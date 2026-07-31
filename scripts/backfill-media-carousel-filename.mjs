// Backfills filename on Media docs created by carousel-pipeline.mjs before it started
// sending `title` in its create-media-from-cloudinary calls (see that pipeline's own
// recent fix) — same safe dry-run-then-write pattern as scripts/backfill-media-
// filename.mjs (the equivalent keyword-pipeline-images.mjs backfill) and
// scripts/backfill-media-mimetype.mjs/backfill-media-subjects.mjs before it.
//
// SCOPE — precisely confirmed via live query, NOT a blind "filename IS NULL AND title IS
// NULL" query (which would incidentally sweep in 6 unrelated keyword-pipeline-test-
// images.mjs rows too — confirmed live, those have a kw-test-... cloudinaryPublicId
// prefix and an EMPTY caption). Carousel Pipeline's own upload route
// (dailyinsight-pipeline/app/api/carousel-upload/route.ts) uploads with only
// `folder: 'dailyinsight'` and no explicit public_id, so Cloudinary assigns a random
// alphanumeric id — there is no kw-... style prefix the way keyword-pipeline-images.mjs
// has, so cloudinaryPublicId ALONE cannot scope this. The actual reliable signature,
// confirmed via live query against the full "filename IS NULL AND title IS NULL"
// candidate population (a clean 100% split, zero ambiguous rows), is the COMBINATION of:
//   - cloudinaryPublicId NOT starting with "dailyinsight/kw-" (excludes both
//     keyword-pipeline-images.mjs's kw-... prefix and keyword-pipeline-test-images.mjs's
//     kw-test-... prefix)
//   - caption present and non-empty (carousel-pipeline.mjs always sends a Claude-
//     generated caption per image; nothing else in this codebase creates a Media doc
//     with a random public_id AND a populated caption)
// Confirmed: exactly 56 rows match, all with a pure random 20-char Cloudinary-generated
// public_id (not the di-image-... pattern upload-featured-image/route.ts's Save-to-Media
// flow would produce either, ruling out that path too).
//
// FILENAME DERIVATION — these docs have no `title` to reuse (unlike the KW backfill).
// 52 of 56 already have `subjects` populated (from the earlier scripts/backfill-media-
// subjects.mjs run, which derives it from whichever Article's body actually references
// each Media doc) — the referencing carousel article's own generated title. Rather than
// mechanically title-casing that full headline (which produced verbose, awkward names
// like "18_Iconic_Fashion_Choices_By_Kate_Middleton_Over_The_Years_Carousel_1" — reviewed
// and rejected in favour of this simpler approach), SUBJECT_PREFIX_MAP below maps each of
// the three confirmed exact subjects strings to a short, human-chosen prefix instead. For
// a matched doc: filename = "${prefix}_Carousel_${n}.${ext}", where n is this doc's
// 1-based position within its own prefix group, docs ordered by id ascending — id order
// matches upload order, which matches the original per-carousel image order, since
// carousel-pipeline.mjs sorts `images` by `order` BEFORE creating any Media docs. Any doc
// with no subjects, OR subjects that don't match one of the three mapped strings exactly,
// falls back to the simple, honest "Carousel_Image_${id}.${ext}" pattern (4 such rows
// confirmed — orphaned, no referencing article was ever found by the earlier subjects
// backfill either) rather than fabricating a name from unstructured caption prose.
//
// Reuses the exact same collision-disambiguation logic just proven in
// scripts/backfill-media-filename.mjs (Set + live payload.find check; disambiguates on
// collision by appending the doc's own id, always unique).
//
// Default (no flag): DRY RUN ONLY — prints the affected count and the full list of
// id/subjects/derived-filename, writes nothing.
// `--write`: performs the actual updates. Idempotent — re-checks each doc's filename is
// still null immediately before writing. A single doc's write failure is logged and
// skipped, not fatal to the rest of the batch.
//
// Only ever writes the single `filename` field — never touches alt/caption/title/
// subjects/cloudinaryUrl or anything else.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

// Explicit, human-chosen prefix per confirmed exact subjects string — see the file-header
// comment for why this replaced mechanically title-casing the full headline. Keyed on the
// exact string (not a substring/fuzzy match) so an unexpected subjects value never
// silently maps to the wrong prefix — anything not listed here falls through to the
// Carousel_Image_{id} fallback in deriveBaseFilenames below.
const SUBJECT_PREFIX_MAP = {
  '18 Iconic Fashion Choices by Kate Middleton Over the Years': 'Kate_Middleton',
  '16 Iconic Fashion Choices by Kate Middleton at Wimbledon Over the Years': 'Kate_Middleton_Wimbledon',
  '18 Show-Stopping Red Carpet Looks From Taylor Swift': 'Taylor_Swift',
}

