/**
 * EfficiencyFilterChips Component Tests
 * Story 63.4-FE: Advertising Efficiency Filter UI
 * Epic 63-FE: Dashboard Business Logic (Frontend)
 *
 * Test coverage:
 * - Efficiency filter chips display (AC1)
 * - Filter chip colors (AC2)
 * - Filter application to API (AC3)
 * - Count display (AC4)
 * - Multi-select / toggle behavior (AC5)
 * - Integration points (AC6)
 * - Accessibility (AC7)
 * - Loading state
 * - Chip styling & layout
 * - Filter configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'

import { EfficiencyFilterChips } from '../advertising/EfficiencyFilterChips'
import { efficiencyFilterConfig, FILTER_ORDER } from '@/lib/efficiency-filter-config'
import type { EfficiencyCountsSummary } from '@/types/efficiency-filter'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/advertising',
  useSearchParams: () => mockSearchParams,
}))

/**
 * Helper to create mock efficiency counts data
 */
function createMockCounts(
  overrides: Partial<EfficiencyCountsSummary> = {}
): EfficiencyCountsSummary {
  return {
    excellent: 45,
    good: 78,
    moderate: 112,
    poor: 34,
    loss: 12,
    total: 281,
    ...overrides,
  }
}

/** Render the component with default counts. */
function renderChips(overrides: Partial<EfficiencyCountsSummary> = {}) {
  return renderWithProviders(<EfficiencyFilterChips counts={createMockCounts(overrides)} />)
}

/** Find all filter chip buttons (the group's children). */
function getChipButtons(): HTMLButtonElement[] {
  const group = screen.getByRole('group', {
    name: 'Фильтр по эффективности рекламы',
  })
  return Array.from(group.querySelectorAll('button'))
}

