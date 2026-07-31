// Backfills filename on Media docs created via create-media-from-cloudinary before the
// fix in that route (which never set it) — same safe dry-run-then-write pattern as
// scripts/backfill-media-mimetype.mjs and scripts/backfill-media-subjects.mjs.
//
// Scope: filename IS NULL AND title IS NOT NULL — this is exactly the population
// create-media-from-cloudinary created (confirmed via live DB query: 23 such rows, all
// with a kw-...-prefixed cloudinaryPublicId). Deliberately does NOT touch the separate,
// much larger population of docs with filename already set but title null (1096 rows) —
// those came from a different creation path (manual admin upload, not this route) and are
// out of scope.
//
// Default (no flag): DRY RUN ONLY — prints the affected count and the full list of
// id/title/derived-filename, writes nothing.
// `--write`: performs the actual updates. Idempotent — re-checks each doc's filename is
// still null immediately before writing (not just relying on the original query results,
// in case something else populated it in the meantime), so a repeat run only touches docs
// that still need it. A single doc's write failure is logged and skipped, not fatal to the
// rest of the batch (see the try/catch around payload.update below).
//
// Only ever writes the single `filename` field — never touches alt/caption/title/
// subjects/cloudinaryUrl or anything else.
//
// filename has a UNIQUE index (media_filename_idx) — CONFIRMED REAL: a live --write run of
// an earlier, simpler version of this script crashed after 5 writes when it hit two
// separate docs (from two different pipeline runs, same keyword+slot) whose derived
// filename collided exactly ("Prince_William_BOT.jpg" x2) — multiple pipeline runs for the
// same keyword+slot combination produce identical deriveImageTitle() output, since that
// function has no per-run uniqueness token. resolveFilename below disambiguates any
// collision (against docs already processed THIS run, OR anything already live in the DB —
// including a doc a previous partial run already wrote, exactly what happened here) by
// appending the doc's own id, which is always unique.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

function deriveFilename(doc, disambiguate) {
  const ext = doc.cloudinaryFormat || 'jpg'
  return disambiguate ? `${doc.title}-${doc.id}.${ext}` : `${doc.title}.${ext}`
}

// Resolves the actual filename to use for one doc, checking for a collision against BOTH
// every filename already claimed so far in this run (usedFilenames, in-memory) and
// anything already live in the DB (a prior partial run, or an unrelated pre-existing doc)
// — the live check is what specifically prevents re-colliding with a doc a previous
// crashed run already wrote successfully. Dry-run and write passes call this identically,
// so the printed plan matches what --write will actually do (barring another process
// touching Media in between).
async function resolveFilename(payload, doc, usedFilenames) {
  const base = deriveFilename(doc, false)
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
    candidate = deriveFilename(doc, true)
  }
  usedFilenames.add(candidate)
  return candidate
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

  const usedFilenames = new Set()
  const plan = []
  for (const doc of affected) {
    const filename = await resolveFilename(payload, doc, usedFilenames)
    plan.push({ doc, filename })
  }

  console.log(`\nFull list (${plan.length} rows):`)
  for (const { doc, filename } of plan) {
    console.log(`  Media ${doc.id} | title: "${doc.title}" | filename -> "${filename}"`)
  }

  if (!write) {
    console.log('\nDRY RUN — no writes performed. Re-run with --write to apply.')
    process.exit(0)
  }

  console.log('\n--write flag detected — applying updates...')
  let written = 0
  let skippedAlreadySet = 0
  let failed = 0

  for (const { doc, filename } of plan) {
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
  console.log(`Total affected (found by query): ${affected.length}`)
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
