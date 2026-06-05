import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Image Title',
      admin: {
        description: 'Optional friendly name for easy searching in the media library',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
  ],
  upload: {
    disableLocalStorage: true,
  },
}
