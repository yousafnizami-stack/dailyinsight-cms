import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

// PendingDrafts.access.delete (src/collections/PendingDrafts.ts) is Boolean(user) only —
// no x-api-key bypass, same reasoning as /api/articles-update's own comment for Articles.
// This route is that bypass for pending-drafts deletes specifically: gated by
// PIPELINE_SECRET itself, then overrideAccess:true past the collection's own user-only
// rule. Used by dailyinsight-pipeline's Review tab for both the per-row "Delete" button on
// staged rows and the lazy 7-day auto-expiry cleanup.
//
// Lives at its own /delete path — not the bare /api/pending-drafts/[id] — because a
// custom DELETE handler there previously shadowed ALL methods at that exact path
// (including Payload's own native PATCH used by the CMS admin panel's Save button),
// since Next.js App Router resolves the most specific route file first and does not fall
// through to a different file (like Payload's own [...slug] catch-all,
// src/app/(payload)/api/[...slug]/route.ts) for a method the matched file doesn't export.
// Moving DELETE to its own path leaves the bare /api/pending-drafts/[id] path entirely
// unoccupied by any custom route, so it now falls through cleanly to Payload's catch-all
// for GET/PATCH/POST/PUT — confirmed root cause of a live 405 on
// PATCH /api/pending-drafts/10 from the admin panel's native Save button.
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
