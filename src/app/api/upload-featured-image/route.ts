import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, filename, articleId, collection } = await req.json()
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
      } as any,
      file: {
        data: imageBuffer,
        mimetype: contentType,
        name: `${filename}.${ext}`,
        size: imageBuffer.byteLength,
      },
    })
    console.log('Media record created:', mediaRecord.id)

    // Update article
    const collectionSlug = collection || 'articles'
    await payload.update({
      collection: collectionSlug as any,
      id: Number(articleId),
      data: {
        featuredImage: mediaRecord.id,
        featuredImageUrl: uploadResult.secure_url,
        featuredImageAlt: filename.replace(/-/g, ' '),
        imageOptions: [],
      } as any,
    })
    console.log('Article updated successfully')

    return NextResponse.json({ success: true, url: uploadResult.secure_url })
  } catch (error: any) {
    console.error('Upload route error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
