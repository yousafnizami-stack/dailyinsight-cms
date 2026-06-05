'use client'
import { useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export function AltTextGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { value: altValue, setValue: setAlt } = useField<string>({ path: 'alt' })
  const fields = useFormFields(([fields]) => fields)

  const cloudinaryUrl = (fields?.cloudinaryUrl?.value || fields?.url?.value) as string

  async function generate() {
    if (!cloudinaryUrl) {
      setError('No image URL found — save the image first')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: cloudinaryUrl }),
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
