/**
 * One-time seed script: replaces all RSS sources with a curated 21-source set.
 * Run: node scripts/seed-rss-sources.mjs
 */

const BASE_URL = 'https://admin.dailyinsight.co.uk'
const API_KEY = 'kF3zX8vQ'

const SOURCES = [
  // ROYALS
  { url: 'https://www.hellomagazine.com/feeds/rss/royalty', category: 'royals', weight: 1.0 },
  { url: 'https://feeds.bbci.co.uk/news/uk/rss.xml', category: 'royals', weight: 1.0 },
  { url: 'https://www.express.co.uk/posts/rss/139/royal-family', category: 'royals', weight: 1.0 },

  // CELEBRITY
  { url: 'https://metro.co.uk/entertainment/showbiz/?service=rss', category: 'celebrity', weight: 0.85 },
  { url: 'https://www.mirror.co.uk/3am/?service=rss', category: 'celebrity', weight: 0.85 },
  { url: 'https://www.standard.co.uk/showbiz/rss', category: 'celebrity', weight: 0.85 },

  // ENTERTAINMENT
  { url: 'https://www.dailymail.co.uk/tvshowbiz/index.rss', category: 'entertainment', weight: 0.85 },
  { url: 'https://justjared.com/feed', category: 'entertainment', weight: 0.85 },
  { url: 'https://hollywoodlife.com/feed', category: 'entertainment', weight: 0.85 },

  // TV
  { url: 'https://www.thesun.co.uk/tv/?service=rss', category: 'tv', weight: 0.85 },
  { url: 'https://metro.co.uk/entertainment/tv/?service=rss', category: 'tv', weight: 0.85 },
  { url: 'https://www.mirror.co.uk/tv/?service=rss', category: 'tv', weight: 0.85 },

  // MUSIC
  { url: 'https://www.nme.com/news/music/feed', category: 'music', weight: 0.85 },
  { url: 'https://www.thesun.co.uk/topic/music/?service=rss', category: 'music', weight: 0.85 },
  { url: 'https://metro.co.uk/entertainment/music/?service=rss', category: 'music', weight: 0.85 },

  // FILM
  { url: 'https://variety.com/feed', category: 'film', weight: 0.85 },
  { url: 'https://metro.co.uk/entertainment/film/?service=rss', category: 'film', weight: 0.85 },
  { url: 'https://www.mirror.co.uk/film/?service=rss', category: 'film', weight: 0.85 },

  // LIFESTYLE
  { url: 'https://www.hellomagazine.com/feeds/rss/lifestyle', category: 'lifestyle', weight: 0.80 },
  { url: 'https://metro.co.uk/lifestyle/?service=rss', category: 'lifestyle', weight: 0.80 },
  { url: 'https://www.standard.co.uk/lifestyle/rss', category: 'lifestyle', weight: 0.80 },
]

const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY }

async function fetchAllSources() {
  const res = await fetch(`${BASE_URL}/api/rss-sources?limit=200&depth=0`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch sources: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.docs || []
}

async function deleteSource(id) {
  const res = await fetch(`${BASE_URL}/api/rss-sources/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`DELETE ${id} failed: ${res.status} — ${body.slice(0, 200)}`)
  }
}

async function createSource(source) {
  const res = await fetch(`${BASE_URL}/api/rss-sources`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...source, active: true }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`POST failed: ${res.status} — ${body.slice(0, 200)}`)
  const data = JSON.parse(body)
  return data.doc?.id ?? data.id
}

async function main() {
  console.log('='.repeat(60))
  console.log('RSS SOURCES SEED SCRIPT')
  console.log('='.repeat(60))

  // Step 1: fetch and delete all existing sources
  console.log('\n[1/2] Fetching existing RSS sources...')
  const existing = await fetchAllSources()
  console.log(`      Found ${existing.length} existing source(s)`)

  for (const src of existing) {
    process.stdout.write(`      DELETE ${src.url} ... `)
    await deleteSource(src.id)
    console.log('done')
  }

  // Step 2: insert curated sources
  console.log(`\n[2/2] Inserting ${SOURCES.length} curated sources...`)
  let created = 0
  let failed = 0

  for (const source of SOURCES) {
    process.stdout.write(`      POST [${source.category}] ${source.url} ... `)
    try {
      const id = await createSource(source)
      console.log(`done (id: ${id})`)
      created++
    } catch (err) {
      console.log(`FAILED — ${err.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`COMPLETE: ${created} created, ${failed} failed`)
  console.log('='.repeat(60))
}

main().catch(err => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
