import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '../../../payload.config'

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
    const lexicalBody = body.body ? htmlToLexical(body.body) : undefined

    const { category, featuredImage, body: bodyHtml, imageOptions, author, ...rest } = body
    const article = await payload.create({
      collection: 'articles',
      data: {
        ...rest,
        ...(categoryId !== undefined && { category: categoryId }),
        ...(featuredImageUrl !== undefined && { featuredImageUrl }),
        ...(lexicalBody !== undefined && { body: lexicalBody }),
        ...(imageOptions !== undefined && { imageOptions }),
        ...(author !== undefined && { author }),
      },
      overrideAccess: true,
    })
    return NextResponse.json({ id: article.id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
