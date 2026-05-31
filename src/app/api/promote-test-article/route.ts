import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json()
    const payload = await getPayload({ config })

    const testArticle = await payload.findByID({
      collection: 'test-articles',
      id,
      depth: 1,
    })

    if (!testArticle) return NextResponse.json({ error: 'Test article not found' }, { status: 404 })

    const { id: _id, createdAt, updatedAt, ...articleData } = testArticle as any

    const promoted = await payload.create({
      collection: 'articles',
      data: {
        ...articleData,
        status: 'draft',
        reviewNote: (articleData.reviewNote || '') + ' [Promoted from test pipeline]',
      },
    })

    await payload.delete({
      collection: 'test-articles',
      id,
    })

    return NextResponse.json({ success: true, id: promoted.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
