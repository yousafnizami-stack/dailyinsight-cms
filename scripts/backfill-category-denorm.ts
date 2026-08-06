// Backfills categoryName and categorySlug scalar fields on all published articles
// by re-saving each article with its existing category value, triggering the
// beforeChange hook that denormalizes category name+slug onto the document.
//
// SAFETY:
//   - status is NEVER included in the update data, so no draft<->published transitions occur.
//   - The afterChange FB-queue hook guards on:
//       if (previousDoc?.status === 'published' || doc.status !== 'published') return
//     Since these are already-published articles, previousDoc.status === 'published' is true,
//     so the FB-queue hook returns immediately without creating any queue entries.
//   - The beforeChange publishedAt hook only fires when data.status === 'published' &&
//     originalDoc.status !== 'published' — since status is not in data, this is also safe.
//
// VERIFICATION: social-post-queue row count is logged BEFORE and AFTER the backfill.
// These two numbers MUST be identical. Any increase is a bug.

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

async function countSocialPostQueue(payload: any): Promise<number> {
  const res = await payload.find({
    collection: 'social-post-queue',
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return res.totalDocs
}

async function fetchAllPublishedArticles(payload: any): Promise<any[]> {
  const docs: any[] = []
  let page = 1
  while (true) {
    const res = await payload.find({
      collection: 'articles',
      where: { status: { equals: 'published' } },
      depth: 0,
      limit: 100,
      page,
      overrideAccess: true,
    })
    docs.push(...res.docs)
    console.log(`  Fetched page ${page}/${Math.ceil(res.totalDocs / 100)} — ${docs.length}/${res.totalDocs} articles`)
    if (!res.hasNextPage) break
    page++
  }
  return docs
}

async function main() {
  const payload = await getPayload({ config })

  // ── SAFETY CHECK: count social-post-queue BEFORE backfill ──────────────────
  const queueCountBefore = await countSocialPostQueue(payload)
  console.log(`\n=== SAFETY CHECK ===`)
  console.log(`social-post-queue row count BEFORE backfill: ${queueCountBefore}`)

  // ── Fetch all published articles ───────────────────────────────────────────
  console.log(`\nFetching all published articles...`)
  const articles = await fetchAllPublishedArticles(payload)
  console.log(`Total published articles: ${articles.length}`)

  // ── Backfill: re-save each article with its existing category to trigger hook ──
  console.log(`\nRunning backfill...`)
  let processed = 0
  let skipped = 0
  let failed = 0
  const samples: any[] = []

  for (const article of articles) {
    // Skip articles that have no category — hook would resolve nothing anyway
    if (!article.category) {
      skipped++
      continue
    }

    try {
      // Pass the existing category value (as a plain ID since depth=0) so the
      // beforeChange hook sees data.category !== undefined and resolves the slug.
      // Critically: status is NOT included — no status change occurs.
      const updated = await payload.update({
        collection: 'articles',
        id: article.id,
        data: {
          category: typeof article.category === 'object' ? article.category.id : article.category,
        },
        overrideAccess: true,
        depth: 0,
      })
      processed++

      if (samples.length < 3) {
        samples.push({
          id: updated.id,
          title: updated.title,
          categoryName: (updated as any).categoryName,
          categorySlug: (updated as any).categorySlug,
        })
      }
    } catch (err: any) {
      failed++
      console.error(`  FAILED article ${article.id} "${article.title}": ${err.message}`)
    }
  }

  // ── SAFETY CHECK: count social-post-queue AFTER backfill ──────────────────
  const queueCountAfter = await countSocialPostQueue(payload)

  console.log(`\n=== RESULTS ===`)
  console.log(`Total published articles found: ${articles.length}`)
  console.log(`Processed (category present, update called): ${processed}`)
  console.log(`Skipped (no category): ${skipped}`)
  console.log(`Failed: ${failed}`)

  console.log(`\n=== SAFETY CHECK ===`)
  console.log(`social-post-queue row count BEFORE backfill: ${queueCountBefore}`)
  console.log(`social-post-queue row count AFTER  backfill: ${queueCountAfter}`)

  if (queueCountAfter !== queueCountBefore) {
    console.error(`\n!!! CRITICAL BUG: social-post-queue count changed by ${queueCountAfter - queueCountBefore} rows!`)
    console.error(`!!! This means the FB afterChange hook fired during backfill — STOP and investigate before proceeding.`)
    process.exit(1)
  } else {
    console.log(`Queue counts are IDENTICAL — FB hook correctly did NOT fire during backfill. SAFE.`)
  }

  console.log(`\n=== SAMPLE VERIFICATION (first 3 articles processed) ===`)
  for (const s of samples) {
    console.log(`  Article ${s.id} | "${s.title}"`)
    console.log(`    categoryName: ${s.categoryName || '(not set)'}`)
    console.log(`    categorySlug: ${s.categorySlug || '(not set)'}`)
  }

  console.log(`\nBackfill complete.`)
  process.exit(0)
}

try {
  await main()
} catch (err) {
  console.error('FATAL:', err)
  process.exit(1)
}
