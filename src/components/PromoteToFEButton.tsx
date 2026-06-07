'use client'
import { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

export function PromoteToFEButton() {
  const { id, collectionSlug } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePromote() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/promote-to-fe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, collectionSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to promote')
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) return <div style={{ padding: '8px 16px', background: '#22c55e', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>✅ Promoted to FE Ready!</div>

  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={handlePromote}
        disabled={loading}
        style={{ padding: '8px 16px', background: '#C8102E', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Promoting...' : '🚀 Promote to FE Ready'}
      </button>
      {error && <div style={{ color: 'red', marginTop: '4px', fontSize: '12px' }}>{error}</div>}
    </div>
  )
}
