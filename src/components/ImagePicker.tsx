'use client'
import { useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

export function ImagePicker() {
  const { id, collectionSlug } = useDocumentInfo()
  const { value: imageOptions } = useField<string[]>({ path: 'imageOptions' })
  const { value: title } = useField<string>({ path: 'title' })
  const [uploading, setUploading] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!imageOptions || !Array.isArray(imageOptions) || imageOptions.length === 0) return null
  if (done) return null

  async function handleClick(url: string) {
    if (!id || uploading) return
    setUploading(url)
    setError(null)
    try {
      const filename = (title || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)
      const res = await fetch('/api/upload-featured-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, filename, articleId: id, collection: collectionSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setDone(true)
      setTimeout(() => window.location.reload(), 1000)
    } catch (e: any) {
      setError(e.message)
      setUploading(null)
    }
  }

  return (
    <div style={{ marginBottom: '24px', padding: '16px', border: '2px solid #C8102E', borderRadius: '8px', background: '#fff5f5' }}>
      <h4 style={{ margin: '0 0 12px', color: '#C8102E', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>📸 Click to set as Featured Image</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {imageOptions.map((url: string, i: number) => (
          <div
            key={i}
            onClick={() => handleClick(url)}
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              border: uploading === url ? '3px solid #C8102E' : '3px solid transparent',
              borderRadius: '6px',
              overflow: 'hidden',
              width: '120px',
              height: '80px',
              flexShrink: 0,
              opacity: uploading && uploading !== url ? 0.5 : 1,
              position: 'relative',
            }}
          >
            <img src={url} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
            {uploading === url && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,16,46,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>Uploading...</div>
            )}
          </div>
        ))}
      </div>
      {error && <div style={{ color: 'red', marginTop: '8px', fontSize: '12px' }}>{error}</div>}
    </div>
  )
}
