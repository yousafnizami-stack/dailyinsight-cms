import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '../../../payload.config'

// Verbatim mirror of /api/ingest-with-images (same htmlToLexical + bodyImages insertion +
// auth + category-lookup + create logic) — does NOT modify that route at all. The only
// difference is the target collection: "pending-drafts" instead of "articles", since this
// is the staging entry point for the KW pipeline's image-integration workflow (drafts sit
// here for review before being promoted to a real article via
// /api/pending-drafts/[id]/publish).

// Identical to /api/ingest-with-images's own htmlToLexical — verbatim copy, not
// shared/imported, for the same independence reason that route's own copy documents
// relative to /api/ingest.
function htmlToLexical(html: string) {
  if (!html) return undefined
  const nodes: any[] = []
  const blockRegex = /<(p|h2|blockquote)>([\s\S]*?)<\/\1>/gi
  let match
  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase()
    const inner = match[2]
    const cleanText = inner.replace(/<[^>]+>/g, '')
    if (tag === 'h2') {
      nodes.push({ type: 'heading', tag: 'h2', children: [{ type: 'text', text: cleanText, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 })
    } else if (tag === 'blockquote') {
      nodes.push({ type: 'quote', children: [{ type: 'text', text: cleanText, version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 })
    } else {
      const parts = inner.split(/(<strong>[\s\S]*?<\/strong>|<a\s[^>]*href[^>]*>[\s\S]*?<\/a>)/gi)
      const children = parts.filter(p => p).map(part => {
        const boldMatch = part.match(/^<strong>([\s\S]*?)<\/strong>$/i)
        if (boldMatch) return { type: 'text', text: boldMatch[1].replace(/<[^>]+>/g, ''), format: 1, version: 1 }
        const linkMatch = part.match(/^<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>$/i)
        if (linkMatch) return { type: 'link', fields: { url: linkMatch[1] }, children: [{ type: 'text', text: linkMatch[2].replace(/<[^>]+>/g, ''), version: 1 }], version: 1 }
        const text = part.replace(/<[^>]+>/g, '')
        return text ? { type: 'text', text, format: 0, version: 1 } : null
      }).filter(Boolean)
      if (children.length) nodes.push({ type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 })
    }
  }
  return {
    root: {
      type: 'root',
      children: nodes.length ? nodes : [{ type: 'paragraph', children: [{ type: 'text', text: html.replace(/<[^>]+>/g, ''), version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }],
      direction: 'ltr', format: '', indent: 0, version: 1,
    }
  }
}

// Exact raw shape confirmed live against article 1183's stored body (fetched at depth:0,
// i.e. the actual persisted representation, not the depth:1 populated-Media-object shape
// a normal read returns). No top-level `id` — matches htmlToLexical's own
// paragraph/heading/quote nodes above, none of which set one either; Payload's lexical
// field fills node ids in automatically on save. `version: 3` is specific to UploadNode's
// own internal schema version (distinct from the `version: 1` used by text/paragraph
// nodes) — confirmed against the live example, not guessed.
function buildUploadNode(mediaId: string | number) {
  return {
    type: 'upload',
    relationTo: 'media',
    value: mediaId,
    fields: null,
    format: '',
    version: 3,
  }
}

// Inserts an upload node immediately after the Nth paragraph node (0-indexed among
// PARAGRAPH-typed nodes specifically, not a raw children-array index — heading/quote
// nodes interleaved in real body content don't count toward the position). Processes
// insertions in descending afterParagraphIndex order so each splice only ever shifts
// positions of paragraphs AFTER the one just processed, never the ones still queued —
// the paragraphPositions lookup table is computed once, up front, from the
// pre-insertion layout, and stays valid throughout for exactly this reason.
function insertBodyImages(lexicalBody: any, bodyImages: { mediaId: string; afterParagraphIndex: number }[]) {
  if (!lexicalBody?.root?.children || !Array.isArray(bodyImages) || bodyImages.length === 0) return lexicalBody
  const children = lexicalBody.root.children as any[]

  const paragraphPositions: number[] = []
  children.forEach((node, idx) => {
    if (node?.type === 'paragraph') paragraphPositions.push(idx)
  })

  const sorted = [...bodyImages].sort((a, b) => b.afterParagraphIndex - a.afterParagraphIndex)
  for (const { mediaId, afterParagraphIndex } of sorted) {
    if (
      typeof afterParagraphIndex !== 'number' ||
      afterParagraphIndex < 0 ||
      afterParagraphIndex >= paragraphPositions.length ||
      !mediaId
    ) {
      continue // out of range or malformed entry — skip rather than throw, matching
      // this codebase's general fail-soft convention for per-item processing loops.
    }
    const insertAt = paragraphPositions[afterParagraphIndex] + 1
    children.splice(insertAt, 0, buildUploadNode(mediaId))
  }

  return lexicalBody
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const auth = req.headers.get('Authorization')
  if (apiKey !== process.env.PIPELINE_SECRET && auth !== `Bearer ${process.env.PIPELINE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    const body = await req.json()

    let categoryId: string | number | undefined
    if (body.category && typeof body.category === 'string') {
      const result = await payload.find({
        collection: 'categories',
        where: { slug: { equals: body.category } },
        limit: 1,
        overrideAccess: true,
      })
      if (result.docs.length === 0) {
        return NextResponse.json({ error: `Category not found: ${body.category}` }, { status: 400 })
      }
      categoryId = result.docs[0].id
    }

    const featuredImageUrl = (body.featuredImage && typeof body.featuredImage === 'string') ? body.featuredImage : undefined
    let lexicalBody = body.body ? htmlToLexical(body.body) : undefined

    if (lexicalBody && Array.isArray(body.bodyImages) && body.bodyImages.length > 0) {
      lexicalBody = insertBodyImages(lexicalBody, body.bodyImages)
    }

    const { category, featuredImage, body: bodyHtml, imageOptions, author, featuredImageMediaId, bodyImages, ...rest } = body
    const draft = await payload.create({
      collection: 'pending-drafts',
      data: {
        ...rest,
        ...(categoryId !== undefined && { category: categoryId }),
        // featuredImageUrl is set here purely for parity with the ingest-with-images data
        // shape — PendingDrafts has no such field in its schema (see
        // src/collections/PendingDrafts.ts), so Payload silently drops it; the actual
        // image reference is the featuredImage relationship field set below.
        ...(featuredImageUrl !== undefined && { featuredImageUrl }),
        ...(featuredImageMediaId !== undefined && { featuredImage: featuredImageMediaId }),
        ...(lexicalBody !== undefined && { body: lexicalBody }),
        ...(imageOptions !== undefined && { imageOptions }),
        ...(author !== undefined && { author }),
      },
      overrideAccess: true,
    })
    return NextResponse.json({ id: draft.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
