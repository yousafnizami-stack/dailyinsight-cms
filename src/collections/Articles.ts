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
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
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
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
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
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'featuredImageAlt',
      type: 'text',
    },
    {
      name: 'featuredImageUrl',
      type: 'text',
      admin: {
        components: {
          afterInput: ['@/components/FeaturedImagePreview#FeaturedImagePreview'],
        },
      },
    },
    {
      name: 'metaTitle',
      type: 'text',
    },
    {
      name: 'metaDescription',
      type: 'text',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'embeds',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'text',
        },
        {
          name: 'embedHtml',
          type: 'textarea',
        },
        {
          name: 'caption',
          type: 'text',
        },
        {
          name: 'insertAfterParagraph',
          type: 'number',
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'publishedDate',
      type: 'date',
    },
    {
      name: 'confidence',
      type: 'number',
    },
    {
      name: 'reviewNote',
      type: 'textarea',
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
      name: 'headlineVariants',
      type: 'array',
      fields: [
        {
          name: 'headline',
          type: 'text',
        },
      ],
    },
    {
      name: 'readingTime',
      type: 'number',
    },
  ],
}
