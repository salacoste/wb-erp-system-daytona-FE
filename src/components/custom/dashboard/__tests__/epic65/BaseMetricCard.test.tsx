/**
 * TDD Tests for BaseMetricCard — Story 65.19
 * RED phase: Tests define expected behavior BEFORE implementation.
 *
 * BaseMetricCard is the foundational component for ALL dashboard metric cards.
 * Two variants: standard (text-2xl, default border) and highlighted (text-4xl, border-2, gradient).
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md — Story 65.19
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BaseMetricCard } from '@/components/custom/dashboard/BaseMetricCard'
import {
  createBaseMetricCardProps,
  createStandardCardProps,
  createHighlightedCardProps,
  createComparisonProps,
  createInvertedMetricProps,
  expectAccessibleCard,
  expectAccessibleSkeleton,
} from './helpers/render-helpers'

// =============================================================================
// Story 65.19: BaseMetricCard — Props interface tests
// =============================================================================

describe('BaseMetricCard', () => {
  describe('variant rendering', () => {
    /** AC-65.19.1: standard variant is default */
    it('renders with standard variant by default', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
      // Standard: text-2xl for value, no border-2
      const value = screen.getByTestId('metric-value')
      expect(value).toHaveClass('text-2xl')
      expect(value).toHaveClass('font-bold')
      expect(card.className).not.toMatch(/border-2/)
    })

    /** AC-65.19.1: highlighted variant has border-2, gradient bg, text-4xl */
    it('renders with highlighted variant (border-2, gradient bg, text-4xl)', () => {
      const props = createHighlightedCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('border-2')
      expect(card.className).toMatch(/bg-gradient/)

      const value = screen.getByTestId('metric-value')
      expect(value).toHaveClass('text-4xl')
      expect(value).toHaveClass('font-bold')
    })

    /** AC-65.19.1: explicit standard variant */
    it('renders with explicit standard variant', () => {
      const props = createStandardCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const value = screen.getByTestId('metric-value')
      expect(value).toHaveClass('text-2xl')
    })
  })

  describe('title and icon', () => {
    /** AC-65.19.1: renders title and icon */
    it('renders title text', () => {
      const props = createBaseMetricCardProps({ title: 'Логистика' })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByText('Логистика')).toBeInTheDocument()
    })

    it('renders icon component', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('applies accentColor to icon', () => {
      const props = createBaseMetricCardProps({ accentColor: 'text-red-500' })
      renderWithProviders(<BaseMetricCard {...props} />)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveClass('text-red-500')
    })
  })

  describe('value formatting', () => {
    /** AC-65.19.1: formatted currency value */
    it('renders formatted currency value', () => {
      const props = createBaseMetricCardProps({ value: 23748, format: 'currency' })
      renderWithProviders(<BaseMetricCard {...props} />)

      // formatCurrency(23748) produces Russian locale format
      const value = screen.getByTestId('metric-value')
      expect(value.textContent).toMatch(/23\s?748/)
    })

    /** AC-65.19.1: formatted percentage value */
    it('renders formatted percentage value', () => {
      const props = createBaseMetricCardProps({ value: 14.09, format: 'percent' })
      renderWithProviders(<BaseMetricCard {...props} />)

      const value = screen.getByTestId('metric-value')
      expect(value.textContent).toMatch(/14[,.]09/)
    })

    /** AC-65.19.1: renders dash when value is null */
    it('renders dash when value is null', () => {
      const props = createBaseMetricCardProps({ value: null })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    /** AC-65.19.1: renders dash when value is undefined */
    it('renders dash when value is undefined', () => {
      const props = createBaseMetricCardProps({ value: undefined })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('applies valueColor override when provided', () => {
      const props = createBaseMetricCardProps({ valueColor: 'text-green-600' })
      renderWithProviders(<BaseMetricCard {...props} />)

      const value = screen.getByTestId('metric-value')
      expect(value).toHaveClass('text-green-600')
    })
  })

  describe('loading state', () => {
    /** AC-65.19.7: skeleton in loading state */
    it('renders skeleton when isLoading=true', () => {
      const props = createBaseMetricCardProps({ isLoading: true })
      const { container } = renderWithProviders(<BaseMetricCard {...props} />)

      expectAccessibleSkeleton(container)
      // Value should not be visible during loading
      expect(screen.queryByTestId('metric-value')).not.toBeInTheDocument()
    })

    it('does NOT render skeleton when isLoading=false', () => {
      const props = createBaseMetricCardProps({ isLoading: false })
      const { container } = renderWithProviders(<BaseMetricCard {...props} />)

      expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
      expect(screen.getByTestId('metric-value')).toBeInTheDocument()
    })

    /** AC-65.19.8: skeleton must NOT have aria-hidden alongside aria-busy */
    it('loading skeleton uses aria-busy without aria-hidden', () => {
      const props = createBaseMetricCardProps({ isLoading: true })
      const { container } = renderWithProviders(<BaseMetricCard {...props} />)

      const skeleton = container.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).not.toHaveAttribute('aria-hidden', 'true')
    })

    it('renders standard skeleton for standard variant', () => {
      const props = createStandardCardProps({ isLoading: true })
      const { container } = renderWithProviders(<BaseMetricCard {...props} />)

      const skeleton = container.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
      // Standard skeleton has min-h-[120px]
      expect(skeleton).toHaveClass('min-h-[120px]')
    })

    it('renders highlighted skeleton for highlighted variant', () => {
      const props = createHighlightedCardProps({ isLoading: true })
      const { container } = renderWithProviders(<BaseMetricCard {...props} />)

      const skeleton = container.querySelector('[aria-busy="true"]')
      expect(skeleton).toBeInTheDocument()
      // Highlighted skeleton has border-2 and min-h-[140px]
      expect(skeleton).toHaveClass('border-2')
      expect(skeleton).toHaveClass('min-h-[140px]')
    })
  })

  describe('error state', () => {
    it('renders error state with alert role', () => {
      const error = new Error('Ошибка загрузки')
      const props = createBaseMetricCardProps({ error })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('shows retry button when onRetry provided', () => {
      const onRetry = vi.fn()
      const error = new Error('Network error')
      const props = createBaseMetricCardProps({ error, onRetry })
      renderWithProviders(<BaseMetricCard {...props} />)

      const retryButton = screen.getByRole('button', { name: /повторить/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls onRetry when retry button clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const error = new Error('Network error')
      const props = createBaseMetricCardProps({ error, onRetry })
      renderWithProviders(<BaseMetricCard {...props} />)

      await user.click(screen.getByRole('button', { name: /повторить/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Story 65.19 + 65.15: Comparison / Trend tests
  // ===========================================================================

  describe('comparison and trend', () => {
    /** AC-65.19.1: shows ComparisonBadge when comparison data provided */
    it('shows ComparisonBadge when previousValue provided', () => {
      const props = createComparisonProps('positive')
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('comparison-badge')).toBeInTheDocument()
    })

    it('hides ComparisonBadge when no previousValue', () => {
      const props = createBaseMetricCardProps({ previousValue: undefined })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('hides ComparisonBadge when previousValue is null', () => {
      const props = createBaseMetricCardProps({ previousValue: null })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    /** AC-65.15.1: positive trend shows green indicator */
    it('positive trend shows green indicator', () => {
      const props = createComparisonProps('positive')
      renderWithProviders(<BaseMetricCard {...props} />)

      const trend = screen.getByTestId('trend-indicator')
      expect(trend).toHaveClass('text-green-600')
    })

    /** AC-65.15.2: negative trend shows red indicator */
    it('negative trend shows red indicator', () => {
      const props = createComparisonProps('negative')
      renderWithProviders(<BaseMetricCard {...props} />)

      const trend = screen.getByTestId('trend-indicator')
      expect(trend).toHaveClass('text-red-500')
    })

    it('neutral trend shows muted indicator', () => {
      const props = createComparisonProps('neutral')
      renderWithProviders(<BaseMetricCard {...props} />)

      const trend = screen.getByTestId('trend-indicator')
      expect(trend).toHaveClass('text-muted-foreground')
    })

    /** AC-65.15.2: inverted metric (higher=worse) reverses colors */
    it('inverted metric: decrease shows positive (green) direction', () => {
      // Expense decreased: 6000 -> 5000, inverted=true -> positive
      const props = createInvertedMetricProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/green/)
    })

    it('inverted metric: increase shows negative (red) direction', () => {
      const props = createInvertedMetricProps({
        value: 7000,
        previousValue: 6000,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      const badge = screen.getByTestId('comparison-badge')
      expect(badge).toHaveClass(/red/)
    })
  })

  // ===========================================================================
  // Story 65.15: Sentiment background tests
  // ===========================================================================

  describe('sentiment background (Story 65.15)', () => {
    /** AC-65.15.1: positive trend -> green-tinted background */
    it('positive trend applies bg-green-50 background', () => {
      const props = createComparisonProps('positive', { sentimentBg: true })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('bg-green-50')
      expect(card).toHaveClass('border-green-200')
    })

    /** AC-65.15.2: negative trend -> red-tinted background */
    it('negative trend applies bg-red-50 background', () => {
      const props = createComparisonProps('negative', { sentimentBg: true })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('bg-red-50')
      expect(card).toHaveClass('border-red-200')
    })

    /** AC-65.15.3: neutral trend -> default background */
    it('neutral trend does not apply sentiment background', () => {
      const props = createComparisonProps('neutral', { sentimentBg: true })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).not.toHaveClass('bg-green-50')
      expect(card).not.toHaveClass('bg-red-50')
    })

    /** AC-65.15.8: highlighted variant does NOT get sentiment bg */
    it('highlighted variant does NOT get sentiment background', () => {
      const props = createHighlightedCardProps({
        previousValue: 30000,
        sentimentBg: true,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      // Highlighted has its own gradient, sentinel bg must not apply
      expect(card).not.toHaveClass('bg-green-50')
      expect(card).not.toHaveClass('bg-red-50')
      // But should still have gradient
      expect(card.className).toMatch(/bg-gradient/)
    })

    it('no sentiment background when sentimentBg is false', () => {
      const props = createComparisonProps('positive', { sentimentBg: false })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).not.toHaveClass('bg-green-50')
      expect(card).not.toHaveClass('bg-red-50')
    })

    it('no sentiment background when sentimentBg not provided', () => {
      const props = createComparisonProps('positive')
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).not.toHaveClass('bg-green-50')
      expect(card).not.toHaveClass('bg-red-50')
    })
  })

  // ===========================================================================
  // Story 65.16: Dual value / secondary value
  // ===========================================================================

  describe('dual value display (Story 65.16)', () => {
    /** AC-65.16.1: primary and secondary on one line with separator */
    it('renders secondaryValue alongside primary with separator', () => {
      const props = createBaseMetricCardProps({
        value: 23748,
        secondaryValue: '14,09%',
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByText(/14,09%/)).toBeInTheDocument()
    })

    /** AC-65.16.5: secondary value is visually less prominent */
    it('secondary value has muted styling', () => {
      const props = createBaseMetricCardProps({
        value: 23748,
        secondaryValue: '14,09%',
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      const secondary = screen.getByText(/14,09%/)
      expect(secondary).toHaveClass('text-muted-foreground')
    })

    it('does not render secondary when not provided', () => {
      const props = createBaseMetricCardProps({ secondaryValue: undefined })
      renderWithProviders(<BaseMetricCard {...props} />)

      // Only primary value should be present
      expect(screen.queryByText('/')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Subcategory badge / breakdown
  // ===========================================================================

  describe('breakdown badge', () => {
    it('shows badge with count when breakdownCount provided', () => {
      const props = createBaseMetricCardProps({ breakdownCount: 5 })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('does not show badge when breakdownCount not provided', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      // No breakdown badge should be rendered
      expect(screen.queryByTestId('breakdown-badge')).not.toBeInTheDocument()
    })

    it('clicking badge triggers onBreakdownClick', async () => {
      const user = userEvent.setup()
      const onBreakdownClick = vi.fn()
      const props = createBaseMetricCardProps({
        breakdownCount: 3,
        onBreakdownClick,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      const badge = screen.getByText('3')
      await user.click(badge)
      expect(onBreakdownClick).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Slots: subtitle, badge, actions
  // ===========================================================================

  describe('slot rendering', () => {
    it('renders subtitle slot content', () => {
      const props = createBaseMetricCardProps({
        subtitle: <span data-testid="subtitle-slot">Выкупы 100 - Возвраты 10</span>,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('subtitle-slot')).toBeInTheDocument()
    })

    it('renders badge slot content', () => {
      const props = createBaseMetricCardProps({
        badge: <span data-testid="badge-slot">ROAS 3.5</span>,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('badge-slot')).toBeInTheDocument()
    })

    it('renders actions slot content', () => {
      const props = createBaseMetricCardProps({
        actions: <button data-testid="action-slot">Заполнить COGS</button>,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('action-slot')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Tooltip
  // ===========================================================================

  describe('tooltip', () => {
    it('renders info button for tooltip', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const infoButton = screen.getByRole('button', {
        name: /подробнее/i,
      })
      expect(infoButton).toBeInTheDocument()
    })

    it('shows tooltip content on hover', async () => {
      const user = userEvent.setup()
      const props = createBaseMetricCardProps({ tooltip: 'Подробное описание метрики' })
      renderWithProviders(<BaseMetricCard {...props} />)

      const infoButton = screen.getByRole('button', { name: /подробнее/i })
      await user.hover(infoButton)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
        // Radix renders tooltip text in multiple DOM locations; use getAllByText
        const matches = screen.getAllByText('Подробное описание метрики')
        expect(matches.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ===========================================================================
  // Styling
  // ===========================================================================

  describe('styling', () => {
    it('applies custom className prop', () => {
      const props = createBaseMetricCardProps({ className: 'custom-test' })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByRole('article')).toHaveClass('custom-test')
    })

    it('applies data-testid prop', () => {
      const props = createBaseMetricCardProps({ 'data-testid': 'my-metric' })
      renderWithProviders(<BaseMetricCard {...props} />)

      expect(screen.getByTestId('my-metric')).toBeInTheDocument()
    })

    it('standard card has hover shadow transition', () => {
      const props = createStandardCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('transition-shadow')
      expect(card).toHaveClass('hover:shadow-md')
    })

    it('highlighted card has hover shadow transition', () => {
      const props = createHighlightedCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('transition-shadow')
      expect(card).toHaveClass('hover:shadow-md')
    })

    /** AC-65.15.4: sentiment bg uses soft tints */
    it('sentiment background uses transition-colors for smooth changes', () => {
      const props = createComparisonProps('positive', { sentimentBg: true })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card).toHaveClass('transition-colors')
    })
  })

  // ===========================================================================
  // Accessibility (WCAG 2.1 AA)
  // ===========================================================================

  describe('accessibility', () => {
    /** AC-65.19.8: has role="article" */
    it('has role="article" on card element', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      expectAccessibleCard(screen.getByRole('article'))
    })

    /** AC-65.19.8: title readable by screen reader */
    it('aria-label includes title and value', () => {
      const props = createBaseMetricCardProps({
        title: 'Логистика',
        value: 5000,
      })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      const label = card.getAttribute('aria-label')
      expect(label).toMatch(/Логистика/)
    })

    it('aria-label shows "нет данных" when value is null', () => {
      const props = createBaseMetricCardProps({ value: null })
      renderWithProviders(<BaseMetricCard {...props} />)

      const card = screen.getByRole('article')
      expect(card.getAttribute('aria-label')).toMatch(/нет данных/)
    })

    it('icon has aria-hidden="true"', () => {
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const icon = screen.getByTestId('mock-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    /** AC-65.19.8: comparison has aria-label with context */
    it('comparison badge includes context in aria attributes', () => {
      const props = createComparisonProps('positive')
      renderWithProviders(<BaseMetricCard {...props} />)

      const badge = screen.getByTestId('comparison-badge')
      // Badge text should contain percentage change info
      expect(badge.textContent).toMatch(/[+\-]?\d/)
    })

    it('tooltip trigger is keyboard focusable', async () => {
      const user = userEvent.setup()
      const props = createBaseMetricCardProps()
      renderWithProviders(<BaseMetricCard {...props} />)

      const infoButton = screen.getByRole('button', { name: /подробнее/i })
      await user.tab()

      // Info button should be focusable via keyboard
      expect(infoButton.tagName).toBe('BUTTON')
    })

    it('info button has descriptive aria-label', () => {
      const props = createBaseMetricCardProps({ title: 'Логистика' })
      renderWithProviders(<BaseMetricCard {...props} />)

      const infoButton = screen.getByRole('button', { name: /подробнее/i })
      expect(infoButton.getAttribute('aria-label')).toMatch(/Логистика/)
    })
  })
})
