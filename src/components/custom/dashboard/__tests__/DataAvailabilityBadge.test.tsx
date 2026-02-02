/**
 * DataAvailabilityBadge Component Tests
 * Dashboard Data Availability Indicators
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataAvailabilityBadge } from '../DataAvailabilityBadge'

/** Wrapper with TooltipProvider for tooltip testing */
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('DataAvailabilityBadge', () => {
  describe('Status Display', () => {
    it('renders realtime status correctly', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      expect(screen.getByText('В реальном времени')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('В реальном времени')
      )
    })

    it('renders delayed status correctly', () => {
      renderWithTooltip(<DataAvailabilityBadge status="delayed" />)

      expect(screen.getByText('Задержка 1-2 дня')).toBeInTheDocument()
    })

    it('renders pending_week status correctly', () => {
      renderWithTooltip(<DataAvailabilityBadge status="pending_week" />)

      expect(screen.getByText('Ожидание отчёта')).toBeInTheDocument()
    })

    it('renders unavailable status correctly', () => {
      renderWithTooltip(<DataAvailabilityBadge status="unavailable" />)

      expect(screen.getByText('Недоступно')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('applies green colors for realtime status', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-green-50')
      expect(badge).toHaveClass('text-green-700')
    })

    it('applies yellow colors for delayed status', () => {
      renderWithTooltip(<DataAvailabilityBadge status="delayed" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-yellow-50')
      expect(badge).toHaveClass('text-yellow-700')
    })

    it('applies gray colors for pending_week status', () => {
      renderWithTooltip(<DataAvailabilityBadge status="pending_week" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-600')
    })

    it('applies red colors for unavailable status', () => {
      renderWithTooltip(<DataAvailabilityBadge status="unavailable" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-red-50')
      expect(badge).toHaveClass('text-red-700')
    })
  })

  describe('Label Visibility', () => {
    it('shows label by default', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      expect(screen.getByText('В реальном времени')).toBeVisible()
    })

    it('hides label when showLabel is false', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" showLabel={false} />)

      expect(screen.queryByText('В реальном времени')).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders small size by default', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-[10px]')
      expect(badge).toHaveClass('px-1.5')
    })

    it('renders medium size when specified', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" size="md" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('px-2')
    })
  })

  describe('Accessibility', () => {
    it('has proper role and aria-label', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label')
      expect(badge).toHaveAttribute('tabIndex', '0')
    })

    it('includes description in aria-label', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" />)

      const badge = screen.getByRole('status')
      expect(badge.getAttribute('aria-label')).toContain('обновляются')
    })
  })

  describe('Expected Date', () => {
    it('includes expected date in aria-label for pending_week', () => {
      const expectedDate = new Date('2026-02-04')
      renderWithTooltip(<DataAvailabilityBadge status="pending_week" expectedDate={expectedDate} />)

      const badge = screen.getByRole('status')
      expect(badge.getAttribute('aria-label')).toContain('4 февраля')
    })
  })

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderWithTooltip(<DataAvailabilityBadge status="realtime" className="custom-class" />)

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('custom-class')
    })
  })
})
