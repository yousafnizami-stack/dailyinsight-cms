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
    // Allows creating a Media doc that references an already-uploaded Cloudinary asset
    // (cloudinaryPublicId/cloudinaryUrl set directly) without attaching a file to the
    // request — used by the Carousel Pipeline, whose images are uploaded to Cloudinary
    // by the PMS before this collection is ever touched. Without this, Payload's shared
    // create operation throws MissingFile for both Local API and REST calls alike.
    filesRequiredOnCreate: false,
  },
}
