import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { action, urls, keyword } = await req.json()
    const payload = await getPayload({ config })

    if (action === 'check') {
      for (const url of urls) {
        const result = await payload.find({
          collection: 'used-urls',
          where: { url: { equals: url } },
          limit: 1,
        })
        if (result.totalDocs > 0) {
          return NextResponse.json({ duplicate: true, url })
        }
      }
      return NextResponse.json({ duplicate: false })
    }

    if (action === 'save') {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      for (const url of urls) {
        try {
          await payload.create({
            collection: 'used-urls',
            data: {
              url,
              keyword: keyword || '',
              expiresAt: expiresAt.toISOString(),
            },
          })
        } catch {
          // URL already exists — ignore duplicate error
        }
      }

      // Clean up expired URLs
      const now = new Date().toISOString()
      const expired = await payload.find({
        collection: 'used-urls',
        where: { expiresAt: { less_than: now } },
        limit: 100,
      })
      for (const doc of expired.docs) {
        await payload.delete({ collection: 'used-urls', id: doc.id })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
