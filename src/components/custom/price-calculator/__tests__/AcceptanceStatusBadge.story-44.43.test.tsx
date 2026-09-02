/**
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * TDD Tests - Red Phase (Failing Tests)
 *
 * These tests define the expected behavior BEFORE implementation.
 * Run: npm test -- AcceptanceStatusBadge.story-44.43
 *
 * @see docs/stories/epic-44/story-44.43-fe-acceptance-coefficient-badge.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AcceptanceStatusBadge } from '../AcceptanceStatusBadge'

// ============================================================================
// Test Data Constants (from Story 44.43-FE)
// ============================================================================

/**
 * Badge test cases from Story AC1 table
 * | Coefficient | Badge | Color | Icon |
 */
const AC1_BADGE_VARIANTS = [
  {
    coefficient: -1,
    label: 'Недоступно',
    color: 'destructive',
    bgClass: 'bg-status-error/10',
    textClass: 'text-status-error',
    borderClass: 'border-status-error/30',
    icon: '⛔',
    description: 'Приёмка недоступна',
  },
  {
    coefficient: 0,
    label: 'Бесплатно',
    color: 'success',
    bgClass: 'bg-status-success/10',
    textClass: 'text-status-success',
    borderClass: 'border-status-success/30',
    icon: '✅',
    description: 'Приёмка бесплатная',
  },
  {
    coefficient: 1,
    label: 'Стандартно',
    color: 'default',
    bgClass: 'bg-muted',
    textClass: 'text-foreground',
    borderClass: 'border-border',
    icon: '',
    description: 'Стандартная стоимость',
  },
  {
    coefficient: 1.25,
    label: '×1,25',
    color: 'warning',
    bgClass: 'bg-status-warning/10',
    textClass: 'text-status-warning',
    borderClass: 'border-status-warning/30',
    icon: '⚠️',
    description: 'Повышенная стоимость (1.01-1.50)',
  },
  {
    coefficient: 1.65,
    label: '×1,65',
    color: 'high',
    bgClass: 'bg-status-warning',
    textClass: 'text-status-warning-foreground',
    borderClass: 'border-status-warning/40',
    icon: '🔴',
    description: 'Повышенная стоимость (>1.50)',
  },
] as const

// ============================================================================
// AC1: Badge Component Tests
// ============================================================================

