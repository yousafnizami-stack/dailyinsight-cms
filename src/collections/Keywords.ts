import type { CollectionConfig } from 'payload'

export const Keywords: CollectionConfig = {
  slug: 'keywords',
  admin: {
    useAsTitle: 'keyword',
    defaultColumns: ['keyword', 'category', 'active'],
    group: 'Pipeline',
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      if (Boolean(req.user)) return true
      const apiKey = req.headers['x-api-key'] as string
      return apiKey === process.env.PIPELINE_SECRET
    },
    update: ({ req }) => {
      if (Boolean(req.user)) return true
      const apiKey = req.headers['x-api-key'] as string
      return apiKey === process.env.PIPELINE_SECRET
    },
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'keyword',
      type: 'text',
      required: true,
    },
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Uncheck to temporarily disable this keyword without deleting it',
      },
    },
  ],
}
