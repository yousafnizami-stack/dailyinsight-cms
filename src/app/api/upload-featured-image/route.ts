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
    const payload = await getPayload({ config })

    let uploadResult: any
    try {
      uploadResult = await cloudinary.uploader.upload(imageUrl, {
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
        cloudinaryVersion: uploadResult.version,
        url: uploadResult.secure_url,
      },
    })

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
