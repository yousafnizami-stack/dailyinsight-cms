import type { CollectionConfig } from 'payload'

export const Horoscopes: CollectionConfig = {
  slug: 'horoscopes',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'publishedDate', 'updatedAt'],
    group: 'Content',
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
      name: 'date',
      type: 'text',
      required: true,
      admin: { description: 'Format: YYYY-MM-DD' },
    },
    {
      name: 'publishedDate',
      type: 'date',
    },
    {
      name: 'signs',
      type: 'array',
      fields: [
        {
          name: 'sign',
          type: 'select',
          options: [
            { label: 'Aries', value: 'aries' },
            { label: 'Taurus', value: 'taurus' },
            { label: 'Gemini', value: 'gemini' },
            { label: 'Cancer', value: 'cancer' },
            { label: 'Leo', value: 'leo' },
            { label: 'Virgo', value: 'virgo' },
            { label: 'Libra', value: 'libra' },
            { label: 'Scorpio', value: 'scorpio' },
            { label: 'Sagittarius', value: 'sagittarius' },
            { label: 'Capricorn', value: 'capricorn' },
            { label: 'Aquarius', value: 'aquarius' },
            { label: 'Pisces', value: 'pisces' },
          ],
        },
        {
          name: 'reading',
          type: 'textarea',
        },
        {
          name: 'love',
          type: 'number',
          min: 1,
          max: 5,
        },
        {
          name: 'career',
          type: 'number',
          min: 1,
          max: 5,
        },
        {
          name: 'luckyColour',
          type: 'text',
        },
        {
          name: 'luckyNumber',
          type: 'number',
        },
        {
          name: 'luckyDay',
          type: 'text',
        },
      ],
    },
  ],
}
