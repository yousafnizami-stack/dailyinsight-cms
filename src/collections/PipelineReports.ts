import type { CollectionConfig } from 'payload'

export const PipelineReports: CollectionConfig = {
  slug: 'pipeline-reports',
  labels: { singular: 'Report', plural: 'Reports' },
  admin: {
    group: 'Pipeline',
    useAsTitle: 'runDate',
    defaultColumns: ['type', 'runDate', 'articleSaved', 'skipped'],
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      const apiKey = req.headers.get('x-api-key')
      return apiKey === process.env.PIPELINE_SECRET
    },
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'KW Pipeline', value: 'kw-pipeline' },
        { label: 'RSS Pipeline', value: 'rss-pipeline' },
      ],
    },
    {
      name: 'runDate',
      type: 'date',
      required: true,
    },
    {
      name: 'duration',
      type: 'text',
    },
    {
      name: 'articleSaved',
      type: 'number',
    },
    {
      name: 'skipped',
      type: 'number',
    },
    {
      name: 'failed',
      type: 'number',
    },
    {
      name: 'sources',
      type: 'json',
      admin: { description: 'RSS — list of sources used' },
    },
    {
      name: 'articlesList',
      type: 'json',
      admin: { description: 'Array of {title, category, slug}' },
    },
    {
      name: 'skippedList',
      type: 'json',
      admin: { description: 'Array of {title, reason}' },
    },
    {
      name: 'errors',
      type: 'json',
      admin: { description: 'Array of error strings' },
    },
    {
      name: 'claudeCalls',
      type: 'number',
    },
    {
      name: 'serpApiUsage',
      type: 'json',
      admin: { description: 'KW — SERP API usage stats' },
    },
  ],
}
