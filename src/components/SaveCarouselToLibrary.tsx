'use client'
import { useState } from 'react'
import { Button, Pill, useForm } from '@payloadcms/ui'

// Rendered as CarouselBlockConfig's admin.components.Label. Payload's richtext-lexical
// gives each block instance in the editor its own isolated <Form> (see useDocumentForm's
// own doc comment in @payloadcms/ui: "This is the case within lexical Blocks, as each
// lexical block renders their own Form") — so the plain useForm() hook here resolves to
// THIS specific block instance's own fields, not the whole article document. Setting
// admin.components.Label replaces the block's entire default header (pill + block name),
// so the pill is reconstructed here to keep the same look, with the button added alongside.
//
// Uses Payload's own <Button> component with an onMouseDown preventDefault, exactly
// matching the pattern Payload's built-in EditButton/RemoveButton already use in this
// same block header — a raw <button> here previously produced zero effect on click
// (mousedown was shifting lexical's DOM selection/focus out from under the click before
// it completed); the onMouseDown preventDefault stops that.
export function SaveCarouselToLibrary() {
  const { getData } = useForm()
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSave(e: React.MouseEvent) {
    // eslint-disable-next-line no-console
    console.log('[SaveCarouselToLibrary] click fired')
    e.preventDefault()
    e.stopPropagation()

    const data = getData() as { images?: Array<{ caption?: string; image?: unknown }> }
    const images = Array.isArray(data.images) ? data.images : []
    if (images.length === 0) {
      setStatus('error')
      setMessage('Add at least one image first')
      setTimeout(() => { setStatus('idle'); setMessage('') }, 3000)
      return
    }

    const name = window.prompt('Name this carousel for the library:')
    if (!name || !name.trim()) return

    setStatus('saving')
    setMessage('')
    try {
      const res = await fetch('/api/carousels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          // Only image + caption are copied — no row id, blockName, etc. This is a
          // one-way copy into a brand new Carousels document: it doesn't alter the
          // source block and doesn't link back to it.
          images: images.map((row) => ({ image: row.image, caption: row.caption })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message || json?.message || `Save failed (${res.status})`)
      }
      setStatus('saved')
      setMessage('Saved to library')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Save failed')
    } finally {
      setTimeout(() => { setStatus('idle'); setMessage('') }, 3000)
    }
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Pill pillStyle="white" size="small">Carousel</Pill>
      <Button
        buttonStyle={status === 'error' ? 'error' : 'secondary'}
        disabled={status === 'saving'}
        el="button"
        onClick={handleSave}
        onMouseDown={(e) => e.preventDefault()}
        size="small"
      >
        {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved ✓' : status === 'error' ? 'Retry' : 'Save to Library'}
      </Button>
      {message && (
        <span style={{ fontSize: '11px', color: status === 'error' ? '#dc2626' : '#16a34a' }}>{message}</span>
      )}
    </div>
  )
}
