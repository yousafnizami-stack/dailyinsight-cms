import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { promotePendingDraftToArticle } from '@/lib/promotePendingDraft'

// Promotes a staged pending-draft into a real, published Article, then removes the
// pending-draft. Fetched at depth:0 so relationship fields (category, featuredImage) come
// back as raw IDs rather than populated objects — exactly the shape payload.create()
// expects when handed straight to the new Articles doc (see promotePendingDraftToArticle
// for the actual field mapping, shared with PendingDrafts' own status-field beforeChange
// hook). slug is deliberately not set here — Articles' own beforeChange hook
// (src/collections/Articles.ts) generates one from title automatically when absent, same
// as every other article-creating route in this codebase relies on.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const payload = await getPayload({ config })

    const draft = await payload.findByID({
      collection: 'pending-drafts',
      id,
      depth: 0,
      overrideAccess: true,
    })

    if (!draft) {
      return NextResponse.json({ error: 'Pending draft not found' }, { status: 404 })
    }

    const article = await promotePendingDraftToArticle(payload, draft)

    try {
      await payload.delete({
        collection: 'pending-drafts',
        id,
        overrideAccess: true,
      })
    } catch (deleteErr: any) {
      // The article is already live at this point, which is what matters — do NOT roll
      // back a successful publish over a cleanup failure. An orphaned pending-draft is a
      // harmless leftover that can be deleted separately/manually later; log clearly so
      // it's visible, but still report success below.
      console.error(
        `Pending draft ${id} published as article ${article.id}, but deleting the pending-draft afterward failed:`,
        deleteErr?.message || deleteErr,
      )
    }

    return NextResponse.json({ id: article.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
