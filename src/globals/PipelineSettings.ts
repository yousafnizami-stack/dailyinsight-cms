import type { GlobalConfig } from 'payload'

export const PipelineSettings: GlobalConfig = {
  slug: 'pipeline-settings',
  label: 'Pipeline Settings',
  admin: {
    group: 'Pipeline',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Pipeline Enabled',
      admin: {
        description: 'Turn the entire pipeline on or off',
      },
    },
    {
      name: 'schedule',
      type: 'select',
      defaultValue: '8am',
      label: 'Run Schedule',
      options: [
        { label: '8 AM only', value: '8am' },
        { label: '8 PM only', value: '8pm' },
        { label: 'Both 8 AM and 8 PM', value: 'both' },
        { label: 'Off (manual only)', value: 'off' },
      ],
    },
    {
      name: 'maxUrlsPerKeyword',
      type: 'number',
      defaultValue: 3,
      label: 'Max URLs Per Keyword',
    },
    {
      name: 'minContentThreshold',
      type: 'number',
      defaultValue: 500,
      label: 'Minimum Content Threshold (chars)',
    },
    {
      name: 'dedupExpiryHours',
      type: 'number',
      defaultValue: 24,
      label: 'Deduplication Expiry (hours)',
    },
  ],
}
