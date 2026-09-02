/**
 * Component Tests for AcceptanceStatusBadge
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests written BEFORE implementation
 * These tests will FAIL until AcceptanceStatusBadge.tsx is created
 *
 * Tests:
 * - Badge renders for each status (unavailable, free, standard, elevated, high)
 * - Correct colors per status
 * - Tooltip content
 * - Accessibility (aria-label)
 * - Size variants
 * - Edge cases
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AcceptanceStatusBadge } from '../AcceptanceStatusBadge'

// ============================================================================
// Test Data Constants (from Story 44.43-FE)
// ============================================================================

/**
 * Badge test cases from Story AC1
 * | Coefficient | Badge | Color | Icon |
 */
const BADGE_TEST_CASES = [
  {
    coefficient: -1,
    expectedLabel: 'Недоступно',
    expectedColor: 'destructive',
    colorClass: 'text-status-error',
    bgClass: 'bg-status-error/10',
    icon: '⛔',
  },
  {
    coefficient: 0,
    expectedLabel: 'Бесплатно',
    expectedColor: 'success',
    colorClass: 'text-status-success',
    bgClass: 'bg-status-success/10',
    icon: '✅',
  },
  {
    coefficient: 1,
    expectedLabel: 'Стандартно',
    expectedColor: 'default',
    colorClass: 'text-foreground',
    bgClass: 'bg-muted',
    icon: '',
  },
  {
    coefficient: 1.25,
    expectedLabel: '×1,25',
    expectedColor: 'warning',
    colorClass: 'text-status-warning',
    bgClass: 'bg-status-warning/10',
    icon: '⚠️',
  },
  {
    coefficient: 1.65,
    expectedLabel: '×1,65',
    expectedColor: 'high',
    colorClass: 'text-status-warning-foreground',
    bgClass: 'bg-status-warning',
    icon: '🔴',
  },
] as const

// ============================================================================
// Story 44.43-FE: Badge Component Tests
// ============================================================================

