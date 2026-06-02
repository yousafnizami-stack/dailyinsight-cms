import type { CollectionConfig } from 'payload'
export const Articles: CollectionConfig = {
  slug: 'articles',
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
          const slug = doc.slug
          const categorySlug = typeof doc.category === 'object' ? doc.category?.slug : null
          if (slug && categorySlug) {
            await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/${categorySlug}/${slug}&secret=${process.env.REVALIDATE_SECRET}`,
            )
          }
        } catch (err) {
          console.error('Revalidation failed:', err)
        }
      },
      async ({ doc, previousDoc }) => {
        try {
          if (doc.status === 'published' && previousDoc?.status !== 'published') {
            const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
            const pageId = process.env.FACEBOOK_PAGE_ID
            if (!pageToken || !pageId) return

            const categorySlug = typeof doc.category === 'object' ? doc.category?.slug : doc.category
            const articleUrl = `https://www.dailyinsight.co.uk/${categorySlug}/${doc.slug}`
            const imageUrl = doc.featuredImageUrl || ''
            const message = `${doc.title}\n\nRead more: ${articleUrl}`

            if (imageUrl) {
              await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: imageUrl,
                  caption: message,
                  access_token: pageToken,
                })
              })
            } else {
              await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message,
                  access_token: pageToken,
                })
              })
            }
            console.log('Facebook post published for:', doc.title)
          }
        } catch (e) {
          console.log('Facebook post failed:', e)
        }
      },
    ],
    beforeChange: [
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
