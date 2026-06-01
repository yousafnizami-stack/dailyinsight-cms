import type { CollectionConfig } from 'payload'

export const UsedUrls: CollectionConfig = {
  slug: 'used-urls',
  access: {
    create: () => true,
    read: () => true,
    delete: () => true,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'keyword',
      type: 'text',
    },
    {
      name: 'expiresAt',
      type: 'date',
    },
  ],
}
