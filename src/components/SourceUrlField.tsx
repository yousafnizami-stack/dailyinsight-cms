'use client'
import React from 'react'

export const SourceUrlField: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) return null
  return (
    <div style={{ marginTop: '4px' }}>
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#C8102E', fontSize: '12px', wordBreak: 'break-all' }}>
        {value}
      </a>
    </div>
  )
}
