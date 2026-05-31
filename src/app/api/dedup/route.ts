import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CACHE_FILE = '/tmp/dedup-cache.json'

function loadCache(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    return new Set(data)
  } catch {
    return new Set()
  }
}

function saveCache(urls: Set<string>) {
  try {
    const arr = [...urls]
    const trimmed = arr.length > 1000 ? arr.slice(arr.length - 1000) : arr
    fs.writeFileSync(CACHE_FILE, JSON.stringify(trimmed))
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const { action, urls } = await req.json()
    const cache = loadCache()

    if (action === 'check') {
      for (const url of urls) {
        if (cache.has(url)) {
          return NextResponse.json({ duplicate: true, url })
        }
      }
      return NextResponse.json({ duplicate: false })
    }

    if (action === 'save') {
      for (const url of urls) cache.add(url)
      saveCache(cache)
      return NextResponse.json({ success: true, total: cache.size })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
