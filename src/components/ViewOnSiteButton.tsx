import type { Payload } from 'payload'

type Props = {
  id?: number | string
  payload?: Payload
  collectionSlug?: string
}

export async function ViewOnSiteButton({ id, payload, collectionSlug = 'articles' }: Props) {
  if (!id || !payload) return null

  try {
    const article = await payload.findByID({
      collection: collectionSlug as 'articles' | 'rss-articles',
      id,
      depth: 1,
    })

    const slug = (article as any)?.slug as string | undefined
    const category = (article as any)?.category
    const categorySlug =
      category && typeof category === 'object' ? (category as { slug?: string }).slug : undefined

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
