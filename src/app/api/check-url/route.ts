import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json()
    const payload = await getPayload({ config })
    const { db } = payload

    // Create table if not exists
    await db.execute(
      `CREATE TABLE IF NOT EXISTS used_urls (
        url TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    )

    // Check if any URL exists
    for (const url of urls) {
      const result = await db.execute(
        `SELECT url FROM used_urls WHERE url = $1 LIMIT 1`,
        [url]
      )
      if (result.rows.length > 0) {
        return NextResponse.json({ duplicate: true, url })
      }
    }
    return NextResponse.json({ duplicate: false })
  } catch (error: any) {
    return NextResponse.json({ duplicate: false, error: error.message })
  }
}
