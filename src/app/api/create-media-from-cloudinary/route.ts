import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.PIPELINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { cloudinaryPublicId, cloudinaryUrl, cloudinaryResourceType, cloudinaryFormat, alt, caption } = body

    if (!cloudinaryPublicId || !cloudinaryUrl) {
      return NextResponse.json({ error: 'cloudinaryPublicId and cloudinaryUrl are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const doc = await payload.create({
      collection: 'media',
      data: {
        cloudinaryPublicId,
        cloudinaryUrl,
        cloudinaryResourceType: cloudinaryResourceType || 'image',
        cloudinaryFormat,
        url: cloudinaryUrl,
        alt: alt || '',
        caption: caption || '',
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ id: doc.id, doc }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create Media document' }, { status: 500 })
  }
}
