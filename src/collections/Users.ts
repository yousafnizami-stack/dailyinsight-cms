import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    tokenExpiration: 2592000, // 30 days
  },
  fields: [
    // Email added by default
    {
      name: 'name',
      type: 'text',
    },
  ],
}
