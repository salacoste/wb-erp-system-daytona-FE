/**
 * Unit tests for StorageAlertBanner component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorageAlertBanner } from '../StorageAlertBanner'
import type { TopConsumerItem } from '@/types/storage-analytics'

// Helper to create mock consumer items
function createConsumer(
  nmId: string,
  ratio: number | null
): TopConsumerItem {
  return {
    rank: 1,
    nm_id: nmId,
    vendor_code: null,
    product_name: `Product ${nmId}`,
    brand: null,
    storage_cost: 1000,
    percent_of_total: 10,
    volume: 1,
    storage_to_revenue_ratio: ratio,
  }
}

describe('StorageAlertBanner', () => {
  it('hides when highRatioCount = 0', () => {
    const consumers = [
      createConsumer('1', 5),  // < 20
      createConsumer('2', 15), // < 20
      createConsumer('3', null),
    ]

    const { container } = render(<StorageAlertBanner topConsumers={consumers} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when highRatioCount > 0', () => {
    const consumers = [
      createConsumer('1', 25), // > 20
      createConsumer('2', 15), // < 20
    ]

    render(<StorageAlertBanner topConsumers={consumers} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows correct count of high ratio products', () => {
    const consumers = [
      createConsumer('1', 25), // > 20
      createConsumer('2', 30), // > 20
      createConsumer('3', 15), // < 20
    ]

    render(<StorageAlertBanner topConsumers={consumers} />)
    expect(screen.getByText(/2 товара/)).toBeInTheDocument()
  })

  // Pluralization tests for Russian (товар/товара/товаров)
  describe('Russian pluralization', () => {
    it('pluralizes correctly for 1 (товар)', () => {
      const consumers = [createConsumer('1', 25)]

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/1 товар/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 2 (товара)', () => {
      const consumers = [
        createConsumer('1', 25),
        createConsumer('2', 30),
      ]

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/2 товара/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 3 (товара)', () => {
      const consumers = [
        createConsumer('1', 25),
        createConsumer('2', 30),
        createConsumer('3', 35),
      ]

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/3 товара/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 4 (товара)', () => {
      const consumers = Array.from({ length: 4 }, (_, i) =>
        createConsumer(String(i), 25)
      )

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/4 товара/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 5 (товаров)', () => {
      const consumers = Array.from({ length: 5 }, (_, i) =>
        createConsumer(String(i), 25)
      )

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/5 товаров/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 11 (товаров) - special case', () => {
      const consumers = Array.from({ length: 11 }, (_, i) =>
        createConsumer(String(i), 25)
      )

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/11 товаров/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 21 (товар) - special case', () => {
      const consumers = Array.from({ length: 21 }, (_, i) =>
        createConsumer(String(i), 25)
      )

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/21 товар/)).toBeInTheDocument()
    })

    it('pluralizes correctly for 22 (товара)', () => {
      const consumers = Array.from({ length: 22 }, (_, i) =>
        createConsumer(String(i), 25)
      )

      render(<StorageAlertBanner topConsumers={consumers} />)
      expect(screen.getByText(/22 товара/)).toBeInTheDocument()
    })
  })

  it('shows threshold in message', () => {
    const consumers = [createConsumer('1', 25)]

    render(<StorageAlertBanner topConsumers={consumers} />)
    expect(screen.getByText(/> 20%/)).toBeInTheDocument()
  })

  it('respects custom threshold prop', () => {
    const consumers = [
      createConsumer('1', 15), // > 10 custom threshold
      createConsumer('2', 8),  // < 10 custom threshold
    ]

    render(<StorageAlertBanner topConsumers={consumers} threshold={10} />)
    expect(screen.getByText(/1 товар/)).toBeInTheDocument()
    expect(screen.getByText(/> 10%/)).toBeInTheDocument()
  })

  it('treats null ratios as 0', () => {
    const consumers = [
      createConsumer('1', null), // Should be treated as 0
      createConsumer('2', 25),   // > 20
    ]

    render(<StorageAlertBanner topConsumers={consumers} />)
    expect(screen.getByText(/1 товар/)).toBeInTheDocument()
  })

  it('handles empty consumers array', () => {
    const { container } = render(<StorageAlertBanner topConsumers={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
