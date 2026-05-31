import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json()
    const payload = await getPayload({ config })
    const { db } = payload

    // Create table if not exists
    await db.execute(sql`CREATE TABLE IF NOT EXISTS used_urls (
      url TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW()
    )`)

    // Insert URLs, ignore duplicates
    for (const url of urls) {
      await db.execute(sql`INSERT INTO used_urls (url) VALUES (${url}) ON CONFLICT (url) DO NOTHING`)
    }

    // Clean up URLs older than 7 days
    await db.execute(sql`DELETE FROM used_urls WHERE created_at < NOW() - INTERVAL '7 days'`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
