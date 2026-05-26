import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '../../../payload.config'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  const expected = `Bearer ${process.env.PIPELINE_SECRET}`
  
  console.log('[pipeline] Auth received:', auth)
  console.log('[pipeline] Expected:', expected)
  console.log('[pipeline] PIPELINE_SECRET env:', process.env.PIPELINE_SECRET)

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized', received: auth, expected }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const article = await payload.create({
      collection: 'articles',
      data: body,
      overrideAccess: true,
    })
    return NextResponse.json({ id: article.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
