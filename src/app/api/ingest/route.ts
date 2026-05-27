import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '../../../payload.config'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.PIPELINE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized', received: auth }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    const body = await req.json()

    // Resolve category slug → ID
    let categoryId: string | number | undefined
    if (body.category && typeof body.category === 'string') {
      const result = await payload.find({
        collection: 'categories',
        where: { slug: { equals: body.category } },
        limit: 1,
        overrideAccess: true,
      })
      if (result.docs.length === 0) {
        return NextResponse.json({ error: `Category not found: ${body.category}` }, { status: 400 })
      }
      categoryId = result.docs[0].id
    }

    // Resolve featuredImage URL → media document ID
    let featuredImageId: string | number | undefined
    if (body.featuredImage && typeof body.featuredImage === 'string') {
      const imageUrl = body.featuredImage
      const imageRes = await fetch(imageUrl)
      if (!imageRes.ok) {
        return NextResponse.json({ error: `Failed to fetch image: ${imageUrl}` }, { status: 400 })
      }
      const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg'
      const arrayBuffer = await imageRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'image.jpg'

      try {
        const media = await payload.create({
          collection: 'media',
          data: { alt: body.featuredImageAlt ?? body.title ?? filename },
          file: {
            data: buffer,
            mimetype: contentType,
            name: filename,
            size: buffer.length,
          },
          overrideAccess: true,
        })
        featuredImageId = media.id
        console.log(`[ingest] Media created: id=${media.id} filename=${filename}`)
      } catch (mediaErr: any) {
        console.error('[ingest] Failed to create media document:', {
          message: mediaErr.message,
          stack: mediaErr.stack,
          data: mediaErr.data ?? null,
          imageUrl,
          filename,
          contentType,
          bufferSize: buffer.length,
        })
        return NextResponse.json(
          { error: `Media upload failed: ${mediaErr.message}`, imageUrl, filename },
          { status: 500 },
        )
      }
    }

    const { category, featuredImage, ...rest } = body
    const article = await payload.create({
      collection: 'articles',
      data: {
        ...rest,
        ...(categoryId !== undefined && { category: categoryId }),
        ...(featuredImageId !== undefined && { featuredImage: featuredImageId }),
      },
      overrideAccess: true,
    })
    return NextResponse.json({ id: article.id }, { status: 201 })
  } catch (err: any) {
    console.error('[ingest] Unhandled error:', { message: err.message, stack: err.stack, data: err.data ?? null })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
