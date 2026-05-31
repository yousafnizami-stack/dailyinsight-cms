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
    console.log('Received collection:', collection, 'articleId:', articleId)
    const payload = await getPayload({ config })

    let uploadResult: any
    try {
      const imageResponse = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': new URL(imageUrl).origin,
        }
      })

      if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`)

      const imageBuffer = await imageResponse.arrayBuffer()
      const base64Image = `data:${imageResponse.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(imageBuffer).toString('base64')}`

      uploadResult = await cloudinary.uploader.upload(base64Image, {
        public_id: `dailyinsight/${filename}`,
        overwrite: false,
        resource_type: 'image',
      })
      console.log('Cloudinary upload success:', uploadResult.secure_url)
    } catch (err) {
      console.error('Cloudinary upload error:', err)
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }

    const mediaRecord = await payload.create({
      collection: 'media',
      data: {
        alt: filename.replace(/-/g, ' '),
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryResourceType: uploadResult.resource_type,
        cloudinaryFormat: uploadResult.format,
        cloudinaryVersion: Number(uploadResult.version),
        url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
      } as any,
    })

    console.log('Media record created, id:', mediaRecord.id)
    console.log('Updating article, collection:', collection, 'id:', articleId)

    await payload.update({
      collection: collection || 'articles',
      id: articleId,
      data: { featuredImage: mediaRecord.id },
    })

    return NextResponse.json({ success: true, url: uploadResult.secure_url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
