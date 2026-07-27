// READ-ONLY dry run — traces which articles reference each Media doc, computes what the
// new `subjects` field WOULD be set to, and reports coverage/quality stats. Does NOT
// write to any Media document (or any document at all) — diagnosis only, to review
// before any real backfill write is built.
//
// Collections actually scanned: 'articles' and 'rss-articles' only. The task that asked
// for this script also named a third collection, 'fe-articles' — that collection was
// fully removed earlier this session (no live DB table, not registered in
// payload.config.ts's collections array) and so cannot be scanned; there is nothing to
// find there. 'test-articles' also exists live but was not named in the original ask and
// is excluded here (draft/test content, not real published stories) — flagged in the
// summary output below so this scope decision is visible, not silent.
//
// Reference types checked per collection (matches how the frontend itself parses body
// richtext in dailyinsight/components/ArticleBody.tsx — only top-level body.root.children
// nodes are treated as upload/carousel-block nodes there, not an arbitrarily deep walk,
// so this script mirrors that same shallow walk rather than assuming deeper nesting that
// the renderer wouldn't even honor):
//   1. featuredImage (upload relationship field, raw Media ID at depth:0)
//   2. inline 'upload' nodes directly in body.root.children (node.value = Media ID)
//   3. 'carousel' block nodes in body.root.children (node.fields.images[].image = Media ID)
// rss-articles' body schema (BlocksFeature([EmbedBlockConfig])) doesn't even register a
// carousel block type, so no rss-articles carousel matches are structurally possible —
// checked anyway for completeness/symmetry, expected to always be zero.

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

// Walks only top-level body.root.children — see file-header comment for why.
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

