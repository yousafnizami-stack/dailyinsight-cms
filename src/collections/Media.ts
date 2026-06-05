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
    },
    {
      name: 'altTextGenerator',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/AltTextGenerator#AltTextGenerator',
        },
      },
    },
  ],
  upload: {
    disableLocalStorage: true,
  },
}
