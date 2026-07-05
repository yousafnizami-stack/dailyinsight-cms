import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MEDIA_ID = 1112

async function main() {
  const payload = await getPayload({ config })

  const doc = await payload.findByID({ collection: 'media', id: MEDIA_ID })
  if (!doc) throw new Error(`Media ${MEDIA_ID} not found`)

  const { cloudinaryUrl, cloudinaryPublicId, filesize: originalFilesize, filename } = doc
  if (!cloudinaryUrl || !cloudinaryPublicId) {
    throw new Error(`Media ${MEDIA_ID} is missing cloudinaryUrl/cloudinaryPublicId`)
  }

  console.log(`=== Media ${MEDIA_ID}: ${filename} ===`)
  console.log(`Current cloudinaryPublicId : ${cloudinaryPublicId}`)
  console.log(`Current cloudinaryUrl      : ${cloudinaryUrl}`)
  console.log(`Current filesize           : ${originalFilesize} bytes`)

  // cloudinaryPublicId already includes the "dailyinsight/" folder segment as part of the
  // public_id string itself — in Cloudinary, public_id IS the full asset path, folder
  // included. Passing a separate `folder` option here (as the plugin does on fresh uploads,
  // where it derives a bare filename-based public_id and lets `folder` prefix it) would
  // prepend "dailyinsight/" a second time on top of this already-prefixed public_id,
  // producing a duplicate path like "dailyinsight/dailyinsight/...". So: public_id only,
  // no folder option, when re-targeting an existing asset by its already-stored publicId.
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

  console.log('\n=== Cloudinary re-upload complete ===')
  console.log(`New public_id  : ${result.public_id}`)
  console.log(`New format     : ${result.format}`)
  console.log(`New version    : ${result.version}`)
  console.log(`New secure_url : ${result.secure_url}`)
  console.log(`New filesize   : ${newFilesize} bytes`)
  console.log(`Reduction      : ${originalFilesize} -> ${newFilesize} bytes (${reductionPct}% smaller)`)

  const thumbnailURL = cloudinary.url(result.public_id, {
    secure: true,
    version: result.version,
    resource_type: result.resource_type || 'image',
    type: result.type || 'upload',
    transformation: {
      width: 150,
      height: 150,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    },
  })

  await payload.update({
    collection: 'media',
    id: MEDIA_ID,
    data: {
      cloudinaryUrl: result.secure_url,
      cloudinaryVersion: result.version,
      cloudinaryFormat: result.format,
      url: result.secure_url,
      thumbnailURL,
    },
    overrideAccess: true,
  })
  console.log('\nPayload Media document updated with new Cloudinary values.')
  console.log(`NOTE: "filesize" field left untouched (still reads ${originalFilesize}) — it was not in the requested update list, so the stored doc will report a stale size until that's addressed separately.`)

  const headRes = await fetch(result.secure_url, { method: 'HEAD' })
  const contentLength = headRes.headers.get('content-length')

  console.log('\n=== HEAD verification on new URL ===')
  console.log(`URL             : ${result.secure_url}`)
  console.log(`HTTP status     : ${headRes.status}`)
  console.log(`Content-Length  : ${contentLength}`)
  console.log(`Matches Cloudinary-reported bytes (${newFilesize}): ${String(contentLength) === String(newFilesize)}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
