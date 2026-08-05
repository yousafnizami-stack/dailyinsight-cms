import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature, UploadFeature } from '@payloadcms/richtext-lexical'
import { EmbedBlockConfig } from '../blocks/EmbedBlock'
import { CarouselBlockConfig } from '../blocks/CarouselBlock'
import { InsertCarouselFeature } from '../lexical/InsertCarouselFeature/server'
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'KW Article', plural: 'KW Articles' },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'category', 'publishedAt'],
    pagination: {
      defaultLimit: 50,
      limits: [10, 25, 50, 100],
    },
    components: {
      edit: {
        beforeDocumentControls: ['@/components/ViewOnSiteButton#ViewOnSiteButton'],
      },
    },
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        try {
          if (doc.status === 'published') {
            const slug = doc.slug
            const categorySlug = typeof doc.category === 'object' ? doc.category?.slug : null
            if (slug && categorySlug) {
              await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/${categorySlug}/${slug}&secret=${process.env.REVALIDATE_SECRET}`,
              )
            }
          }
        } catch (err) {
          console.error('Revalidation failed:', err)
        }
      },
      // Auto-queue the article for Facebook the instant it transitions to published.
      // Wrapped entirely in try/catch — any failure here must never block the article
      // save itself; this is a background side-effect, not a required part of publishing.
      async ({ doc, previousDoc, req }) => {
        console.log('[FB-QUEUE-HOOK] Fired for article', doc.id, 'status:', doc.status, 'previousStatus:', previousDoc?.status)
        try {
          // Only fire on the draft→published transition, not on every published save.
          if (previousDoc?.status === 'published' || doc.status !== 'published') return

          const slug: string | null = doc.slug || null
          const category = doc.category
          console.log('[FB-QUEUE-HOOK] category shape:', typeof category, JSON.stringify(category))

          // Resolve categorySlug — mirrors the featuredImage findByID fallback pattern:
          // doc.category arrives as a bare ID (number/string) when the save context doesn't
          // populate relationships, so we explicitly fetch it when needed rather than
          // assuming it's already a populated object with a slug.
          let categorySlug: string | null = null
          if (typeof category === 'object' && category !== null) {
            categorySlug = (category as any).slug || null
          } else if (typeof category === 'number' || typeof category === 'string') {
            try {
              const categoryDoc = await req.payload.findByID({ collection: 'categories', id: category as any, depth: 0 })
              categorySlug = (categoryDoc as any)?.slug || null
            } catch {
              // leave categorySlug null — logged below
            }
          }

          if (!slug || !categorySlug) {
            console.warn(`[social-post-queue] Skipping auto-queue for article ${doc.id} "${doc.title}" — missing slug or category slug (slug: ${slug}, categorySlug: ${categorySlug})`)
            return
          }

          // Resolve featuredImage — at afterChange depth the relationship may be populated
          // (object) or just an ID (number/string) depending on how the save was triggered.
          let imageUrl: string | null = null
          const fi = doc.featuredImage
          if (typeof fi === 'object' && fi !== null) {
            imageUrl = (fi as any).cloudinaryUrl || (fi as any).url || null
          } else if (typeof fi === 'number' || typeof fi === 'string') {
            try {
              const media = await req.payload.findByID({ collection: 'media', id: fi as any })
              imageUrl = (media as any)?.cloudinaryUrl || (media as any)?.url || null
            } catch {
              // leave imageUrl null — logged below
            }
          }

          if (!imageUrl) {
            console.warn(`[social-post-queue] Skipping auto-queue for article ${doc.id} "${doc.title}" — no featuredImage URL resolved`)
            return
          }

          const articleUrl = `https://www.dailyinsight.co.uk/${categorySlug}/${slug}`

          // Dedup: skip if already queued for this articleUrl.
          const existing = await req.payload.find({
            collection: 'social-post-queue',
            where: { articleUrl: { equals: articleUrl } },
            limit: 1,
          })
          if (existing.docs.length > 0) {
            console.log(`[social-post-queue] Already queued for "${articleUrl}" — skipping`)
            return
          }

          // Compute staggered scheduledFor: latest unposted entry's scheduledFor + 15 min,
          // or now if the queue is empty.
          const latestQueued = await req.payload.find({
            collection: 'social-post-queue',
            where: { posted: { equals: false } },
            sort: '-scheduledFor',
            limit: 1,
          })
          let scheduledFor: Date
          if (latestQueued.docs.length > 0 && (latestQueued.docs[0] as any).scheduledFor) {
            scheduledFor = new Date(new Date((latestQueued.docs[0] as any).scheduledFor).getTime() + 15 * 60 * 1000)
          } else {
            scheduledFor = new Date()
          }

          await req.payload.create({
            collection: 'social-post-queue',
            data: {
              title: doc.title,
              articleUrl,
              imageUrl,
              scheduledFor: scheduledFor.toISOString(),
              platform: 'facebook',
            } as any,
          })

          console.log(`[social-post-queue] Queued article ${doc.id} "${doc.title}" for Facebook at ${scheduledFor.toISOString()}`)
        } catch (err: any) {
          console.error(`[social-post-queue] Auto-queue failed for article ${doc.id} "${doc.title}": ${err.message}`)
        }
      },
    ],
    beforeChange: [
      async ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') +
            '-' + Math.floor(Date.now() / 1000)
        }
        return data
      },
      async (args) => {
        const { data, originalDoc } = args
        if (data.status === 'published' && originalDoc?.status !== 'published') {
          data.publishedAt = new Date().toISOString()
        }
        if (data.featured === true) {
          const { req } = args
          await req.payload.update({
            collection: 'articles',
            where: {
              and: [
                { featured: { equals: true } },
                { id: { not_equals: originalDoc?.id } },
              ],
            },
            data: { featured: false } as any,
          })
        }
        return data
      },
      async ({ data, req, originalDoc }) => {
        if (data.featuredImage === undefined) return data
        const newId = typeof data.featuredImage === 'object' && data.featuredImage !== null
          ? (data.featuredImage as any).id
          : data.featuredImage
        const oldId = typeof originalDoc?.featuredImage === 'object' && originalDoc?.featuredImage !== null
          ? (originalDoc.featuredImage as any).id
          : originalDoc?.featuredImage
        if (newId === oldId) return data

        try {
          let imageUrl = null

          if (typeof data.featuredImage === 'number' || typeof data.featuredImage === 'string') {
            const media = await req.payload.findByID({
              collection: 'media',
              id: data.featuredImage as any,
            })
            imageUrl = media?.cloudinaryUrl || media?.url || null
          } else if (typeof data.featuredImage === 'object' && data.featuredImage !== null) {
            imageUrl = data.featuredImage.cloudinaryUrl || data.featuredImage.url || null
          }

          if (imageUrl) {
            data.featuredImageUrl = imageUrl
            console.log('FI synced to:', imageUrl)
          }
        } catch (e) {
          console.log('FI sync error:', e)
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
      name: 'articleUrl',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/ArticleUrlField#ArticleUrlField',
        },
      },
    },
    {
      name: 'sourceUrls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
          admin: {
            components: {
              beforeInput: ['@/components/SourceUrlField#SourceUrlField'],
            },
          },
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        components: {
          afterInput: ['@/components/FeaturedImageTitle#FeaturedImageTitle'],
        },
      },
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
      name: 'embeds',
      type: 'array',
      admin: { hidden: true },
      fields: [
        { name: 'platform', type: 'text' },
        { name: 'embedHtml', type: 'textarea' },
        { name: 'caption', type: 'text' },
        { name: 'insertAfterParagraph', type: 'number' },
      ],
    },
    {
      name: 'reviewNote',
      type: 'textarea',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pin this article to the top of the homepage',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      required: true,
      admin: { hidden: true },
    },
    {
      name: 'featuredImageUrl',
      type: 'text',
      admin: {
        hidden: true,
        components: {
          afterInput: ['@/components/FeaturedImagePreview#FeaturedImagePreview'],
        },
      },
    },
    {
      name: 'featuredImageAlt',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'metaTitle',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'metaDescription',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { hidden: true },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { hidden: true },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: { hidden: true },
    },
    {
      name: 'confidence',
      type: 'number',
      admin: { hidden: true },
    },
    {
      name: 'headlineVariants',
      type: 'array',
      fields: [{ name: 'variant', type: 'text' }],
      admin: { hidden: true },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: { hidden: true },
    },
    {
      name: 'articleType',
      type: 'select',
      options: [
        { label: 'News', value: 'news' },
        { label: 'Listicle', value: 'listicle' },
        { label: 'Profile', value: 'profile' },
        { label: 'Explainer', value: 'explainer' },
        { label: 'Timeline', value: 'timeline' },
        { label: 'Developing', value: 'developing' },
      ],
      admin: { hidden: true },
    },
    {
      name: 'displayOrder',
      type: 'number',
      admin: {
        hidden: true,
        description: 'Lower numbers appear first. Leave blank for default ordering.',
      },
    },
    { name: 'imageOptions', type: 'json', admin: { hidden: true } },
  ],
}
