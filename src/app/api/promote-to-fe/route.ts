import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { id, collectionSlug } = await req.json()

    if (collectionSlug !== 'articles' && collectionSlug !== 'rss-articles') {
      return NextResponse.json({ error: 'Invalid source collection' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const sourceArticle = await payload.findByID({
      collection: collectionSlug,
      id,
      depth: 1,
    })

    if (!sourceArticle) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

    const { id: _id, createdAt, updatedAt, ...articleData } = sourceArticle as any

    const isKw = collectionSlug === 'articles'
    const pipelineLabel = isKw ? 'KW pipeline' : 'RSS pipeline'
    const reviewNote = (articleData.reviewNote || '') + ` [Promoted from ${pipelineLabel}]`

    const promoted = await payload.create({
      collection: 'fe-articles',
      data: {
        ...articleData,
        status: 'draft',
        reviewNote,
        source: isKw ? 'kw-pipeline' : 'rss-pipeline',
      },
    })

    await payload.delete({ collection: collectionSlug, id })

    return NextResponse.json({ success: true, id: promoted.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
