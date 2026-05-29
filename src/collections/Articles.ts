import { CollectionConfig } from 'payload'

const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', 'category', 'status', 'confidence', 'createdAt'],
    useAsTitle: 'title',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    // --- Visible fields (in display order) ---
    { name: 'title', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'sourceUrls',
      type: 'array',
      fields: [{ name: 'url', type: 'text' }],
      admin: { description: 'Internal only — never displayed on frontend' },
    },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    { name: 'excerpt', type: 'textarea' },
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
    { name: 'reviewNote', type: 'textarea' },
    { name: 'featured', type: 'checkbox', defaultValue: false },

    // --- Hidden fields ---
    { name: 'slug', type: 'text', required: true, unique: true, admin: { hidden: true } },
    { name: 'featuredImageUrl', type: 'text', admin: { hidden: true } },
    { name: 'featuredImageAlt', type: 'text', admin: { hidden: true } },
    { name: 'metaTitle', type: 'text', admin: { hidden: true } },
    { name: 'metaDescription', type: 'text', admin: { hidden: true } },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { hidden: true },
    },
    { name: 'publishedAt', type: 'date', admin: { hidden: true } },
    { name: 'confidence', type: 'number', admin: { hidden: true } },
    {
      name: 'headlineVariants',
      type: 'array',
      fields: [{ name: 'headline', type: 'text' }],
      admin: { hidden: true },
    },
    { name: 'readingTime', type: 'number', admin: { hidden: true } },
    {
      name: 'articleType',
      type: 'select',
      options: ['news', 'listicle', 'profile', 'explainer', 'timeline', 'developing'],
      admin: { hidden: true },
    },
    { name: 'publishedDate', type: 'date', admin: { hidden: true } },
    { name: 'displayOrder', type: 'number', admin: { hidden: true } },
  ],
}

export { Articles }
