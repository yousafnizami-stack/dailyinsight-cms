'use client'
import React from 'react'
import { useField } from '@payloadcms/ui'

export function FeaturedImagePreview() {
  const { value } = useField<string>({ path: 'featuredImageUrl' })
  if (!value) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <img
        src={value}
        alt="Featured image preview"
        style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }}
      />
    </div>
  )
}
