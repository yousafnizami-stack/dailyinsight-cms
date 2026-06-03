import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const PIPELINE_SECRET = process.env.PIPELINE_SECRET || 'kF3zX8vQ'

export async function PATCH(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== PIPELINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id, active } = await req.json()
    const payload = await getPayload({ config })
    const result = await payload.update({
      collection: 'keywords',
      id: Number(id),
      data: { active },
      overrideAccess: true,
    })
    return NextResponse.json({ doc: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== PIPELINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { keyword, category } = await req.json()
    const payload = await getPayload({ config })
    const result = await payload.create({
      collection: 'keywords',
      data: { keyword, category, active: true },
      overrideAccess: true,
    })
    return NextResponse.json({ doc: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== PIPELINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await req.json()
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'keywords',
      id: Number(id),
      overrideAccess: true,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
