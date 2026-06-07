import type { CollectionConfig } from 'payload'

export const RssSources: CollectionConfig = {
  slug: 'rss-sources',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'category', 'weight', 'active'],
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
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
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
      name: 'weight',
      type: 'number',
      required: true,
      defaultValue: 0.85,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Uncheck to temporarily disable this source without deleting it',
      },
    },
  ],
}
