import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Same normalization regex as pipeline/keyword-pipeline-test-images.mjs's own
// toTitleCaseUnderscored (dailyinsight repo — duplicated here rather than imported,
// since these are separate codebases with no shared module system) — splits on
// anything that's not a letter/number/apostrophe, not just whitespace, so stray
// punctuation in a real headline (commas, colons, em dashes, etc.) doesn't leak into
// the underscore-joined result. Deliberately does NOT attempt to extract only
// person-name portions via regex — that's an unreliable parse against arbitrary
// tabloid headlines; the full title is used as-is, just reformatted.
function toTitleCaseUnderscored(s: string): string {
  return s
    .trim()
    .split(/[^a-zA-Z0-9']+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('_')
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, filename, articleId, collection, saveToMediaOnly } = await req.json()
    console.log('Upload request:', { imageUrl, filename, articleId, collection })

    const payload = await getPayload({ config })

    // Fetch image as buffer
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      }
    })
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg'
    console.log('Image fetched, size:', imageBuffer.byteLength)

    // Upload to Cloudinary
    const base64Image = `data:${contentType};base64,${imageBuffer.toString('base64')}`
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      public_id: `dailyinsight/${filename}-${Date.now()}`,
      overwrite: false,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    })
    console.log('Cloudinary upload success:', uploadResult.secure_url)

    // Generate alt text using Claude vision API
    let generatedAltText = filename.replace(/-/g, ' ')
    try {
      const altResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: uploadResult.secure_url },
              },
              {
                type: 'text',
                text: 'Write a concise descriptive alt text for this image in one sentence. Be specific about who or what is shown. Maximum 125 characters. Return only the alt text, nothing else.',
              },
            ],
          }],
        }),
      })
      const altData = await altResponse.json()
      generatedAltText = altData.content?.[0]?.text?.trim() || generatedAltText
      console.log('Generated alt text:', generatedAltText)
    } catch (e) {
      console.log('Alt text generation failed, using filename:', e)
    }

    // subjects/title — only for the saveToMediaOnly path (ImagePicker's "Save to Media"
    // button, which always has articleId in scope but isn't updating that article's own
    // featuredImage here). subjects matches the exact convention already established by
    // scripts/backfill-media-subjects.mjs and keyword-pipeline-test-images.mjs — the
    // referencing article's title, verbatim — so library-first search finds these
    // manually-saved images the same way it finds pipeline-created ones. Any failure
    // here (missing articleId, bad fetch) is non-fatal — falls back to the pre-existing
    // behavior of not setting either field, exactly as before this change.
    let mediaSubjects: string | undefined
    let mediaTitle: string | undefined
    if (saveToMediaOnly && articleId) {
      try {
        const articleDoc = await payload.findByID({
          collection: (collection || 'articles') as any,
          id: Number(articleId),
          select: { title: true } as any,
          overrideAccess: true,
        })
        if (articleDoc?.title) {
          mediaSubjects = articleDoc.title
          mediaTitle = toTitleCaseUnderscored(articleDoc.title)
        }
      } catch (e) {
        console.log('Article title fetch for subjects/title failed (non-fatal):', e)
      }
    }

    // Create media record using Payload's local API with file data
    const mediaRecord = await payload.create({
      collection: 'media',
      data: {
        alt: generatedAltText,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryResourceType: 'image',
        cloudinaryFormat: ext,
        cloudinaryVersion: Number(uploadResult.version),
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        ...(mediaSubjects !== undefined && { subjects: mediaSubjects }),
        ...(mediaTitle !== undefined && { title: mediaTitle }),
      } as any,
      file: {
        data: imageBuffer,
        mimetype: contentType,
        name: `${filename}.${ext}`,
        size: imageBuffer.byteLength,
      },
    })
    console.log('Media record created:', mediaRecord.id)

    // Update article only if not saveToMediaOnly
    if (!saveToMediaOnly) {
      const collectionSlug = collection || 'articles'
      await payload.update({
        collection: collectionSlug as any,
        id: Number(articleId),
        data: {
          featuredImage: mediaRecord.id,
          featuredImageUrl: uploadResult.secure_url,
          featuredImageAlt: filename.replace(/-/g, ' '),
        } as any,
      })
      console.log('Article updated successfully')
    } else {
      console.log('Saved to media only, article not updated')
    }

    return NextResponse.json({ success: true, url: uploadResult.secure_url })
  } catch (error: any) {
    console.error('Upload route error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
