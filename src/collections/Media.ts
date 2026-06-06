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
      name: 'title',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional keyword tag for searching (e.g. "Prince Andrew", "Affleck")',
      },
    },
  ],
  upload: {
    disableLocalStorage: true,
    adminThumbnail: ({ doc }: { doc: any }) => doc.cloudinaryUrl || doc.url || '',
  },
}
