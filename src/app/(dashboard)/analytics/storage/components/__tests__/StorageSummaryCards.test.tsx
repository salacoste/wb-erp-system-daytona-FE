/**
 * Unit tests for StorageSummaryCards component
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * BD-16 / AP#8 coverage: null money totals must render «—», never «0 ₽».
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorageSummaryCards } from '../StorageSummaryCards'
import { mockNullCostStorageSummary } from '@/test/fixtures/storage-analytics'

describe('StorageSummaryCards', () => {
  it('renders a dash (not "0 ₽") for null total storage cost (BD-16, AP#8)', () => {
    render(<StorageSummaryCards summary={mockNullCostStorageSummary} />)

    // The «Всего расходы» card carries the null total → must show «—», never a fabricated «0 ₽».
    const cards = screen.getAllByText('—')
    expect(cards.length).toBeGreaterThan(0)
    expect(screen.queryByText(/0\s*₽/)).not.toBeInTheDocument()
  })

  it('formats a known total cost as currency', () => {
    render(
      <StorageSummaryCards
        summary={{
          total_storage_cost: 1250.5,
          products_count: 3,
          avg_cost_per_product: 417,
        }}
      />
    )
    // Known money renders the ruble sign (Russian locale).
    expect(screen.getAllByText(/₽/).length).toBeGreaterThan(0)
  })
})
