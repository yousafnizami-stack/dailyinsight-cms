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
    create: ({ req }) => Boolean(req.user || req.headers.get("x-api-key") === process.env.PIPELINE_SECRET),
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
