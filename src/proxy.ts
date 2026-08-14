import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROUTES } from '@/lib/routes'
import { isProtectedRoute, isPublicRoute } from '@/lib/routes-protected'
import { isValidToken } from '@/lib/auth'

function getSafeAuthRedirect(request: NextRequest): URL {
  const dashboardUrl = new URL(ROUTES.DASHBOARD, request.url)
  const redirectParam = request.nextUrl.searchParams.get('redirect')

  if (!redirectParam?.startsWith('/') || redirectParam.startsWith('//')) {
    return dashboardUrl
  }

  try {
    const redirectUrl = new URL(redirectParam, request.url)
    const targetsAuthPage =
      redirectUrl.pathname === ROUTES.LOGIN || redirectUrl.pathname === ROUTES.REGISTER

    return redirectUrl.origin === request.nextUrl.origin && !targetsAuthPage
      ? redirectUrl
      : dashboardUrl
  } catch (error) {
    if (error instanceof TypeError) {
      return dashboardUrl
    }
    throw error
  }
}

/**
 * Next.js proxy for authentication (Next 16: middleware → proxy convention)
 * Protects routes and handles redirects based on authentication state
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get token from cookie (set by client after login) or header
  // Middleware runs on server and cannot access localStorage, so we use cookies
  // Cookie is set by LoginForm after successful login
  const tokenFromCookie = request.cookies.get('auth-token')?.value
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '')

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
    const redirectUrl = getSafeAuthRedirect(request)

    // Only redirect if not already on the target page
    if (pathname !== redirectUrl.pathname) {
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

// Configure which routes proxy runs on
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