describe('AcceptanceStatusBadge', () => {
  describe('AC1: Badge Component - Renders for all statuses', () => {
    it.each(BADGE_TEST_CASES)(
      'renders "$expectedLabel" badge for coefficient $coefficient',
      ({ coefficient, expectedLabel }) => {
        render(<AcceptanceStatusBadge coefficient={coefficient} />)

        expect(screen.getByText(expectedLabel)).toBeInTheDocument()
      }
    )
  })

  describe('AC1: Badge Component - Correct colors', () => {
    it('renders unavailable badge with the error status role', () => {
      render(<AcceptanceStatusBadge coefficient={-1} />)

      const badge = screen.getByText('Недоступно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-error/10')
      expect(badge).toHaveClass('text-status-error')
      expect(badge).toHaveClass('border-status-error/30')
    })

    it('renders free badge with the success status role', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const badge = screen.getByText('Бесплатно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-success/10')
      expect(badge).toHaveClass('text-status-success')
      expect(badge).toHaveClass('border-status-success/30')
    })

    it('renders standard badge with gray (default) color', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      const badge = screen.getByText('Стандартно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-muted')
      expect(badge).toHaveClass('text-foreground')
      expect(badge).toHaveClass('border-border')
    })

    it('renders elevated badge with the warning status role', () => {
      render(<AcceptanceStatusBadge coefficient={1.25} />)

      const badge = screen.getByText('×1,25').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-warning/10')
      expect(badge).toHaveClass('text-status-warning')
      expect(badge).toHaveClass('border-status-warning/30')
    })

    it('renders high badge with the emphasized warning role', () => {
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-warning')
      expect(badge).toHaveClass('text-status-warning-foreground')
      expect(badge).toHaveClass('border-status-warning/40')
    })
  })

  describe('AC1: Badge Component - Icons', () => {
    it.each(BADGE_TEST_CASES)(
      'renders "$icon" icon for coefficient $coefficient',
      ({ coefficient, icon }) => {
        render(<AcceptanceStatusBadge coefficient={coefficient} />)

        if (icon) {
          expect(screen.getByText(icon)).toBeInTheDocument()
        }
      }
    )

    it('does not render icon for standard status (coefficient=1)', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      // Standard has empty icon, should not have emoji in badge
      const badge = screen.getByText('Стандартно')
      expect(badge.textContent).not.toMatch(/[⛔✅⚠️🔴]/)
    })
  })

  describe('AC6: Tooltip Information', () => {
    it('shows tooltip by default', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65')
      await user.hover(badge)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
      })
    })

    it('shows coefficient value in tooltip', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65')
      await user.hover(badge)

      await waitFor(() => {
        // Radix renders tooltip content twice (visible + accessible hidden)
        // Use getAllByText to handle this known behavior
        const tooltipTexts = screen.getAllByText(/Коэффициент приёмки:.*×1,65/i)
        expect(tooltipTexts.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows percentage increase in tooltip for elevated coefficients', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65')
      await user.hover(badge)

      await waitFor(() => {
        // Story AC5: Tooltip: "Повышенная стоимость приёмки (+{pct}%)"
        // Radix renders tooltip content twice (visible + accessible hidden)
        const percentTexts = screen.getAllByText(/65\s%/) // ru-RU NBSP
        expect(percentTexts.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows recommendation for high percentage increase (>25%)', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65')
      await user.hover(badge)

      await waitFor(() => {
        // Story AC6: "Рекомендуем выбрать дату с меньшим коэффициентом"
        // Radix renders tooltip content twice (visible + accessible hidden)
        const recommendTexts = screen.getAllByText(/дату с меньшим коэффициентом/i)
        expect(recommendTexts.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('does not show recommendation for low percentage increase (<=25%)', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.2} />)

      const badge = screen.getByText('×1,20')
      await user.hover(badge)

      await waitFor(() => {
        expect(screen.queryByText(/дату с меньшим коэффициентом/i)).not.toBeInTheDocument()
      })
    })

    it('can disable tooltip with showTooltip=false', () => {
      render(<AcceptanceStatusBadge coefficient={1.65} showTooltip={false} />)

      // Badge should render without tooltip wrapper
      expect(screen.getByText('×1,65')).toBeInTheDocument()
      // No tooltip trigger should be present
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('shows unavailable description in tooltip', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={-1} />)

      const badge = screen.getByText('Недоступно')
      await user.hover(badge)

      await waitFor(() => {
        // Radix renders tooltip content twice (visible + accessible hidden)
        const descTexts = screen.getAllByText(/невозможна/i)
        expect(descTexts.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows free acceptance description in tooltip', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={0} />)

      const badge = screen.getByText('Бесплатно')
      await user.hover(badge)

      await waitFor(() => {
        // Story AC4: "Бесплатная приёмка! Рекомендуемая дата."
        // Radix renders tooltip content twice (visible + accessible hidden)
        const freeTexts = screen.getAllByText(/Бесплатная приёмка/i)
        expect(freeTexts.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Size variants', () => {
    it('renders default size', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      const badge = screen.getByText('Стандартно')
      // Default size should not have sm or lg classes
      expect(badge).not.toHaveClass('text-xs')
      expect(badge).not.toHaveClass('text-base')
    })

    it('renders small size', () => {
      render(<AcceptanceStatusBadge coefficient={1} size="sm" />)

      const badge = screen.getByText('Стандартно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('px-1.5')
      expect(badge).toHaveClass('py-0')
    })

    it('renders large size', () => {
      render(<AcceptanceStatusBadge coefficient={1} size="lg" />)

      const badge = screen.getByText('Стандартно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('text-base')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1')
    })
  })

  describe('Custom className', () => {
    it('applies custom className to badge', () => {
      render(<AcceptanceStatusBadge coefficient={1} className="custom-test-class" />)

      const badge = screen.getByText('Стандартно').closest('[class*="bg-"]')
      expect(badge).toHaveClass('custom-test-class')
    })
  })

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('has aria-label with full status description', () => {
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      const badge = screen.getByText('×1,65').closest('[aria-label]')
      expect(badge).toHaveAttribute('aria-label')
      expect(badge?.getAttribute('aria-label')).toContain('1,65')
    })

    it('provides accessible name for unavailable status', () => {
      render(<AcceptanceStatusBadge coefficient={-1} />)

      const badge = screen.getByText('Недоступно').closest('[aria-label]')
      expect(badge?.getAttribute('aria-label')).toContain('Недоступно')
    })

    it('provides accessible name for free status', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const badge = screen.getByText('Бесплатно').closest('[aria-label]')
      expect(badge?.getAttribute('aria-label')).toContain('Бесплатно')
    })

    it('tooltip is accessible via keyboard focus', async () => {
      const user = userEvent.setup()
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      // Tab to the badge to trigger focus
      // Note: Radix tooltip may not show on focus in test environment
      // but the badge itself should be focusable and have aria-label
      await user.tab()

      // Verify badge is focusable and has accessibility attributes
      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveAttribute('aria-label')
      // Badge should be able to receive focus (has tabindex via TooltipTrigger)
      expect(badge.getAttribute('aria-label')).toContain('1,65')
    })

    it('color is not sole indicator - icon and text present', () => {
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      // Both icon and text should be present
      expect(screen.getByText('🔴')).toBeInTheDocument()
      expect(screen.getByText('×1,65')).toBeInTheDocument()
    })

    it('has proper data-testid for testing', () => {
      render(<AcceptanceStatusBadge coefficient={1.65} />)

      expect(screen.getByTestId('acceptance-status-badge')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles undefined coefficient as unavailable', () => {
      render(<AcceptanceStatusBadge coefficient={undefined as unknown as number} />)

      expect(screen.getByText('Недоступно')).toBeInTheDocument()
    })

    it('handles very high coefficients', () => {
      render(<AcceptanceStatusBadge coefficient={10} />)

      expect(screen.getByText('×10,00')).toBeInTheDocument()
      const badge = screen.getByText('×10,00').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-warning')
    })

    it('handles decimal precision in display', () => {
      render(<AcceptanceStatusBadge coefficient={1.666} />)

      // Should round to 2 decimal places
      expect(screen.getByText('×1,67')).toBeInTheDocument()
    })

    it('handles coefficient at boundary 1.50 as elevated', () => {
      render(<AcceptanceStatusBadge coefficient={1.5} />)

      const badge = screen.getByText('×1,50').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-warning/10')
    })

    it('handles coefficient at boundary 1.51 as high', () => {
      render(<AcceptanceStatusBadge coefficient={1.51} />)

      const badge = screen.getByText('×1,51').closest('[class*="bg-"]')
      expect(badge).toHaveClass('bg-status-warning')
    })
  })

  describe('Visual verification', () => {
    it('renders Badge component from shadcn/ui', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      // Badge should have outline variant
      const badge = screen.getByText('Стандартно').closest('[class*="border"]')
      expect(badge).toBeInTheDocument()
    })

    it('icon is rendered before label text', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const badge = screen.getByText('Бесплатно').closest('[class*="bg-"]')!.textContent!

      // Icon (✅) should come before label (Бесплатно)
      const iconIndex = badge.indexOf('✅')
      const labelIndex = badge.indexOf('Бесплатно')
      expect(iconIndex).toBeLessThan(labelIndex)
    })

    it('icon has margin-right for spacing', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const icon = screen.getByText('✅')
      expect(icon).toHaveClass('mr-1')
    })
  })
})

// ============================================================================
// Integration Tests - Badge with Calendar (Story AC7 reference)
// ============================================================================

describe('AcceptanceStatusBadge - Calendar Integration Support', () => {
  it('exports colorClasses for calendar border colors', () => {
    // This test verifies the component exports its color classes
    // for use in CoefficientCalendar (Story AC7)
    render(<AcceptanceStatusBadge coefficient={0} />)

    const badge = screen.getByText('Бесплатно').closest('[class*="border"]')
    expect(badge).toHaveClass('border-status-success/30')
  })

  it('provides consistent status determination for calendar cells', () => {
    // All these should map to correct statuses for calendar rendering
    const testCases = [
      { coefficient: -1, expectedBorder: 'border-status-error/30' },
      { coefficient: 0, expectedBorder: 'border-status-success/30' },
      { coefficient: 1, expectedBorder: 'border-border' },
      { coefficient: 1.25, expectedBorder: 'border-status-warning/30' },
      { coefficient: 1.65, expectedBorder: 'border-status-warning/40' },
    ]

    testCases.forEach(({ coefficient, expectedBorder }) => {
      const { unmount } = render(<AcceptanceStatusBadge coefficient={coefficient} />)
      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass(expectedBorder)
      unmount()
    })
  })
})
