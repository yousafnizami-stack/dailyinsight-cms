'use client'
import { useFormFields } from '@payloadcms/ui'

export function ViewOnSiteButton() {
  const slug = useFormFields(([fields]) => fields['slug']?.value as string | undefined)
  const category = useFormFields(([fields]) => fields['category']?.value)

  const categorySlug =
    category && typeof category === 'object' && !Array.isArray(category)
      ? (category as { slug?: string }).slug
      : null

  if (!slug || !categorySlug) return null

  const url = `https://www.dailyinsight.co.uk/${categorySlug}/${slug}`

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#C8102E',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.025em',
        }}
      >
        View on Site ↗
      </a>
    </div>
  )
}
