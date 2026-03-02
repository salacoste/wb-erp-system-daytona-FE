/**
 * Tests for OtherDeductionsCard — "Прочие удержания"
 * Shows Jam + other WB services (excl. promotion) with ₽/% format.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OtherDeductionsCard } from '@/components/custom/dashboard/OtherDeductionsCard'

describe('OtherDeductionsCard', () => {
  describe('main value display', () => {
    it('renders jam + other services total as currency', () => {
      renderWithProviders(
        <OtherDeductionsCard
          jamCost={500}
          otherServicesCost={400}
          previousTotal={null}
          saleGross={null}
        />
      )

      expect(screen.getByText(/900/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title as "Прочие удержания"', () => {
      renderWithProviders(
        <OtherDeductionsCard
          jamCost={500}
          otherServicesCost={400}
          previousTotal={null}
          saleGross={null}
        />
      )

      expect(screen.getByText('Прочие удержания')).toBeInTheDocument()
    })
  })

  describe('revenue percentage', () => {
    it('shows % of revenue next to value', () => {
      renderWithProviders(
        <OtherDeductionsCard
          jamCost={500}
          otherServicesCost={400}
          previousTotal={null}
          saleGross={100000}
        />
      )

      // 900 / 100000 * 100 = 0.9%
      expect(screen.getByText(/0[,.]9/)).toBeInTheDocument()
      expect(screen.getByText(/%/)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('shows "—" when both costs are null', () => {
      renderWithProviders(
        <OtherDeductionsCard
          jamCost={null}
          otherServicesCost={null}
          previousTotal={null}
          saleGross={null}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <OtherDeductionsCard
          jamCost={null}
          otherServicesCost={null}
          previousTotal={null}
          saleGross={null}
          isLoading={true}
        />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })
  })
})
