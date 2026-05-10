/**
 * ReconciliationTable Unit Tests — Story 96.14-FE
 *
 * Verifies table renders columns and anomaly indicators correctly:
 *   - Column headers present
 *   - Rows with anomaly counts > 0 show AlertTriangle (role=button) per column
 *   - Rows with all-zero anomaly counts show no AlertTriangle
 *   - Source enum rendered as human-readable label
 *
 * Pattern 3 wiring: noAnomalyItem / withAnomalyItem imported from buyout-reconciliation-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReconciliationTable } from '../ReconciliationTable'
import {
  noAnomalyItem,
  withAnomalyItem,
  emptyReconciliationItem,
} from '@/test/fixtures/buyout-reconciliation-empty'

describe('ReconciliationTable', () => {
  it('renders all required column headers', () => {
    renderWithProviders(<ReconciliationTable items={[]} />)
    expect(screen.getByText('Артикул WB')).toBeInTheDocument()
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Выкупов')).toBeInTheDocument()
    expect(screen.getByText('Возвратов')).toBeInTheDocument()
    expect(screen.getByText('Возвраты без выкупа')).toBeInTheDocument()
    expect(screen.getByText('Сиротские выкупы')).toBeInTheDocument()
    // M-4 fix: full form matches spec AC-3 (was "Расхождение кол-ва")
    expect(screen.getByText('Расхождение количества')).toBeInTheDocument()
    expect(screen.getByText('Источник')).toBeInTheDocument()
  })

  it('renders no anomaly indicator buttons on a row with all-zero anomaly counts', () => {
    renderWithProviders(<ReconciliationTable items={[noAnomalyItem()]} />)
    // L-1 + M2-2 fix: role="button" dropped — scope by aria-label instead
    // queryAllByLabelText(/Аномалия/) finds tooltip-trigger spans with anomaly aria-labels
    expect(screen.queryAllByLabelText(/Аномалия/)).toHaveLength(0)
    // counts render as plain numbers
    expect(screen.getByText('50')).toBeInTheDocument() // buyoutQuantity
    expect(screen.getByText('5')).toBeInTheDocument() // returnQuantity
  })

  it('renders AlertTriangle buttons for each anomaly column when counts > 0', () => {
    renderWithProviders(<ReconciliationTable items={[withAnomalyItem()]} />)
    // M2-1 + M2-2 fix: role="button" dropped (focus-based tooltip, not click activation)
    // Query by aria-label — regression-resistant, scoped to anomaly indicators specifically
    const indicators = screen.getAllByLabelText(/Аномалия/)
    expect(indicators).toHaveLength(3)
    // Each indicator has the correct aria-label
    expect(indicators[0]).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Аномалия: возврат без подтверждённого выкупа')
    )
    expect(indicators[1]).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Аномалия: выкуп без подтверждённого исходного заказа')
    )
    expect(indicators[2]).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Аномалия: расхождение количества возвратов между источниками')
    )
  })

  it('renders product name, brand, and source label', () => {
    renderWithProviders(<ReconciliationTable items={[withAnomalyItem()]} />)
    expect(screen.getByText('Тест с аномалиями')).toBeInTheDocument()
    expect(screen.getByText('Brand B')).toBeInTheDocument()
    // source='sdk_reconciliation' → 'SDK'
    expect(screen.getByText('SDK')).toBeInTheDocument()
  })

  it('renders SourceBadge for blended source (Story 96.15-FE)', () => {
    renderWithProviders(<ReconciliationTable items={[noAnomalyItem()]} />)
    // H-1 fix: source='blended' → SourceBadge renders 'Комбинированный' (unified with dropdown)
    // L-1 fix: testid scoped to source-badge-blended
    const badge = screen.getByTestId('source-badge-blended')
    expect(badge).toHaveTextContent('Комбинированный')
  })

  it('Story 96.15-FE: sdk_reconciliation renders SourceBadge with "SDK" label', () => {
    renderWithProviders(<ReconciliationTable items={[withAnomalyItem()]} />)
    // L-1 fix: testid scoped to source-badge-sdk_reconciliation (no multi-row collision)
    const badge = screen.getByTestId('source-badge-sdk_reconciliation')
    expect(badge).toHaveTextContent('SDK')
    expect(badge).toHaveAttribute('aria-label', 'Источник: SDK-сверка (наивысшая точность)')
    expect(badge).not.toHaveAttribute('role', 'button')
  })

  it('M-3: renders SourceBadge with AlertTriangle when source === "unknown" (Defensive Frontend Principle)', () => {
    const unknownSourceItem = {
      ...emptyReconciliationItem(),
      nmId: 999,
      source: 'unknown' as const,
    }
    renderWithProviders(<ReconciliationTable items={[unknownSourceItem]} />)
    // M-3 fix: 'unknown' is now in BuyoutSource — delegated to SourceBadge which renders
    // "Неизвестен" label + AlertTriangle icon. L-1 fix: testid scoped to source-badge-unknown.
    const badge = screen.getByTestId('source-badge-unknown')
    expect(badge).toHaveTextContent('Неизвестен')
    expect(badge.querySelector('svg')).not.toBeNull()
  })
})
