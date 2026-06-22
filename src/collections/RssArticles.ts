import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature, UploadFeature } from '@payloadcms/richtext-lexical'
import { EmbedBlockConfig } from '../blocks/EmbedBlock'
export const RssArticles: CollectionConfig = {
  slug: 'rss-articles',
  labels: { singular: 'RSS Article', plural: 'RSS Articles' },
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
        beforeDocumentControls: [
          {
            path: '@/components/ViewOnSiteButton',
            exportName: 'ViewOnSiteButton',
            serverProps: { collectionSlug: 'rss-articles' },
          },
        ],
      },
    },
  },
  hooks: {
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
            collection: 'rss-articles',
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
          BlocksFeature({ blocks: [EmbedBlockConfig] }),
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
      name: 'captionSuggestion',
      type: 'textarea',
      label: 'Caption Suggestions',
      admin: {
        description: 'AI-suggested captions for scraped images based on article context. Use as a starting point — verify accuracy before applying.',
      },
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
