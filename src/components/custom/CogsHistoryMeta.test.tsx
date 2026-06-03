/**
 * Tests for CogsHistoryMeta — "Текущий COGS" rendering.
 * Guards the cogs-history normalizer's NaN "invalid cost" sentinel (current_cogs.unit_cost_rub)
 * so the meta card shows "—" rather than the raw Intl "не число ₽" (anti-pattern #8).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CogsHistoryMeta } from './CogsHistoryMeta'

const baseMeta = { nm_id: '12345', product_name: 'Товар', total_versions: 3 }

describe('CogsHistoryMeta', () => {
  it('renders "—" when current_cogs cost is NaN (invalid backend sentinel), not "не число ₽"', () => {
    render(
      <CogsHistoryMeta
        meta={{ ...baseMeta, current_cogs: { unit_cost_rub: NaN, valid_from: '2025-01-01' } }}
      />
    )
    expect(screen.getByText(/Текущий COGS:\s*—/)).toBeInTheDocument()
    expect(screen.queryByText(/не число/)).not.toBeInTheDocument()
  })

  it('renders the formatted cost when current_cogs is valid', () => {
    render(
      <CogsHistoryMeta
        meta={{ ...baseMeta, current_cogs: { unit_cost_rub: 500, valid_from: '2025-01-01' } }}
      />
    )
    expect(screen.getByText(/500,00/)).toBeInTheDocument()
  })

  it('renders "—" when current_cogs is null', () => {
    render(<CogsHistoryMeta meta={{ ...baseMeta, current_cogs: null }} />)
    expect(screen.getByText(/Текущий COGS:\s*—/)).toBeInTheDocument()
  })
})
