import { getPayload } from 'payload'
import config from '../payload.config'

async function seedAuthors() {
  const payload = await getPayload({ config })

  const authors = [
    {
      name: 'Sarah Whitmore',
      slug: 'sarah-whitmore',
      role: 'Royal Correspondent',
      bio: "Sarah Whitmore has covered the British Royal Family for more than a decade, reporting on everything from state occasions and palace announcements to the more intimate moments that reveal the monarchy's human side. A graduate of the University of Edinburgh, she brings both academic rigour and genuine passion to her royal coverage. When she's not tracking the latest from Kensington Palace or Windsor, she's an avid reader of royal biographies and a firm believer that the monarchy's story is really Britain's story.",
    },
    {
      name: 'Entertainment Desk',
      slug: 'di-entertainment-desk',
      role: 'Entertainment',
      bio: "The Daily Insight Entertainment Desk brings together a team of writers with a shared obsession: the stories behind the stars. From Hollywood A-listers to reality TV's biggest moments, the desk covers celebrity culture with warmth, wit and an eye for the detail that others miss. Based in London, the team is plugged into the entertainment industry on both sides of the Atlantic.",
    },
    {
      name: 'Music Desk',
      slug: 'di-music-desk',
      role: 'Music',
      bio: "The Daily Insight Music Desk covers the artists, albums and industry moments that define the soundtrack of British life. From Glastonbury headliners to breakthrough acts making noise in the charts, the team writes about music with the enthusiasm of fans and the instincts of seasoned journalists. Whether it's a stadium tour announcement or a behind-the-scenes industry story, if it matters to music lovers in the UK, the desk is on it.",
    },
    {
      name: 'Film Desk',
      slug: 'di-film-desk',
      role: 'Film & TV',
      bio: "The Daily Insight Film Desk covers cinema from every angle — blockbuster releases, streaming wars, awards season drama and the human stories behind the camera. The team brings a distinctly British perspective to Hollywood coverage, with a particular interest in UK talent making waves on the world stage. From Marvel to arthouse, box office to Bafta, no story is too big or too small.",
    },
    {
      name: 'Web Desk',
      slug: 'web-desk',
      role: 'News & Features',
      bio: "The Daily Insight Web Desk keeps readers across the UK up to date with the stories that matter most — breaking news, trending topics and the kind of human interest stories that get people talking. Fast, reliable and always readable, the desk is the heartbeat of the site's daily coverage.",
    },
    {
      name: 'Celebrity Desk',
      slug: 'celebrity-desk',
      role: 'Celebrity',
      bio: "The Daily Insight Celebrity Desk tracks the biggest names in entertainment, sport and public life — from red carpet moments to the stories behind the headlines. With contacts across the industry and a nose for what readers actually want to know, the desk delivers celebrity coverage that goes beyond the surface.",
    },
    {
      name: 'News Desk',
      slug: 'news-desk',
      role: 'News',
      bio: "The Daily Insight News Desk covers the stories that matter to readers across the UK — from breaking developments to the deeper context behind the day's biggest talking points. Thorough, accurate and always accessible, the desk is committed to keeping our audience informed.",
    },
  ]

  for (const author of authors) {
    try {
      await payload.create({ collection: 'authors', data: author as any })
      console.log('Created author:', author.name)
    } catch (e: any) {
      console.log('Skipped (may exist):', author.name, e.message)
    }
  }

  console.log('Done')
  process.exit(0)
}

seedAuthors()
