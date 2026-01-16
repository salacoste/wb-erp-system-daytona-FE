/**
 * Authentication utilities
 * Token validation and session management helpers
 */

/**
 * Decode JWT token without verification (client-side only)
 * Note: This only decodes the token, it does not verify the signature.
 * Backend should always verify tokens.
 */
export function decodeJWT(token: string): { exp?: number; [key: string]: unknown } | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true

  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) return true

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000
  const currentTime = Date.now()

  // Add 5 minute buffer to refresh before actual expiration
  const bufferTime = 5 * 60 * 1000

  return currentTime >= expirationTime - bufferTime
}

/**
 * Check if token is valid (exists and not expired)
 * @param token - JWT token string
 * @returns true if token is valid, false otherwise
 */
export function isValidToken(token: string | null): boolean {
  if (!token) return false
  return !isTokenExpired(token)
}

