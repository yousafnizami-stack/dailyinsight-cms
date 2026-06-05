'use client'
import { useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export function AltTextGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // useField only for the declared 'alt' field — this component's own field
  const { setValue: setAlt } = useField<string>({ path: 'alt' })

  // useFormFields (read-only) to observe image URL fields without registering them
  // as mutable form fields. Using useField({ path: 'url' }) was the bug: it registered
  // Payload's computed upload URL as user-submitted data, causing 500s on save.
  const imageUrl = useFormFields(([fields]) =>
    (fields?.['cloudinaryUrl']?.value || fields?.['url']?.value) as string | undefined
  )

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
    } finally {
      setLoading(false)
    }
  }

  try {
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
  } catch {
    return null
  }
}
