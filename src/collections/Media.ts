import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'alt'],
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
  ],
  upload: {
    disableLocalStorage: true,
    adminThumbnail: 'cloudinaryUrl',
  },
}
