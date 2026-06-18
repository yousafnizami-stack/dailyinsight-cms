'use client'
import { useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

export function ImagePicker() {
  const { id, collectionSlug } = useDocumentInfo()
  const { value: imageOptions } = useField<string[]>({ path: 'imageOptions' })
  const [uploading, setUploading] = useState<string | null>(null)
  const [savedToMedia, setSavedToMedia] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!imageOptions || !Array.isArray(imageOptions) || imageOptions.length === 0) return null

  async function handleSaveToMedia(url: string) {
    if (!id || uploading) return
    setUploading(url)
    setErrors(e => ({ ...e, [url]: '' }))
    try {
      const filename = `di-image-${Date.now()}`
      const res = await fetch('/api/upload-featured-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, filename, articleId: id, collection: collectionSlug, saveToMediaOnly: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSavedToMedia(prev => [...prev, url])
    } catch (e: any) {
      setErrors(prev => ({ ...prev, [url]: e.message }))
    } finally {
      setUploading(null)
    }
  }

  return (
    <div style={{ marginBottom: '24px', padding: '16px', border: '2px solid #C8102E', borderRadius: '8px', background: '#fff5f5' }}>
      <h4 style={{ margin: '0 0 12px', color: '#C8102E', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>📸 Image Picker</h4>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {imageOptions.map((url: string, i: number) => {
          const isMedia = savedToMedia.includes(url)
          const isUploading = uploading === url
          return (
            <div key={i} style={{ width: '280px', flexShrink: 0 }}>
              <div style={{ position: 'relative', width: '280px', height: '180px', borderRadius: '6px', overflow: 'hidden', border: isMedia ? '3px solid #3b82f6' : '3px solid transparent' }}>
                <img src={url} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
                {isUploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Uploading...</div>
                )}
                {isMedia && (
                  <div style={{ position: 'absolute', top: 6, left: 6, background: '#3b82f6', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>✓ SAVED TO MEDIA</div>
                )}
              </div>
              <div style={{ marginTop: '6px' }}>
                <button
                  onClick={() => handleSaveToMedia(url)}
                  disabled={!!uploading || isMedia}
                  style={{ width: '100%', padding: '5px 0', background: isMedia ? '#3b82f6' : '#555', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: (uploading || isMedia) ? 'not-allowed' : 'pointer', opacity: (uploading && uploading !== url) ? 0.5 : 1 }}
                >
                  {isMedia ? '✓ In Media' : 'Save to Media'}
                </button>
              </div>
              {errors[url] && <div style={{ color: 'red', fontSize: '11px', marginTop: '4px' }}>{errors[url]}</div>}
            </div>
          )
        })}
      </div>
      <p style={{ margin: '12px 0 0', fontSize: '11px', color: '#888' }}>Images saved to Media can be inserted into the article body via the rich text editor → Insert Image.</p>
    </div>
  )
}
