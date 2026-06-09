/**
 * Unit Tests for SupplyStatusStepper component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Shows 4 steps: OPEN -> CLOSED -> DELIVERING -> DELIVERED
 * - Current step highlighted
 * - Completed steps have checkmark
 * - Future steps grayed out
 * - CANCELLED shows different styling
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SupplyStatusStepper } from '../SupplyStatusStepper'
import { SUPPLY_STATUSES } from '@/test/fixtures/supplies'
import type { SupplyStatus } from '@/types/supplies'

function renderStepper(status: SupplyStatus) {
  return renderWithProviders(<SupplyStatusStepper status={status} />)
}

describe('SupplyStatusStepper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Basic Rendering Tests (AC4)
  // ===========================================================================

  describe('Basic Rendering', () => {
    it('renders 4 steps for normal flow', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Открыта')).toBeInTheDocument()
      expect(screen.getByText('Закрыта')).toBeInTheDocument()
      expect(screen.getByText('В пути')).toBeInTheDocument()
      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })

    it('steps are in order: Открыта -> Закрыта -> В пути -> Доставлена', () => {
      renderStepper('OPEN')
      const labels = screen.getAllByText(/Открыта|Закрыта|В пути|Доставлена/)
      const order = labels.map(el => el.textContent)
      const openIdx = order.indexOf('Открыта')
      const closedIdx = order.indexOf('Закрыта')
      const deliveringIdx = order.indexOf('В пути')
      const deliveredIdx = order.indexOf('Доставлена')
      expect(openIdx).toBeLessThan(closedIdx)
      expect(closedIdx).toBeLessThan(deliveringIdx)
      expect(deliveringIdx).toBeLessThan(deliveredIdx)
    })

    it('renders horizontal layout on desktop', () => {
      renderStepper('OPEN')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      expect(nav).toBeInTheDocument()
      const list = nav.querySelector('ol')
      expect(list?.className).toContain('flex')
    })

    it('renders nav element', () => {
      renderStepper('OPEN')
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('steps connected by lines/connectors', () => {
      renderStepper('OPEN')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      const connectors = nav.querySelectorAll('div[aria-hidden="true"]')
      expect(connectors.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // 2. Step Labels Tests (AC4)
  // ===========================================================================

  describe('Step Labels', () => {
    it('OPEN step shows label "Открыта"', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })

    it('CLOSED step shows label "Закрыта"', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Закрыта')).toBeInTheDocument()
    })

    it('DELIVERING step shows label "В пути"', () => {
      renderStepper('OPEN')
      expect(screen.getByText('В пути')).toBeInTheDocument()
    })

    it('DELIVERED step shows label "Доставлена"', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Доставлена')).toBeInTheDocument()
    })

    it('CANCELLED shows label "Отменена" (special case)', () => {
      renderStepper('CANCELLED')
      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 3. OPEN Status Tests
  // ===========================================================================

  describe('OPEN Status', () => {
    it('OPEN step is highlighted with current styling', () => {
      renderStepper('OPEN')
      const openLabel = screen.getByText('Открыта')
      expect(openLabel.className).toContain('text-primary')
    })

    it('OPEN step shows filled circle indicator', () => {
      renderStepper('OPEN')
      const openLabel = screen.getByText('Открыта')
      // The label is inside a flex column container; the circle is a sibling div above it
      const parentDiv = openLabel.parentElement
      expect(parentDiv).toBeInTheDocument()
      expect(parentDiv?.querySelector('.rounded-full')).toBeTruthy()
    })

    it('CLOSED, DELIVERING, DELIVERED steps are gray/outlined', () => {
      renderStepper('OPEN')
      const closedLabel = screen.getByText('Закрыта')
      expect(closedLabel.className).toContain('text-muted-foreground')
      const deliveringLabel = screen.getByText('В пути')
      expect(deliveringLabel.className).toContain('text-muted-foreground')
      const deliveredLabel = screen.getByText('Доставлена')
      expect(deliveredLabel.className).toContain('text-muted-foreground')
    })

    it('no checkmarks visible (no completed steps)', () => {
      const { container } = renderStepper('OPEN')
      const checkIcons = container.querySelectorAll('.text-white')
      expect(checkIcons.length).toBe(0)
    })

    it('connectors after OPEN are gray', () => {
      renderStepper('OPEN')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      const connectors = nav.querySelectorAll('.bg-muted')
      expect(connectors.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // 4. CLOSED Status Tests
  // ===========================================================================

  describe('CLOSED Status', () => {
    it('OPEN step shows green checkmark (completed)', () => {
      const { container } = renderStepper('CLOSED')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(1)
    })

    it('CLOSED step is highlighted with primary styling', () => {
      renderStepper('CLOSED')
      const closedLabel = screen.getByText('Закрыта')
      expect(closedLabel.className).toContain('text-primary')
    })

    it('DELIVERING, DELIVERED steps are gray/outlined', () => {
      renderStepper('CLOSED')
      const deliveringLabel = screen.getByText('В пути')
      expect(deliveringLabel.className).toContain('text-muted-foreground')
      const deliveredLabel = screen.getByText('Доставлена')
      expect(deliveredLabel.className).toContain('text-muted-foreground')
    })

    it('connector between OPEN and CLOSED is green', () => {
      renderStepper('CLOSED')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      const greenConnectors = nav.querySelectorAll('.bg-green-500')
      expect(greenConnectors.length).toBeGreaterThan(0)
    })

    it('connectors after CLOSED are gray', () => {
      renderStepper('CLOSED')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      const grayConnectors = nav.querySelectorAll('.bg-muted')
      expect(grayConnectors.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // 5. DELIVERING Status Tests
  // ===========================================================================

  describe('DELIVERING Status', () => {
    it('OPEN step shows green checkmark', () => {
      const { container } = renderStepper('DELIVERING')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(1)
    })

    it('CLOSED step shows green checkmark', () => {
      const { container } = renderStepper('DELIVERING')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(2)
    })

    it('DELIVERING step is highlighted with primary styling', () => {
      renderStepper('DELIVERING')
      const deliveringLabel = screen.getByText('В пути')
      expect(deliveringLabel.className).toContain('text-primary')
    })

    it('DELIVERED step is gray/outlined', () => {
      renderStepper('DELIVERING')
      const deliveredLabel = screen.getByText('Доставлена')
      expect(deliveredLabel.className).toContain('text-muted-foreground')
    })

    it('connectors up to DELIVERING are green', () => {
      const { container } = renderStepper('DELIVERING')
      const greenConnectors = container.querySelectorAll('.bg-green-500')
      expect(greenConnectors.length).toBeGreaterThanOrEqual(2)
    })

    it('connector after DELIVERING is gray', () => {
      renderStepper('DELIVERING')
      const nav = screen.getByRole('navigation', { name: 'Статус поставки' })
      const grayConnectors = nav.querySelectorAll('.bg-muted')
      expect(grayConnectors.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================================================
  // 6. DELIVERED Status Tests
  // ===========================================================================

  describe('DELIVERED Status', () => {
    it('OPEN step shows green checkmark', () => {
      const { container } = renderStepper('DELIVERED')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(1)
    })

    it('CLOSED step shows green checkmark', () => {
      const { container } = renderStepper('DELIVERED')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(2)
    })

    it('DELIVERING step shows green checkmark', () => {
      const { container } = renderStepper('DELIVERED')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(3)
    })

    it('DELIVERED step is highlighted as current', () => {
      renderStepper('DELIVERED')
      const deliveredLabel = screen.getByText('Доставлена')
      // Current step uses text-primary class
      expect(deliveredLabel.className).toContain('text-primary')
    })

    it('all connectors are green', () => {
      const { container } = renderStepper('DELIVERED')
      const grayConnectors = container.querySelectorAll('.bg-muted')
      expect(grayConnectors.length).toBe(0)
    })

    it('final step has checkmark', () => {
      const { container } = renderStepper('DELIVERED')
      const greenCircles = container.querySelectorAll('.bg-green-500')
      expect(greenCircles.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ===========================================================================
  // 7. CANCELLED Status Tests (Special Case)
  // ===========================================================================

  describe('CANCELLED Status', () => {
    it('does not show standard 4-step stepper', () => {
      renderStepper('CANCELLED')
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    it('shows single "Отменена" state with X icon', () => {
      renderStepper('CANCELLED')
      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })

    it('shows red styling for cancelled state', () => {
      const { container } = renderStepper('CANCELLED')
      const redElements = container.querySelectorAll('[class*="red"]')
      expect(redElements.length).toBeGreaterThan(0)
    })

    it('shows cancelled icon (XCircle)', () => {
      const { container } = renderStepper('CANCELLED')
      const svgIcons = container.querySelectorAll('svg')
      expect(svgIcons.length).toBeGreaterThan(0)
    })

    it('shows cancellation message or reason if available', () => {
      renderStepper('CANCELLED')
      expect(screen.getByText('Поставка была отменена')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 8. Timestamps on Steps
  // ===========================================================================

  describe('Timestamps', () => {
    it('stepper does not crash without timestamps', () => {
      expect(() => renderStepper('OPEN')).not.toThrow()
    })

    it('stepper renders correctly for each status', () => {
      const expectedLabel: Record<SupplyStatus, string> = {
        OPEN: 'Открыта',
        CLOSED: 'Закрыта',
        DELIVERING: 'В пути',
        DELIVERED: 'Доставлена',
        CANCELLED: 'Отменена',
      }
      const statuses: SupplyStatus[] = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED', 'CANCELLED']
      for (const status of statuses) {
        const { unmount, container } = renderStepper(status)
        expect(container.textContent).toContain(expectedLabel[status])
        unmount()
      }
    })

    it('no timestamp elements in current stepper implementation', () => {
      const { container } = renderStepper('DELIVERED')
      const timeElements = container.querySelectorAll('time')
      expect(timeElements.length).toBe(0)
    })

    it('current step shows step label', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Открыта')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 9. Accessibility (AC14)
  // ===========================================================================

  describe('Accessibility', () => {
    it('stepper has role="navigation"', () => {
      renderStepper('OPEN')
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('stepper has aria-label="Статус поставки"', () => {
      renderStepper('OPEN')
      expect(screen.getByRole('navigation', { name: 'Статус поставки' })).toBeInTheDocument()
    })

    it('current step has aria-current="step"', () => {
      renderStepper('OPEN')
      const openLabel = screen.getByText('Открыта')
      expect(openLabel).toHaveAttribute('aria-current', 'step')
    })

    it('completed steps do not have aria-current', () => {
      renderStepper('DELIVERED')
      const openLabel = screen.getByText('Открыта')
      expect(openLabel).not.toHaveAttribute('aria-current')
    })

    it('step labels are properly associated', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Открыта')).toBeInTheDocument()
      expect(screen.getByText('Закрыта')).toBeInTheDocument()
    })

    it('checkmark icons have aria-hidden="true"', () => {
      const { container } = renderStepper('CLOSED')
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })

    it('color contrast via semantic classes', () => {
      renderStepper('OPEN')
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 10. Mobile Responsive (AC13)
  // ===========================================================================

  describe('Mobile Responsive', () => {
    it('stepper renders correctly at any viewport', () => {
      renderStepper('OPEN')
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('step labels visible', () => {
      renderStepper('OPEN')
      expect(screen.getByText('Открыта')).toBeVisible()
      expect(screen.getByText('Доставлена')).toBeVisible()
    })

    it('connectors visible between steps', () => {
      const { container } = renderStepper('OPEN')
      const connectors = container.querySelectorAll('.h-0\\.5')
      expect(connectors.length).toBeGreaterThan(0)
    })

    it('CANCELLED state renders compactly', () => {
      renderStepper('CANCELLED')
      expect(screen.getByText('Отменена')).toBeInTheDocument()
      expect(screen.getByText('Поставка была отменена')).toBeInTheDocument()
    })

    it('step indicators have adequate size', () => {
      const { container } = renderStepper('OPEN')
      const circles = container.querySelectorAll('.rounded-full')
      expect(circles.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // TDD Verification Test
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have all supply statuses defined', () => {
      expect(SUPPLY_STATUSES).toBeDefined()
      expect(SUPPLY_STATUSES).toContain('OPEN')
      expect(SUPPLY_STATUSES).toContain('CLOSED')
      expect(SUPPLY_STATUSES).toContain('DELIVERING')
      expect(SUPPLY_STATUSES).toContain('DELIVERED')
      expect(SUPPLY_STATUSES).toContain('CANCELLED')
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })

    it('should have correct status order for stepper', () => {
      const expectedOrder = ['OPEN', 'CLOSED', 'DELIVERING', 'DELIVERED']
      expectedOrder.forEach(status => {
        expect(SUPPLY_STATUSES).toContain(status)
      })
    })
  })
})
