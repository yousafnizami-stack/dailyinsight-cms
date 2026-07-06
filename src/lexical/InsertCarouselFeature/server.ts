import { createServerFeature } from '@payloadcms/richtext-lexical'

// Thin server-side registration — the real logic lives in client.tsx, referenced here only
// as a component path string (same convention as admin.components.* elsewhere in this app).
export const InsertCarouselFeature = createServerFeature({
  key: 'insertCarouselFromLibrary',
  feature: {
    ClientFeature: '@/lexical/InsertCarouselFeature/client#InsertCarouselFeatureClient',
  },
})
