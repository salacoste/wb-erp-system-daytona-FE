import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isProtectedRoute, isPublicRoute, ROUTES } from '@/lib/routes'
import { isValidToken } from '@/lib/auth'

/**
 * Next.js middleware for authentication
 * Protects routes and handles redirects based on authentication state
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from cookie (set by client after login) or header
  // Middleware runs on server and cannot access localStorage, so we use cookies
  // Cookie is set by LoginForm after successful login
  const tokenFromCookie = request.cookies.get('auth-token')?.value
  const tokenFromHeader = request.headers
    .get('authorization')
    ?.replace('Bearer ', '')

  const token = tokenFromCookie || tokenFromHeader

  // Check if route is protected
  const isProtected = isProtectedRoute(pathname)
  const publicRoute = isPublicRoute(pathname)

  // For protected routes, check authentication
  if (isProtected) {
    // If no token or token is invalid, redirect to login
    if (!token || !isValidToken(token)) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users from auth pages
  // But respect redirect parameter if present
  if (
    publicRoute &&
    token &&
    isValidToken(token) &&
    (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER)
  ) {
    // Check if there's a redirect parameter in the URL
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    const redirectTo = redirectParam && redirectParam.startsWith('/')
      ? redirectParam
      : ROUTES.DASHBOARD
    
    // Only redirect if not already on the target page
    if (pathname !== redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

