import { getPayload } from 'payload'
import config from '../payload.config'

const KEYWORDS = [
  // Royals
  { keyword: 'King Charles', category: 'royals' },
  { keyword: 'Prince William', category: 'royals' },
  { keyword: 'Kate Middleton', category: 'royals' },
  { keyword: 'Prince Harry', category: 'royals' },
  { keyword: 'Meghan Markle', category: 'royals' },
  { keyword: 'Princess of Wales', category: 'royals' },
  { keyword: 'Prince George', category: 'royals' },
  { keyword: 'Prince Andrew', category: 'royals' },
  { keyword: 'Queen Camilla', category: 'royals' },
  { keyword: 'Princess Charlotte', category: 'royals' },
  { keyword: 'Prince Louis', category: 'royals' },
  { keyword: 'Buckingham Palace', category: 'royals' },
  // Entertainment
  { keyword: 'Taylor Swift', category: 'entertainment' },
  { keyword: 'Brad Pitt', category: 'entertainment' },
  { keyword: 'Kim Kardashian', category: 'entertainment' },
  { keyword: 'Beyonce', category: 'entertainment' },
  { keyword: 'Bruce Willis', category: 'entertainment' },
  { keyword: 'Justin Bieber', category: 'entertainment' },
  { keyword: 'Jennifer Lopez', category: 'entertainment' },
  { keyword: 'Demi Moore', category: 'entertainment' },
  { keyword: 'Nicole Kidman', category: 'entertainment' },
  { keyword: 'Reese Witherspoon', category: 'entertainment' },
  { keyword: 'Selena Gomez', category: 'entertainment' },
  { keyword: 'Zendaya', category: 'entertainment' },
  { keyword: 'Sydney Sweeney', category: 'entertainment' },
  { keyword: 'Margot Robbie', category: 'entertainment' },
  // Celebrity
  { keyword: 'Ben Affleck', category: 'celebrity' },
  { keyword: 'Angelina Jolie', category: 'celebrity' },
  { keyword: 'Tom Cruise', category: 'celebrity' },
  { keyword: 'Suri Cruise', category: 'celebrity' },
  { keyword: 'Shiloh Jolie', category: 'celebrity' },
  { keyword: 'Maddox Jolie', category: 'celebrity' },
  { keyword: 'Lindsay Lohan', category: 'celebrity' },
  { keyword: 'Paris Hilton', category: 'celebrity' },
  { keyword: 'Britney Spears', category: 'celebrity' },
  { keyword: 'Kanye West', category: 'celebrity' },
  { keyword: 'Johnny Depp', category: 'celebrity' },
  { keyword: 'Jennifer Aniston', category: 'celebrity' },
  { keyword: 'George Clooney', category: 'celebrity' },
  // TV
  { keyword: 'Love Island UK', category: 'tv' },
  { keyword: 'Strictly Come Dancing', category: 'tv' },
  { keyword: 'Celebrity Big Brother UK', category: 'tv' },
  { keyword: 'The Traitors UK', category: 'tv' },
  { keyword: 'EastEnders', category: 'tv' },
  { keyword: 'Coronation Street', category: 'tv' },
  { keyword: 'Emmerdale', category: 'tv' },
  { keyword: "Britain's Got Talent", category: 'tv' },
  { keyword: 'Doctor Who', category: 'tv' },
  { keyword: "Clarkson's Farm", category: 'tv' },
  { keyword: 'White Lotus HBO', category: 'tv' },
  { keyword: 'Squid Game', category: 'tv' },
  { keyword: 'Bridgerton', category: 'tv' },
  { keyword: 'Channel 4 reality TV', category: 'tv' },
  // Music
  { keyword: 'Oasis', category: 'music' },
  { keyword: 'Sabrina Carpenter', category: 'music' },
  { keyword: 'Charli XCX', category: 'music' },
  { keyword: 'Dua Lipa', category: 'music' },
  { keyword: 'Ed Sheeran', category: 'music' },
  { keyword: 'Glastonbury 2026', category: 'music' },
  { keyword: 'Bad Bunny', category: 'music' },
  { keyword: 'Rihanna', category: 'music' },
  { keyword: 'Katy Perry', category: 'music' },
  { keyword: 'Adele', category: 'music' },
  { keyword: 'Harry Styles', category: 'music' },
  { keyword: 'Billie Eilish', category: 'music' },
  { keyword: 'Lady Gaga', category: 'music' },
  { keyword: 'The Weeknd', category: 'music' },
  { keyword: 'Drake', category: 'music' },
  { keyword: 'Ariana Grande', category: 'music' },
  { keyword: 'Coldplay', category: 'music' },
  // Film
  { keyword: 'Netflix', category: 'film' },
  { keyword: 'Disney Plus', category: 'film' },
  { keyword: 'Amazon Prime Video', category: 'film' },
  { keyword: 'Apple TV', category: 'film' },
  { keyword: 'HBO Max', category: 'film' },
  { keyword: 'Marvel Studios', category: 'film' },
  { keyword: 'DC Studios', category: 'film' },
  { keyword: 'Universal Pictures', category: 'film' },
  { keyword: 'Mission Impossible Final Reckoning', category: 'film' },
  { keyword: 'Jurassic World Rebirth', category: 'film' },
  // Lifestyle
  { keyword: 'Skincare', category: 'lifestyle' },
  { keyword: 'Makeup', category: 'lifestyle' },
  { keyword: "Women's health", category: 'lifestyle' },
  { keyword: "Men's health", category: 'lifestyle' },
  { keyword: 'Hair and scalp', category: 'lifestyle' },
  { keyword: 'Baby products', category: 'lifestyle' },
  { keyword: 'Astrology', category: 'lifestyle' },
] as const

async function seedKeywords() {
  const payload = await getPayload({ config })

  console.log(`Seeding ${KEYWORDS.length} keywords...`)

  let created = 0
  let skipped = 0

  for (const kw of KEYWORDS) {
    try {
      const existing = await payload.find({
        collection: 'keywords',
        where: { keyword: { equals: kw.keyword } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        console.log(`  Skip (exists): ${kw.keyword}`)
        skipped++
        continue
      }

      await payload.create({
        collection: 'keywords',
        data: {
          keyword: kw.keyword,
          category: kw.category,
          active: true,
        },
      })

      console.log(`  Created: ${kw.keyword} [${kw.category}]`)
      created++
    } catch (err: any) {
      console.error(`  Error seeding "${kw.keyword}": ${err.message}`)
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped`)
  process.exit(0)
}

seedKeywords().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
