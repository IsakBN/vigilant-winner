import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest): NextResponse {
  // Check for both cookie names: __Secure- prefix is added in production (secure: true)
  const sessionCookie = request.cookies.get('__Secure-better-auth.session_token')
    ?? request.cookies.get('better-auth.session_token')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/sign-up') ||
                     request.nextUrl.pathname.startsWith('/forgot-password')

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && !isAuthPage && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If has session and trying to access auth page, redirect to dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
