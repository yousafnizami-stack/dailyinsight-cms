import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature, UploadFeature } from '@payloadcms/richtext-lexical'
import { EmbedBlockConfig } from '../blocks/EmbedBlock'
import { CarouselBlockConfig } from '../blocks/CarouselBlock'
import { InsertCarouselFeature } from '../lexical/InsertCarouselFeature/server'

// Internal staging area for KW-pipeline-generated drafts pending image integration/review
// before promotion to Articles — not public-facing, unlike Articles' own `read: () =>
// true`. create mirrors Media's x-api-key/PIPELINE_SECRET-or-user pattern so pipeline
// scripts can write here the same way they already create Media docs; read/update/delete
// are user-only, since this is a working area for editors, not a public API surface.
export const PendingDrafts: CollectionConfig = {
  slug: 'pending-drafts',
  labels: { singular: 'Pending Draft', plural: 'Pending Drafts' },
  access: {
    create: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'keyword', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'author',
      type: 'select',
      required: false,
      admin: {
        description: 'Byline shown on article page',
      },
      options: [
        { label: 'Royal Correspondent', value: 'di-royal-reporter' },
        { label: 'Entertainment Desk', value: 'di-entertainment-desk' },
        { label: 'Music Desk', value: 'di-music-desk' },
        { label: 'Film Desk', value: 'di-film-desk' },
        { label: 'Web Desk', value: 'web-desk' },
        { label: 'News Desk', value: 'news-desk' },
        { label: 'Celebrity Desk', value: 'celebrity-desk' },
        { label: 'Royal Family News Desk', value: 'royal-family-desk' },
        { label: 'Sophie Marshall', value: 'sophie-marshall' },
        { label: 'James Okafor', value: 'james-okafor' },
        { label: 'Claire Dennison', value: 'claire-dennison' },
        { label: 'Tom Everett', value: 'tom-everett' },
        { label: 'Rachel Hinds', value: 'rachel-hinds' },
        { label: 'Priya Nair', value: 'priya-nair' },
      ],
    },
    {
      name: 'keyword',
      type: 'text',
      admin: {
        description: 'The KW pipeline search keyword that generated this draft',
      },
    },
    {
      name: 'sourceUrls',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          UploadFeature({ collections: { media: { fields: [] } } }),
          BlocksFeature({ blocks: [EmbedBlockConfig, CarouselBlockConfig] }),
          InsertCarouselFeature(),
        ],
      }),
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Keep under 200 characters — shown in article previews and social sharing.',
      },
    },
    {
      name: 'reviewNote',
      type: 'textarea',
    },
  ],
}
