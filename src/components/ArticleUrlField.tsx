'use client'
import React, { useState, useEffect } from 'react'
import { useField } from '@payloadcms/ui'

export const ArticleUrlField: React.FC = () => {
  const { value: slug } = useField<string>({ path: 'slug' })
  const { value: categoryValue } = useField<any>({ path: 'category' })
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!categoryValue) {
      setCategorySlug(null)
      return
    }
    // Relationship may be populated as full object or bare ID
    if (typeof categoryValue === 'object' && categoryValue !== null && typeof categoryValue.slug === 'string') {
      setCategorySlug(categoryValue.slug)
      return
    }
    const id = typeof categoryValue === 'object' && categoryValue !== null ? categoryValue.id : categoryValue
    if (!id) {
      setCategorySlug(null)
      return
    }
    fetch(`/api/categories/${id}?depth=0`)
      .then((r) => r.json())
      .then((data) => setCategorySlug(data?.slug ?? null))
      .catch(() => setCategorySlug(null))
  }, [categoryValue])

  if (!slug || !categorySlug) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
          Save the article to generate its URL
        </p>
      </div>
    )
  }

  const url = `https://www.dailyinsight.co.uk/${categorySlug}/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', marginBottom: '6px' }}>
        Article URL
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', wordBreak: 'break-all', flex: 1, color: '#333' }}>
          {url}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            border: '1px solid',
            borderColor: copied ? '#2e7d32' : '#ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: copied ? '#e8f5e9' : 'white',
            color: copied ? '#2e7d32' : '#555',
            transition: 'all 0.15s',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
    </div>
  )
}
