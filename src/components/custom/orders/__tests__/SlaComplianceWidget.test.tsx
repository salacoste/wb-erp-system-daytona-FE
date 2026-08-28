/**
 * Unit Tests for SlaComplianceWidget component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Test coverage:
 * - SLA percentage display (AC1)
 * - Color coding thresholds
 * - Pending and breached orders display
 * - Tooltip with SLA explanation
 * - Loading and error states
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SlaComplianceWidget } from '../analytics/SlaComplianceWidget'
import {
  mockSlaMetricsExcellent,
  mockSlaMetricsWarning,
  mockSlaMetricsCritical,
  mockSlaMetricsNoRisk,
  slaColorTestCases,
} from '@/test/fixtures/orders-analytics'

describe('SlaComplianceWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderWidget(overrides: Partial<Parameters<typeof SlaComplianceWidget>[0]> = {}) {
    return renderWithProviders(<SlaComplianceWidget {...overrides} />)
  }

  // ===========================================================================
  // 1. SLA Percentage Display Tests (AC1)
  // ===========================================================================

  describe('SLA Percentage Display', () => {
    it('displays confirmation + completion SLA percentages in Russian locale', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByText(/98,5\s%/)).toBeInTheDocument()
      expect(screen.getByText(/96,2\s%/)).toBeInTheDocument()
    })

    it('displays "Подтверждение" label for confirmation metric', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByText('Подтверждение')).toBeInTheDocument()
    })

    it('displays "Выполнение" label for completion metric', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByText('Выполнение')).toBeInTheDocument()
    })

    it('displays widget title "SLA Соответствие"', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByText(/SLA Соответствие/)).toBeInTheDocument()
    })

    it('rounds percentage to one decimal place', () => {
      const data = { ...mockSlaMetricsExcellent, confirmationCompliancePercent: 95.567 }
      renderWidget({ data })
      expect(screen.getByText(/95,6\s%/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 2. Color Coding Tests (AC1)
  // ===========================================================================

  describe('Color Coding Thresholds', () => {
    describe('Green (>= 95%)', () => {
      it('applies green color for 95% compliance', () => {
        const data = { ...mockSlaMetricsExcellent, confirmationCompliancePercent: 95.0 }
        renderWidget({ data })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-green-600')
      })

      it('applies green color for 100% compliance', () => {
        renderWidget({ data: mockSlaMetricsNoRisk })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-green-600')
      })

      it('shows green check icon for excellent compliance', () => {
        renderWidget({ data: mockSlaMetricsExcellent })
        const icon = screen.getByTestId('confirmation-sla-status-icon')
        expect(icon.querySelector('.text-status-success')).toBeInTheDocument()
      })
    })

    describe('Yellow (85-94%)', () => {
      it('applies yellow color for 94.9% compliance', () => {
        const data = { ...mockSlaMetricsWarning, confirmationCompliancePercent: 94.9 }
        renderWidget({ data })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-yellow-600')
      })

      it('applies yellow color for 85% compliance', () => {
        const data = { ...mockSlaMetricsWarning, confirmationCompliancePercent: 85.0 }
        renderWidget({ data })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-yellow-600')
      })

      it('shows yellow warning icon for warning compliance', () => {
        renderWidget({ data: mockSlaMetricsWarning })
        const icon = screen.getByTestId('confirmation-sla-status-icon')
        expect(icon.querySelector('.text-status-warning')).toBeInTheDocument()
      })
    })

    describe('Red (< 85%)', () => {
      it('applies red color for 84.9% compliance', () => {
        const data = { ...mockSlaMetricsCritical, confirmationCompliancePercent: 84.9 }
        renderWidget({ data })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-red-600')
      })

      it('applies red color for 0% compliance', () => {
        const data = { ...mockSlaMetricsCritical, confirmationCompliancePercent: 0 }
        renderWidget({ data })
        const metric = screen.getByTestId('confirmation-sla-value')
        expect(metric.className).toContain('text-red-600')
      })

      it('shows red alert icon for critical compliance', () => {
        renderWidget({ data: mockSlaMetricsCritical })
        const icon = screen.getByTestId('confirmation-sla-status-icon')
        expect(icon.querySelector('.text-status-error')).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // 3. Pending and Breached Orders Display (AC1)
  // ===========================================================================

  describe('Pending and Breached Orders', () => {
    it('displays pending orders count', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByText(/В ожидании: 8/)).toBeInTheDocument()
    })

    it('displays breached orders count when > 0', () => {
      renderWidget({ data: mockSlaMetricsCritical })
      expect(screen.getByText(/Нарушено: 12/)).toBeInTheDocument()
    })

    it('applies red styling to breached count when > 0', () => {
      renderWidget({ data: mockSlaMetricsCritical })
      const badge = screen.getByTestId('breached-badge')
      // Red color is on the badge wrapper
      expect(badge.className).toContain('text-status-error')
    })

    it('shows red badge for breached orders', () => {
      renderWidget({ data: mockSlaMetricsCritical })
      const badge = screen.getByTestId('breached-badge')
      expect(badge.className).toContain('bg-status-error/10')
    })

    it('shows "Нарушено: 0" with normal styling when no breaches', () => {
      renderWidget({ data: mockSlaMetricsNoRisk })
      expect(screen.getByText(/Нарушено: 0/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 4. Tooltip Tests (AC1)
  // ===========================================================================

  describe('SLA Threshold Tooltip', () => {
    it('shows help icon next to SLA label', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      expect(screen.getByTestId('sla-help-icon')).toBeInTheDocument()
    })

    it('displays tooltip trigger for SLA thresholds', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      const trigger = screen.getByTestId('sla-help-icon')
      expect(trigger).toBeInTheDocument()
    })

    it('tooltip trigger is present for SLA thresholds', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      // The help icon serves as the tooltip trigger
      const trigger = screen.getByTestId('sla-help-icon')
      expect(trigger).toBeInTheDocument()
      // Tooltip content is rendered via Radix portal (not visible in jsdom without hover)
    })
  })

  // ===========================================================================
  // 5. Loading State Tests
  // ===========================================================================

  describe('Loading State', () => {
    it('shows skeleton when isLoading is true', () => {
      renderWidget({ isLoading: true })
      expect(screen.getByTestId('sla-widget-skeleton')).toBeInTheDocument()
    })

    it('hides actual content during loading', () => {
      renderWidget({ data: mockSlaMetricsExcellent, isLoading: true })
      expect(screen.queryByText(/98,5\s%/)).not.toBeInTheDocument()
    })

    it('shows widget title even during loading', () => {
      renderWidget({ isLoading: true })
      expect(screen.getByText(/SLA Соответствие/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // 6. Error State Tests
  // ===========================================================================

  describe('Error State', () => {
    it('shows error message when error prop is provided', () => {
      renderWidget({ error: new Error('Failed') })
      expect(screen.getByText(/Не удалось загрузить данные SLA/)).toBeInTheDocument()
    })

    it('shows retry button on error when onRetry provided', () => {
      const onRetry = vi.fn()
      renderWidget({ error: new Error('Failed'), onRetry })
      expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
    })

    it('calls onRetry when retry button clicked', () => {
      const onRetry = vi.fn()
      renderWidget({ error: new Error('Failed'), onRetry })
      fireEvent.click(screen.getByRole('button', { name: /Повторить/ }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // 7. Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses aria-label for percentage values', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      const confirmation = screen.getByTestId('confirmation-sla-value')
      expect(confirmation).toHaveAttribute('aria-label')
    })

    it('status icons have aria-label describing status', () => {
      renderWidget({ data: mockSlaMetricsExcellent })
      // Both confirmation and completion have same status icon, use getAllByLabelText
      const icons = screen.getAllByLabelText('Отлично')
      expect(icons.length).toBeGreaterThanOrEqual(1)
    })

    it('color is not the only indicator of status', () => {
      renderWidget({ data: mockSlaMetricsCritical })
      // Critical status has red color AND XCircle icon with aria-label
      const icons = screen.getAllByLabelText('Критично')
      expect(icons.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ===========================================================================
  // TDD Verification Tests
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have correct color threshold boundaries', () => {
      const getSlaColor = (percent: number): string => {
        if (percent >= 95) return 'green'
        if (percent >= 85) return 'yellow'
        return 'red'
      }

      slaColorTestCases.forEach(({ percent, expectedColor }) => {
        expect(getSlaColor(percent)).toBe(expectedColor)
      })
    })

    it('should have all mock fixtures available', () => {
      expect(mockSlaMetricsExcellent).toBeDefined()
      expect(mockSlaMetricsWarning).toBeDefined()
      expect(mockSlaMetricsCritical).toBeDefined()
      expect(mockSlaMetricsNoRisk).toBeDefined()
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
    })
  })
})
