'use client'
import { useState } from 'react'
import { useField } from '@payloadcms/ui'

export function AltTextGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { value: currentAlt, setValue: setAlt } = useField<string>({ path: 'alt' })
  const { value: cloudinaryUrl } = useField<string>({ path: 'cloudinaryUrl' })
  const { value: url } = useField<string>({ path: 'url' })

  const imageUrl = cloudinaryUrl || url

  async function generate() {
    if (!imageUrl) {
      setError('Save the image first then generate alt text')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAlt(data.altText)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ marginTop: '4px' }}>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        style={{
          background: loading ? '#555' : '#C8102E',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.05em',
        }}
      >
        {loading ? 'Generating...' : '✨ Generate Alt Text'}
      </button>
      {error && <p style={{ color: 'red', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}
