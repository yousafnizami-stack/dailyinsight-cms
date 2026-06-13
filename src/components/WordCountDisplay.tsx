'use client'
import { useField } from '@payloadcms/ui'

function extractText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) return node.children.map(extractText).join(' ')
  if (node.root) return extractText(node.root)
  return ''
}

function countWords(body: any): number {
  if (!body) return 0
  const raw = typeof body === 'string' ? body : extractText(body)
  const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? text.split(' ').filter((w) => w.length > 0).length : 0
}

export function WordCountDisplay() {
  const { value } = useField<any>({ path: 'body' })
  const wc = countWords(value)

  const color = wc >= 700 ? '#4ade80' : wc >= 500 ? '#fbbf24' : '#f87171'
  const bg = wc >= 700 ? 'rgba(74,222,128,0.1)' : wc >= 500 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: bg,
        border: `1px solid ${color}`,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color,
        letterSpacing: '0.03em',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {wc} words
    </div>
  )
}
