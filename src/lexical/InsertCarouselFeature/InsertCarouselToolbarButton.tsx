'use client'
import type { LexicalEditor } from 'lexical'
import React, { useCallback } from 'react'
import { $addUpdateTag } from 'lexical'
import { useListDrawer } from '@payloadcms/ui'
import { INSERT_BLOCK_COMMAND } from '@payloadcms/richtext-lexical/client'

// Upload/relationship fields on a document fetched via the list drawer may come back as
// either a bare ID or a populated object depending on the drawer's fetch depth — normalize
// to just the ID either way, since that's what the carousel block's own upload field expects.
function toImageId(value: unknown): unknown {
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return (value as Record<string, unknown>).id
  }
  return value
}

// Fixed-toolbar button (registered via InsertCarouselFeatureClient's toolbarFixed group)
// that lets someone pick a Carousels library entry and insert a fresh, independent copy
// of it as a new carousel block at the current cursor position.
//
// Deliberately mirrors @payloadcms/richtext-lexical's own ToolbarButton click handling
// (editor.focus(() => { editor.update(...); ... }) plus an onMouseDown preventDefault) —
// the exact same pattern already confirmed to work for the built-in "Insert Block"
// toolbar/slash-menu button in this app. A useListDrawer-driven picker needs real React
// hooks, which ToolbarGroupItem's plain onSelect callback can't provide, so this uses the
// toolbar item's `Component` slot (which receives `editor` directly) instead, replicating
// the same click/focus behavior manually rather than the onSelect-only path.
export function InsertCarouselToolbarButton({ editor }: { editor: LexicalEditor }) {
  const [ListDrawer, , { openDrawer }] = useListDrawer({ collectionSlugs: ['carousels'] })

  const handleSelect = useCallback(
    ({ doc }: { doc: { images?: Array<{ caption?: string; image?: unknown }> } }) => {
      const images = Array.isArray(doc?.images) ? doc.images : []
      const copiedImages = images.map((row) => ({
        // Fresh row id per image — never reuse the library entry's own row ids, to avoid
        // any collision with them (this is a one-way copy, independent from here on).
        id: crypto.randomUUID(),
        image: toImageId(row.image),
        caption: row.caption,
      }))

      editor.focus(() => {
        editor.update(() => {
          $addUpdateTag('toolbar')
        })
        editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
          blockName: '',
          blockType: 'carousel',
          images: copiedImages,
        })
      })
    },
    [editor],
  )

  return (
    <>
      <button
        className="toolbar-popup__dropdown"
        onClick={() => openDrawer()}
        onMouseDown={(e) => e.preventDefault()}
        title="Insert Carousel from Library"
        type="button"
      >
        <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Library</span>
      </button>
      <ListDrawer onSelect={handleSelect} />
    </>
  )
}
