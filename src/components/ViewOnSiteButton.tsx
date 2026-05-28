'use client'

import { useFormFields } from '@payloadcms/ui'

export function ViewOnSiteButton() {
  const slug = useFormFields(([fields]) => fields['slug']?.value as string | undefined)
  const categoryValue = useFormFields(([fields]) => fields['category']?.value)

  const categorySlug =
    categoryValue && typeof categoryValue === 'object' && !Array.isArray(categoryValue)
      ? (categoryValue as { slug?: string }).slug
      : null

  if (!slug || !categorySlug) return null

  const url = `https://www.dailyinsight.co.uk/${categorySlug}/${slug}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        background: 'white',
        border: '1px solid #C8102E',
        color: '#C8102E',
        padding: '8px 16px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '13px',
      }}
    >
      View on Site ↗
    </a>
  )
}
