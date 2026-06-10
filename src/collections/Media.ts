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
    adminThumbnail: ({ doc }: { doc: any }) => {
      const url: string = (doc.cloudinaryUrl || doc.url || '') as string
      if (url.includes('/upload/')) {
        return url.replace('/upload/', '/upload/w_400,h_300,c_fill/')
      }
      return url
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
    ],
  },
}
