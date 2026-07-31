import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature, UploadFeature } from '@payloadcms/richtext-lexical'
import { EmbedBlockConfig } from '../blocks/EmbedBlock'
import { CarouselBlockConfig } from '../blocks/CarouselBlock'
import { InsertCarouselFeature } from '../lexical/InsertCarouselFeature/server'
import { promotePendingDraftToArticle } from '../lib/promotePendingDraft'

// Internal staging area for KW-pipeline-generated drafts pending image integration/review
// before promotion to Articles — not public-facing, unlike Articles' own `read: () =>
// true`. create mirrors Media's x-api-key/PIPELINE_SECRET-or-user pattern so pipeline
// scripts can write here the same way they already create Media docs; read/update/delete
// are user-only, since this is a working area for editors, not a public API surface.
export const PendingDrafts: CollectionConfig = {
  slug: 'pending-drafts',
  labels: { singular: 'Pending Draft', plural: 'Pending Drafts' },
  access: {
    create: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'keyword', 'createdAt'],
  },
  hooks: {
    beforeChange: [
      // Mirrors Articles' own beforeChange pattern (src/collections/Articles.ts) for
      // detecting a transition INTO published — same `data.status === 'published' &&
      // originalDoc?.status !== 'published'` comparison. Fires when an editor flips this
      // doc's native status field to Published directly in the CMS admin — a SEPARATE
      // path from the PMS Review tab's /api/pending-drafts/[id]/publish route, which
      // promotes AND deletes the draft. This path deliberately does NOT delete anything —
      // a status change should behave like Payload's normal save behavior (the document
      // persists, now marked published), exactly how Articles themselves behave on
      // publish. Reuses promotePendingDraftToArticle for the identical field mapping the
      // route already uses, rather than duplicating it here.
      async ({ data, originalDoc, req }) => {
        if (data.status === 'published' && originalDoc?.status !== 'published') {
          // `data` may only contain the fields actually changed in this particular save
          // (e.g. a partial API update) rather than the full document — merge over
          // originalDoc so the promoted Article always gets complete field values
          // regardless of how this save was triggered. Deliberately NOT wrapped in
          // try/catch: if promotion fails, the save itself must fail too (Payload aborts
          // and surfaces the error to the admin UI) — a PendingDraft silently left marked
          // "published" with no real Article behind it would be a misleading, broken
          // state, worse than just letting the save error out.
          const merged = { ...originalDoc, ...data }
          const article = await promotePendingDraftToArticle(req.payload, {
            title: merged.title,
            body: merged.body,
            category: merged.category,
            author: merged.author,
            excerpt: merged.excerpt,
            reviewNote: merged.reviewNote,
            sourceUrls: merged.sourceUrls,
            featuredImage: merged.featuredImage,
          })
          data.publishedArticleId = article.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'publishedArticleId',
      type: 'relationship',
      relationTo: 'articles',
      admin: {
        readOnly: true,
        description: 'Set automatically when this draft is published via the status field above — links to the resulting live Article.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'author',
      type: 'select',
      required: false,
      admin: {
        description: 'Byline shown on article page',
      },
      options: [
        { label: 'Royal Correspondent', value: 'di-royal-reporter' },
        { label: 'Entertainment Desk', value: 'di-entertainment-desk' },
        { label: 'Music Desk', value: 'di-music-desk' },
        { label: 'Film Desk', value: 'di-film-desk' },
        { label: 'Web Desk', value: 'web-desk' },
        { label: 'News Desk', value: 'news-desk' },
        { label: 'Celebrity Desk', value: 'celebrity-desk' },
        { label: 'Royal Family News Desk', value: 'royal-family-desk' },
        { label: 'Sophie Marshall', value: 'sophie-marshall' },
        { label: 'James Okafor', value: 'james-okafor' },
        { label: 'Claire Dennison', value: 'claire-dennison' },
        { label: 'Tom Everett', value: 'tom-everett' },
        { label: 'Rachel Hinds', value: 'rachel-hinds' },
        { label: 'Priya Nair', value: 'priya-nair' },
      ],
    },
    {
      name: 'keyword',
      type: 'text',
      admin: {
        description: 'The KW pipeline search keyword that generated this draft',
      },
    },
    {
      name: 'sourceUrls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'imagePicker',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/ImagePicker#ImagePicker',
        },
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          UploadFeature({ collections: { media: { fields: [] } } }),
          BlocksFeature({ blocks: [EmbedBlockConfig, CarouselBlockConfig] }),
          InsertCarouselFeature(),
        ],
      }),
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Keep under 200 characters — shown in article previews and social sharing.',
      },
    },
    {
      name: 'reviewNote',
      type: 'textarea',
    },
    // Candidate image URLs (og:image + inline <img> srcs) captured during scraping — the
    // full pool ImagePicker above reads from (see its own useField({ path: 'imageOptions'
    // })), so a human reviewing a staged draft can see and pick from every original
    // candidate, not just whichever one the automated watermark/relevance checks resolved
    // into featuredImage/body. Matches Articles' own imageOptions field exactly (same
    // hidden JSON shape) — /api/ingest-pending already forwards it from the pipeline's
    // payload; this field was the only missing piece, since Payload silently drops data
    // keys with no matching field.
    { name: 'imageOptions', type: 'json', admin: { hidden: true } },
  ],
}
