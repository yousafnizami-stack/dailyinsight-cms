// Backfills filename on Media docs created via create-media-from-cloudinary before the
// fix in that route (which never set it) — same safe dry-run-then-write pattern as
// scripts/backfill-media-mimetype.mjs and scripts/backfill-media-subjects.mjs.
//
// Scope: filename IS NULL AND title IS NOT NULL — this is exactly the population
// create-media-from-cloudinary created (confirmed via live DB query: 14 such rows, all
// with a kw-...-prefixed cloudinaryPublicId). Deliberately does NOT touch the separate
// population of docs with filename already set but title null (~3 rows) — those came from
// a different creation path (manual admin upload, not this route) and are out of scope.
//
// Default (no flag): DRY RUN ONLY — prints the affected count and the full list of
// id/title/derived-filename, writes nothing.
// `--write`: performs the actual updates. Idempotent — re-checks each doc's filename is
// still null immediately before writing (not just relying on the original query results,
// in case something else populated it in the meantime), so a repeat run only touches docs
// that still need it.
//
// Only ever writes the single `filename` field — never touches alt/caption/title/
// subjects/cloudinaryUrl or anything else.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

function deriveFilename(doc) {
  const ext = doc.cloudinaryFormat || 'jpg'
  return `${doc.title}.${ext}`
}

async function fetchAffected(payload) {
  const docs = []
  let page = 1
  while (true) {
    const res = await payload.find({
      collection: 'media',
      where: {
        and: [
          { filename: { equals: null } },
          { title: { exists: true } },
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

async function main() {
  const write = process.argv.includes('--write')
  const payload = await getPayload({ config })

  console.log('Fetching Media docs with filename=null and title set...')
  const affected = await fetchAffected(payload)
  console.log(`Total affected: ${affected.length}`)

  console.log(`\nFull list (${affected.length} rows):`)
  for (const doc of affected) {
    console.log(`  Media ${doc.id} | title: "${doc.title}" | filename -> "${deriveFilename(doc)}"`)
  }

  if (!write) {
    console.log('\nDRY RUN — no writes performed. Re-run with --write to apply.')
    process.exit(0)
  }

  console.log('\n--write flag detected — applying updates...')
  let written = 0
  let skippedAlreadySet = 0

  for (const doc of affected) {
    // Idempotency re-check — re-fetch immediately before writing rather than trusting the
    // original query snapshot, in case anything changed filename in the meantime.
    const current = await payload.findByID({ collection: 'media', id: doc.id, depth: 0, overrideAccess: true })
    if (current.filename) {
      skippedAlreadySet++
      continue
    }
    const filename = deriveFilename(doc)
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { filename },
      overrideAccess: true,
    })
    written++
    console.log(`  Media ${doc.id} | filename set to "${filename}"`)
  }

  console.log('\n=== Summary ===')
  console.log(`Total affected (found by query): ${affected.length}`)
  console.log(`Written: ${written}`)
  console.log(`Skipped (already set by the time of write): ${skippedAlreadySet}`)
  console.log('\nBackfill complete.')
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
