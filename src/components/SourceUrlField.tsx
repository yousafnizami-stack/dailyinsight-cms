'use client'
import React from 'react'
import { useField } from '@payloadcms/ui'

export const SourceUrlField: React.FC<{ path: string }> = ({ path }) => {
  const { value } = useField<string>({ path })
  const [copied, setCopied] = React.useState(false)

  if (!value) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#C8102E', fontSize: '11px', wordBreak: 'break-all', flex: 1 }}>
        {value}
      </a>
      <button onClick={handleCopy} type="button" style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', background: copied ? '#e8f5e9' : 'white', color: copied ? '#2e7d32' : '#666' }}>
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}