async function fetchCandidates(payload) {
  const docs = []
  let page = 1
  while (true) {
    const res = await payload.find({
      collection: 'media',
      where: {
        and: [
          { filename: { equals: null } },
          { title: { equals: null } },
        ],
      },
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

// Filtered client-side rather than via a Payload `where` operator — Payload's Postgres
// adapter has no documented not-like/not-starts-with operator, so the broader
// filename=null/title=null superset is fetched via the API (a shape already proven safe
// in backfill-media-filename.mjs) and narrowed down here to exactly the confirmed
// Carousel signature.
function isCarouselCandidate(doc) {
  const publicId = doc.cloudinaryPublicId || ''
  const hasCaption = typeof doc.caption === 'string' && doc.caption.trim() !== ''
  return !publicId.startsWith('dailyinsight/kw-') && hasCaption
}

function deriveBaseFilenames(docs) {
  const sorted = [...docs].sort((a, b) => a.id - b.id)
  const groupCounts = new Map()
  return sorted.map((doc) => {
    const ext = doc.cloudinaryFormat || 'jpg'
    const prefix = doc.subjects ? SUBJECT_PREFIX_MAP[doc.subjects] : undefined
    if (prefix) {
      const n = (groupCounts.get(prefix) || 0) + 1
      groupCounts.set(prefix, n)
      return { doc, base: `${prefix}_Carousel_${n}.${ext}` }
    }
    return { doc, base: `Carousel_Image_${doc.id}.${ext}` }
  })
}

async function resolveFinalFilename(payload, doc, base, usedFilenames) {
  let candidate = base
  let collides = usedFilenames.has(candidate)
  if (!collides) {
    const existing = await payload.find({
      collection: 'media',
      where: { and: [{ filename: { equals: candidate } }, { id: { not_equals: doc.id } }] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    collides = existing.docs.length > 0
  }
  if (collides) {
    const ext = doc.cloudinaryFormat || 'jpg'
    candidate = `${base.slice(0, -(ext.length + 1))}-${doc.id}.${ext}`
  }
  usedFilenames.add(candidate)
  return candidate
}

async function main() {
  const write = process.argv.includes('--write')
  const payload = await getPayload({ config })

  console.log('Fetching Media docs with filename=null and title=null...')
  const superset = await fetchCandidates(payload)
  const candidates = superset.filter(isCarouselCandidate)
  console.log(`Total candidates (filename=null, title=null): ${superset.length}`)
  console.log(`Total affected (Carousel-originated, confirmed via cloudinaryPublicId + caption signature): ${candidates.length}`)

  const basePlan = deriveBaseFilenames(candidates)
  const usedFilenames = new Set()
  const resolved = []
  for (const { doc, base } of basePlan) {
    const filename = await resolveFinalFilename(payload, doc, base, usedFilenames)
    resolved.push({ doc, filename })
  }

  console.log(`\nFull list (${resolved.length} rows):`)
  for (const { doc, filename } of resolved) {
    console.log(`  Media ${doc.id} | subjects: ${doc.subjects ? `"${doc.subjects}"` : '(none — orphaned)'} | filename -> "${filename}"`)
  }

  if (!write) {
    console.log('\nDRY RUN — no writes performed. Re-run with --write to apply.')
    process.exit(0)
  }

  console.log('\n--write flag detected — applying updates...')
  let written = 0
  let skippedAlreadySet = 0
  let failed = 0

  for (const { doc, filename } of resolved) {
    // Idempotency re-check — re-fetch immediately before writing rather than trusting the
    // original query snapshot, in case anything changed filename in the meantime.
    const current = await payload.findByID({ collection: 'media', id: doc.id, depth: 0, overrideAccess: true })
    if (current.filename) {
      skippedAlreadySet++
      continue
    }
    try {
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: { filename },
        overrideAccess: true,
      })
      written++
      console.log(`  Media ${doc.id} | filename set to "${filename}"`)
    } catch (err) {
      failed++
      console.log(`  Media ${doc.id} | FAILED to set filename to "${filename}": ${err.message} — skipping, continuing with remaining docs`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Total affected (found by query): ${resolved.length}`)
  console.log(`Written: ${written}`)
  console.log(`Skipped (already set by the time of write): ${skippedAlreadySet}`)
  console.log(`Failed: ${failed}`)
  console.log('\nBackfill complete.')
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
