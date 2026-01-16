import { describe, it, expect } from 'vitest'
import { decodeJWT, isTokenExpired, isValidToken } from './auth'

describe('auth utilities', () => {
  describe('decodeJWT', () => {
    it('decodes valid JWT token', () => {
      // Create a simple JWT token for testing
      // Header: {"alg":"HS256","typ":"JWT"}
      // Payload: {"exp":1735689600,"userId":"123"}
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(
        JSON.stringify({ exp: 1735689600, userId: '123' }),
      )
      const token = `${header}.${payload}.signature`

      const decoded = decodeJWT(token)

      expect(decoded).toEqual({ exp: 1735689600, userId: '123' })
    })

    it('returns null for invalid token format', () => {
      const invalidToken = 'not-a-valid-token'
      const decoded = decodeJWT(invalidToken)
      expect(decoded).toBeNull()
    })

    it('returns null for token without payload', () => {
      const token = 'header.'
      const decoded = decodeJWT(token)
      expect(decoded).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('returns true for null token', () => {
      expect(isTokenExpired(null)).toBe(true)
    })

    it('returns true for expired token', () => {
      // Token expired 1 hour ago
      const expiredTime = Math.floor((Date.now() - 3600000) / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: expiredTime }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('returns false for valid token', () => {
      // Token expires in 1 hour
      const futureTime = Math.floor((Date.now() + 3600000) / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: futureTime }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(false)
    })

    it('returns true for token expiring within 5 minutes (buffer)', () => {
      // Token expires in 3 minutes (within 5 minute buffer)
      const nearExpiration = Math.floor((Date.now() + 180000) / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: nearExpiration }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('returns true for token without exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ userId: '123' }))
      const token = `${header}.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('isValidToken', () => {
    it('returns false for null token', () => {
      expect(isValidToken(null)).toBe(false)
    })

    it('returns false for expired token', () => {
      const expiredTime = Math.floor((Date.now() - 3600000) / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: expiredTime }))
      const token = `${header}.${payload}.signature`

      expect(isValidToken(token)).toBe(false)
    })

    it('returns true for valid token', () => {
      const futureTime = Math.floor((Date.now() + 3600000) / 1000)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      const payload = btoa(JSON.stringify({ exp: futureTime }))
      const token = `${header}.${payload}.signature`

      expect(isValidToken(token)).toBe(true)
    })
  })
})

