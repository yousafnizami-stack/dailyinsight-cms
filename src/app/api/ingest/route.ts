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

    const featuredImageUrl = (body.featuredImage && typeof body.featuredImage === "string") ? body.featuredImage : undefined

    const { category, featuredImage, ...rest } = body
    const article = await payload.create({
      collection: "articles",
      data: {
        ...rest,
        ...(categoryId !== undefined && { category: categoryId }),
        ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      },
