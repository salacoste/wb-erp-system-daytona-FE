/**
 * Tests for Story 60.3-FE: Enhanced MetricCard with Comparison
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Component displays metric values with trend indicators and comparison badges
 * showing percentage change from previous period.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MetricCardEnhanced } from '../MetricCardEnhanced'
import { TrendIndicator } from '../TrendIndicator'
import { ComparisonBadge } from '../ComparisonBadge'
import { Wallet } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockProps = (overrides = {}) => ({
  title: 'К перечислению',
  value: 87074.72,
  previousValue: 82780,
  format: 'currency' as const,
  icon: undefined,
  tooltip: undefined,
  isLoading: false,
  error: null,
  invertComparison: false,
  className: '',
  onClick: undefined,
  ...overrides,
})

/** Wrapper with TooltipProvider for tests */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

// =============================================================================
// Story 60.3-FE: Basic Rendering
// =============================================================================

describe('Story 60.3-FE: Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('title and value', () => {
    it('renders title text', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps()} />)
      expect(screen.getByText('К перечислению')).toBeInTheDocument()
    })

    it('renders formatted currency value', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 87074.72, format: 'currency' })} />
      )
      // Currency formatting: "87 074,72 ₽"
      expect(screen.getByText(/87\s*074/)).toBeInTheDocument()
    })

    it('renders formatted percentage value', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 24.5, format: 'percentage' })} />
      )
      // Percentage formatting: "24,5 %"
      expect(screen.getByText(/24,5\s*%/)).toBeInTheDocument()
    })

    it('renders formatted number value', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 1234, format: 'number' })} />
      )
      expect(screen.getByText(/1\s*234/)).toBeInTheDocument()
    })

    it('renders icon when provided', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ icon: Wallet })} />)
      expect(screen.getByTestId('metric-icon')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC8 - Loading State
// =============================================================================

describe('Story 60.3-FE: AC8 - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('skeleton display', () => {
    it('shows skeleton when isLoading is true', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ isLoading: true })} />)
      expect(screen.getByTestId('metric-card-skeleton')).toBeInTheDocument()
    })

    it('hides skeleton when isLoading is false', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ isLoading: false })} />)
      expect(screen.queryByTestId('metric-card-skeleton')).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: Error State
// =============================================================================

describe('Story 60.3-FE: Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('error display', () => {
    it('shows error message when error prop is provided', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ error: 'Ошибка загрузки' })} />)
      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC2 - Positive Change Calculation
// =============================================================================

describe('Story 60.3-FE: AC2 - Positive Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('positive change', () => {
    it('calculates positive percentage change correctly', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      // ((110 - 100) / 100) * 100 = 10%
      expect(screen.getByText(/\+10,0%/)).toBeInTheDocument()
    })

    it('shows green trend indicator for positive change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-600')
    })

    it('shows up arrow for positive change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Рост')).toBeInTheDocument()
    })

    it('shows green badge background for positive change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC2 - Negative Change Calculation
// =============================================================================

describe('Story 60.3-FE: AC2 - Negative Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('negative change', () => {
    it('calculates negative percentage change correctly', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 90, previousValue: 100 })} />
      )
      // ((90 - 100) / 100) * 100 = -10%
      expect(screen.getByText(/-10,0%/)).toBeInTheDocument()
    })

    it('shows red trend indicator for negative change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 90, previousValue: 100 })} />
      )
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('shows down arrow for negative change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 90, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Снижение')).toBeInTheDocument()
    })

    it('shows red badge background for negative change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 90, previousValue: 100 })} />
      )
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC3 - Neutral/Zero Change
// =============================================================================

describe('Story 60.3-FE: AC3 - Neutral Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('neutral change', () => {
    it('shows neutral indicator for zero change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Без изменений')).toBeInTheDocument()
    })

    it('shows neutral indicator for changes < 0.1%', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100.05, previousValue: 100 })} />
      )
      // 0.05% is below threshold
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-muted-foreground')
    })

    it('shows gray badge for neutral change', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100, previousValue: 100 })} />
      )
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-600')
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC10 - Inverted Comparison (Expenses)
// =============================================================================

