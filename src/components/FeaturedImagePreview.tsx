'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export function FeaturedImagePreview() {
  const value = useFormFields(([fields]) => fields['featuredImageUrl']?.value as string | undefined)

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
