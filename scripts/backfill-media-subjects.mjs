// REAL WRITE PASS — backfills Media.subjects from referencing article titles. Converted
// from the read-only scripts/trace-media-subjects-dry-run.mjs (same reference-tracing and
// title-extraction logic; see that file's header comments for the full reasoning on scope
// — 'articles' + 'rss-articles' only, 'fe-articles' no longer exists, 'test-articles'
// intentionally excluded — and on why full article titles are used verbatim rather than
// attempting name extraction).
//
// Idempotent: only writes to Media docs whose subjects field is currently null/empty.
// Already-set docs and orphaned (0-reference) docs are both skipped without writing —
// orphaned docs are left at null rather than getting an empty string written, so a doc
// that later gains a real reference (e.g. a new article is published using it) is still
// picked up by a future re-run instead of looking "already processed" forever.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const ARTICLE_COLLECTIONS = ['articles', 'rss-articles']

function extractMediaId(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value.id !== undefined) return value.id
  return null
}

// Walks only top-level body.root.children — matches how the frontend itself parses body
// richtext (dailyinsight/components/ArticleBody.tsx), same as the dry run.
function findBodyReferences(body) {
  const uploadIds = []
  const carouselImageIds = []
  const children = body?.root?.children
  if (!Array.isArray(children)) return { uploadIds, carouselImageIds }

  for (const node of children) {
    if (node?.type === 'upload') {
      const id = extractMediaId(node.value)
      if (id !== null) uploadIds.push(id)
    } else if (node?.type === 'block' && node?.fields?.blockType === 'carousel') {
      const images = Array.isArray(node.fields.images) ? node.fields.images : []
      for (const img of images) {
        const id = extractMediaId(img?.image)
        if (id !== null) carouselImageIds.push(id)
      }
    }
  }
  return { uploadIds, carouselImageIds }
}

async function fetchAll(payload, collection) {
  const docs = []
  let page = 1
  while (true) {
    const res = await payload.find({
      collection,
      depth: 0,
      limit: 200,
      page,
      overrideAccess: true,
    })
    docs.push(...res.docs)
    if (!res.hasNextPage) break
    page++
  }
  return docs
}

function titleSignificantWords(title) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  )
}

// Same word-overlap heuristic as the dry run — used ONLY for the distinct [AMBIGUOUS] log
// tag here, not to change write behavior (ambiguous multi-ref docs are written exactly
// the same way as any other multi-ref doc: distinct titles joined with " | ").
function isAmbiguous(distinctTitles) {
  if (distinctTitles.length < 2) return false
  const wordSets = distinctTitles.map(titleSignificantWords)
  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      for (const w of wordSets[i]) {
        if (wordSets[j].has(w)) return false
      }
    }
  }
  return true
}

async function main() {
  const payload = await getPayload({ config })

  console.log('Fetching all Media docs...')
  const mediaDocs = await fetchAll(payload, 'media')
  console.log(`  ${mediaDocs.length} Media docs`)

  const refsByMedia = new Map() // mediaId -> Map<articleId, { title }>
  for (const m of mediaDocs) {
    refsByMedia.set(m.id, new Map())
  }

  function recordRef(mediaId, articleId, title) {
    const byArticle = refsByMedia.get(mediaId)
    if (!byArticle) return
    if (!byArticle.has(articleId)) {
      byArticle.set(articleId, { title })
    }
  }

  for (const collection of ARTICLE_COLLECTIONS) {
    console.log(`Fetching all ${collection} docs...`)
    const articleDocs = await fetchAll(payload, collection)
    console.log(`  ${articleDocs.length} ${collection} docs`)

    for (const article of articleDocs) {
      const title = article.title || `(untitled ${collection} #${article.id})`

      const fiId = extractMediaId(article.featuredImage)
      if (fiId !== null) recordRef(fiId, article.id, title)

      const { uploadIds, carouselImageIds } = findBodyReferences(article.body)
      for (const id of uploadIds) recordRef(id, article.id, title)
      for (const id of carouselImageIds) recordRef(id, article.id, title)
    }
  }

  // ─── Spot-check setup: snapshot alt/caption/title for a few docs BEFORE any writes,
  // to prove afterward that the update() calls below (which only ever send `subjects`
  // in their data payload) never touched those fields. ─────────────────────────────────
  const spotCheckIds = mediaDocs
    .filter((m) => !m.subjects && refsByMedia.get(m.id).size > 0)
    .slice(0, 5)
    .map((m) => m.id)
  const beforeSnapshots = new Map()
  for (const id of spotCheckIds) {
    const doc = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    beforeSnapshots.set(id, { alt: doc.alt ?? null, caption: doc.caption ?? null, title: doc.title ?? null })
  }

  // ─── Write pass — one Media doc at a time, sequential (no Promise.all/bulk) ───────────
  let totalProcessed = 0
  let totalWritten = 0
  let skippedAlreadySet = 0
  let skippedOrphaned = 0
  const ambiguousLogged = []

  for (const m of mediaDocs) {
    totalProcessed++

    if (m.subjects && String(m.subjects).trim().length > 0) {
      skippedAlreadySet++
      continue
    }

    const byArticle = refsByMedia.get(m.id)
    const distinctTitles = Array.from(new Set(Array.from(byArticle.values()).map((e) => e.title)))

    if (distinctTitles.length === 0) {
      skippedOrphaned++
      continue // leave subjects null — do not write empty string
    }

    const subjects = distinctTitles.join(' | ')
    const ambiguous = isAmbiguous(distinctTitles)

    await payload.update({
      collection: 'media',
      id: m.id,
      data: { subjects },
      overrideAccess: true,
    })
    totalWritten++

    if (ambiguous) {
      ambiguousLogged.push({ id: m.id, filename: m.filename, subjects })
      console.log(`[AMBIGUOUS] Media ${m.id} | ${m.filename} | subjects set to: "${subjects}"`)
    } else {
      console.log(`Media ${m.id} | ${m.filename} | subjects set to: "${subjects}"`)
    }
  }

  // ─── Spot-check verification ───────────────────────────────────────────────────────
  console.log('\n=== Spot-check: alt/caption/title untouched by these writes ===')
  let spotCheckPassed = true
  for (const id of spotCheckIds) {
    const before = beforeSnapshots.get(id)
    const after = await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: true })
    const afterSnapshot = { alt: after.alt ?? null, caption: after.caption ?? null, title: after.title ?? null }
    const unchanged =
      before.alt === afterSnapshot.alt &&
      before.caption === afterSnapshot.caption &&
      before.title === afterSnapshot.title
    if (!unchanged) spotCheckPassed = false
    console.log(
      `Media ${id}: alt/caption/title ${unchanged ? 'UNCHANGED ✓' : 'CHANGED ✗ — INVESTIGATE'} ` +
        `(before: ${JSON.stringify(before)}, after: ${JSON.stringify(afterSnapshot)})`,
    )
  }

  // ─── Final summary ──────────────────────────────────────────────────────────────────
  console.log('\n=== Summary ===')
  console.log(`Total Media docs processed: ${totalProcessed}`)
  console.log(`Total written (subjects set): ${totalWritten}`)
  console.log(`Total skipped (already had a subjects value): ${skippedAlreadySet}`)
  console.log(`Total skipped (orphaned — 0 referencing articles): ${skippedOrphaned}`)
  console.log(`Ambiguous multi-reference docs written (see [AMBIGUOUS] lines above for IDs): ${ambiguousLogged.length}`)
  console.log(`Spot-check (alt/caption/title untouched): ${spotCheckPassed ? 'PASSED' : 'FAILED — see above'}`)
  console.log('\nBackfill complete.')
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