describe('Story 44.43: Acceptance Coefficient Status Badge', () => {
  describe('AC1: Badge Component', () => {
    describe('AC1.1: Reusable AcceptanceStatusBadge component', () => {
      it('should render as a Badge component', () => {
        render(<AcceptanceStatusBadge coefficient={1} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge).toBeInTheDocument()
      })

      it('should accept coefficient prop', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        expect(screen.getByText('×1,65')).toBeInTheDocument()
      })
    })

    describe('AC1.2: Badge variants based on coefficient value', () => {
      it.each(AC1_BADGE_VARIANTS)(
        'should render "$label" for coefficient $coefficient',
        ({ coefficient, label }) => {
          render(<AcceptanceStatusBadge coefficient={coefficient} />)

          expect(screen.getByText(label)).toBeInTheDocument()
        }
      )
    })

    describe('AC1.3: Badge colors per status', () => {
      it.each(AC1_BADGE_VARIANTS)(
        'should have $color color classes for coefficient $coefficient',
        ({ coefficient, bgClass, textClass, borderClass }) => {
          render(<AcceptanceStatusBadge coefficient={coefficient} />)

          const badge = screen.getByTestId('acceptance-status-badge')
          expect(badge).toHaveClass(bgClass)
          expect(badge).toHaveClass(textClass)
          expect(badge).toHaveClass(borderClass)
        }
      )
    })

    describe('AC1.4: Badge icons per status', () => {
      it.each(AC1_BADGE_VARIANTS.filter(v => v.icon !== ''))(
        'should render "$icon" icon for coefficient $coefficient',
        ({ coefficient, icon }) => {
          render(<AcceptanceStatusBadge coefficient={coefficient} />)

          expect(screen.getByText(icon)).toBeInTheDocument()
        }
      )

      it('should NOT render icon for standard status (coefficient=1)', () => {
        render(<AcceptanceStatusBadge coefficient={1} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        // Standard has empty icon string
        expect(badge.textContent).toBe('Стандартно')
        expect(badge.textContent).not.toMatch(/[⛔✅⚠️🔴]/)
      })
    })

    describe('AC1.5: Format coefficient as "×1,65" (not "165%")', () => {
      it('should format elevated coefficient as ×{value}', () => {
        render(<AcceptanceStatusBadge coefficient={1.25} />)

        expect(screen.getByText('×1,25')).toBeInTheDocument()
        expect(screen.queryByText('125%')).not.toBeInTheDocument()
      })

      it('should format high coefficient as ×{value}', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        expect(screen.getByText('×1,65')).toBeInTheDocument()
        expect(screen.queryByText('165%')).not.toBeInTheDocument()
      })

      it('should show 2 decimal places for coefficients', () => {
        render(<AcceptanceStatusBadge coefficient={1.5} />)

        expect(screen.getByText('×1,50')).toBeInTheDocument()
      })

      it('should round to 2 decimal places', () => {
        render(<AcceptanceStatusBadge coefficient={1.666} />)

        expect(screen.getByText('×1,67')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // AC3: Unavailable State Handling Tests
  // ============================================================================

  describe('AC3: Unavailable State Handling', () => {
    describe('AC3.1: When coefficient = -1', () => {
      it('should show "Недоступно" badge with the error status role', () => {
        render(<AcceptanceStatusBadge coefficient={-1} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(screen.getByText('Недоступно')).toBeInTheDocument()
        expect(badge).toHaveClass('bg-status-error/10')
        expect(badge).toHaveClass('text-status-error')
      })

      it('should show ⛔ icon for unavailable', () => {
        render(<AcceptanceStatusBadge coefficient={-1} />)

        expect(screen.getByText('⛔')).toBeInTheDocument()
      })
    })

    describe('AC3.2: Tooltip shows unavailability message', () => {
      it('should show unavailable description in tooltip', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={-1} />)

        await user.hover(screen.getByText('Недоступно'))

        await waitFor(() => {
          const tooltipTexts = screen.getAllByText(/невозможна/i)
          expect(tooltipTexts.length).toBeGreaterThanOrEqual(1)
        })
      })
    })
  })

  // ============================================================================
  // AC4: Free Acceptance Highlighting Tests
  // ============================================================================

  describe('AC4: Free Acceptance Highlighting', () => {
    describe('AC4.1: When coefficient = 0', () => {
      it('should show "Бесплатно" badge with the success status role', () => {
        render(<AcceptanceStatusBadge coefficient={0} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(screen.getByText('Бесплатно')).toBeInTheDocument()
        expect(badge).toHaveClass('bg-status-success/10')
        expect(badge).toHaveClass('text-status-success')
      })

      it('should show ✅ icon for free', () => {
        render(<AcceptanceStatusBadge coefficient={0} />)

        expect(screen.getByText('✅')).toBeInTheDocument()
      })
    })

    describe('AC4.2: Show info tip in tooltip', () => {
      it('should show "Бесплатная приёмка! Рекомендуемая дата." in tooltip', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={0} />)

        await user.hover(screen.getByText('Бесплатно'))

        await waitFor(() => {
          const freeTexts = screen.getAllByText(/Бесплатная приёмка/i)
          expect(freeTexts.length).toBeGreaterThanOrEqual(1)
        })
      })
    })
  })

  // ============================================================================
  // AC5: Elevated Cost Warning Tests
  // ============================================================================

  describe('AC5: Elevated Cost Warning', () => {
    describe('AC5.1: When coefficient > 1', () => {
      it('should show multiplier badge "×{value}"', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        expect(screen.getByText('×1,65')).toBeInTheDocument()
      })
    })

    describe('AC5.2: Color based on severity', () => {
      it('should show the warning status role for 1.01-1.25 (mild increase)', () => {
        render(<AcceptanceStatusBadge coefficient={1.15} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge).toHaveClass('bg-status-warning/10')
      })

      it('should show the warning status role for 1.26-1.50 (moderate increase)', () => {
        render(<AcceptanceStatusBadge coefficient={1.4} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge).toHaveClass('bg-status-warning/10')
      })

      it('should show the emphasized warning role for >1.50 (high increase)', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge).toHaveClass('bg-status-warning')
      })
    })

    describe('AC5.3: Tooltip shows percentage increase', () => {
      it('should show percentage in tooltip: "+{pct}%"', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        await user.hover(screen.getByText('×1,65'))

        await waitFor(() => {
          // Story AC5: "Повышенная стоимость приёмки (+{pct}%)"
          const percentTexts = screen.getAllByText(/65\s%/)
          expect(percentTexts.length).toBeGreaterThanOrEqual(1)
        })
      })

      it('should calculate percentage as (coefficient - 1) * 100', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.25} />)

        await user.hover(screen.getByText('×1,25'))

        await waitFor(() => {
          // (1.25 - 1) * 100 = 25%
          const percentTexts = screen.getAllByText(/25\s%/)
          expect(percentTexts.length).toBeGreaterThanOrEqual(1)
        })
      })
    })
  })

  // ============================================================================
  // AC6: Tooltip Information Tests
  // ============================================================================

  describe('AC6: Tooltip Information', () => {
    describe('AC6.1: Badge tooltip shows detailed information', () => {
      it('should show "Коэффициент приёмки: ×{value}" in tooltip', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        await user.hover(screen.getByText('×1,65'))

        await waitFor(() => {
          const titleTexts = screen.getAllByText(/Коэффициент приёмки/)
          expect(titleTexts.length).toBeGreaterThanOrEqual(1)
        })
      })

      it('should show percentage increase info for elevated', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        await user.hover(screen.getByText('×1,65'))

        await waitFor(() => {
          // Story AC6: "Стоимость увеличена на 65%"
          const increaseTexts = screen.getAllByText(/65\s%/)
          expect(increaseTexts.length).toBeGreaterThanOrEqual(1)
        })
      })
    })

    describe('AC6.2: Recommendation for high coefficients (>25%)', () => {
      it('should show recommendation when percentage > 25%', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        await user.hover(screen.getByText('×1,65'))

        await waitFor(() => {
          // Story AC6: "Рекомендация: выберите дату с меньшим коэффициентом"
          const recTexts = screen.getAllByText(/дату с меньшим коэффициентом/i)
          expect(recTexts.length).toBeGreaterThanOrEqual(1)
        })
      })

      it('should NOT show recommendation when percentage <= 25%', async () => {
        const user = userEvent.setup()
        render(<AcceptanceStatusBadge coefficient={1.2} />)

        await user.hover(screen.getByText('×1,20'))

        await waitFor(() => {
          expect(screen.queryByText(/дату с меньшим коэффициентом/i)).not.toBeInTheDocument()
        })
      })
    })

    describe('AC6.3: Tooltip can be disabled', () => {
      it('should not show tooltip when showTooltip=false', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} showTooltip={false} />)

        expect(screen.getByText('×1,65')).toBeInTheDocument()
        // No tooltip trigger should be present
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Accessibility Tests (WCAG 2.1 AA - from story)
  // ============================================================================

  describe('Accessibility (WCAG 2.1 AA)', () => {
    describe('aria-label with full status description', () => {
      it('should have aria-label on badge', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge).toHaveAttribute('aria-label')
      })

      it('should include coefficient value in aria-label', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge.getAttribute('aria-label')).toContain('1,65')
      })

      it('should include status description in aria-label', () => {
        render(<AcceptanceStatusBadge coefficient={-1} />)

        const badge = screen.getByTestId('acceptance-status-badge')
        expect(badge.getAttribute('aria-label')).toContain('Недоступно')
      })
    })

    describe('Color is not sole indicator (icon + text)', () => {
      it('should have both icon and text for unavailable', () => {
        render(<AcceptanceStatusBadge coefficient={-1} />)

        expect(screen.getByText('⛔')).toBeInTheDocument()
        expect(screen.getByText('Недоступно')).toBeInTheDocument()
      })

      it('should have both icon and text for free', () => {
        render(<AcceptanceStatusBadge coefficient={0} />)

        expect(screen.getByText('✅')).toBeInTheDocument()
        expect(screen.getByText('Бесплатно')).toBeInTheDocument()
      })

      it('should have both icon and text for elevated', () => {
        render(<AcceptanceStatusBadge coefficient={1.25} />)

        expect(screen.getByText('⚠️')).toBeInTheDocument()
        expect(screen.getByText('×1,25')).toBeInTheDocument()
      })

      it('should have both icon and text for high', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        expect(screen.getByText('🔴')).toBeInTheDocument()
        expect(screen.getByText('×1,65')).toBeInTheDocument()
      })
    })

    describe('Tooltip accessible via keyboard focus', () => {
      it('should have data-testid for testing', () => {
        render(<AcceptanceStatusBadge coefficient={1.65} />)

        expect(screen.getByTestId('acceptance-status-badge')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Size Variants Tests
  // ============================================================================

  describe('Size Variants', () => {
    it('should render default size', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      const badge = screen.getByTestId('acceptance-status-badge')
      // Default should not have sm or lg specific classes
      expect(badge).not.toHaveClass('text-xs')
      expect(badge).not.toHaveClass('text-base')
    })

    it('should render small size with text-xs', () => {
      render(<AcceptanceStatusBadge coefficient={1} size="sm" />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('px-1.5')
      expect(badge).toHaveClass('py-0')
    })

    it('should render large size with text-base', () => {
      render(<AcceptanceStatusBadge coefficient={1} size="lg" />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('text-base')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1')
    })
  })

  // ============================================================================
  // Edge Cases & Invariants (from Story table)
  // ============================================================================

  describe('Edge Cases & Invariants', () => {
    it('should treat undefined coefficient as unavailable', () => {
      render(<AcceptanceStatusBadge coefficient={undefined as unknown as number} />)

      expect(screen.getByText('Недоступно')).toBeInTheDocument()
    })

    it('should handle very high coefficients (2.5)', () => {
      render(<AcceptanceStatusBadge coefficient={2.5} />)

      expect(screen.getByText('×2,50')).toBeInTheDocument()
      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('bg-status-warning')
    })

    it('should handle very high coefficients (10)', () => {
      render(<AcceptanceStatusBadge coefficient={10} />)

      expect(screen.getByText('×10,00')).toBeInTheDocument()
    })

    it('should handle boundary coefficient 1.50 as elevated', () => {
      render(<AcceptanceStatusBadge coefficient={1.5} />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('bg-status-warning/10')
    })

    it('should handle boundary coefficient 1.51 as high', () => {
      render(<AcceptanceStatusBadge coefficient={1.51} />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('bg-status-warning')
    })

    it('should apply custom className', () => {
      render(<AcceptanceStatusBadge coefficient={1} className="my-custom-class" />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('my-custom-class')
    })
  })

  // ============================================================================
  // Visual Layout Tests
  // ============================================================================

  describe('Visual Layout', () => {
    it('should render icon before label text', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const badge = screen.getByTestId('acceptance-status-badge')
      const content = badge.textContent || ''

      const iconIndex = content.indexOf('✅')
      const labelIndex = content.indexOf('Бесплатно')

      expect(iconIndex).toBeLessThan(labelIndex)
    })

    it('should have margin-right on icon for spacing', () => {
      render(<AcceptanceStatusBadge coefficient={0} />)

      const icon = screen.getByText('✅')
      expect(icon).toHaveClass('mr-1')
    })

    it('should use Badge with outline variant', () => {
      render(<AcceptanceStatusBadge coefficient={1} />)

      const badge = screen.getByTestId('acceptance-status-badge')
      expect(badge).toHaveClass('border')
    })
  })
})
