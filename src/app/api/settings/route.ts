import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const PIPELINE_SECRET = process.env.PIPELINE_SECRET || 'kF3zX8vQ'

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== PIPELINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const payload = await getPayload({ config })
    const result = await payload.updateGlobal({
      slug: 'pipeline-settings',
      data: body,
      overrideAccess: true,
    })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
