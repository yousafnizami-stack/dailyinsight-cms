import type { Block } from 'payload'

export const CarouselBlockConfig: Block = {
  slug: 'carousel',
  labels: { singular: 'Carousel', plural: 'Carousels' },
  admin: {
    components: {
      Label: '@/components/SaveCarouselToLibrary#SaveCarouselToLibrary',
    },
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
          required: false,
        },
      ],
    },
  ],
}
