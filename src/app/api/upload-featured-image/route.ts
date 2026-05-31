import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'
import { sql } from 'drizzle-orm'

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

    // Step 1: Fetch image as buffer
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      }
    })
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(imageBuffer).toString('base64')}`
    console.log('Image fetched, size:', imageBuffer.byteLength)

    // Step 2: Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      public_id: `dailyinsight/${filename}`,
      overwrite: true,
      resource_type: 'image',
    })
    console.log('Cloudinary upload success:', uploadResult.secure_url)

    const collectionSlug = collection || 'articles'

    // Insert media record directly via SQL
    const { db } = payload
    await db.execute(sql`
      INSERT INTO media (alt, cloudinary_url, cloudinary_public_id, cloudinary_resource_type, cloudinary_format, cloudinary_version, url, width, height, updated_at, created_at)
      VALUES (${filename.replace(/-/g, ' ')}, ${uploadResult.secure_url}, ${uploadResult.public_id}, ${'image'}, ${uploadResult.format}, ${uploadResult.version}, ${uploadResult.secure_url}, ${uploadResult.width}, ${uploadResult.height}, NOW(), NOW())
      RETURNING id
    `)

    const mediaRows = await db.execute(sql`SELECT id FROM media WHERE cloudinary_public_id = ${uploadResult.public_id} LIMIT 1`)
    const mediaId = mediaRows.rows[0].id

    await payload.update({
      collection: collectionSlug as any,
      id: Number(articleId),
      data: {
        featuredImage: mediaId,
        featuredImageUrl: uploadResult.secure_url,
        featuredImageAlt: filename.replace(/-/g, ' '),
        imageOptions: [],
      } as any,
    })
    console.log('Article updated with featuredImage mediaId:', mediaId)

    return NextResponse.json({ success: true, url: uploadResult.secure_url })
  } catch (error: any) {
    console.error('Upload route error:', error?.message || error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
