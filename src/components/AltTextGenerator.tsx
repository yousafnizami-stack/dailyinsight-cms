'use client'
import { useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'

export function AltTextGenerator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fields, dispatchFields] = useAllFormFields()

  const imageUrl = (fields?.cloudinaryUrl?.value || fields?.url?.value) as string

  async function generate() {
    if (!imageUrl) {
      setError('Save the image first, then generate alt text')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/generate-alt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      dispatchFields({ type: 'UPDATE', path: 'alt', value: data.altText })
      setSuccess(data.altText)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        style={{
          background: loading ? '#555' : '#C8102E',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : '✨ Generate Alt Text'}
      </button>
      {success && <p style={{ color: '#22c55e', fontSize: '11px', marginTop: '4px' }}>✓ {success}</p>}
      {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}
