/**
 * Unit Tests for EfficiencyBadge Component
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Rendering with different statuses
 * - Color classes per status
 * - Icon display
 * - Accessibility
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EfficiencyBadge } from '../EfficiencyBadge'
import type { EfficiencyStatus } from '@/types/advertising-analytics'

// All efficiency statuses for comprehensive testing
const ALL_STATUSES: EfficiencyStatus[] = [
  'excellent',
  'good',
  'moderate',
  'poor',
  'loss',
  'unknown',
]

// Expected Russian labels
const STATUS_LABELS: Record<EfficiencyStatus, string> = {
  excellent: 'Отлично',
  good: 'Хорошо',
  moderate: 'Умеренно',
  poor: 'Слабо',
  loss: 'Убыток',
  unknown: 'Нет данных',
}

// Expected color patterns
const STATUS_COLORS: Record<EfficiencyStatus, string> = {
  excellent: 'green',
  good: 'emerald',
  moderate: 'yellow',
  poor: 'orange',
  loss: 'red',
  unknown: 'gray',
}

describe('EfficiencyBadge', () => {
  describe('Rendering', () => {
    it.each(ALL_STATUSES)('renders %s status with Russian label', (status) => {
      render(<EfficiencyBadge status={status} />)

      expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument()
    })

    it.each(ALL_STATUSES)('applies %s color class', (status) => {
      const { container } = render(<EfficiencyBadge status={status} />)

      const badge = container.querySelector('[class*="bg-"]')
      expect(badge?.className).toContain(STATUS_COLORS[status])
    })
  })

  describe('Icon Display', () => {
    it('shows icon by default', () => {
      const { container } = render(<EfficiencyBadge status="excellent" />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('hides icon when showIcon is false', () => {
      const { container } = render(
        <EfficiencyBadge status="excellent" showIcon={false} />
      )

      const icon = container.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has aria-label with status information', () => {
      const { container } = render(<EfficiencyBadge status="good" />)

      const badge = container.querySelector('[aria-label]')
      expect(badge).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Статус эффективности')
      )
    })

    it('hides icon from screen readers', () => {
      const { container } = render(<EfficiencyBadge status="excellent" />)

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Custom className', () => {
    it('applies additional className', () => {
      const { container } = render(
        <EfficiencyBadge status="good" className="custom-class" />
      )

      const badge = container.querySelector('.custom-class')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Specific Status Tests', () => {
    it('renders excellent status with green styling', () => {
      const { container } = render(<EfficiencyBadge status="excellent" />)

      expect(screen.getByText('Отлично')).toBeInTheDocument()
      const badge = container.querySelector('[class*="bg-green"]')
      expect(badge).toBeInTheDocument()
    })

    it('renders loss status with red styling', () => {
      const { container } = render(<EfficiencyBadge status="loss" />)

      expect(screen.getByText('Убыток')).toBeInTheDocument()
      const badge = container.querySelector('[class*="bg-red"]')
      expect(badge).toBeInTheDocument()
    })

    it('renders unknown status with gray styling', () => {
      const { container } = render(<EfficiencyBadge status="unknown" />)

      expect(screen.getByText('Нет данных')).toBeInTheDocument()
      const badge = container.querySelector('[class*="bg-gray"]')
      expect(badge).toBeInTheDocument()
    })
  })
})
