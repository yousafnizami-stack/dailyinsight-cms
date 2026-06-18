import type { Block } from 'payload'

export const EmbedBlockConfig: Block = {
  slug: 'embedBlock',
  labels: { singular: 'Embed', plural: 'Embeds' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'YouTube, Twitter/X, or Instagram URL' },
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
    },
  ],
}
