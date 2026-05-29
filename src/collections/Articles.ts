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
      name: 'sourceUrls',
      type: 'array',
      fields: [{ name: 'url', type: 'text' }],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      name: 'excerpt',
      type: 'textarea',
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
  ],
}
