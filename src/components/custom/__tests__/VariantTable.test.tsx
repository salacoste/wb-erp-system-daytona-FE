/**
 * Unit tests for VariantTable (FR-7 #221).
 */

import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { VariantTable } from '../VariantTable'
import { variantSampleItem, variantNullColorItem } from '@/test/fixtures/variant-empty'

describe('VariantTable', () => {
  it('renders a populated variant (Синий · 42) with revenue and units', () => {
    const { getAllByText, getByText } = renderWithProviders(
      <VariantTable data={[variantSampleItem]} />
    )

    // variant label «Синий · 42»
    expect(getByText(/Синий · 42/)).toBeTruthy()
    // nm_id raw (anti-pattern #10: never formatted)
    expect(getByText(String(variantSampleItem.nm_id))).toBeTruthy()
    // units
    expect(getAllByText(String(variantSampleItem.total_units)).length).toBeGreaterThan(0)
  })

  it('renders a null-color variant as «chrt {id}»', () => {
    const { getByText } = renderWithProviders(<VariantTable data={[variantNullColorItem]} />)

    expect(getByText(`chrt ${variantNullColorItem.chrt_id}`)).toBeTruthy()
  })

  it('renders "—" for null allocated profit and margin', () => {
    const { getAllByText } = renderWithProviders(<VariantTable data={[variantNullColorItem]} />)

    // null profit_allocated_rub and null margin_allocated_pct → two "—" cells
    const dashes = getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the allocated marker (⚠️) on cells AND column headers', () => {
    const { getAllByLabelText } = renderWithProviders(<VariantTable data={[variantSampleItem]} />)

    // Cell markers: Прибыль + Маржа cells (values non-null → marker shown)
    expect(getAllByLabelText('Приблизительное значение').length).toBe(2)
    // Header markers: Прибыль + Маржа column headers (distinct aria-label)
    expect(getAllByLabelText('Столбец содержит приблизительные значения').length).toBe(2)
  })

  it('renders the negative allocated profit in red (not as «—»)', () => {
    const { container } = renderWithProviders(<VariantTable data={[variantSampleItem]} />)
    // variantSampleItem.profit_allocated_rub = -82.78 → negative-financial token class on the profit cell
    // (Story 168.1: text-red-600 → semantic text-financial-negative, sign semantics unchanged)
    const redProfit = container.querySelector('.text-financial-negative')
    expect(redProfit).not.toBeNull()
    expect(redProfit?.textContent).toContain('82,78')
  })

  it('humanizes tech_size "0" as «один размер» to disambiguate same-color variants', () => {
    const zeroSize = { ...variantSampleItem, chrt_id: 999, tech_size: '0' }
    const { getByText } = renderWithProviders(<VariantTable data={[zeroSize]} />)
    expect(getByText(/Синий · один размер/)).toBeTruthy()
  })

  it('shows a spinner when metadata_pending is true', () => {
    const pending = { ...variantSampleItem, chrt_id: 998, metadata_pending: true }
    const { getByLabelText } = renderWithProviders(<VariantTable data={[pending]} />)
    expect(getByLabelText('Метаданные варианта загружаются')).toBeTruthy()
  })

  it('shows the empty state when data is empty', () => {
    const { getByText } = renderWithProviders(<VariantTable data={[]} />)
    expect(getByText('Нет вариантов FBS за эту неделю')).toBeTruthy()
  })

  it('shows the loading state', () => {
    const { getByText } = renderWithProviders(<VariantTable data={[]} isLoading />)
    expect(getByText('Загрузка вариантов…')).toBeTruthy()
  })
})
