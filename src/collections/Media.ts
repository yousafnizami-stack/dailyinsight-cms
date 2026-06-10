import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt'],
    listSearchableFields: ['filename', 'alt', 'title'],
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
      name: 'caption',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional caption displayed below the image on the frontend',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
  ],
  upload: {
    disableLocalStorage: true,
    adminThumbnail: ({ doc }: { doc: any }) => doc.url as string,
  },
}