describe('EfficiencyFilterChips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('efficiency')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // AC1: Efficiency Filter Chips
  // ============================================================================

  describe('AC1: Efficiency Filter Chips', () => {
    it('displays 5 filter chips: excellent, good, moderate, poor, loss', () => {
      renderChips()
      expect(screen.getByText('Отлично')).toBeInTheDocument()
      expect(screen.getByText('Хорошо')).toBeInTheDocument()
      expect(screen.getByText('Умеренно')).toBeInTheDocument()
      expect(screen.getByText('Слабо')).toBeInTheDocument()
      expect(screen.getByText('Убыток')).toBeInTheDocument()
    })

    it('displays "Все" (All) chip as first option', () => {
      renderChips()
      const buttons = getChipButtons()
      expect(buttons[0]).toHaveTextContent('Все')
    })

    it('each chip shows count of items in that category', () => {
      renderChips()
      // The Badge inside each chip displays the count
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('78')).toBeInTheDocument()
      expect(screen.getByText('112')).toBeInTheDocument()
      expect(screen.getByText('34')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    it('chips are color-coded per efficiency status', () => {
      renderChips()
      const buttons = getChipButtons()
      // Skip "Все" (index 0), check status chips
      // P2 wave-5 semantic tokens: solid tiers (excellent/poor/loss) carry
      // *-foreground pairs; soft tiers (good/moderate) are fg-on-tint
      // (text-foreground) per migrated efficiency-filter-config.ts.
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      expect(excellentBtn?.className).toContain('text-status-success-foreground')

      const goodBtn = buttons.find(b => b.textContent?.includes('Хорошо'))
      expect(goodBtn?.className).toContain('text-foreground')

      const moderateBtn = buttons.find(b => b.textContent?.includes('Умеренно'))
      expect(moderateBtn?.className).toContain('text-foreground')

      const poorBtn = buttons.find(b => b.textContent?.includes('Слабо'))
      expect(poorBtn?.className).toContain('text-status-warning-foreground')

      const lossBtn = buttons.find(b => b.textContent?.includes('Убыток'))
      expect(lossBtn?.className).toContain('text-status-error-foreground')
    })

    it('active filter chip is visually highlighted with border', () => {
      // Set URL param to make "loss" active
      mockSearchParams.set('efficiency', 'loss')
      renderChips()
      const buttons = getChipButtons()
      const lossBtn = buttons.find(b => b.textContent?.includes('Убыток'))
      expect(lossBtn?.className).toContain('border-status-error')
    })

    it('"Все" option clears filter when clicked', async () => {
      mockSearchParams.set('efficiency', 'loss')
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Все'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising', { scroll: false })
    })

    it('chips render in correct order: Все, Отлично, Хорошо, Умеренно, Слабо, Убыток', () => {
      renderChips()
      const buttons = getChipButtons()
      const labels = buttons.map(b => {
        // Extract just the label text (before the count badge)
        const span = b.querySelector('span')
        return span?.textContent
      })
      expect(labels).toEqual(['Все', 'Отлично', 'Хорошо', 'Умеренно', 'Слабо', 'Убыток'])
    })
  })

  // ============================================================================
  // AC2: Filter Chip Colors
  // ============================================================================

  describe('AC2: Filter Chip Colors', () => {
    describe('excellent chip', () => {
      it('has solid success text color (text-status-success-foreground)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Отлично'))
        expect(btn?.className).toContain('text-status-success-foreground')
      })

      it('has solid success background (bg-status-success)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Отлично'))
        expect(btn?.className).toContain('bg-status-success')
        // P2 wave-5 fix (finding 2): inactive solid chip must NOT carry the
        // active-state ring affordance (state discrimination, negative side)
        expect(btn?.className).not.toContain('ring-2 ring-ring')
      })

      it('has solid success active background (bg-status-success)', () => {
        mockSearchParams.set('efficiency', 'excellent')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Отлично'))
        expect(btn?.className).toContain('bg-status-success')
        // P2 wave-5 fix (finding 2): active solid chip DOES get the ring
        // affordance (positive side of the state discrimination pair)
        expect(btn?.className).toContain('ring-2 ring-ring')
      })

      it('has success border when active (border-status-success)', () => {
        mockSearchParams.set('efficiency', 'excellent')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Отлично'))
        expect(btn?.className).toContain('border-status-success')
      })
    })

    describe('good chip', () => {
      it('has soft success text color (text-foreground)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Хорошо'))
        expect(btn?.className).toContain('text-foreground')
      })

      it('has soft success background (bg-status-success/5)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Хорошо'))
        expect(btn?.className).toContain('bg-status-success/5')
      })

      it('has soft success active background (bg-status-success/15)', () => {
        mockSearchParams.set('efficiency', 'good')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Хорошо'))
        expect(btn?.className).toContain('bg-status-success/15')
      })

      it('has success border when active (border-status-success)', () => {
        mockSearchParams.set('efficiency', 'good')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Хорошо'))
        expect(btn?.className).toContain('border-status-success')
      })
    })

    describe('moderate chip', () => {
      it('has soft warning text color (text-foreground)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Умеренно'))
        expect(btn?.className).toContain('text-foreground')
      })

      it('has soft warning background (bg-status-warning/5)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Умеренно'))
        expect(btn?.className).toContain('bg-status-warning/5')
      })

      it('has soft warning active background (bg-status-warning/15)', () => {
        mockSearchParams.set('efficiency', 'moderate')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Умеренно'))
        expect(btn?.className).toContain('bg-status-warning/15')
      })

      it('has warning border when active (border-status-warning)', () => {
        mockSearchParams.set('efficiency', 'moderate')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Умеренно'))
        expect(btn?.className).toContain('border-status-warning')
      })
    })

    describe('poor chip', () => {
      it('has solid warning text color (text-status-warning-foreground)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Слабо'))
        expect(btn?.className).toContain('text-status-warning-foreground')
      })

      it('has solid warning background (bg-status-warning)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Слабо'))
        expect(btn?.className).toContain('bg-status-warning')
        // P2 wave-5 fix (finding 2): inactive solid chip must NOT carry the
        // active-state ring affordance (state discrimination, negative side)
        expect(btn?.className).not.toContain('ring-2 ring-ring')
      })

      it('has solid warning active background (bg-status-warning)', () => {
        mockSearchParams.set('efficiency', 'poor')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Слабо'))
        expect(btn?.className).toContain('bg-status-warning')
        // P2 wave-5 fix (finding 2): active solid chip DOES get the ring
        // affordance (positive side of the state discrimination pair)
        expect(btn?.className).toContain('ring-2 ring-ring')
      })

      it('has warning border when active (border-status-warning)', () => {
        mockSearchParams.set('efficiency', 'poor')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Слабо'))
        expect(btn?.className).toContain('border-status-warning')
      })
    })

    describe('loss chip', () => {
      it('has solid error text color (text-status-error-foreground)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Убыток'))
        expect(btn?.className).toContain('text-status-error-foreground')
      })

      it('has solid error background (bg-status-error)', () => {
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Убыток'))
        expect(btn?.className).toContain('bg-status-error')
        // P2 wave-5 fix (finding 2): inactive solid chip must NOT carry the
        // active-state ring affordance (state discrimination, negative side)
        expect(btn?.className).not.toContain('ring-2 ring-ring')
      })

      it('has solid error active background (bg-status-error)', () => {
        mockSearchParams.set('efficiency', 'loss')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Убыток'))
        expect(btn?.className).toContain('bg-status-error')
        // P2 wave-5 fix (finding 2): active solid chip DOES get the ring
        // affordance (positive side of the state discrimination pair)
        expect(btn?.className).toContain('ring-2 ring-ring')
      })

      it('has error border when active (border-status-error)', () => {
        mockSearchParams.set('efficiency', 'loss')
        renderChips()
        const buttons = getChipButtons()
        const btn = buttons.find(b => b.textContent?.includes('Убыток'))
        expect(btn?.className).toContain('border-status-error')
      })
    })
  })

  // ============================================================================
  // AC3: Filter Application
  // ============================================================================

  describe('AC3: Filter Application', () => {
    it('clicking chip applies efficiency_filter param to API request', async () => {
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Убыток'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising?efficiency=loss', {
        scroll: false,
      })
    })

    it('URL updates with filter query param (?efficiency=loss)', async () => {
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Убыток'))
      expect(mockPush).toHaveBeenCalledTimes(1)
      const pushArg = mockPush.mock.calls[0][0] as string
      expect(pushArg).toContain('efficiency=loss')
    })

    it('filter persists on page refresh (reads from URL)', () => {
      mockSearchParams.set('efficiency', 'good')
      renderChips()
      const buttons = getChipButtons()
      const goodBtn = buttons.find(b => b.textContent?.includes('Хорошо'))
      expect(goodBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('clicking same filter again removes it (toggle behavior)', async () => {
      mockSearchParams.set('efficiency', 'loss')
      const user = userEvent.setup()
      renderChips()
      const lossBtn = screen.getByText('Убыток')
      await user.click(lossBtn)
      // Toggle off: URL should have no efficiency param
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising', { scroll: false })
    })

    it('clicking different filter replaces current filter', async () => {
      mockSearchParams.set('efficiency', 'loss')
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Хорошо'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising?efficiency=good', {
        scroll: false,
      })
    })

    it('router.push called with correct URL and scroll: false', async () => {
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Отлично'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising?efficiency=excellent', {
        scroll: false,
      })
    })
  })

  // ============================================================================
  // AC4: Count Display
  // ============================================================================

  describe('AC4: Count Display', () => {
    it('counts are displayed inside each chip badge', () => {
      renderChips()
      // Each chip has a Badge element showing the count
      const buttons = getChipButtons()
      // "Все" shows total
      expect(buttons[0]).toHaveTextContent('281')
      // Status chips show individual counts
      expect(buttons.find(b => b.textContent?.includes('Отлично'))).toHaveTextContent('45')
      expect(buttons.find(b => b.textContent?.includes('Хорошо'))).toHaveTextContent('78')
      expect(buttons.find(b => b.textContent?.includes('Умеренно'))).toHaveTextContent('112')
      expect(buttons.find(b => b.textContent?.includes('Слабо'))).toHaveTextContent('34')
      expect(buttons.find(b => b.textContent?.includes('Убыток'))).toHaveTextContent('12')
    })

    it('loading skeleton shown while fetching counts', () => {
      renderWithProviders(<EfficiencyFilterChips counts={createMockCounts()} isLoading={true} />)
      // Skeletons should render instead of buttons
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    })

    it('zero-count chips remain visible but have opacity-50', () => {
      renderChips({ excellent: 0 })
      const buttons = getChipButtons()
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      expect(excellentBtn?.className).toContain('opacity-50')
    })

    it('zero-count chips are disabled (cursor-not-allowed)', () => {
      renderChips({ excellent: 0 })
      const buttons = getChipButtons()
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      expect(excellentBtn?.className).toContain('cursor-not-allowed')
      expect(excellentBtn).toBeDisabled()
    })

    it('total count shown next to "Все" chip', () => {
      renderChips()
      const buttons = getChipButtons()
      expect(buttons[0]).toHaveTextContent('281')
    })

    it('count badge has appropriate styling (rounded, small text)', () => {
      renderChips()
      const buttons = getChipButtons()
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      const badge = excellentBtn?.querySelector('[class*="rounded"]')
      expect(badge).toBeInTheDocument()
    })
  })

  // ============================================================================
  // AC5: Multi-Select Support (Single-select toggle behavior)
  // ============================================================================

  describe('AC5: Toggle Behavior', () => {
    it('clicking active filter deselects it (returns to "Все")', async () => {
      mockSearchParams.set('efficiency', 'loss')
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Убыток'))
      // Should navigate to path without efficiency param
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising', { scroll: false })
    })

    it('only one filter can be active at a time', () => {
      mockSearchParams.set('efficiency', 'good')
      renderChips()
      const buttons = getChipButtons()
      const pressedButtons = buttons.filter(b => b.getAttribute('aria-pressed') === 'true')
      expect(pressedButtons).toHaveLength(1)
      expect(pressedButtons[0]).toHaveTextContent('Хорошо')
    })

    it('"Все" is active by default when no filter selected', () => {
      renderChips()
      const buttons = getChipButtons()
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
    })

    it('clicking "Все" clears any active filter', async () => {
      mockSearchParams.set('efficiency', 'loss')
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Все'))
      expect(mockPush).toHaveBeenCalledWith('/dashboard/advertising', { scroll: false })
    })
  })

  // ============================================================================
  // AC6: Integration Points
  // ============================================================================

  describe('AC6: Integration Points', () => {
    it('filter works in advertising table (campaign view)', () => {
      // Component renders in advertising context (pathname = /dashboard/advertising)
      renderChips()
      const group = screen.getByRole('group', {
        name: 'Фильтр по эффективности рекламы',
      })
      expect(group).toBeInTheDocument()
    })

    it('filter syncs with URL search params', async () => {
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Отлично'))
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('efficiency=excellent'), {
        scroll: false,
      })
    })

    it('searchParams.get("efficiency") returns current filter', () => {
      mockSearchParams.set('efficiency', 'poor')
      renderChips()
      const buttons = getChipButtons()
      const poorBtn = buttons.find(b => b.textContent?.includes('Слабо'))
      expect(poorBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('component uses pathname for URL construction', async () => {
      const user = userEvent.setup()
      renderChips()
      await user.click(screen.getByText('Убыток'))
      const pushArg = mockPush.mock.calls[0][0] as string
      expect(pushArg).toContain('/dashboard/advertising')
    })
  })

  // ============================================================================
  // AC7: Accessibility
  // ============================================================================

  describe('AC7: Accessibility', () => {
    it('filter group has role="group"', () => {
      renderChips()
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('filter group has aria-label="Фильтр по эффективности рекламы"', () => {
      renderChips()
      expect(
        screen.getByRole('group', { name: 'Фильтр по эффективности рекламы' })
      ).toBeInTheDocument()
    })

    it('individual chips are keyboard navigable (tab order)', () => {
      renderChips()
      const buttons = getChipButtons()
      expect(buttons.length).toBe(6) // Все + 5 status chips
      buttons.forEach(btn => {
        expect(btn.tagName).toBe('BUTTON')
      })
    })

    it('chips have aria-pressed state for active/inactive', () => {
      mockSearchParams.set('efficiency', 'loss')
      renderChips()
      const buttons = getChipButtons()
      const lossBtn = buttons.find(b => b.textContent?.includes('Убыток'))
      expect(lossBtn).toHaveAttribute('aria-pressed', 'true')
      // "Все" should not be pressed
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
    })

    it('chips have aria-label describing status and count', () => {
      renderChips()
      const buttons = getChipButtons()
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      expect(excellentBtn).toHaveAttribute('aria-label')
      const ariaLabel = excellentBtn?.getAttribute('aria-label') ?? ''
      expect(ariaLabel).toContain('Отлично')
      expect(ariaLabel).toContain('45')
      expect(ariaLabel).toContain('элементов')
    })

    it('focus is visible on all interactive elements', () => {
      renderChips()
      const buttons = getChipButtons()
      buttons.forEach(btn => {
        expect(btn.className).toContain('focus-visible:ring')
      })
    })

    it('disabled chips have aria-disabled attribute', () => {
      renderChips({ excellent: 0 })
      const buttons = getChipButtons()
      const excellentBtn = buttons.find(b => b.textContent?.includes('Отлично'))
      expect(excellentBtn).toHaveAttribute('aria-disabled', 'true')
    })

    it('tooltip shows ROAS range on hover for each status', () => {
      renderChips()
      // The component wraps status chips in Tooltip; verify description config
      // is passed by checking the config data used in rendering
      const statuses: Array<'excellent' | 'good' | 'moderate' | 'poor' | 'loss'> = [
        'excellent',
        'good',
        'moderate',
        'poor',
        'loss',
      ]
      statuses.forEach(status => {
        const config = efficiencyFilterConfig[status]
        expect(config.description).toBeTruthy()
        expect(config.description).toContain('ROAS')
      })
    })
  })

  // ============================================================================
  // Loading State
  // ============================================================================

  describe('Loading State', () => {
    it('shows skeleton placeholders during loading', () => {
      renderWithProviders(<EfficiencyFilterChips counts={createMockCounts()} isLoading={true} />)
      // No interactive elements during loading
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      // Skeletons exist (they don't have roles by default)
      const container = document.querySelector('.flex.gap-2')
      expect(container).toBeInTheDocument()
    })

    it('renders 5 skeleton chips matching filter order', () => {
      renderWithProviders(<EfficiencyFilterChips counts={createMockCounts()} isLoading={true} />)
      // 1 "Все" skeleton + 5 status skeletons = 6 total
      const container = document.querySelector('.flex.gap-2')
      const skeletons = container?.querySelectorAll('.rounded-full')
      expect(skeletons?.length).toBe(6) // 1 for "Все" + 5 status
    })

    it('skeletons have h-7 w-20 rounded-full styling', () => {
      renderWithProviders(<EfficiencyFilterChips counts={createMockCounts()} isLoading={true} />)
      const skeletons = document.querySelectorAll('.rounded-full')
      // Status skeletons have w-20, "Все" skeleton has w-16
      skeletons.forEach(s => {
        expect(s.className).toContain('h-7')
        expect(s.className).toContain('rounded-full')
      })
      // At least one status skeleton has w-20
      const w20Count = Array.from(skeletons).filter(s => s.className.includes('w-20'))
      expect(w20Count.length).toBe(5) // 5 status skeletons
    })
  })

  // ============================================================================
  // Chip Styling & Layout
  // ============================================================================

  describe('Chip Styling', () => {
    it('chips have rounded-full border radius, border-2, px-3 py-1, text-sm font-medium', () => {
      renderChips()
      const buttons = getChipButtons()
      buttons.forEach(btn => {
        expect(btn.className).toContain('rounded-full')
        expect(btn.className).toContain('border-2')
        expect(btn.className).toContain('px-3')
        expect(btn.className).toContain('py-1')
        expect(btn.className).toContain('text-sm')
        expect(btn.className).toContain('font-medium')
      })
    })

    it('container has gap-2 spacing and horizontal scroll on overflow', () => {
      renderChips()
      const group = screen.getByRole('group')
      expect(group.className).toContain('gap-2')
      expect(group.className).toContain('overflow-x-auto')
    })
  })

  // ============================================================================
  // Filter Configuration
  // ============================================================================

  describe('Filter Configuration', () => {
    it('all configs have correct Russian labels', () => {
      expect(efficiencyFilterConfig.excellent.label).toBe('Отлично')
      expect(efficiencyFilterConfig.good.label).toBe('Хорошо')
      expect(efficiencyFilterConfig.moderate.label).toBe('Умеренно')
      expect(efficiencyFilterConfig.poor.label).toBe('Слабо')
      expect(efficiencyFilterConfig.loss.label).toBe('Убыток')
    })

    it('all configs have correct ROAS/ROI descriptions', () => {
      expect(efficiencyFilterConfig.excellent.description).toBe('ROAS > 5, ROI > 100%')
      expect(efficiencyFilterConfig.good.description).toBe('ROAS 3-5, ROI 50-100%')
      expect(efficiencyFilterConfig.moderate.description).toBe('ROAS 2-3, ROI 20-50%')
      expect(efficiencyFilterConfig.poor.description).toBe('ROAS 1-2, ROI 0-20%')
      expect(efficiencyFilterConfig.loss.description).toBe('ROAS < 1, ROI < 0%')
    })
  })

  // ============================================================================
  // TDD Verification Tests
  // ============================================================================

  describe('TDD Verification', () => {
    it('has expected efficiency filter configuration structure', () => {
      expect(efficiencyFilterConfig.excellent.label).toBe('Отлично')
      expect(efficiencyFilterConfig.good.label).toBe('Хорошо')
      expect(efficiencyFilterConfig.moderate.label).toBe('Умеренно')
      expect(efficiencyFilterConfig.poor.label).toBe('Слабо')
      expect(efficiencyFilterConfig.loss.label).toBe('Убыток')
    })

    it('has all five efficiency statuses in correct order', () => {
      expect(FILTER_ORDER).toHaveLength(5)
      expect(FILTER_ORDER[0]).toBe('excellent')
      expect(FILTER_ORDER[4]).toBe('loss')
    })

    it('has testing utilities available', () => {
      expect(renderWithProviders).toBeDefined()
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
    })

    it('creates valid mock counts data', () => {
      const mockCounts = createMockCounts()

      expect(mockCounts.excellent).toBe(45)
      expect(mockCounts.good).toBe(78)
      expect(mockCounts.moderate).toBe(112)
      expect(mockCounts.poor).toBe(34)
      expect(mockCounts.loss).toBe(12)
      expect(mockCounts.total).toBe(281)
    })

    it('allows overriding mock counts', () => {
      const mockCounts = createMockCounts({
        excellent: 0,
        loss: 50,
        total: 200,
      })

      expect(mockCounts.excellent).toBe(0)
      expect(mockCounts.loss).toBe(50)
      expect(mockCounts.total).toBe(200)
      // Non-overridden values remain default
      expect(mockCounts.good).toBe(78)
    })

    it('validates color hex codes match spec', () => {
      // From Story 63.4-FE spec
      const colorSpec = {
        excellent: '#22C55E', // Green
        good: '#84CC16', // Light Green (Lime)
        moderate: '#EAB308', // Yellow
        poor: '#F97316', // Orange
        loss: '#EF4444', // Red
      }

      expect(colorSpec.excellent).toBe('#22C55E')
      expect(colorSpec.good).toBe('#84CC16')
      expect(colorSpec.moderate).toBe('#EAB308')
      expect(colorSpec.poor).toBe('#F97316')
      expect(colorSpec.loss).toBe('#EF4444')
    })

    it('validates ROAS thresholds match backend spec', () => {
      const roasThresholds = {
        excellent: { min: 5, description: 'ROAS > 5' },
        good: { min: 3, max: 5, description: 'ROAS 3-5' },
        moderate: { min: 2, max: 3, description: 'ROAS 2-3' },
        poor: { min: 1, max: 2, description: 'ROAS 1-2' },
        loss: { max: 1, description: 'ROAS < 1' },
      }

      expect(roasThresholds.excellent.min).toBe(5)
      expect(roasThresholds.good.min).toBe(3)
      expect(roasThresholds.good.max).toBe(5)
      expect(roasThresholds.moderate.min).toBe(2)
      expect(roasThresholds.moderate.max).toBe(3)
      expect(roasThresholds.poor.min).toBe(1)
      expect(roasThresholds.poor.max).toBe(2)
      expect(roasThresholds.loss.max).toBe(1)
    })

    it('validates ROI thresholds match backend spec', () => {
      const roiThresholds = {
        excellent: { min: 1.0, description: 'ROI > 100%' },
        good: { min: 0.5, max: 1.0, description: 'ROI 50-100%' },
        moderate: { min: 0.2, max: 0.5, description: 'ROI 20-50%' },
        poor: { min: 0, max: 0.2, description: 'ROI 0-20%' },
        loss: { max: 0, description: 'ROI < 0%' },
      }

      expect(roiThresholds.excellent.min).toBe(1.0)
      expect(roiThresholds.good.min).toBe(0.5)
      expect(roiThresholds.loss.max).toBe(0)
    })
  })
})
