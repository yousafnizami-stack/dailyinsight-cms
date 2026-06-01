import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { cloudinaryStorage } from 'payload-storage-cloudinary'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Articles } from './collections/Articles'
import { TestArticles } from './collections/TestArticles'
import { Categories } from './collections/Categories'
import { Authors } from './collections/Authors'
import { UsedUrls } from './collections/UsedUrls'
import { Keywords } from './collections/Keywords'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Daily Insight CMS',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon-cms.svg' }],
    },
  },
  routes: {
    admin: '/admin',
  },
  serverURL: process.env.PAYLOAD_SERVER_URL || 'https://admin.dailyinsight.co.uk',
  cookiePrefix: 'di',
  csrf: ['https://dailyinsight.co.uk', 'https://admin.dailyinsight.co.uk'],
  collections: [Users, Media, Articles, TestArticles, Categories, Authors, UsedUrls, Keywords],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      UploadFeature({
        collections: {
          media: {
            fields: [],
          },
        },
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: true,
  }),
  sharp,
  plugins: [
    cloudinaryStorage({
      cloudConfig: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
      collections: {
        media: true,
      },
    }),
  ],
})
