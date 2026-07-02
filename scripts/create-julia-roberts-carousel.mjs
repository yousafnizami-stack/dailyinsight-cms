/**
 * One-off script: upload 11 Julia Roberts images + create draft article with carousel block.
 * Run with: node scripts/create-julia-roberts-carousel.mjs
 *
 * Config inspection notes (src/collections/Articles.ts, Media.ts, CarouselBlock.ts):
 *   - Media.alt       → type: text (plain string)
 *   - Media.caption   → type: text (plain string)
 *   - Media upload file field name → "file"
 *   - Articles.author → type: select (NOT a relationship to an Authors collection)
 *                        Web Desk select value = "web-desk"
 *   - Articles.category → type: relationship, relationTo: "categories" (looked up at runtime)
 *   - CarouselBlock images[] → { image: <mediaId>, caption: <string> }
 *
 * Uses global fetch, FormData, Blob — all available natively in Node 20, no imports needed.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const CMS_URL = 'https://admin.dailyinsight.co.uk'
const IMAGES_DIR = `${process.env.HOME}/Downloads/Julia Roberts Carousel JPEGS`

let HEADERS = {}

// ─── Auth ───────────────────────────────────────────────────────────────────────

async function login() {
  const email = process.env.CMS_ADMIN_EMAIL
  const password = process.env.CMS_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('✗ Missing credentials: both CMS_ADMIN_EMAIL and CMS_ADMIN_PASSWORD must be set.')
    console.error('  export CMS_ADMIN_EMAIL=you@example.com')
    console.error('  export CMS_ADMIN_PASSWORD=yourpassword')
    process.exit(1)
  }

  const res = await fetch(`${CMS_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`\n✗ Login failed: ${res.status}`)
    console.error(text)
    process.exit(1)
  }

  const data = await res.json()
  const token = data?.token
  if (!token) {
    console.error('✗ No token in login response:')
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log('  ✓ Logged in')
  HEADERS = { Authorization: `JWT ${token}` }
}

// ─── Image metadata ────────────────────────────────────────────────────────────

const IMAGES = [
  {
    filename: 'Julia_Roberts_1.jpg',
    alt: 'A young woman with curly reddish hair in an oversized grey suit and purple tie, smiling and making a peace sign while holding a small golden trophy',
    caption: 'Julia Roberts at the 1990 Golden Globe Awards, wearing an oversized Armani menswear suit with a purple floral tie, flashing a peace sign while holding her Best Supporting Actress trophy for Steel Magnolias | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_2.jpg',
    alt: 'A young woman with long curly hair wearing an oversized cream knit sweater dress and black thigh-high socks at an evening event',
    caption: 'Julia Roberts at a film premiere in the early 1990s, wearing an oversized cream cable-knit sweater dress with black over-the-knee socks | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_3.jpg',
    alt: 'A woman with long curly blonde hair wearing a black fitted dress with a scooped neckline at an indoor event',
    caption: 'Julia Roberts arriving at a Hollywood event in the early 1990s in a fitted black dress with a sweetheart neckline | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_4.jpg',
    alt: 'Five women posing closely together for a group portrait, arms linked, against a plain grey backdrop',
    caption: 'Julia Roberts with her Steel Magnolias co-stars in a promotional portrait for the 1989 film | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_5.jpg',
    alt: 'A woman with long straight hair wearing a sleeveless taupe dress and long gold earrings, standing outdoors on a red carpet',
    caption: 'Julia Roberts on the red carpet at an awards ceremony in the early 1990s, wearing a sleeveless taupe gown with statement gold earrings | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_6.jpg',
    alt: 'Two women laughing together, one with short brown hair in a tan sleeveless top, the other with long blonde hair',
    caption: 'Julia Roberts sharing a laugh with a friend at an evening event in the early 1990s | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_7.jpg',
    alt: 'A woman with wavy brown hair wearing a black and white striped crop top and striped trousers, walking outdoors at night',
    caption: 'Julia Roberts out in Los Angeles in the mid-1990s, wearing a striped cropped top and matching drawstring trousers | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_8.jpg',
    alt: 'A woman in a black strapless gown with white trim and a long train, holding a gold trophy in front of an Academy Awards backdrop',
    caption: 'Julia Roberts backstage at the 2001 Academy Awards, holding her Best Actress Oscar for Erin Brockovich in a black-and-white Valentino gown | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_9.jpg',
    alt: 'A smiling woman with dark wavy hair wearing a brown long-sleeve dress and pearl earrings at an indoor event',
    caption: 'Julia Roberts at a film premiere, wearing a fitted long-sleeve brown dress with drop pearl earrings | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_10.jpg',
    alt: 'A woman with side-swept bangs wearing dark sunglasses and a black v-neck sweater over a white top, standing against a wooden wall',
    caption: 'Julia Roberts outside a studio in the late 1990s, wearing dark sunglasses over a black v-neck sweater layered over a white top | Photo: Getty Images',
  },
  {
    filename: 'Julia_Roberts_11.jpg',
    alt: 'A woman with a shoulder-length bob wearing a green cardigan over a pink floral slip dress, holding a small clutch bag',
    caption: 'Julia Roberts at an evening event in the late 1990s, wearing a floral slip dress layered under an olive green cardigan | Photo: Getty Images',
  },
]

// ─── Article content ───────────────────────────────────────────────────────────

const ARTICLE_TITLE = '11 Images of Julia Roberts Before Hollywood Made Her a Star'

const ARTICLE_EXCERPT = 'From her Golden Globes-winning suit to Oscar night in black-and-white Valentino, 11 photos that trace Julia Roberts rise to Hollywood A-list.'

const INTRO_TEXT = 'Long before she was one of the most bankable stars in Hollywood, Julia Roberts was a Georgia-born newcomer trying to break through in a crowded industry. Her first real notice came with 1988s Mystic Pizza, but it was 1989s Steel Magnolias that put her on the map, earning her an Academy Award nomination and a Golden Globe win for Best Supporting Actress. A year later, Pretty Woman turned her into a global star overnight, and the wide-eyed newcomer captured in these early photos was suddenly one of the most photographed women in the world.'

const OUTRO_TEXT_A = 'Roberts has never really left the spotlight since. She was most recently seen in After the Hunt, Luca Guadagninos psychological drama opposite Ayo Edebiri and Andrew Garfield, which earned her a Golden Globe nomination for Best Female Actor in a Motion Picture Drama this year.'

const OUTRO_TEXT_B = 'Her upcoming slate is just as busy. Shes set to reunite with Homecoming director Sam Esmail for the thriller Panic Carefully, due out in February 2027, and shes also attached to star in and produce an adaptation of the novel Home Economics for Sony, a project announced earlier this year.'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParagraphNode(text) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text, format: 0, version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function makeCarouselNode(mediaIds) {
  return {
    type: 'block',
    fields: {
      blockType: 'carousel',
      id: 'julia-roberts-carousel-1',
      images: mediaIds.map((id, i) => ({
        id: `carousel-img-${i + 1}`,
        image: id,
        caption: IMAGES[i].caption,
      })),
    },
    format: '',
    version: 2,
  }
}

function buildLexicalBody(mediaIds) {
  return {
    root: {
      type: 'root',
      children: [
        makeParagraphNode(INTRO_TEXT),
        makeCarouselNode(mediaIds),
        makeParagraphNode(OUTRO_TEXT_A),
        makeParagraphNode(OUTRO_TEXT_B),
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ─── Part 1: Upload images ─────────────────────────────────────────────────────

async function uploadImage(img) {
  const filePath = resolve(`${IMAGES_DIR}/${img.filename}`)
  const fileBuffer = readFileSync(filePath)

  const form = new FormData()
  form.append('file', new Blob([fileBuffer], { type: 'image/jpeg' }), img.filename)
  form.append('_payload', JSON.stringify({ alt: img.alt, caption: img.caption }))

  const res = await fetch(`${CMS_URL}/api/media`, {
    method: 'POST',
    headers: HEADERS,
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`\n✗ Upload failed for ${img.filename}`)
    console.error(`  Status: ${res.status}`)
    console.error(`  Response: ${text}`)
    process.exit(1)
  }

  const data = await res.json()
  const id = data?.doc?.id ?? data?.id
  if (!id) {
    console.error(`\n✗ No ID in response for ${img.filename}:`)
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  console.log(`  ✓ ${img.filename} → media ID ${id}`)
  return id
}

// ─── Part 2: Look up category + create article ────────────────────────────────

async function lookupCelebrityCategory() {
  const res = await fetch(`${CMS_URL}/api/categories?limit=50`, { headers: HEADERS })
  if (!res.ok) {
    console.error(`✗ Failed to fetch categories: ${res.status}`)
    process.exit(1)
  }
  const data = await res.json()
  const doc = (data.docs ?? []).find((d) => d.slug === 'celebrity')
  if (!doc) {
    console.error('✗ No category with slug "celebrity" found. Full list:')
    console.error(JSON.stringify(data.docs?.map((d) => ({ id: d.id, slug: d.slug })), null, 2))
    process.exit(1)
  }
  console.log(`  ✓ Celebrity category ID: ${doc.id}`)
  return doc.id
}

async function createArticle(categoryId, mediaIds) {
  const body = buildLexicalBody(mediaIds)

  const payload = {
    title: ARTICLE_TITLE,
    status: 'draft',
    // author is a select field (not a relationship) — Web Desk = 'web-desk'
    author: 'web-desk',
    category: categoryId,
    excerpt: ARTICLE_EXCERPT,
    body,
  }

  const res = await fetch(`${CMS_URL}/api/articles`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`\n✗ Article creation failed: ${res.status}`)
    console.error(text)
    process.exit(1)
  }

  const data = await res.json()
  const id = data?.doc?.id ?? data?.id
  if (!id) {
    console.error('✗ No article ID in response:')
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }
  return id
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Julia Roberts Carousel Script ===\n')

  console.log('Authenticating…')
  await login()

  console.log('\nPart 1: Uploading 11 images to Media…')
  const mediaIds = []
  for (const img of IMAGES) {
    const id = await uploadImage(img)
    mediaIds.push(id)
  }
  console.log(`\nAll 11 images uploaded. IDs: [${mediaIds.join(', ')}]\n`)

  console.log('Part 2: Looking up Celebrity category…')
  const categoryId = await lookupCelebrityCategory()

  console.log('\nCreating draft article…')
  const articleId = await createArticle(categoryId, mediaIds)

  console.log('\n=== Done ===')
  console.log(`Article ID : ${articleId}`)
  console.log(`Admin URL  : ${CMS_URL}/admin/collections/articles/${articleId}`)
}

main().catch((err) => {
  console.error('\n✗ Unexpected error:', err)
  process.exit(1)
})
