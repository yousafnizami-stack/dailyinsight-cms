import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'keywords',
      limit: 0,
      sort: 'category',
    })
    const keywords = result.docs.map(doc => ({
      id: doc.id,
      keyword: doc.keyword,
      category: doc.category,
      active: doc.active,
    }))
    return NextResponse.json({ keywords })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
