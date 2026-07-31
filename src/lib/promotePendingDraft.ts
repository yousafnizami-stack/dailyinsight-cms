import type { Payload } from 'payload'

// Field mapping shared between two call paths that both promote a PendingDrafts doc into
// a real, published Article:
//   1. /api/pending-drafts/[id]/publish — the PMS Review tab's "Publish Selected" action,
//      which deletes the pending-draft afterward.
//   2. PendingDrafts' own beforeChange hook (src/collections/PendingDrafts.ts) — firing
//      when an editor flips the native status field to "published" directly in the CMS
//      admin, which does NOT delete the pending-draft (mirrors Payload's normal
//      draft/published save behavior — nothing gets deleted just because status changed).
// Body is copied VERBATIM — the raw lexical JSON tree, including any upload/carousel
// nodes — no re-processing, no rebuild from a subset of fields.
export async function promotePendingDraftToArticle(
  payload: Payload,
  draft: {
    title?: unknown
    body?: unknown
    category?: unknown
    author?: unknown
    excerpt?: unknown
    reviewNote?: unknown
    sourceUrls?: unknown
    featuredImage?: unknown
  },
) {
  return payload.create({
    collection: 'articles',
    data: {
      title: draft.title,
      body: draft.body,
      category: draft.category,
      author: draft.author,
      excerpt: draft.excerpt,
      reviewNote: draft.reviewNote,
      sourceUrls: draft.sourceUrls,
      featuredImage: draft.featuredImage,
      status: 'published',
      publishedAt: new Date().toISOString(),
    } as any,
    overrideAccess: true,
  })
}