async function main() {
  const payload = await getPayload({ config })

  console.log('Fetching all Media docs...')
  const mediaDocs = await fetchAll(payload, 'media')
  console.log(`  ${mediaDocs.length} Media docs`)

  // mediaId -> Set of { id, title, collection, refTypes: Set }
  const refsByMedia = new Map()
  for (const m of mediaDocs) {
    refsByMedia.set(m.id, new Map()) // articleId -> { title, collection, refTypes: Set }
  }

  function recordRef(mediaId, articleId, title, collection, refType) {
    const byArticle = refsByMedia.get(mediaId)
    if (!byArticle) return // media ID referenced but not in our Media set (stale/deleted ref) — ignore
    if (!byArticle.has(articleId)) {
      byArticle.set(articleId, { title, collection, refTypes: new Set() })
    }
    byArticle.get(articleId).refTypes.add(refType)
  }

  const perCollectionCounts = {}
  for (const collection of ARTICLE_COLLECTIONS) {
    console.log(`Fetching all ${collection} docs...`)
    const articleDocs = await fetchAll(payload, collection)
    console.log(`  ${articleDocs.length} ${collection} docs`)
    perCollectionCounts[collection] = {
      total: articleDocs.length,
      featuredImageRefs: 0,
      inlineUploadRefs: 0,
      carouselImageRefs: 0,
    }

    for (const article of articleDocs) {
      const title = article.title || `(untitled ${collection} #${article.id})`

      const fiId = extractMediaId(article.featuredImage)
      if (fiId !== null) {
        recordRef(fiId, article.id, title, collection, 'featuredImage')
        perCollectionCounts[collection].featuredImageRefs++
      }

      const { uploadIds, carouselImageIds } = findBodyReferences(article.body)
      for (const id of uploadIds) {
        recordRef(id, article.id, title, collection, 'inline-upload')
        perCollectionCounts[collection].inlineUploadRefs++
      }
      for (const id of carouselImageIds) {
        recordRef(id, article.id, title, collection, 'carousel-block')
        perCollectionCounts[collection].carouselImageRefs++
      }
    }
  }

  // ─── Compute what `subjects` WOULD be set to ───────────────────────────────────────
  // Approach (judgment call, reported here for review before any real write):
  // Reliable, code-only "subject name" extraction from arbitrary tabloid headlines isn't
  // achievable with simple heuristics — headlines vary wildly in shape ("18 Iconic
  // Fashion Choices by Taylor Swift Over the Years" vs "PizzaExpress Found No Proof
  // Andrew Was There" vs "Margaret Qualley and Jack Antonoff Split After Nearly 3
  // Years") and a naive first-N-words or capitalized-word regex would misfire constantly
  // (e.g. grabbing "PizzaExpress Found" as a "subject"). Rather than ship a noisy
  // extraction, this dry run uses the FULL referencing article title(s) as the computed
  // subjects value: single reference -> that title verbatim; multiple references -> each
  // distinct title joined with " | ". This is intentionally the more conservative,
  // higher-precision choice — a real backfill could instead run each title through an
  // LLM call for actual name extraction, but that's a different (paid, non-deterministic)
  // step that shouldn't happen silently inside a dry run.
  const results = []
  let withRefs = 0
  let orphaned = 0
  const multiRefAmbiguous = []
  const multiRefSameSubject = []

  function titleSignificantWords(title) {
    return new Set(
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3), // drop short stopword-ish tokens
    )
  }

  for (const m of mediaDocs) {
    const byArticle = refsByMedia.get(m.id)
    const entries = Array.from(byArticle.values())
    const distinctTitles = Array.from(new Set(entries.map((e) => e.title)))

    if (distinctTitles.length === 0) {
      orphaned++
      results.push({ id: m.id, filename: m.filename, refCount: 0, subjects: null })
      continue
    }

    withRefs++
    const subjects = distinctTitles.join(' | ')
    results.push({ id: m.id, filename: m.filename, refCount: distinctTitles.length, subjects, titles: distinctTitles })

    if (distinctTitles.length > 1) {
      // Heuristic: do the titles share any "significant" word? If not, flag as likely
      // unrelated stories reusing the same image (ambiguous — needs a human decision on
      // whether concatenation is even sensible) rather than silently combining.
      const wordSets = distinctTitles.map(titleSignificantWords)
      let anyOverlap = false
      outer: for (let i = 0; i < wordSets.length; i++) {
        for (let j = i + 1; j < wordSets.length; j++) {
          for (const w of wordSets[i]) {
            if (wordSets[j].has(w)) { anyOverlap = true; break outer }
          }
        }
      }
      const record = { id: m.id, filename: m.filename, titles: distinctTitles }
      if (anyOverlap) {
        multiRefSameSubject.push(record)
      } else {
        multiRefAmbiguous.push(record)
      }
    }
  }

  // ─── Report ─────────────────────────────────────────────────────────────────────────
  console.log('\n=== Per-collection reference counts ===')
  for (const [collection, counts] of Object.entries(perCollectionCounts)) {
    console.log(`${collection}: ${counts.total} docs — featuredImage refs: ${counts.featuredImageRefs}, inline-upload refs: ${counts.inlineUploadRefs}, carousel-block refs: ${counts.carouselImageRefs}`)
  }

  console.log('\n=== Coverage summary ===')
  console.log(`Total Media docs processed: ${mediaDocs.length}`)
  console.log(`With >=1 referencing article: ${withRefs} (${((withRefs / mediaDocs.length) * 100).toFixed(1)}%)`)
  console.log(`Orphaned (0 references found): ${orphaned} (${((orphaned / mediaDocs.length) * 100).toFixed(1)}%)`)
  console.log(`Multi-reference, titles share a significant word (safer to combine): ${multiRefSameSubject.length}`)
  console.log(`Multi-reference, titles share NO significant word (ambiguous — needs a decision): ${multiRefAmbiguous.length}`)
  console.log(`Note: 'test-articles' (live collection, not scanned) and 'fe-articles' (named in the original ask, no longer exists) are excluded from this trace — see file header comment.`)

  console.log('\n=== Sample rows (first 20 with references, then up to 20 orphaned) ===')
  const withRefsSample = results.filter((r) => r.refCount > 0).slice(0, 20)
  const orphanedSample = results.filter((r) => r.refCount === 0).slice(0, 20)
  console.log('\n-- Referenced --')
  for (const r of withRefsSample) {
    console.log(`Media ${r.id} | ${r.filename} | refs: ${r.refCount} | subjects: "${r.subjects}"`)
  }
  console.log('\n-- Orphaned (no references found) --')
  for (const r of orphanedSample) {
    console.log(`Media ${r.id} | ${r.filename} | subjects: (none — no referencing article found)`)
  }

  console.log('\n=== Multi-reference edge cases: AMBIGUOUS (no shared significant word — likely different subjects, needs a decision) ===')
  for (const r of multiRefAmbiguous.slice(0, 20)) {
    console.log(`Media ${r.id} | ${r.filename}`)
    for (const t of r.titles) console.log(`    - ${t}`)
  }
  if (multiRefAmbiguous.length > 20) console.log(`  ...and ${multiRefAmbiguous.length - 20} more`)

  console.log('\n=== Multi-reference edge cases: LIKELY SAME SUBJECT (shared significant word — combining is probably fine) ===')
  for (const r of multiRefSameSubject.slice(0, 10)) {
    console.log(`Media ${r.id} | ${r.filename}`)
    for (const t of r.titles) console.log(`    - ${t}`)
  }
  if (multiRefSameSubject.length > 10) console.log(`  ...and ${multiRefSameSubject.length - 10} more`)

  console.log('\nDry run complete. No Media documents were modified.')
  process.exit(0)
}

// Top-level await (not fire-and-forget) — `payload run` does a bare `import()` of this
// file and exits the process as soon as that import's own top-level evaluation settles;
// without awaiting main() here, the module resolves immediately and the process exits
// before any of main()'s async work (all output below) ever runs.
try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
