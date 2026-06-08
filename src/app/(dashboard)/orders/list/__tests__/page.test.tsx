/**
 * Orders List Page Tests
 * Tests for src/app/(dashboard)/orders/list/page.tsx
 *
 * Note: This page calls redirect('/orders') at render time.
 */

import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation redirect
const mockRedirect = vi.fn()
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT: ${url}`)
  },
}))

describe('OrdersListPage', () => {
  it('should call redirect to /orders', async () => {
    const { default: OrdersListPage } = await import('../page')

    expect(() => {
      try {
        OrdersListPage()
      } catch {
        // Expected: redirect throws
      }
    }).not.toThrow(/Cannot read properties of undefined/)

    expect(mockRedirect).toHaveBeenCalledWith('/orders')
  })

  it('should be a function (default export)', async () => {
    const { default: OrdersListPage } = await import('../page')

    expect(typeof OrdersListPage).toBe('function')
  })
})