describe('Story 60.3-FE: AC10 - Inverted Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('inverted logic for expenses', () => {
    it('shows green when expense decreases (invertComparison=true)', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: 90,
            previousValue: 100,
            invertComparison: true,
            title: 'Логистика',
          })}
        />
      )
      // Lower expense is good = green
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-600')
    })

    it('shows red when expense increases (invertComparison=true)', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: 110,
            previousValue: 100,
            invertComparison: true,
          })}
        />
      )
      // Higher expense is bad = red
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('shows green badge when expense decreases', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({
            value: 90,
            previousValue: 100,
            invertComparison: true,
          })}
        />
      )
      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass('bg-green-100')
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC9 - Edge Cases
// =============================================================================

describe('Story 60.3-FE: AC9 - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('zero previous value', () => {
    it('handles division by zero gracefully', () => {
      // Should not crash
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100, previousValue: 0 })} />
      )
      expect(screen.getByText('К перечислению')).toBeInTheDocument()
    })

    it('shows no comparison when previous is zero', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100, previousValue: 0 })} />
      )
      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })
  })

  describe('null/undefined values', () => {
    it('shows dash when value is null', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ value: null })} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows dash when value is undefined', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ value: undefined })} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('handles undefined previousValue', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ previousValue: undefined })} />)
      expect(screen.getByText('Нет данных за предыдущий период')).toBeInTheDocument()
    })

    it('handles null previousValue', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ previousValue: null })} />)
      expect(screen.getByText('Нет данных за предыдущий период')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC6 - Format Types
// =============================================================================

describe('Story 60.3-FE: AC6 - Format Types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('currency format', () => {
    it('formats currency with Russian locale', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 1234567.89, format: 'currency' })} />
      )
      // Look for the value with proper formatting
      expect(screen.getByText(/1\s*234\s*567/)).toBeInTheDocument()
    })
  })

  describe('percentage format', () => {
    it('formats percentage with Russian locale', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({ value: 24.5, previousValue: 20, format: 'percentage' })}
        />
      )
      expect(screen.getByText(/24,5\s*%/)).toBeInTheDocument()
    })
  })

  describe('number format', () => {
    it('formats number with thousand separators', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          {...createMockProps({ value: 12345, previousValue: 10000, format: 'number' })}
        />
      )
      expect(screen.getByText(/12\s*345/)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC5, AC7 - Tooltip
// =============================================================================

describe('Story 60.3-FE: AC5, AC7 - Tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('metric tooltip', () => {
    it('shows info icon when tooltip prop is provided', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ tooltip: 'Metric explanation' })} />
      )
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })

    it('hides info icon when tooltip prop is not provided', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ tooltip: undefined })} />)
      expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 60.3-FE: Click Handler
// =============================================================================

describe('Story 60.3-FE: Click Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('onClick callback', () => {
    it('calls onClick when card is clicked', async () => {
      const onClick = vi.fn()
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick })} />)
      const user = userEvent.setup()
      await user.click(screen.getByRole('article'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('has cursor-pointer when onClick is provided', () => {
      const onClick = vi.fn()
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick })} />)
      expect(screen.getByRole('article')).toHaveClass('cursor-pointer')
    })

    it('has hover shadow when onClick is provided', () => {
      const onClick = vi.fn()
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick })} />)
      expect(screen.getByRole('article')).toHaveClass('hover:shadow-md')
    })

    it('does not have hover styles when onClick is not provided', () => {
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick: undefined })} />)
      expect(screen.getByRole('article')).not.toHaveClass('cursor-pointer')
    })
  })
})

// =============================================================================
// Story 60.3-FE: AC11 - Accessibility
// =============================================================================

describe('Story 60.3-FE: AC11 - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('ARIA labels', () => {
    it('trend indicator has aria-label describing direction', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Рост')).toBeInTheDocument()
    })

    it('negative trend has correct aria-label', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 90, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Снижение')).toBeInTheDocument()
    })

    it('neutral trend has correct aria-label', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 100, previousValue: 100 })} />
      )
      expect(screen.getByLabelText('Без изменений')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('card is focusable when onClick is provided', () => {
      const onClick = vi.fn()
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick })} />)
      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('tabindex', '0')
    })

    it('Enter key triggers onClick', async () => {
      const onClick = vi.fn()
      renderWithTooltip(<MetricCardEnhanced {...createMockProps({ onClick })} />)
      const user = userEvent.setup()
      const card = screen.getByRole('article')
      card.focus()
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalled()
    })
  })
})

