/**
 * Tests for SkuPageStates — 168.9 h1 scale standardization pins.
 * All page states share ONE h1 scale (text-2xl + text-foreground, 168.1 hub precedent).
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuPageLoading, SkuPageWeeksError, SkuPageDataError } from '../SkuPageStates'

function expectH1Pinned() {
  const h1 = screen.getByRole('heading', { level: 1 })
  expect(h1.classList.contains('text-2xl')).toBe(true)
  expect(h1.classList.contains('text-foreground')).toBe(true)
  expect(h1.classList.contains('text-3xl')).toBe(false)
  expect(h1.classList.contains('text-gray-900')).toBe(false)
}

describe('SkuPageStates h1 scale (168.9)', () => {
  it('renders the route suspense fallback as a bounded busy state', () => {
    renderWithProviders(<SkuPageLoading />)

    expect(document.querySelectorAll('.animate-pulse')).not.toHaveLength(0)
  })

  it('SkuPageWeeksError: h1 pinned to 168.1 hub scale (2xl/foreground)', () => {
    renderWithProviders(
      <SkuPageWeeksError error={new Error('auth')} router={{ push: vi.fn() } as never} />
    )
    expectH1Pinned()
  })

  it('SkuPageDataError: same h1 scale across all page states', () => {
    renderWithProviders(<SkuPageDataError error={new Error('boom')} onRetry={vi.fn()} />)
    expectH1Pinned()
  })

  it('retries the failed SKU query from the route-owned data error', () => {
    const onRetry = vi.fn()
    renderWithProviders(<SkuPageDataError error={new Error('boom')} onRetry={onRetry} />)

    screen.getByRole('button', { name: 'Повторить' }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
