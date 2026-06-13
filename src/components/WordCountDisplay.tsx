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
  let text = ''
  if (typeof body === 'string') {
    text = body.replace(/<[^>]+>/g, ' ')
  } else if (typeof body === 'object') {
    text = extractText(body)
  }
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

export function WordCountDisplay() {
  const { value } = useField<any>({ path: 'body' })
  const wc = countWords(value)

  let color: string
  let bg: string
  let border: string

  if (wc >= 700) {
    color = '#4ade80'
    bg = 'rgba(74,222,128,0.08)'
    border = '#4ade80'
  } else if (wc >= 500) {
    color = '#fbbf24'
    bg = 'rgba(251,191,36,0.08)'
    border = '#fbbf24'
  } else {
    color = '#f87171'
    bg = 'rgba(248,113,113,0.08)'
    border = '#f87171'
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color,
        letterSpacing: '0.03em',
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
