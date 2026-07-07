'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import React, { useCallback, useEffect } from 'react'
import {
  createClientFeature,
  INSERT_BLOCK_COMMAND,
  slashMenuBasicGroupWithItems,
  useLexicalListDrawer,
} from '@payloadcms/richtext-lexical/client'

export const INSERT_CAROUSEL_FROM_LIBRARY_COMMAND = createCommand('INSERT_CAROUSEL_FROM_LIBRARY_COMMAND')

// Upload/relationship fields on a document fetched via the list drawer may come back as
// either a bare ID or a populated object depending on the drawer's fetch depth — normalize
// to just the ID either way, since that's what the carousel block's own upload field expects.
function toImageId(value: unknown): unknown {
  if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return (value as Record<string, unknown>).id
  }
  return value
}

// None of @payloadcms/richtext-lexical's built-in icons are part of its public export
// surface (only reachable via internal dist/ paths), so this is a small inline icon rather
// than an unstable deep import.
function CarouselFromLibraryIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
      <rect height="12" rx="1" stroke="currentColor" strokeWidth="1.2" width="4.5" x="2" y="4" />
      <rect height="15" rx="1" stroke="currentColor" strokeWidth="1.2" width="4.5" x="7.75" y="2.5" />
      <rect height="12" rx="1" stroke="currentColor" strokeWidth="1.2" width="4.5" x="13.5" y="4" />
    </svg>
  )
}

// Mirrors @payloadcms/richtext-lexical's own Upload feature pattern exactly (see
// upload/client/drawer/index.js): a persistent plugin holds the drawer/hook logic, registers
// a lexical command that opens it, and its own ListDrawer's onSelect performs the actual
// insertion. useLexicalListDrawer (rather than the raw useListDrawer) additionally preserves
// and restores the lexical cursor position around opening/closing the drawer.
//
// The slash menu / "+" gutter item itself (registered below) only ever does a plain,
// hook-free editor.dispatchCommand — it's a simple callback, not a component, so it can't
// call useLexicalListDrawer (a hook) directly. That's why the actual drawer logic has to
// live here, in an always-mounted plugin, triggered by a custom command instead.
function InsertCarouselDrawerPlugin() {
  const [editor] = useLexicalComposerContext()
  const { closeListDrawer, ListDrawer, openListDrawer } = useLexicalListDrawer({
    collectionSlugs: ['carousels'],
  })

  const handleSelect = useCallback(
    ({ doc }: { doc: { images?: Array<{ caption?: string; image?: unknown }> } }) => {
      closeListDrawer()
      const images = Array.isArray(doc?.images) ? doc.images : []
      const copiedImages = images.map((row) => ({
        // Fresh row id per image — never reuse the library entry's own row ids, to avoid
        // any collision with them (this is a one-way copy, independent from here on).
        id: crypto.randomUUID(),
        image: toImageId(row.image),
        caption: row.caption,
      }))
      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
        blockName: '',
        blockType: 'carousel',
        images: copiedImages,
      })
    },
    [closeListDrawer, editor],
  )

  useEffect(() => {
    return editor.registerCommand(
      INSERT_CAROUSEL_FROM_LIBRARY_COMMAND,
      () => {
        openListDrawer()
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor, openListDrawer])

  return <ListDrawer onSelect={handleSelect} />
}

// Contributes "Choose Existing Carousel" to the slash menu ("/") and, since Payload's own
// AddBlockHandlePlugin dispatches ENABLE_SLASH_MENU_COMMAND to open this exact same menu
// (confirmed via its own source comment: "This is mainly used for the AddBlockHandlePlugin,
// so that the slash menu can be opened from there"), the "+" gutter dropdown too — same
// list, just two ways to open it. Merged into the shared 'basic' slash-menu group (the same
// one Upload uses) so it appears naturally alongside the other built-in entries rather than
// as its own separate section.
export const InsertCarouselFeatureClient = createClientFeature(() => {
  return {
    plugins: [
      {
        Component: InsertCarouselDrawerPlugin,
        position: 'normal',
      },
    ],
    slashMenu: {
      groups: [
        slashMenuBasicGroupWithItems([
          {
            Icon: CarouselFromLibraryIcon,
            key: 'insert-carousel-from-library',
            keywords: ['carousel', 'library', 'existing', 'reuse'],
            label: 'Choose Existing Carousel',
            onSelect: ({ editor }) => {
              editor.dispatchCommand(INSERT_CAROUSEL_FROM_LIBRARY_COMMAND, undefined)
            },
          },
        ]),
      ],
    },
  }
})
