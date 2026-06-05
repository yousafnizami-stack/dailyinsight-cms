'use client'
import { useState, useEffect } from 'react'
import { useFormFields } from '@payloadcms/ui'

export function FeaturedImageTitle() {
  const featuredImage = useFormFields(([fields]) => fields['featuredImage']?.value)
  const [title, setTitle] = useState('')
  const [mediaId, setMediaId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!featuredImage) { setMediaId(null); setTitle(''); return }
    const id = typeof featuredImage === 'object' ? (featuredImage as any).id : featuredImage
    setMediaId(Number(id))
    fetch(`/api/media/${id}`)
      .then(r => r.json())
      .then(data => setTitle(data.title || data.filename || ''))
      .catch(() => setTitle(''))
  }, [featuredImage])

  if (!mediaId) return null

  async function handleSave() {
    if (!mediaId || !title.trim()) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={title}
        onChange={e => { setTitle(e.target.value); setSaved(false) }}
        placeholder="Image title (for Media library search)"
        style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ padding: '6px 14px', background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Title'}
      </button>
      {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
    </div>
  )
}
