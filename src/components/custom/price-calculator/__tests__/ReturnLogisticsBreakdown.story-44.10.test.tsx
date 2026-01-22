/**
 * TDD Component Tests for ReturnLogisticsBreakdown
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD RED Phase - These tests define expected behavior from story specification.
 * Tests should FAIL until component implementation matches story requirements.
 *
 * Component: ReturnLogisticsBreakdown
 * - Collapsible breakdown display for return logistics calculation
 * - Shows base return, buyback percentage, return rate, effective return
 * - Formats values for Russian locale display
 *
 * @see docs/stories/epic-44/story-44.10-fe-return-logistics-calculation.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReturnLogisticsBreakdown } from '../ReturnLogisticsBreakdown'
import type { ReturnLogisticsResult } from '@/lib/return-logistics-utils'

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Standard test result for 98% buyback scenario
 * Forward logistics: 72.50 ₽
 * Buyback: 98%
 * Return rate: 2%
 * Effective return: 1.45 ₽
 */
const standardResult: ReturnLogisticsResult = {
  baseReturn: 72.5,
  effectiveReturn: 1.45,
  buybackPct: 98,
  returnRatePct: 2,
  breakdown: {
    baseReturnDisplay: '72,50 ₽',
    buybackDisplay: '98%',
    returnRateDisplay: '2%',
    effectiveReturnDisplay: '1,45 ₽',
  },
}

/**
 * 100% buyback result (no returns)
 */
const fullBuybackResult: ReturnLogisticsResult = {
  baseReturn: 72.5,
  effectiveReturn: 0,
  buybackPct: 100,
  returnRatePct: 0,
  breakdown: {
    baseReturnDisplay: '72,50 ₽',
    buybackDisplay: '100%',
    returnRateDisplay: '0%',
    effectiveReturnDisplay: '0,00 ₽',
  },
}

/**
 * 0% buyback result (all returns)
 */
const noBuybackResult: ReturnLogisticsResult = {
  baseReturn: 72.5,
  effectiveReturn: 72.5,
  buybackPct: 0,
  returnRatePct: 100,
  breakdown: {
    baseReturnDisplay: '72,50 ₽',
    buybackDisplay: '0%',
    returnRateDisplay: '100%',
    effectiveReturnDisplay: '72,50 ₽',
  },
}

function renderComponent(result: ReturnLogisticsResult = standardResult) {
  return render(<ReturnLogisticsBreakdown result={result} />)
}

// ============================================================================
// Story 44.10: AC3 - Breakdown Display
// ============================================================================

