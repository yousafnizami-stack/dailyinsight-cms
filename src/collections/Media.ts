import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        components: {
          afterInput: ['@/components/AltTextGenerator#AltTextGenerator'],
        },
      },
    },
  ],
  upload: {
    disableLocalStorage: true,
  },
}
