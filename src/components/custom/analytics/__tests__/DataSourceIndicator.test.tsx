/**
 * Tests for DataSourceIndicator Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests data source badge display with correct labels, colors, and icons
 * for different data sources (orders_fbs, reports, analytics).
 *
 * @see docs/stories/epic-51/story-51.4-fe-fbs-trends-chart.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import {
  DataSourceIndicator,
  getDataSourceConfig,
  getDataSourceBadgeLabel,
} from '../DataSourceIndicator'

describe('DataSourceIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Basic Rendering Tests (~8 tests)
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render Badge component as span element', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })

    it('should render with rounded border (outline variant styling)', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('rounded-md')
      expect(badge?.className).toContain('border')
    })

    it('should display label text content', () => {
      render(<DataSourceIndicator source="orders_fbs" />)
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()
    })

    it('should apply correct className via cn utility', () => {
      const { container } = render(
        <DataSourceIndicator source="orders_fbs" className="test-extra" />
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('test-extra')
    })

    it('should handle unknown source gracefully — falls back to orders_fbs config', () => {
      // Cast through unknown to simulate an unrecognized source
      const unknownSource = 'unknown_source' as 'orders_fbs' | 'reports' | 'analytics'
      render(<DataSourceIndicator source={unknownSource} />)
      // Falls back to orders_fbs label
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()
    })

    it('should render inline with other elements', () => {
      const { container } = render(
        <div>
          <span>Before</span>
          <DataSourceIndicator source="orders_fbs" />
          <span>After</span>
        </div>
      )
      expect(screen.getByText('Before')).toBeInTheDocument()
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()
      expect(screen.getByText('After')).toBeInTheDocument()
      // Badge is inline-flex
      const badge = container.querySelector('span.inline-flex')
      expect(badge).toBeInTheDocument()
    })

    it('should not be interactive (display only) — no button/tabindex', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge?.getAttribute('role')).toBeNull()
      expect(badge?.getAttribute('tabIndex')).toBeNull()
    })

    it('should have consistent sizing (text-xs, font-medium, px-2, py-0.5)', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('text-xs')
      expect(badge?.className).toContain('font-medium')
      expect(badge?.className).toContain('px-2')
      expect(badge?.className).toContain('py-0.5')
    })
  })

  // ============================================================================
  // orders_fbs Source Tests (~5 tests)
  // ============================================================================

  describe('orders_fbs (Realtime)', () => {
    it('should display "Реалтайм" label', () => {
      render(<DataSourceIndicator source="orders_fbs" />)
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()
    })

    it('should apply green color styling (bg-status-success/5 text-status-success)', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-status-success/5')
      expect(badge?.className).toContain('text-status-success')
    })

    it('should include green border (border-status-success/20)', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('border-status-success/20')
    })

    it('should indicate 0-30 days data range via tooltip description', () => {
      const config = getDataSourceConfig('orders_fbs')
      expect(config.description).toContain('30')
    })

    it('should render correctly when source is "orders_fbs"', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" />)
      expect(container.querySelector('span')).toBeInTheDocument()
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // reports Source Tests (~5 tests)
  // ============================================================================

  describe('reports (Daily)', () => {
    it('should display "Ежедневно" label', () => {
      render(<DataSourceIndicator source="reports" />)
      expect(screen.getByText('Ежедневно')).toBeInTheDocument()
    })

    it('should apply blue color styling (bg-status-information/10 text-status-information)', () => {
      const { container } = render(<DataSourceIndicator source="reports" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-status-information/10')
      expect(badge?.className).toContain('text-status-information')
    })

    it('should include blue border (border-status-information/20)', () => {
      const { container } = render(<DataSourceIndicator source="reports" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('border-status-information/20')
    })

    it('should indicate 31-90 days data range via tooltip description', () => {
      const config = getDataSourceConfig('reports')
      expect(config.description).toContain('31-90')
    })

    it('should render correctly when source is "reports"', () => {
      const { container } = render(<DataSourceIndicator source="reports" />)
      expect(container.querySelector('span')).toBeInTheDocument()
      expect(screen.getByText('Ежедневно')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // analytics Source Tests (~5 tests)
  // ============================================================================

  describe('analytics (Weekly)', () => {
    it('should display "Еженедельно" label', () => {
      render(<DataSourceIndicator source="analytics" />)
      expect(screen.getByText('Еженедельно')).toBeInTheDocument()
    })

    it('should apply purple color styling (bg-status-pending/10 text-status-pending)', () => {
      const { container } = render(<DataSourceIndicator source="analytics" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-status-pending/10')
      expect(badge?.className).toContain('text-status-pending')
    })

    it('should include purple border (border-status-pending/20)', () => {
      const { container } = render(<DataSourceIndicator source="analytics" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('border-status-pending/20')
    })

    it('should indicate 91-365 days data range via tooltip description', () => {
      const config = getDataSourceConfig('analytics')
      expect(config.description).toContain('91-365')
    })

    it('should render correctly when source is "analytics"', () => {
      const { container } = render(<DataSourceIndicator source="analytics" />)
      expect(container.querySelector('span')).toBeInTheDocument()
      expect(screen.getByText('Еженедельно')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Tooltip Tests (~4 tests)
  // ============================================================================

  describe('Tooltip', () => {
    it('should show tooltip on hover when showTooltip is true', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" showTooltip />)
      const badge = container.querySelector('span')
      expect(badge?.getAttribute('title')).toBeTruthy()
      expect(badge?.getAttribute('title')).toContain('Данные из API заказов FBS')
    })

    it('should display explanation text in tooltip', () => {
      const { container } = render(<DataSourceIndicator source="reports" showTooltip />)
      const badge = container.querySelector('span')
      expect(badge?.getAttribute('title')).toBe('Ежедневные отчёты (31-90 дней)')
    })

    it('should hide tooltip on mouse leave — no title when showTooltip is false', () => {
      const { container } = render(<DataSourceIndicator source="orders_fbs" showTooltip={false} />)
      const badge = container.querySelector('span')
      expect(badge?.getAttribute('title')).toBeNull()
    })

    it('should position tooltip correctly — uses native title attribute', () => {
      const { container } = render(<DataSourceIndicator source="analytics" showTooltip />)
      const badge = container.querySelector('span')
      // Native title attribute positions tooltip via browser (no custom positioning)
      expect(badge?.getAttribute('title')).toBe('Еженедельные агрегаты (91-365 дней)')
    })
  })

  // ============================================================================
  // Dynamic Update Tests (~3 tests)
  // ============================================================================

  describe('Dynamic Updates', () => {
    it('should update badge when source prop changes', () => {
      const { rerender } = render(<DataSourceIndicator source="orders_fbs" />)
      expect(screen.getByText('Реалтайм')).toBeInTheDocument()

      rerender(<DataSourceIndicator source="reports" />)
      expect(screen.getByText('Ежедневно')).toBeInTheDocument()
      expect(screen.queryByText('Реалтайм')).not.toBeInTheDocument()
    })

    it('should transition smoothly between sources — re-renders without errors', () => {
      const { rerender } = render(<DataSourceIndicator source="orders_fbs" />)
      expect(() => {
        rerender(<DataSourceIndicator source="reports" />)
        rerender(<DataSourceIndicator source="analytics" />)
        rerender(<DataSourceIndicator source="orders_fbs" />)
      }).not.toThrow()
    })

    it('should maintain consistent layout on source change — same element type', () => {
      const { container, rerender } = render(<DataSourceIndicator source="orders_fbs" />)
      const firstTag = container.querySelector('span')?.tagName

      rerender(<DataSourceIndicator source="reports" />)
      const secondTag = container.querySelector('span')?.tagName

      // Same element type maintains consistent layout
      expect(firstTag).toBe(secondTag)
      expect(firstTag).toBe('SPAN')
    })
  })

  // ============================================================================
  // Utility Exports Tests
  // ============================================================================

  describe('Utility exports', () => {
    it('getDataSourceConfig returns correct config for each source', () => {
      expect(getDataSourceConfig('orders_fbs').label).toBe('Реалтайм')
      expect(getDataSourceConfig('reports').label).toBe('Ежедневно')
      expect(getDataSourceConfig('analytics').label).toBe('Еженедельно')
    })

    it('getDataSourceBadgeLabel returns correct labels', () => {
      expect(getDataSourceBadgeLabel('orders_fbs')).toBe('Реалтайм')
      expect(getDataSourceBadgeLabel('reports')).toBe('Ежедневно')
      expect(getDataSourceBadgeLabel('analytics')).toBe('Еженедельно')
    })
  })
})
