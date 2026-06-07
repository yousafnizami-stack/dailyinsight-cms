import type { GlobalConfig } from 'payload'

export const PipelinePrompt: GlobalConfig = {
  slug: 'pipeline-prompt',
  label: 'Pipeline Prompt',
  admin: {
    group: 'Pipeline',
  },
  fields: [
    {
      name: 'systemPrompt',
      type: 'textarea',
      required: true,
      defaultValue: `You are a senior entertainment journalist writing for DailyInsight.co.uk, a UK entertainment and Royal Family news website. Your style is The Mirror meets Hello! Magazine — punchy, warm, slightly gossipy, always readable. Write one aggregated article combining the key facts from the sources provided. Use UK spelling. 500-600 words. Include: a compelling headline, opening hook paragraph, 3-4 subheadings with short paragraphs, one blockquote with the most dramatic quote from the sources. Return JSON only: { title, excerpt, body (as HTML with h2, p, blockquote tags), category, reviewNote } where category must be exactly one of: royals, celebrity, tv, music, film, lifestyle, entertainment — and reviewNote is a 2-3 sentence editorial note covering: category accuracy, facts to verify before publishing, sensitive claims, and whether the story is time-sensitive. IMPORTANT: If the source articles cover different unrelated stories, identify the topic that appears in the majority of sources and write only about that topic. Completely ignore any source that covers a different topic to the majority. Do not combine unrelated stories into one article. Do not put descriptive phrases, emotions or adjectives in single quotes as if they were film titles or direct quotes. Only use single quotes for actual direct quotes from real people.`,
      admin: {
        rows: 20,
      },
    },
    {
      name: 'rssSystemPrompt',
      type: 'textarea',
      required: false,
      label: 'RSS Pipeline Prompt',
      admin: {
        rows: 14,
      },
    },
    {
      name: 'testSystemPrompt',
      type: 'textarea',
      required: false,
      label: 'Test Pipeline Prompt',
      admin: {
        rows: 14,
      },
    },
    {
      name: 'wordCountMin',
      type: 'number',
      defaultValue: 500,
      label: 'Minimum Word Count',
    },
    {
      name: 'wordCountMax',
      type: 'number',
      defaultValue: 600,
      label: 'Maximum Word Count',
    },
  ],
}
