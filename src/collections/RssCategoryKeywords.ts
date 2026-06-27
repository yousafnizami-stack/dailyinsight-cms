import type { CollectionConfig } from 'payload'

export const RssCategoryKeywords: CollectionConfig = {
  slug: 'rss-category-keywords',
  admin: {
    useAsTitle: 'category',
    defaultColumns: ['category', 'filterKeywords'],
    group: 'Pipeline',
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      if (Boolean(req.user)) return true
      const apiKey = req.headers.get('x-api-key')
      return apiKey === process.env.PIPELINE_SECRET
    },
    update: ({ req }) => {
      if (Boolean(req.user)) return true
      const apiKey = req.headers.get('x-api-key')
      return apiKey === process.env.PIPELINE_SECRET
    },
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Royals', value: 'royals' },
        { label: 'Entertainment', value: 'entertainment' },
        { label: 'Celebrity', value: 'celebrity' },
        { label: 'TV', value: 'tv' },
        { label: 'Music', value: 'music' },
        { label: 'Film', value: 'film' },
        { label: 'Lifestyle', value: 'lifestyle' },
      ],
    },
    {
      name: 'filterKeywords',
      type: 'textarea',
      required: false,
      label: 'Filter Keywords',
      admin: {
        description: 'Comma-separated keywords for this category. Used to filter RSS items across all sources in this category.',
      },
    },
  ],
}
