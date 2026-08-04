import type { CollectionConfig } from 'payload'

// Staggered social-posting queue — a pipeline script enqueues one row per article/image
// pair with a scheduledFor time, and a separate scheduled job/cron posts each row (e.g.
// to app/api/facebook-post/[secret] in the dailyinsight repo) once its time arrives,
// flipping posted/postedAt. Not public-facing — unlike Keywords/RssSources' `read: () =>
// true`, this holds not-yet-published scheduling data, so read is gated the same as
// create/update, all via the shared x-api-key/PIPELINE_SECRET-or-user pattern already
// used across this project's pipeline-facing collections (see Horoscopes.ts for the same
// compact Boolean(...) style).
export const SocialPostQueue: CollectionConfig = {
  slug: 'social-post-queue',
  labels: { singular: 'Social Post Queue Item', plural: 'Social Post Queue' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'platform', 'scheduledFor', 'posted'],
    group: 'Pipeline',
  },
  access: {
    create: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    read: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    update: ({ req }) => Boolean(req.user || req.headers.get('x-api-key') === process.env.PIPELINE_SECRET),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'articleUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'imageUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'scheduledFor',
      type: 'date',
      required: true,
      admin: {
        description: 'The staggered target time this should post.',
      },
    },
    {
      name: 'posted',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'postedAt',
      type: 'date',
    },
    {
      name: 'platform',
      type: 'select',
      // Only 'facebook' exists today — add a { label: 'Twitter', value: 'twitter' } option
      // here when that integration is built, no other structural change needed.
      options: [{ label: 'Facebook', value: 'facebook' }],
      defaultValue: 'facebook',
      required: true,
    },
  ],
}
