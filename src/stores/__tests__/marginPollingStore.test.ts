/**
 * Tests for useMarginPollingStore
 * Story 4.8: Margin recalculation polling state management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMarginPollingStore } from '../marginPollingStore'

describe('useMarginPollingStore', () => {
  beforeEach(() => {
    useMarginPollingStore.getState().clearPolling()
  })

  it('has correct initial state with empty polling set', () => {
    const state = useMarginPollingStore.getState()
    expect(state.pollingProducts.size).toBe(0)
  })

  it('adds a product to the polling set', () => {
    useMarginPollingStore.getState().addPollingProduct('12345')

    const { pollingProducts } = useMarginPollingStore.getState()
    expect(pollingProducts.has('12345')).toBe(true)
    expect(pollingProducts.size).toBe(1)
  })

  it('does not duplicate products in the polling set', () => {
    useMarginPollingStore.getState().addPollingProduct('12345')
    useMarginPollingStore.getState().addPollingProduct('12345')

    expect(useMarginPollingStore.getState().pollingProducts.size).toBe(1)
  })

  it('tracks multiple products independently', () => {
    useMarginPollingStore.getState().addPollingProduct('111')
    useMarginPollingStore.getState().addPollingProduct('222')
    useMarginPollingStore.getState().addPollingProduct('333')

    const { pollingProducts } = useMarginPollingStore.getState()
    expect(pollingProducts.size).toBe(3)
    expect(pollingProducts.has('111')).toBe(true)
    expect(pollingProducts.has('222')).toBe(true)
    expect(pollingProducts.has('333')).toBe(true)
  })

  it('removes a product from the polling set', () => {
    useMarginPollingStore.getState().addPollingProduct('12345')
    useMarginPollingStore.getState().removePollingProduct('12345')

    const { pollingProducts } = useMarginPollingStore.getState()
    expect(pollingProducts.has('12345')).toBe(false)
    expect(pollingProducts.size).toBe(0)
  })

  it('removes only the specified product', () => {
    useMarginPollingStore.getState().addPollingProduct('111')
    useMarginPollingStore.getState().addPollingProduct('222')

    useMarginPollingStore.getState().removePollingProduct('111')

    const { pollingProducts } = useMarginPollingStore.getState()
    expect(pollingProducts.has('111')).toBe(false)
    expect(pollingProducts.has('222')).toBe(true)
    expect(pollingProducts.size).toBe(1)
  })

  it('isPolling returns true for tracked product', () => {
    useMarginPollingStore.getState().addPollingProduct('12345')

    expect(useMarginPollingStore.getState().isPolling('12345')).toBe(true)
  })

  it('isPolling returns false for untracked product', () => {
    useMarginPollingStore.getState().addPollingProduct('12345')

    expect(useMarginPollingStore.getState().isPolling('99999')).toBe(false)
  })

  it('isPolling returns false for empty store', () => {
    expect(useMarginPollingStore.getState().isPolling('anything')).toBe(false)
  })

  it('clears all polling products', () => {
    useMarginPollingStore.getState().addPollingProduct('111')
    useMarginPollingStore.getState().addPollingProduct('222')
    useMarginPollingStore.getState().addPollingProduct('333')

    useMarginPollingStore.getState().clearPolling()

    expect(useMarginPollingStore.getState().pollingProducts.size).toBe(0)
    expect(useMarginPollingStore.getState().isPolling('111')).toBe(false)
    expect(useMarginPollingStore.getState().isPolling('222')).toBe(false)
    expect(useMarginPollingStore.getState().isPolling('333')).toBe(false)
  })
})
