/**
 * Unit tests for DeltaIndicator component
 * Story 6.2-FE: Period Comparison Enhancement
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeltaIndicator, DeltaBadge } from '../DeltaIndicator'

describe('DeltaIndicator', () => {
  describe('Value formatting', () => {
    it('should format positive percentage with + sign', () => {
      render(<DeltaIndicator value={12.5} type="percentage" />)
      expect(screen.getByText('+12.5%')).toBeInTheDocument()
    })

    it('should format negative percentage', () => {
      render(<DeltaIndicator value={-5.6} type="percentage" />)
      expect(screen.getByText('-5.6%')).toBeInTheDocument()
    })

    it('should format zero percentage', () => {
      render(<DeltaIndicator value={0} type="percentage" />)
      // Zero doesn't get + sign
      expect(screen.getByText('0.0%')).toBeInTheDocument()
    })

    it('should format positive absolute value as currency', () => {
      render(<DeltaIndicator value={15000} type="absolute" />)
      // Russian currency format
      expect(screen.getByText(/\+15.*000/)).toBeInTheDocument()
    })

    it('should format negative absolute value as currency', () => {
      render(<DeltaIndicator value={-5000} type="absolute" />)
      expect(screen.getByText(/-5.*000/)).toBeInTheDocument()
    })
  })

  describe('Color coding', () => {
    it('should show green for positive values', () => {
      render(<DeltaIndicator value={10} type="percentage" />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-green-600')
    })

    it('should show red for negative values', () => {
      render(<DeltaIndicator value={-10} type="percentage" />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-red-600')
    })

    it('should show gray for zero values', () => {
      render(<DeltaIndicator value={0} type="percentage" />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-gray-400')
    })
  })

  describe('Inverse mode (for costs)', () => {
    it('should show green for negative values when inverse is true', () => {
      render(<DeltaIndicator value={-10} type="percentage" inverse />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      // Negative cost change is good
      expect(indicator).toHaveClass('text-green-600')
    })

    it('should show red for positive values when inverse is true', () => {
      render(<DeltaIndicator value={10} type="percentage" inverse />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      // Positive cost increase is bad
      expect(indicator).toHaveClass('text-red-600')
    })
  })

  describe('Null/undefined handling', () => {
    it('should show dash for null values', () => {
      render(<DeltaIndicator value={null} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should show dash for undefined values', () => {
      render(<DeltaIndicator value={undefined} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('should show gray color for null values', () => {
      render(<DeltaIndicator value={null} />)
      // The outer span has the gray color, inner span contains the dash
      const dashElement = screen.getByText('—')
      const outerContainer = dashElement.parentElement
      expect(outerContainer).toHaveClass('text-gray-400')
    })
  })

  describe('Size variants', () => {
    it('should render small size', () => {
      render(<DeltaIndicator value={10} size="sm" />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-xs')
    })

    it('should render medium size by default', () => {
      render(<DeltaIndicator value={10} />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-sm')
    })

    it('should render large size', () => {
      render(<DeltaIndicator value={10} size="lg" />)
      const indicator = screen.getByRole('img', { name: /изменение/i })
      expect(indicator).toHaveClass('text-base')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<DeltaIndicator value={15.5} type="percentage" />)
      expect(screen.getByLabelText(/изменение: \+15.5%/i)).toBeInTheDocument()
    })
  })
})

describe('DeltaBadge', () => {
  it('should render positive badge with green background', () => {
    render(<DeltaBadge value={12.5} />)
    const badge = screen.getByText('+12.5%')
    expect(badge).toHaveClass('bg-green-100', 'text-green-700')
  })

  it('should render negative badge with red background', () => {
    render(<DeltaBadge value={-5.6} />)
    const badge = screen.getByText('-5.6%')
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('should render zero badge with gray background', () => {
    render(<DeltaBadge value={0} />)
    // Zero doesn't get + sign in badge
    const badge = screen.getByText('0.0%')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-500')
  })

  it('should show dash for null values', () => {
    render(<DeltaBadge value={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
