'use client'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { InsertCarouselToolbarButton } from './InsertCarouselToolbarButton'

// Contributes one new fixed-toolbar group, same mechanism the built-in Blocks feature uses
// for its own "Insert Block" dropdown (toolbarFixed.groups) — a brand new group key, so it
// doesn't merge with/replace any existing toolbar group.
export const InsertCarouselFeatureClient = createClientFeature(() => {
  return {
    toolbarFixed: {
      groups: [
        {
          type: 'buttons',
          items: [
            {
              Component: InsertCarouselToolbarButton,
              key: 'insert-carousel-from-library',
            },
          ],
          key: 'insertCarouselFromLibrary',
          order: 30,
        },
      ],
    },
  }
})
