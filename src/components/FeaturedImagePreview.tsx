'use client'
import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'

export function FeaturedImagePreview() {
  const value = useFormFields(([fields]) => fields['featuredImageUrl']?.value as string | undefined)
  const [broken, setBroken] = useState(false)

  if (!value) {
    return (
      <div style={{ marginTop: '8px', padding: '8px', color: '#999', fontSize: '12px' }}>
        No image URL entered
      </div>
    )
  }

  if (broken) {
    return (
      <div style={{ marginTop: '8px', padding: '8px', color: '#c00', fontSize: '12px' }}>
        Could not load image: {value}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <img
        src={value}
        alt="Featured image preview"
        onError={() => setBroken(true)}
        style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '4px', display: 'block' }}
      />
    </div>
  )
}
