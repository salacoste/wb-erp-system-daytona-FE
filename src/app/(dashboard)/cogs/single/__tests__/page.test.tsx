/**
 * Single COGS Page Tests
 * Tests for src/app/(dashboard)/cogs/single/page.tsx
 *
 * Note: This page calls redirect('/cogs') at render time.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation redirect
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    // redirect throws NEXT_REDIRECT in real Next.js; simulate with a thrown error
    throw new Error(`NEXT_REDIRECT: ${url}`)
  },
}))

describe('CogsSinglePage', () => {
  it('should call redirect to /cogs', async () => {
    // Dynamic import so mocks are in place before module evaluation
    const { default: CogsSinglePage } = await import('../page')

    expect(() => {
      try {
        CogsSinglePage()
      } catch {
        // Expected: redirect throws
      }
    }).not.toThrow(/Cannot read properties of undefined/)

    expect(mockRedirect).toHaveBeenCalledWith('/cogs')
  })

  it('should be a function (default export)', async () => {
    const { default: CogsSinglePage } = await import('../page')

    expect(typeof CogsSinglePage).toBe('function')
  })
})
