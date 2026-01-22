/**
 * TDD Tests for CoefficientDisplay Component
 * Story 44.9-FE: Logistics Coefficients UI
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests for CoefficientDisplay component
 * These tests should FAIL initially until implementation is complete.
 *
 * Tests cover:
 * - AC2: Coefficient Value Display
 *   - Display current coefficient value with 2 decimal places
 *   - Status badge (Базовый/Повышенный/Высокий/Пиковый)
 *   - Tooltip explaining coefficient impact
 * - AC5: Auto-fill badge display
 * - Effective date display
 *
 * Reference: docs/stories/epic-44/story-44.9-fe-logistics-coefficients-ui.md
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoefficientDisplay } from '../CoefficientDisplay'

// =============================================================================
// Test Setup
// =============================================================================

const defaultProps = {
  coefficient: 1.25,
  source: 'auto' as const,
}

function renderComponent(props = {}) {
  return render(<CoefficientDisplay {...defaultProps} {...props} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// AC2: Coefficient Value Display
// =============================================================================

describe('AC2: Coefficient Value Display', () => {
  describe('coefficient formatting', () => {
    it('displays coefficient with 2 decimal places (1.25)', () => {
      renderComponent({ coefficient: 1.25 })
      expect(screen.getByText('1.25')).toBeInTheDocument()
    })

    it('displays coefficient 1.00 correctly', () => {
      renderComponent({ coefficient: 1.0 })
      expect(screen.getByText('1.00')).toBeInTheDocument()
    })

    it('displays coefficient 1.50 correctly', () => {
      renderComponent({ coefficient: 1.5 })
      expect(screen.getByText('1.50')).toBeInTheDocument()
    })

    it('displays coefficient 2.00 correctly', () => {
      renderComponent({ coefficient: 2.0 })
      expect(screen.getByText('2.00')).toBeInTheDocument()
    })

    it('displays high coefficient 3.50 correctly', () => {
      renderComponent({ coefficient: 3.5 })
      expect(screen.getByText('3.50')).toBeInTheDocument()
    })
  })

  describe('status badge - base (green)', () => {
    it('shows "Базовый" badge for coefficient 1.00', () => {
      renderComponent({ coefficient: 1.0 })
      const badge = screen.getByText('Базовый')
      expect(badge).toBeInTheDocument()
    })

    it('applies green styling to base badge', () => {
      renderComponent({ coefficient: 1.0 })
      const badge = screen.getByText('Базовый')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-700')
    })

    it('shows base status for coefficient 0.9 (below 1.0)', () => {
      renderComponent({ coefficient: 0.9 })
      expect(screen.getByText('Базовый')).toBeInTheDocument()
    })
  })

  describe('status badge - elevated (yellow)', () => {
    it('shows "Повышенный" badge for coefficient 1.25', () => {
      renderComponent({ coefficient: 1.25 })
      const badge = screen.getByText('Повышенный')
      expect(badge).toBeInTheDocument()
    })

    it('applies yellow styling to elevated badge', () => {
      renderComponent({ coefficient: 1.25 })
      const badge = screen.getByText('Повышенный')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-700')
    })

    it('shows elevated status for coefficient 1.01 (just above base)', () => {
      renderComponent({ coefficient: 1.01 })
      expect(screen.getByText('Повышенный')).toBeInTheDocument()
    })

    it('shows elevated status for coefficient 1.50 (upper boundary)', () => {
      renderComponent({ coefficient: 1.5 })
      expect(screen.getByText('Повышенный')).toBeInTheDocument()
    })
  })

  describe('status badge - high (orange)', () => {
    it('shows "Высокий" badge for coefficient 1.75', () => {
      renderComponent({ coefficient: 1.75 })
      const badge = screen.getByText('Высокий')
      expect(badge).toBeInTheDocument()
    })

    it('applies orange styling to high badge', () => {
      renderComponent({ coefficient: 1.75 })
      const badge = screen.getByText('Высокий')
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-700')
    })

    it('shows high status for coefficient 1.51 (just above elevated)', () => {
      renderComponent({ coefficient: 1.51 })
      expect(screen.getByText('Высокий')).toBeInTheDocument()
    })

    it('shows high status for coefficient 2.00 (upper boundary)', () => {
      renderComponent({ coefficient: 2.0 })
      expect(screen.getByText('Высокий')).toBeInTheDocument()
    })
  })

  describe('status badge - peak (red)', () => {
    it('shows "Пиковый" badge for coefficient 2.50', () => {
      renderComponent({ coefficient: 2.5 })
      const badge = screen.getByText('Пиковый')
      expect(badge).toBeInTheDocument()
    })

    it('applies red styling to peak badge', () => {
      renderComponent({ coefficient: 2.5 })
      const badge = screen.getByText('Пиковый')
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-700')
    })

    it('shows peak status for coefficient 2.01 (just above high)', () => {
      renderComponent({ coefficient: 2.01 })
      expect(screen.getByText('Пиковый')).toBeInTheDocument()
    })

    it('shows peak status for coefficient 5.00 (extreme)', () => {
      renderComponent({ coefficient: 5.0 })
      expect(screen.getByText('Пиковый')).toBeInTheDocument()
    })
  })

  describe('status badge - unavailable (gray)', () => {
    it('shows "Недоступно" badge for coefficient 0', () => {
      renderComponent({ coefficient: 0 })
      const badge = screen.getByText('Недоступно')
      expect(badge).toBeInTheDocument()
    })

    it('applies gray styling to unavailable badge', () => {
      renderComponent({ coefficient: 0 })
      const badge = screen.getByText('Недоступно')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-400')
    })

    it('shows unavailable status for negative coefficient', () => {
      renderComponent({ coefficient: -1 })
      expect(screen.getByText('Недоступно')).toBeInTheDocument()
    })
  })

  describe('tooltip', () => {
    it('has info icon for tooltip trigger', () => {
      const { container } = renderComponent()
      const infoIcon = container.querySelector('[class*="cursor-help"]')
      expect(infoIcon).toBeInTheDocument()
    })

    it('shows tooltip on hover with coefficient explanation', async () => {
      const user = userEvent.setup()
      const { container } = renderComponent()

      const tooltipTrigger = container.querySelector('[class*="cursor-help"]')
      if (tooltipTrigger) {
        await user.hover(tooltipTrigger)
      }

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip).toBeInTheDocument()
        expect(tooltip.textContent).toContain('Коэффициент логистики')
      })
    })

    it('tooltip explains warehouse-specific variation', async () => {
      const user = userEvent.setup()
      const { container } = renderComponent()

      const tooltipTrigger = container.querySelector('[class*="cursor-help"]')
      if (tooltipTrigger) {
        await user.hover(tooltipTrigger)
      }

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip.textContent).toMatch(/загруженност|склад|нагрузк/i)
      })
    })
  })
})

// =============================================================================
// AC5: Auto-fill Badge Integration
// =============================================================================

describe('AC5: Auto-fill Badge', () => {
  it('shows "Автозаполнено" badge when source is auto', () => {
    renderComponent({ source: 'auto' })
    expect(screen.getByText('Автозаполнено')).toBeInTheDocument()
  })

  it('shows "Вручную" badge when source is manual', () => {
    renderComponent({ source: 'manual' })
    expect(screen.getByText('Вручную')).toBeInTheDocument()
  })

  it('auto badge has green styling', () => {
    renderComponent({ source: 'auto' })
    const badge = screen.getByText('Автозаполнено')
    expect(badge).toHaveClass('bg-green-50')
    expect(badge).toHaveClass('text-green-700')
  })

  it('manual badge has yellow/amber styling', () => {
    renderComponent({ source: 'manual' })
    const badge = screen.getByText('Вручную')
    expect(badge.className).toMatch(/yellow|amber/)
  })
})

// =============================================================================
// Effective Date Display
// =============================================================================

describe('Effective Date Display', () => {
  it('shows effective date when provided', () => {
    renderComponent({ effectiveDate: '2026-01-20' })
    expect(screen.getByText(/Действует с:/)).toBeInTheDocument()
  })

  it('formats date in Russian locale', () => {
    renderComponent({ effectiveDate: '2026-01-20' })
    // Should show formatted date like "20.01.2026" or "20 января 2026"
    const dateText = screen.getByText(/Действует с:/)
    expect(dateText.textContent).toMatch(/20.*01.*2026|20.*янв/)
  })

  it('does not show date section when effectiveDate is not provided', () => {
    renderComponent({ effectiveDate: undefined })
    expect(screen.queryByText(/Действует с:/)).not.toBeInTheDocument()
  })

  it('handles empty string effectiveDate', () => {
    renderComponent({ effectiveDate: '' })
    expect(screen.queryByText(/Действует с:/)).not.toBeInTheDocument()
  })
})

// =============================================================================
// Layout and Styling
// =============================================================================

describe('Layout and Styling', () => {
  it('displays coefficient and status badge inline', () => {
    const { container } = renderComponent()
    const wrapper = container.querySelector('.flex')
    expect(wrapper).toBeInTheDocument()
  })

  it('has proper spacing between elements', () => {
    const { container } = renderComponent()
    const wrapper = container.querySelector('.gap-2')
    expect(wrapper).toBeInTheDocument()
  })

  it('coefficient value has font-medium weight', () => {
    renderComponent()
    const coefficientValue = screen.getByText('1.25')
    expect(coefficientValue).toHaveClass('font-medium')
  })

  it('effective date has muted text color', () => {
    renderComponent({ effectiveDate: '2026-01-20' })
    const dateElement = screen.getByText(/Действует с:/)
    expect(dateElement).toHaveClass('text-muted-foreground')
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('handles coefficient of exactly 0', () => {
    renderComponent({ coefficient: 0 })
    expect(screen.getByText('0.00')).toBeInTheDocument()
    expect(screen.getByText('Недоступно')).toBeInTheDocument()
  })

  it('handles very high coefficient (10.0)', () => {
    renderComponent({ coefficient: 10.0 })
    expect(screen.getByText('10.00')).toBeInTheDocument()
    expect(screen.getByText('Пиковый')).toBeInTheDocument()
  })

  it('handles fractional coefficient (1.333)', () => {
    renderComponent({ coefficient: 1.333 })
    expect(screen.getByText('1.33')).toBeInTheDocument()
  })

  it('handles boundary coefficient 1.0 as base', () => {
    renderComponent({ coefficient: 1.0 })
    expect(screen.getByText('Базовый')).toBeInTheDocument()
  })

  it('handles boundary coefficient 1.5 as elevated', () => {
    renderComponent({ coefficient: 1.5 })
    expect(screen.getByText('Повышенный')).toBeInTheDocument()
  })

  it('handles boundary coefficient 2.0 as high', () => {
    renderComponent({ coefficient: 2.0 })
    expect(screen.getByText('Высокий')).toBeInTheDocument()
  })
})

// =============================================================================
// Accessibility (WCAG 2.1 AA)
// =============================================================================

describe('Accessibility', () => {
  it('status badges communicate status via text, not just color', () => {
    renderComponent({ coefficient: 1.25 })
    // Status should be communicated via text label "Повышенный"
    expect(screen.getByText('Повышенный')).toBeInTheDocument()
  })

  it('info icon has accessible cursor style', () => {
    const { container } = renderComponent()
    const infoIcon = container.querySelector('[class*="cursor-help"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it('coefficient value is readable by screen readers', () => {
    renderComponent({ coefficient: 1.25 })
    const value = screen.getByText('1.25')
    expect(value).toBeInTheDocument()
    // Should not be hidden from screen readers
    expect(value).not.toHaveAttribute('aria-hidden', 'true')
  })

  it('badges have sufficient color contrast', () => {
    renderComponent({ coefficient: 1.0 })
    const badge = screen.getByText('Базовый')
    // Green-100 background with green-700 text should have >=4.5:1 ratio
    expect(badge).toHaveClass('text-green-700')
  })

  it('effective date text is readable', () => {
    renderComponent({ effectiveDate: '2026-01-20' })
    const dateElement = screen.getByText(/Действует с:/)
    expect(dateElement).toBeVisible()
  })
})

// =============================================================================
// Props Validation
// =============================================================================

describe('Props Validation', () => {
  it('renders with minimum required props', () => {
    render(<CoefficientDisplay coefficient={1.0} source="auto" />)
    expect(screen.getByText('1.00')).toBeInTheDocument()
  })

  it('handles all optional props together', () => {
    render(
      <CoefficientDisplay
        coefficient={1.25}
        source="auto"
        effectiveDate="2026-01-20"
      />
    )
    expect(screen.getByText('1.25')).toBeInTheDocument()
    expect(screen.getByText('Автозаполнено')).toBeInTheDocument()
    expect(screen.getByText(/Действует с:/)).toBeInTheDocument()
  })
})
