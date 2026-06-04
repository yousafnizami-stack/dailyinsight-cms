import { getPayload } from 'payload'
import config from '../payload.config'

async function seedAuthors() {
  const payload = await getPayload({ config })
  const authors = [
    { name: 'Sarah Whitmore', slug: 'sarah-whitmore', role: 'Royal Correspondent', bio: 'Sarah Whitmore has reported on the British Royal Family for over a decade. She covers everything from state occasions to the stories behind palace doors, bringing warmth and authority to every piece.' },
    { name: 'Entertainment Desk', slug: 'di-entertainment-desk', role: 'Entertainment', bio: 'The Daily Insight Entertainment Desk covers Hollywood, reality TV and celebrity culture with warmth, wit and an eye for the stories readers actually want to read.' },
    { name: 'Music Desk', slug: 'di-music-desk', role: 'Music', bio: 'The Daily Insight Music Desk covers the artists and moments that define the UK music scene — from chart news to Glastonbury and everything in between.' },
    { name: 'Film Desk', slug: 'di-film-desk', role: 'Film & TV', bio: 'The Daily Insight Film Desk covers blockbusters, streaming and awards season with a distinctly British perspective on the world of cinema.' },
    { name: 'Web Desk', slug: 'web-desk', role: 'News & Features', bio: 'The Daily Insight Web Desk delivers the breaking news, trending topics and human interest stories that keep UK readers informed and entertained.' },
    { name: 'Celebrity Desk', slug: 'celebrity-desk', role: 'Celebrity', bio: 'The Daily Insight Celebrity Desk tracks the biggest names in entertainment and public life — from red carpet moments to the stories behind the headlines.' },
    { name: 'News Desk', slug: 'news-desk', role: 'News', bio: 'The Daily Insight News Desk covers the stories that matter to readers across the UK — fast, accurate and always readable.' },
  ]
  for (const author of authors) {
    try {
      await payload.create({ collection: 'authors', data: author as any })
      console.log('Created:', author.name)
    } catch (e: any) {
      console.log('Skipped:', author.name, e.message)
    }
  }
  process.exit(0)
}
seedAuthors()
