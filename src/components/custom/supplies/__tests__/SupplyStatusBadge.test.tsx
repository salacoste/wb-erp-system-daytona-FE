/**
 * SupplyStatusBadge Component Tests
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Correct color for each status (AC8)
 * - Correct Russian label for each status
 * - Icon for each status
 * - Size variants
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SupplyStatusBadge } from '../SupplyStatusBadge'
import type { SupplyStatus as RealSupplyStatus } from '@/types/supplies'

type SupplyStatus = 'OPEN' | 'CLOSED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED'

const EXPECTED_STATUS_CONFIG = {
  OPEN: {
    label: 'Открыта',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
  },
  CLOSED: {
    label: 'Закрыта',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
  },
  DELIVERING: {
    label: 'В пути',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
  },
  DELIVERED: {
    label: 'Доставлена',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50',
  },
  CANCELLED: {
    label: 'Отменена',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
  },
}

describe('SupplyStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Status Labels
  // ===========================================================================

  describe('Status Labels', () => {
    it('displays "Открыта" for OPEN status', () => {
      render(<SupplyStatusBadge status="OPEN" />)

      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })

    it('displays "Закрыта" for CLOSED status', () => {
      render(<SupplyStatusBadge status="CLOSED" />)

      expect(screen.getByText('Закрыта')).toBeInTheDocument()
    })

    it('displays "В пути" for DELIVERING status', () => {
      render(<SupplyStatusBadge status="DELIVERING" />)

      expect(screen.getByText('В пути')).toBeInTheDocument()
    })

    it('displays "Доставлена" for DELIVERED status', () => {
      render(<SupplyStatusBadge status="DELIVERED" />)

      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })

    it('displays "Отменена" for CANCELLED status', () => {
      render(<SupplyStatusBadge status="CANCELLED" />)

      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })

    it('all labels use Russian locale', () => {
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']

      for (const status of statuses) {
        const { unmount } = render(<SupplyStatusBadge status={status} />)
        // Cyrillic characters present in the rendered label
        const label = EXPECTED_STATUS_CONFIG[status].label
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      }
    })
  })

  // ===========================================================================
  // 2. Status Colors
  // ===========================================================================

  describe('Status Colors', () => {
    it('applies blue colors for OPEN status', () => {
      render(<SupplyStatusBadge status="OPEN" />)

      const badge = screen.getByText('Открыта').closest('[class]')
      expect(badge?.className).toContain('text-blue-700')
      expect(badge?.className).toContain('bg-blue-50')
    })

    it('applies orange colors for CLOSED status', () => {
      render(<SupplyStatusBadge status="CLOSED" />)

      const badge = screen.getByText('Закрыта').closest('[class]')
      expect(badge?.className).toContain('text-orange-700')
      expect(badge?.className).toContain('bg-orange-50')
    })

    it('applies purple colors for DELIVERING status', () => {
      render(<SupplyStatusBadge status="DELIVERING" />)

      const badge = screen.getByText('В пути').closest('[class]')
      expect(badge?.className).toContain('text-purple-700')
      expect(badge?.className).toContain('bg-purple-50')
    })

    it('applies green colors for DELIVERED status', () => {
      render(<SupplyStatusBadge status="DELIVERED" />)

      const badge = screen.getByText('Доставлена').closest('[class]')
      expect(badge?.className).toContain('text-green-700')
      expect(badge?.className).toContain('bg-green-50')
    })

    it('applies red colors for CANCELLED status', () => {
      render(<SupplyStatusBadge status="CANCELLED" />)

      const badge = screen.getByText('Отменена').closest('[class]')
      expect(badge?.className).toContain('text-red-700')
      expect(badge?.className).toContain('bg-red-50')
    })

    it('applies text color class correctly', () => {
      const { container } = render(<SupplyStatusBadge status="DELIVERED" />)

      // Green text for DELIVERED
      const el = container.querySelector('.text-green-700')
      expect(el).toBeInTheDocument()
    })

    it('applies background color class correctly', () => {
      const { container } = render(<SupplyStatusBadge status="CANCELLED" />)

      // Red background for CANCELLED
      const el = container.querySelector('.bg-red-50')
      expect(el).toBeInTheDocument()
    })

    it('applies border color class matching status', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      const el = container.querySelector('.border-blue-200')
      expect(el).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 3. Status Icons
  // ===========================================================================

  describe('Status Icons', () => {
    it('renders an SVG icon for OPEN status', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      // Lucide icons render as <svg> elements
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders an SVG icon for each status', () => {
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']

      for (const status of statuses) {
        const { container, unmount } = render(<SupplyStatusBadge status={status} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
        unmount()
      }
    })

    it('icon has correct size class for default size', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      const svg = container.querySelector('svg')
      expect(svg?.className.baseVal ?? svg?.getAttribute('class') ?? '').toContain('h-4')
    })

    it('icon has correct size class for sm size', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="sm" />)

      const svg = container.querySelector('svg')
      expect(svg?.className.baseVal ?? svg?.getAttribute('class') ?? '').toContain('h-3')
    })

    it('icon has correct size class for lg size', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="lg" />)

      const svg = container.querySelector('svg')
      expect(svg?.className.baseVal ?? svg?.getAttribute('class') ?? '').toContain('h-5')
    })

    it('hides icon when showIcon is false', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" showIcon={false} />)

      expect(container.querySelector('svg')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Size Variants
  // ===========================================================================

  describe('Size Variants', () => {
    it('renders default size when no size prop', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      const badge = container.querySelector('.text-sm')
      expect(badge).toBeInTheDocument()
    })

    it('renders small variant with sm size prop', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="sm" />)

      const badge = container.querySelector('.text-xs')
      expect(badge).toBeInTheDocument()
    })

    it('renders large variant with lg size prop', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="lg" />)

      const badge = container.querySelector('.text-base')
      expect(badge).toBeInTheDocument()
    })

    it('small variant has smaller padding', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="sm" />)

      const badge = container.querySelector('.px-2')
      expect(badge).toBeInTheDocument()
    })

    it('large variant has larger padding', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" size="lg" />)

      const badge = container.querySelector('.px-3')
      expect(badge).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 5. Custom className
  // ===========================================================================

  describe('Custom className', () => {
    it('accepts additional className prop', () => {
      const { container } = render(
        <SupplyStatusBadge status="OPEN" className="custom-test-class" />
      )

      const el = container.querySelector('.custom-test-class')
      expect(el).toBeInTheDocument()
    })

    it('merges custom className with default classes', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" className="custom-class" />)

      const badge = container.querySelector('.custom-class')
      // Status color classes should still be present
      expect(badge?.className).toContain('text-blue-700')
      expect(badge?.className).toContain('bg-blue-50')
    })

    it('custom className does not override status colors', () => {
      const { container } = render(<SupplyStatusBadge status="CANCELLED" className="extra-class" />)

      const badge = container.querySelector('.extra-class')
      expect(badge?.className).toContain('text-red-700')
      expect(badge?.className).toContain('bg-red-50')
    })
  })

  // ===========================================================================
  // 6. Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('handles unknown status gracefully', () => {
      render(<SupplyStatusBadge status={'UNKNOWN_STATUS' as RealSupplyStatus} />)

      expect(screen.getByText('Неизвестно')).toBeInTheDocument()
    })

    it('falls back to gray colors for an invalid status', () => {
      const { container } = render(
        <SupplyStatusBadge status={'FUTURE_STATUS' as RealSupplyStatus} />
      )

      const badge = container.querySelector('.text-gray-600')
      expect(badge).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 7. Accessibility
  // ===========================================================================

  describe('Accessibility', () => {
    it('icon has aria-hidden="true"', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('status label is readable text content', () => {
      render(<SupplyStatusBadge status="DELIVERED" />)

      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })

    it('badge renders as a non-interactive element', () => {
      const { container } = render(<SupplyStatusBadge status="OPEN" />)

      // Badge should not be a button or link
      expect(container.querySelector('button')).toBeNull()
      expect(container.querySelector('a')).toBeNull()
    })
  })

  // ===========================================================================
  // TDD Verification
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have expected status configuration', () => {
      expect(EXPECTED_STATUS_CONFIG).toBeDefined()
      expect(Object.keys(EXPECTED_STATUS_CONFIG)).toHaveLength(5)

      expect(EXPECTED_STATUS_CONFIG.OPEN.label).toBe('Открыта')
      expect(EXPECTED_STATUS_CONFIG.CLOSED.label).toBe('Закрыта')
      expect(EXPECTED_STATUS_CONFIG.DELIVERING.label).toBe('В пути')
      expect(EXPECTED_STATUS_CONFIG.DELIVERED.label).toBe('Доставлена')
      expect(EXPECTED_STATUS_CONFIG.CANCELLED.label).toBe('Отменена')
    })

    it('should have testing utilities available', () => {
      expect(render).toBeDefined()
      expect(screen).toBeDefined()
    })

    it('should have all status types defined', () => {
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']

      for (const status of statuses) {
        expect(EXPECTED_STATUS_CONFIG[status]).toBeDefined()
        expect(EXPECTED_STATUS_CONFIG[status].label).toBeDefined()
        expect(EXPECTED_STATUS_CONFIG[status].colorClass).toBeDefined()
        expect(EXPECTED_STATUS_CONFIG[status].bgClass).toBeDefined()
      }
    })
  })

  // ===========================================================================
  // Unknown-status fallback (rendered)
  // ===========================================================================

  describe('unknown-status fallback (rendered)', () => {
    it('renders neutral "Неизвестно" badge for unrecognized status', () => {
      render(<SupplyStatusBadge status={'FUTURE_WB_STATUS' as RealSupplyStatus} />)

      expect(screen.getByText('Неизвестно')).toBeInTheDocument()
      expect(screen.queryByText('Открыта')).not.toBeInTheDocument()
    })

    it('renders correct label for a known status', () => {
      render(<SupplyStatusBadge status="DELIVERED" />)

      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })
  })
})
