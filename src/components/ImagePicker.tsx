'use client'
import { useEffect, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

export function ImagePicker() {
  const { id, collectionSlug } = useDocumentInfo()
  const { value: imageOptions } = useField<string[]>({ path: 'imageOptions' })
  const { value: title } = useField<string>({ path: 'title' })
  const [selected, setSelected] = useState<string | null>(null)
  const [filename, setFilename] = useState('')
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (title) {
      setFilename(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80))
    }
  }, [title])

  if (!imageOptions || !Array.isArray(imageOptions) || imageOptions.length === 0) return null

  async function handleUpload() {
    if (!selected || !id) return
    setUploading(true)
    setError(null)
    try {
      const res = await fetch('/api/upload-featured-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selected, filename, articleId: id, collection: collectionSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setDone(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ marginBottom: '24px', padding: '16px', border: '2px solid #C8102E', borderRadius: '8px', background: '#fff5f5' }}>
      <h4 style={{ margin: '0 0 12px', color: '#C8102E', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>📸 Choose Featured Image</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {imageOptions.map((url: string, i: number) => (
          <div
            key={i}
            onClick={() => setSelected(url)}
            style={{
              cursor: 'pointer',
              border: selected === url ? '3px solid #C8102E' : '3px solid transparent',
              borderRadius: '6px',
              overflow: 'hidden',
              width: '120px',
              height: '80px',
              flexShrink: 0,
            }}
          >
            <img src={url} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ))}
      </div>
      {selected && (
        <div style={{ marginTop: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Cloudinary filename (editable):</label>
          <input
            value={filename}
            onChange={e => setFilename(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{ padding: '8px 16px', background: '#C8102E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
          >
            {uploading ? 'Uploading...' : '✓ Use This Image'}
          </button>
          {done && <span style={{ marginLeft: '8px', color: 'green', fontWeight: 'bold' }}>✅ Done! Reloading...</span>}
          {error && <div style={{ color: 'red', marginTop: '4px', fontSize: '12px' }}>{error}</div>}
        </div>
      )}
    </div>
  )
}