describe('Story 44.10: ReturnLogisticsBreakdown - Collapsible Behavior', () => {
  it('should be collapsed by default', () => {
    renderComponent()

    // Content should not be visible initially
    expect(screen.queryByText('72,50 ₽')).not.toBeInTheDocument()
  })

  it('should show trigger text "Показать расчёт"', () => {
    renderComponent()

    expect(screen.getByText(/показать расчёт/i)).toBeInTheDocument()
  })

  it('should expand on click', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/показать расчёт/i)
    await user.click(trigger)

    await waitFor(() => {
      // Content should be visible after clicking
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
    })
  })

  it('should collapse on second click', async () => {
    const user = userEvent.setup()
    renderComponent()

    const trigger = screen.getByText(/показать расчёт/i)

    // Expand
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
    })

    // Collapse
    await user.click(trigger)
    await waitFor(() => {
      expect(screen.queryByText(/базовая обратная логистика/i)).not.toBeInTheDocument()
    })
  })

  it('should have chevron icon that rotates on expand', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent()

    const trigger = screen.getByText(/показать расчёт/i)

    // Before click - chevron should not be rotated
    const chevron = container.querySelector('svg')
    expect(chevron).toBeInTheDocument()
    expect(chevron).not.toHaveClass('rotate-90')

    // After click - chevron should be rotated
    await user.click(trigger)
    await waitFor(() => {
      expect(chevron).toHaveClass('rotate-90')
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Content Display', () => {
  it('should show base return value when expanded', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
      expect(screen.getByText('72,50 ₽')).toBeInTheDocument()
    })
  })

  it('should show buyback percentage when expanded', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText(/buyback.*выкуп/i)).toBeInTheDocument()
      expect(screen.getByText('98%')).toBeInTheDocument()
    })
  })

  it('should show return rate percentage when expanded', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText(/процент возврата/i)).toBeInTheDocument()
      expect(screen.getByText('2%')).toBeInTheDocument()
    })
  })

  it('should show effective return prominently when expanded', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText(/эффективная обратная/i)).toBeInTheDocument()
      expect(screen.getByText('1,45 ₽')).toBeInTheDocument()
    })
  })

  it('should have separator before effective return', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Should have a separator (border-t or hr element)
      const separator = container.querySelector('.border-t, hr, [class*="separator"]')
      expect(separator).toBeInTheDocument()
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Currency Formatting', () => {
  it('should format currency values in Russian locale', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Russian format uses comma as decimal separator
      expect(screen.getByText('72,50 ₽')).toBeInTheDocument()
      expect(screen.getByText('1,45 ₽')).toBeInTheDocument()
    })
  })

  it('should display ₽ symbol for all currency values', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      const rubleSymbols = screen.getAllByText(/₽/)
      // At least 2 currency values (base return, effective return)
      expect(rubleSymbols.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('should show 0,00 ₽ for zero effective return', async () => {
    const user = userEvent.setup()
    renderComponent(fullBuybackResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText('0,00 ₽')).toBeInTheDocument()
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Edge Cases', () => {
  it('should display 100% buyback correctly', async () => {
    const user = userEvent.setup()
    renderComponent(fullBuybackResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument() // return rate
    })
  })

  it('should display 0% buyback correctly', async () => {
    const user = userEvent.setup()
    renderComponent(noBuybackResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument() // return rate
    })
  })

  it('should handle large values', async () => {
    const user = userEvent.setup()
    const largeResult: ReturnLogisticsResult = {
      baseReturn: 9999.99,
      effectiveReturn: 199.99,
      buybackPct: 98,
      returnRatePct: 2,
      breakdown: {
        baseReturnDisplay: '9 999,99 ₽',
        buybackDisplay: '98%',
        returnRateDisplay: '2%',
        effectiveReturnDisplay: '199,99 ₽',
      },
    }

    renderComponent(largeResult)
    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Should display formatted large number
      expect(screen.getByText(/9.*999.*99.*₽/)).toBeInTheDocument()
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Styling', () => {
  it('should have left border for visual structure', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      const content = container.querySelector('.border-l-2, [class*="border-l"]')
      expect(content).toBeInTheDocument()
    })
  })

  it('should have muted color for labels', async () => {
    const user = userEvent.setup()
    renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      const label = screen.getByText(/базовая обратная логистика/i)
      expect(label).toHaveClass('text-muted-foreground')
    })
  })

  it('should have primary color for effective return value', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // The effective return value should have primary color class
      const effectiveValue = container.querySelector('.text-primary')
      expect(effectiveValue).toBeInTheDocument()
      expect(effectiveValue).toHaveTextContent('1,45 ₽')
    })
  })

  it('should have font-medium for effective return row', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      const effectiveRow = container.querySelector('.font-medium')
      expect(effectiveRow).toBeInTheDocument()
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Accessibility', () => {
  it('should have accessible trigger button', () => {
    renderComponent()

    const trigger = screen.getByText(/показать расчёт/i)
    expect(trigger).toBeVisible()
  })

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Find the CollapsibleTrigger button (parent of the span)
    const triggerButton = screen.getByRole('button', { name: /показать расчёт/i })
    triggerButton.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
    })
  })

  it('should support Space key to toggle', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Find the CollapsibleTrigger button (parent of the span)
    const triggerButton = screen.getByRole('button', { name: /показать расчёт/i })
    triggerButton.focus()
    await user.keyboard(' ')

    await waitFor(() => {
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
    })
  })

  it('should have proper heading structure for breakdown items', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Labels should be readable and descriptive
      expect(screen.getByText(/базовая обратная логистика/i)).toBeInTheDocument()
      expect(screen.getByText(/buyback.*выкуп/i)).toBeInTheDocument()
      expect(screen.getByText(/процент возврата/i)).toBeInTheDocument()
      expect(screen.getByText(/эффективная обратная/i)).toBeInTheDocument()
    })
  })

  it('should have sufficient color contrast for text', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Text should not have low contrast classes
      const label = screen.getByText(/базовая обратная логистика/i)
      expect(label).not.toHaveClass('text-gray-300')
      expect(label).not.toHaveClass('text-gray-200')
    })
  })
})

describe('Story 44.10: ReturnLogisticsBreakdown - Layout', () => {
  it('should display labels and values in flex layout', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Each row should have justify-between for label-value layout
      const rows = container.querySelectorAll('.flex.justify-between')
      expect(rows.length).toBeGreaterThanOrEqual(4) // 4 breakdown rows
    })
  })

  it('should have proper spacing between rows', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Content should have space-y class for vertical spacing
      const content = container.querySelector('.space-y-1, [class*="space-y"]')
      expect(content).toBeInTheDocument()
    })
  })

  it('should have padding for content area', async () => {
    const user = userEvent.setup()
    const { container } = renderComponent(standardResult)

    await user.click(screen.getByText(/показать расчёт/i))

    await waitFor(() => {
      // Content should have left padding (pl-4 or similar)
      const content = container.querySelector('.pl-4, [class*="pl-"]')
      expect(content).toBeInTheDocument()
    })
  })
})