// =============================================================================
// Story 60.3-FE: TrendIndicator Component
// =============================================================================

describe('Story 60.3-FE: TrendIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('applies correct color for positive', () => {
      render(<TrendIndicator direction="positive" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('text-green-600')
    })

    it('applies correct color for negative', () => {
      render(<TrendIndicator direction="negative" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('text-red-500')
    })

    it('applies correct color for neutral', () => {
      render(<TrendIndicator direction="neutral" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('text-muted-foreground')
    })
  })

  describe('size variants', () => {
    it('renders small size', () => {
      render(<TrendIndicator direction="positive" size="sm" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('h-3', 'w-3')
    })

    it('renders medium size (default)', () => {
      render(<TrendIndicator direction="positive" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('h-4', 'w-4')
    })

    it('renders large size', () => {
      render(<TrendIndicator direction="positive" size="lg" />)
      expect(screen.getByTestId('trend-indicator')).toHaveClass('h-5', 'w-5')
    })
  })
})

// =============================================================================
// Story 60.3-FE: ComparisonBadge Component
// =============================================================================

describe('Story 60.3-FE: ComparisonBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('percentage display', () => {
    it('shows positive percentage with plus sign', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={10} direction="positive" />)
      expect(screen.getByText('+10,0%')).toBeInTheDocument()
    })

    it('shows negative percentage with minus sign', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={-10} direction="negative" />)
      expect(screen.getByText('-10,0%')).toBeInTheDocument()
    })

    it('shows zero percentage for neutral', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={0} direction="neutral" />)
      // Zero percentage shows without plus sign
      expect(screen.getByText('0,0%')).toBeInTheDocument()
    })
  })

  describe('badge colors', () => {
    it('has green background for positive direction', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={10} direction="positive" />)
      expect(screen.getByTestId('comparison-badge')).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('has red background for negative direction', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={-10} direction="negative" />)
      expect(screen.getByTestId('comparison-badge')).toHaveClass('bg-red-100', 'text-red-700')
    })

    it('has gray background for neutral direction', () => {
      renderWithTooltip(<ComparisonBadge percentageChange={0} direction="neutral" />)
      expect(screen.getByTestId('comparison-badge')).toHaveClass('bg-gray-100', 'text-gray-600')
    })
  })

  describe('absolute difference tooltip', () => {
    it('shows tooltip with absolute difference on hover', async () => {
      const user = userEvent.setup()
      renderWithTooltip(
        <ComparisonBadge percentageChange={10} direction="positive" absoluteDifference="+1 000 ₽" />
      )
      await user.hover(screen.getByTestId('comparison-badge'))
      await waitFor(() => {
        // Tooltip content appears twice (one for accessibility)
        const elements = screen.getAllByText('+1 000 ₽')
        expect(elements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

// =============================================================================
// Story 60.3-FE: Integration Tests
// =============================================================================

describe('Story 60.3-FE: Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('full card flow', () => {
    it('renders complete card with all elements', () => {
      renderWithTooltip(
        <MetricCardEnhanced
          title="К перечислению"
          value={87074.72}
          previousValue={82780}
          format="currency"
          icon={Wallet}
          tooltip="Сумма к перечислению"
        />
      )
      expect(screen.getByText('К перечислению')).toBeInTheDocument()
      expect(screen.getByText(/87\s*074/)).toBeInTheDocument()
      expect(screen.getByTestId('trend-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('comparison-badge')).toBeInTheDocument()
    })

    it('renders previous value comparison text', () => {
      renderWithTooltip(
        <MetricCardEnhanced {...createMockProps({ value: 110, previousValue: 100 })} />
      )
      expect(screen.getByText(/vs 100/)).toBeInTheDocument()
    })
  })
})
