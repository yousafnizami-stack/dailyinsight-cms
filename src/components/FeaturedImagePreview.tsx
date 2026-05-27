'use client'
import React from 'react'
import { useFormFields } from '@payloadcms/ui'

export function FeaturedImagePreview() {
  const url = useFormFields(([fields]) => fields?.featuredImageUrl?.value as string)
  if (!url) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <img
        src={url}
        alt="Featured image preview"
        style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '6px', border: '1px solid #ccc' }}
      />
    </div>
  )
}
