import type { CollectionConfig } from 'payload'

export const Carousels: CollectionConfig = {
  slug: 'carousels',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name'],
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    update: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
      admin: {
        description: 'Label for browsing this carousel in the library — not shown on the frontend.',
      },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
          required: false,
        },
      ],
    },
  ],
}
