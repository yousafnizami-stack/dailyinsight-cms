import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

// PendingDrafts.access.delete (src/collections/PendingDrafts.ts) is Boolean(user) only —
// no x-api-key bypass, same reasoning as /api/articles-update's own comment for Articles.
// This route is that bypass for pending-drafts deletes specifically: gated by
// PIPELINE_SECRET itself, then overrideAccess:true past the collection's own user-only
// rule. Used by dailyinsight-pipeline's Review tab for both the per-row "Delete" button on
// staged rows and the lazy 7-day auto-expiry cleanup.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'pending-drafts',
      id,
      overrideAccess: true,
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
