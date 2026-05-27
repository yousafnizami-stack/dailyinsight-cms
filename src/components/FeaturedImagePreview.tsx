'use client'
import React from 'react'
import { useField } from '@payloadcms/ui'

export function FeaturedImagePreview() {
  const { value } = useField<string>({ path: 'featuredImageUrl' })
  return (
    <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '6px' }}>
      {value ? (
        <img
          src={value}
          alt="Featured image preview"
          style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '6px' }}
        />
      ) : (
        <span style={{ color: '#999' }}>No image URL yet</span>
      )}
    </div>
  )
}
