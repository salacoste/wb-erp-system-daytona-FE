/**
 * TDD Tests for SubcategoryTooltip — Story 65.16
 * RED phase: Tests define expected behavior BEFORE implementation.
 *
 * Tooltip showing dual-value subcategories: absolute value and percentage of parent total.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md — Story 65.16
 */

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SubcategoryTooltip } from '@/components/custom/dashboard/SubcategoryTooltip'
import { createSubcategories } from './helpers/render-helpers'

describe('SubcategoryTooltip', () => {
  const defaultSubcategories = createSubcategories(3)
  const parentTotal = 20000

  describe('value display', () => {
    /** AC-65.16.1: renders absolute value and percentage for each row */
    it('renders absolute value and percentage for each subcategory', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      // Trigger tooltip open
      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        // Each subcategory should show label, value, and percentage
        expect(screen.getByText('Комиссия за продажу')).toBeInTheDocument()
        expect(screen.getByText('Эквайринг')).toBeInTheDocument()
        expect(screen.getByText('Программа лояльности')).toBeInTheDocument()
      })
    })

    /** AC-65.16.2: percentage = (subcategoryValue / parentTotal) * 100 */
    it('calculates percentage correctly as (value / parentTotal) * 100', async () => {
      const user = userEvent.setup()
      // 15000 / 20000 = 75.00%
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        // 15000 / 20000 * 100 = 75.00%
        expect(screen.getByText(/75[,.]00\s?%/)).toBeInTheDocument()
      })
    })

    /** AC-65.16.2: formats percentage with 2 decimals */
    it('formats percentage with 2 decimal places', async () => {
      const user = userEvent.setup()
      // 3200 / 20000 = 16.00%
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText(/16[,.]00\s?%/)).toBeInTheDocument()
      })
    })

    /** AC-65.16.1: formats absolute value as currency */
    it('formats absolute value as currency', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        // 15000 formatted as currency (Russian locale)
        expect(screen.getByText(/15\s?000/)).toBeInTheDocument()
      })
    })

    it('handles zero parentTotal by showing dash for percentage', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={0} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        // When parentTotal is 0, percentage should show dash
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })

    /** AC-65.16.1: separator between absolute and percentage */
    it('shows separator "/" between absolute value and percentage', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip.textContent).toMatch(/\//)
      })
    })
  })

  describe('interaction', () => {
    it('tooltip opens on hover', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('tooltip opens on keyboard focus', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      // Tab to focus the trigger
      await user.tab()

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('tooltip closes on Escape', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      })
    })
  })

  describe('ordering and rendering', () => {
    /** AC-65.16.4: subcategories render in correct order */
    it('renders subcategories in provided order', async () => {
      const user = userEvent.setup()
      const items = createSubcategories(5)
      renderWithProviders(<SubcategoryTooltip subcategories={items} parentTotal={parentTotal} />)

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        const text = tooltip.textContent ?? ''
        const idx1 = text.indexOf('Комиссия за продажу')
        const idx2 = text.indexOf('Эквайринг')
        const idx3 = text.indexOf('Программа лояльности')
        const idx4 = text.indexOf('Штрафы')
        const idx5 = text.indexOf('Услуги WB')

        expect(idx1).toBeLessThan(idx2)
        expect(idx2).toBeLessThan(idx3)
        expect(idx3).toBeLessThan(idx4)
        expect(idx4).toBeLessThan(idx5)
      })
    })
  })

  describe('accessibility', () => {
    /** AC-65.16.6: screen reader reads "value, percentage of total" not "value slash percentage" */
    it('separator is not exposed as separate element to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      await user.hover(trigger)

      await waitFor(() => {
        // The separator "/" should be combined with primary/secondary in one
        // element so screen readers don't read it as a separate item.
        // The slash should be inside a span with aria-hidden or
        // the entire "value / percentage" should be in one semantic element.
        const tooltip = screen.getByRole('tooltip')
        // Verify no standalone "/" aria element
        const allText = tooltip.querySelectorAll('[role="separator"]')
        expect(allText.length).toBe(0)
      })
    })

    it('trigger button has descriptive aria-label', () => {
      renderWithProviders(
        <SubcategoryTooltip subcategories={defaultSubcategories} parentTotal={parentTotal} />
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('aria-label')
    })
  })
})
