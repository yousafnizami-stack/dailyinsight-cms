import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Get the Payload auth cookie and rewrite it with the shared domain
  const authCookie = request.cookies.get('di-token')
  if (authCookie) {
    response.cookies.set('di-token', authCookie.value, {
      domain: '.dailyinsight.co.uk',
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
