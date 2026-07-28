// Backfills mimeType on Media docs created via create-media-from-cloudinary before the
// fix in that route (which never set it) — same safe dry-run-then-write pattern as
// scripts/backfill-media-subjects.mjs.
//
// Default (no flag): DRY RUN ONLY — prints the affected count and a sample, writes
// nothing.
// `--write`: performs the actual updates. Idempotent — re-checks each doc's mimeType is
// still null immediately before writing (not just relying on the original query results,
// in case something else populated it in the meantime), so a repeat run only touches
// docs that still need it.
//
// Only ever writes the single `mimeType` field — never touches alt/caption/title/
// subjects/cloudinaryUrl or anything else.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

// Identical mapping to src/app/api/create-media-from-cloudinary/route.ts's
// FORMAT_TO_MIME_TYPE — kept as a literal duplicate here (not imported) since this is a
// standalone script outside the Next.js route module graph, matching how other
// standalone scripts in this repo already duplicate small pieces of route logic they
// need (e.g. the balanced-JSON parser duplicated across pipeline scripts) rather than
// reaching into route files.
const FORMAT_TO_MIME_TYPE = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
}

function deriveMimeType(cloudinaryFormat) {
  if (typeof cloudinaryFormat !== 'string') return undefined
  return FORMAT_TO_MIME_TYPE[cloudinaryFormat.trim().toLowerCase()]
}

async function fetchAffected(payload) {
  const docs = []
  let page = 1
  while (true) {
    const res = await payload.find({
      collection: 'media',
      where: {
        and: [
          { mimeType: { equals: null } },
          { cloudinaryFormat: { exists: true } },
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

  console.log('Fetching Media docs with mimeType=null and cloudinaryFormat set...')
  const affected = await fetchAffected(payload)
  console.log(`Total affected: ${affected.length}`)

  const withDerivable = []
  const withUnmappedFormat = []
  for (const doc of affected) {
    const mimeType = deriveMimeType(doc.cloudinaryFormat)
    if (mimeType) {
      withDerivable.push({ id: doc.id, cloudinaryFormat: doc.cloudinaryFormat, mimeType })
    } else {
      withUnmappedFormat.push({ id: doc.id, cloudinaryFormat: doc.cloudinaryFormat })
    }
  }

  console.log(`  Derivable (known format -> mimeType): ${withDerivable.length}`)
  console.log(`  Unmapped format (cannot derive, will be skipped): ${withUnmappedFormat.length}`)
  if (withUnmappedFormat.length > 0) {
    console.log('  Unmapped format samples:', JSON.stringify(withUnmappedFormat.slice(0, 10)))
  }

  console.log(`\nSample of ${Math.min(20, withDerivable.length)} rows:`)
  for (const row of withDerivable.slice(0, 20)) {
    console.log(`  Media ${row.id} | cloudinaryFormat: "${row.cloudinaryFormat}" | mimeType -> "${row.mimeType}"`)
  }

  if (!write) {
    console.log('\nDRY RUN — no writes performed. Re-run with --write to apply.')
    process.exit(0)
  }

  console.log('\n--write flag detected — applying updates...')
  let written = 0
  let skippedAlreadySet = 0
  let skippedUnmapped = 0

  for (const doc of affected) {
    const mimeType = deriveMimeType(doc.cloudinaryFormat)
    if (!mimeType) {
      skippedUnmapped++
      continue
    }
    // Idempotency re-check — re-fetch immediately before writing rather than trusting
    // the original query snapshot, in case anything changed mimeType in the meantime.
    const current = await payload.findByID({ collection: 'media', id: doc.id, depth: 0, overrideAccess: true })
    if (current.mimeType) {
      skippedAlreadySet++
      continue
    }
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { mimeType },
      overrideAccess: true,
    })
    written++
    console.log(`  Media ${doc.id} | mimeType set to "${mimeType}"`)
  }

  console.log('\n=== Summary ===')
  console.log(`Total affected (found by query): ${affected.length}`)
  console.log(`Written: ${written}`)
  console.log(`Skipped (already set by the time of write): ${skippedAlreadySet}`)
  console.log(`Skipped (unmapped cloudinaryFormat): ${skippedUnmapped}`)
  console.log('\nBackfill complete.')
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
