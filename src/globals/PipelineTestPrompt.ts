import type { GlobalConfig } from 'payload'
export const PipelineTestPrompt: GlobalConfig = {
  slug: 'pipeline-test-prompt',
  label: 'Pipeline Test Prompt',
  admin: { group: 'Pipeline', hidden: true },
  fields: [
    {
      name: 'systemPrompt',
      type: 'textarea',
      admin: { rows: 20 },
    },
    { name: 'enabled', type: 'checkbox', defaultValue: false, label: 'Use this test prompt instead of main prompt' },
  ],
}
