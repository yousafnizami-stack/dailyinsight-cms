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
      public_id: `dailyinsight/${filename}`,
      overwrite: true,
      resource_type: 'image',
    })
    console.log('Cloudinary upload success:', uploadResult.secure_url)

    // Create media record using Payload's local API with file data
    const mediaRecord = await payload.create({
      collection: 'media',
      data: {
        alt: filename.replace(/-/g, ' '),
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
        featuredImage: null,
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
