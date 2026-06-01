import payload from 'payload'
import config from '../payload.config'

async function fixAuthors() {
  await payload.init({ config })
  const articles = await payload.find({
    collection: 'articles',
    where: { author: { exists: false } },
    limit: 500,
  })
  console.log(`Found ${articles.totalDocs} articles without author`)
  for (const article of articles.docs) {
    await payload.update({
      collection: 'articles',
      id: article.id,
      data: { author: 'web-desk' },
    })
    console.log(`Updated article ${article.id}`)
  }
  console.log('Done')
  process.exit(0)
}

fixAuthors()
