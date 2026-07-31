import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Confirmed real callers of this route (pipeline/carousel-pipeline.mjs's
// inferFormatFromUrl() — a regex-extracted file extension, case as found in the source
// URL — and pipeline/keyword-pipeline-test-images.mjs's resolveImageFromUrl(), which
// passes Cloudinary's own uploadResult.format, always lowercase). Matched
// case-insensitively here since only one of those two callers is guaranteed lowercase.
// Covers every format Payload's own isImage() check (node_modules/payload/dist/uploads/
// isImage.js) recognizes, since that check is exactly what this fixes.
const FORMAT_TO_MIME_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
}

function deriveMimeType(cloudinaryFormat: unknown): string | undefined {
  if (typeof cloudinaryFormat !== 'string') return undefined
  return FORMAT_TO_MIME_TYPE[cloudinaryFormat.trim().toLowerCase()]
}

// filename has a UNIQUE index (media_filename_idx) — CONFIRMED REAL: scripts/backfill-
// media-filename.mjs's own resolveFilename() hit exactly this collision live (two docs
// from separate pipeline runs, same keyword+slot, deriving the identical filename) and
// needed disambiguation to avoid crashing. Same root cause applies here going forward:
// deriveImageTitle() (pipeline/keyword-pipeline-images.mjs) has no per-run uniqueness
// token, so two runs for the same keyword+slot combination produce the identical title,
// and therefore the identical candidate filename. Checked BEFORE payload.create() below,
// so the collision never reaches the UNIQUE constraint in the first place. Unlike the
// backfill script's id-suffix approach, no doc id exists yet at this point (the doc hasn't
// been created) — a short Date.now() suffix is used instead, matching this codebase's own
// established uniqueness convention (e.g. resolveImageFromUrl's own Cloudinary public_id:
// `kw-${keywordSlug}-${roleLabel}-${Date.now()}`).
async function resolveFilename(payload: Awaited<ReturnType<typeof getPayload>>, title: string, ext: string): Promise<string> {
  const base = `${title}.${ext}`
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: base } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs.length === 0) return base
  return `${title}-${Date.now()}.${ext}`
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { cloudinaryPublicId, cloudinaryUrl, cloudinaryResourceType, cloudinaryFormat, alt, caption, title, subjects } = body

    if (!cloudinaryPublicId || !cloudinaryUrl) {
      return NextResponse.json({ error: 'cloudinaryPublicId and cloudinaryUrl are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // mimeType — derived purely from cloudinaryFormat already present in the request, no
    // new external call needed. Payload's stock lexical upload-node admin renderer gates
    // its in-body thumbnail on isImage(mimeType); a null mimeType (this route never used
    // to set it) makes that renderer always show a placeholder icon instead of the real
    // image, even though the underlying asset and every other field are completely
    // valid — confirmed the live frontend never reads mimeType at all, so this was
    // purely an admin-rendering gap, not a data-integrity one.
    const mimeType = deriveMimeType(cloudinaryFormat)

    // filename drives Media's admin.useAsTitle (src/collections/Media.ts) — the list view's
    // title column. This route never attaches a `file:` object (it only references an
    // already-uploaded Cloudinary asset by URL/publicId), so Payload's own upload
    // machinery — which normally derives filename automatically from an attached file —
    // has nothing to populate it from. Resolved (with collision-checking, see
    // resolveFilename above) BEFORE payload.create() below, since it needs its own async
    // lookup.
    const filename = typeof title === 'string'
      ? await resolveFilename(payload, title, cloudinaryFormat || 'jpg')
      : undefined

    const doc = await payload.create({
      collection: 'media',
      data: {
        cloudinaryPublicId,
        cloudinaryUrl,
        cloudinaryResourceType: cloudinaryResourceType || 'image',
        cloudinaryFormat,
        url: cloudinaryUrl,
        alt: alt || '',
        caption: caption || '',
        ...(mimeType !== undefined && { mimeType }),
        // Both optional — unlike alt/caption above, these are NOT forced to '' when
        // absent. Callers that don't pass them (e.g. carousel-pipeline.mjs, which this
        // task explicitly does not change) must see identical behavior to before: the
        // field simply omitted from data, so Media's own schema default (null) applies
        // exactly as it always has. filename is only ever set when title actually is —
        // same condition as title itself — so carousel-pipeline.mjs (which never passes
        // title) never triggers this branch, exactly as before this fix.
        ...(typeof title === 'string' && { title, filename }),
        ...(typeof subjects === 'string' && { subjects }),
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ id: doc.id, doc }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create Media document' }, { status: 500 })
  }
}
