import type { BeforeDocumentControlsServerProps } from 'payload'

export async function ViewOnSiteButton({ id, payload }: BeforeDocumentControlsServerProps) {
  if (!id || !payload) return null

  try {
    const doc = await payload.findByID({
      collection: 'articles',
      id,
      depth: 1,
      overrideAccess: true,
    })

    const slug = doc?.slug as string | undefined
    const category = doc?.category as { slug?: string } | string | null | undefined
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
  } catch {
    return null
  }
}
