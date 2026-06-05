import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'No image URL' }, { status: 400 })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: imageUrl,
                },
              },
              {
                type: 'text',
                text: 'Write a concise, descriptive alt text for this image in one sentence. Be specific about who or what is shown, where they are, and what they are doing. Maximum 125 characters. Return only the alt text, nothing else.',
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()
    const altText = data.content?.[0]?.text?.trim() || ''
    return NextResponse.json({ altText })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
