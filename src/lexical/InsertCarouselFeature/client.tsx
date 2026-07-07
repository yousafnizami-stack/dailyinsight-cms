'use client'
import type { ReactNode } from 'react'
import React from 'react'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { InsertCarouselToolbarButton } from './InsertCarouselToolbarButton'

// DIAGNOSTIC (temporary): the toolbar button was reported as never appearing at all. Type
// shape was verified correct against Payload's real types and against confirmed-working
// built-in features (see prior investigation) — this boundary exists purely to surface any
// runtime error during render/effects instead of it being silently swallowed somewhere in
// the tree, so it logs clearly AND renders a visible fallback (rather than nothing) if it
// catches something. Remove once the button is confirmed rendering correctly.
class InsertCarouselErrorBoundary extends React.Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[InsertCarouselToolbarButton] render/effect error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <span
          style={{ color: '#dc2626', fontSize: '11px', fontWeight: 'bold', padding: '0 6px' }}
          title={this.state.error.message}
        >
          Library ⚠
        </span>
      )
    }
    return this.props.children
  }
}

function InsertCarouselToolbarButtonSafe(props: Parameters<typeof InsertCarouselToolbarButton>[0]) {
  return (
    <InsertCarouselErrorBoundary>
      <InsertCarouselToolbarButton {...props} />
    </InsertCarouselErrorBoundary>
  )
}

// Contributes one new fixed-toolbar group, same mechanism the built-in Blocks feature uses
// for its own "Insert Block" dropdown (toolbarFixed.groups) — a brand new group key, so it
// doesn't merge with/replace any existing toolbar group.
export const InsertCarouselFeatureClient = createClientFeature(() => {
  // eslint-disable-next-line no-console
  console.log('[InsertCarouselFeatureClient] factory function called')
  return {
    toolbarFixed: {
      groups: [
        {
          type: 'buttons',
          items: [
            {
              Component: InsertCarouselToolbarButtonSafe,
              key: 'insert-carousel-from-library',
            },
          ],
          key: 'insertCarouselFromLibrary',
          order: 30,
        },
      ],
    },
  }
})
