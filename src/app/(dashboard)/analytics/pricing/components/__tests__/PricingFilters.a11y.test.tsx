import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { PricingFilters } from '../PricingFilters'

describe('PricingFilters accessibility', () => {
  it('provides descriptive accessible names for the slider and both selects', () => {
    renderWithProviders(
      <PricingFilters
        targetMargin={20}
        gapFilter=""
        sort=""
        onTargetMarginChange={vi.fn()}
        onGapFilterChange={vi.fn()}
        onSortChange={vi.fn()}
      />
    )

    expect(screen.getByRole('slider', { name: /^Целевая маржа:/ })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Фильтр по разрыву' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Сортировка' })).toBeInTheDocument()
  })
})
