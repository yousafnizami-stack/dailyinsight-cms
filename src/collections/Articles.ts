import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

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
      editor: lexicalEditor(),
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
          name: 'variant',
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
