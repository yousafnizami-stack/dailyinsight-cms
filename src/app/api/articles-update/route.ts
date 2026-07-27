import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '../../../payload.config'

// Articles.access.update is Boolean(req.user) only — same as create (see api/ingest's own
// comment/precedent) — it does NOT accept an x-api-key header, so an automated caller like
// the PMS Review tab has no way to PATCH an article's status/featured/publishedAt via the
// plain REST API. This mirrors api/ingest's exact bypass pattern: authenticate via
// PIPELINE_SECRET (x-api-key or Bearer), then use the Local API with overrideAccess: true
// to perform the write, still running all of Articles' existing beforeChange/afterChange
// hooks (overrideAccess only skips ACCESS CONTROL checks, not hooks) — e.g. the
// auto-unset-other-featured-articles hook and the auto-set-publishedAt-on-publish hook
// both still fire normally through this endpoint.
export async function PATCH(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const auth = req.headers.get('Authorization')
  if (apiKey !== process.env.PIPELINE_SECRET && auth !== `Bearer ${process.env.PIPELINE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    const { id, data } = await req.json()
    if (!id || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'id and data are required' }, { status: 400 })
    }
    const updated = await payload.update({
      collection: 'articles',
      id,
      data,
      overrideAccess: true,
    })
    return NextResponse.json({ id: updated.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
