import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MEDIA_IDS = [1101, 1102, 1103, 1104, 1105, 1106, 1107, 1108, 1109, 1110, 1111, 1113]

async function recompressOne(payload, id) {
  const doc = await payload.findByID({ collection: 'media', id })
  if (!doc) throw new Error(`Media ${id} not found`)

  const { cloudinaryUrl, cloudinaryPublicId, filesize: originalFilesize, cloudinaryFormat: originalFormat, filename } = doc
  if (!cloudinaryUrl || !cloudinaryPublicId) {
    throw new Error(`Media ${id} is missing cloudinaryUrl/cloudinaryPublicId`)
  }

  // public_id already includes the "dailyinsight/" folder prefix — no separate folder option.
  const result = await cloudinary.uploader.upload(cloudinaryUrl, {
    public_id: cloudinaryPublicId,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  })

  const newFilesize = result.bytes
  const reductionPct = ((1 - newFilesize / originalFilesize) * 100).toFixed(1)

  // thumbnailURL is NOT set — confirmed a no-op in this collection's config, since
  // Media.ts's adminThumbnail always recomputes it as doc.url on every read regardless
  // of what's stored.
  await payload.update({
    collection: 'media',
    id,
    data: {
      cloudinaryUrl: result.secure_url,
      cloudinaryVersion: result.version,
      cloudinaryFormat: result.format,
      url: result.secure_url,
    },
    overrideAccess: true,
  })

  return {
    id,
    filename,
    publicId: cloudinaryPublicId,
    originalFormat,
    originalFilesize,
    newFormat: result.format,
    newFilesize,
    reductionPct,
    newVersion: result.version,
    newUrl: result.secure_url,
  }
}

async function main() {
  const payload = await getPayload({ config })

  const successes = []
  const failures = []

  console.log(`Processing ${MEDIA_IDS.length} Media IDs: ${MEDIA_IDS.join(', ')}\n`)

  for (const id of MEDIA_IDS) {
    try {
      const row = await recompressOne(payload, id)
      successes.push(row)
      console.log(
        `[OK] ${row.id} (${row.filename}) — ${row.publicId} — ${row.originalFormat} ${row.originalFilesize}b -> ${row.newFormat} ${row.newFilesize}b (${row.reductionPct}% smaller)`,
      )
    } catch (err) {
      failures.push({ id, error: err.message })
      console.error(`[FAIL] ${id} — ${err.message}`)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Succeeded: ${successes.length}/${MEDIA_IDS.length}`)
  console.log(`Failed:    ${failures.length}/${MEDIA_IDS.length}`)

  if (successes.length) {
    console.log('\n--- Before/After table ---')
    console.log('id\tpublicId\told fmt/size\t\tnew fmt/size\t\treduction')
    for (const r of successes) {
      console.log(
        `${r.id}\t${r.publicId}\t${r.originalFormat}/${r.originalFilesize}\t${r.newFormat}/${r.newFilesize}\t${r.reductionPct}%`,
      )
    }
  }

  if (failures.length) {
    console.log('\n--- Failures ---')
    for (const f of failures) {
      console.log(`Media ${f.id}: ${f.error}`)
    }
  }

  process.exit(failures.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('FATAL (unexpected, outside per-item handling):', err)
  process.exit(1)
})
