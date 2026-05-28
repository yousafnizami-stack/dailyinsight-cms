'use client'

import { useDocumentInfo } from '@payloadcms/ui'

export function ViewOnSiteButton() {
  const { initialData, savedDocumentData } = useDocumentInfo()
  const doc = (savedDocumentData || initialData) as Record<string, any> | undefined

  const slug = doc?.slug as string | undefined
  const category = doc?.category as { slug?: string } | null | undefined
  const categorySlug = category && typeof category === 'object' ? category.slug : null

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
