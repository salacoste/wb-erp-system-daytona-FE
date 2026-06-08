/**
 * BuyoutPageContent Unit Tests
 *
 * Verifies buyout analytics page:
 * - Renders page title and description
 * - Renders date range picker
 * - Renders source selector
 * - Renders summary widget and table
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

vi.mock('@/components/custom/DateRangePickerExtended', () => ({
  DateRangePickerExtended: ({ id }: { id: string }) => <div data-testid={id}>DateRangePicker</div>,
}))

vi.mock('@/components/custom/ComparisonPeriodSelector', () => ({
  ComparisonPeriodSelector: () => <div data-testid="comparison-selector">Comparison</div>,
}))

vi.mock('@/hooks/useFulfillment', () => ({
  useFulfillmentSummary: () => ({ data: null }),
}))

vi.mock('../components/BuyoutSummaryWidget', () => ({
  BuyoutSummaryWidget: () => <div data-testid="buyout-summary">Summary Widget</div>,
}))

vi.mock('../components/BuyoutTable', () => ({
  BuyoutTable: () => <div data-testid="buyout-table">Table</div>,
}))

import { BuyoutPageContent } from '../components/BuyoutPageContent'

describe('BuyoutPageContent', () => {
  it('renders page title', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByText('Аналитика выкупов')).toBeInTheDocument()
  })

  it('renders page description', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByText('Процент выкупа и тренды по SKU')).toBeInTheDocument()
  })

  it('renders date range picker', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByTestId('buyout-date-range')).toBeInTheDocument()
  })

  it('renders source selector', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByText('Комбинированный')).toBeInTheDocument()
  })

  it('renders summary widget', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByTestId('buyout-summary')).toBeInTheDocument()
  })

  it('renders buyout table', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByTestId('buyout-table')).toBeInTheDocument()
  })

  it('renders comparison period selector', () => {
    renderWithProviders(<BuyoutPageContent />)
    expect(screen.getByTestId('comparison-selector')).toBeInTheDocument()
  })
})
