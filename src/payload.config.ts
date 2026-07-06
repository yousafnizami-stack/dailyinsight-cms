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
import { RssArticles } from './collections/RssArticles'
import { RssSources } from './collections/RssSources'
import { RssCategoryKeywords } from './collections/RssCategoryKeywords'
import { PipelineReports } from './collections/PipelineReports'
import { Horoscopes } from './collections/Horoscopes'
import { Carousels } from './collections/Carousels'
import { PipelinePrompt } from './globals/PipelinePrompt'
import { PipelineSettings } from './globals/PipelineSettings'
import { PipelineTestPrompt } from './globals/PipelineTestPrompt'

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
  collections: [Articles, RssArticles, TestArticles, Media, Authors, Categories, Keywords, UsedUrls, RssSources, RssCategoryKeywords, PipelineReports, Horoscopes, Carousels, Users],
  globals: [PipelinePrompt, PipelineSettings, PipelineTestPrompt],
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
        media: {
          folder: 'dailyinsight',
          // Ensures any file uploaded through the plain admin Media Library UI (drag-and-
          // drop) gets auto-compressed the same way the two custom upload routes already
          // do. Confirmed against payload-storage-cloudinary's source: normalizeConfig.js
          // treats a `transformations` object without a `default` key as the default
          // transform itself, and buildUploadOptions() in handlers/handleUpload.js reads
          // transformConfig.default and passes it straight through as Cloudinary's
          // `transformation` upload option. Using the explicit `{ default: {...} }` form
          // here to match the documented TransformationConfig type exactly (types.d.ts:
          // `default?: Record<string, any>`), rather than relying on the implicit
          // no-default-key shorthand.
          transformations: {
            default: { quality: 'auto', fetch_format: 'auto' },
          },
        },
      },
    }),
  ],
})
