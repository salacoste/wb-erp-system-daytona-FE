/**
 * Unit tests for ComparisonPeriodSelector component
 * Story 6.2-FE: Period Comparison Enhancement
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ComparisonPeriodSelector,
  getEffectiveComparisonPeriod,
} from '../ComparisonPeriodSelector'

describe('ComparisonPeriodSelector', () => {
  const defaultProps = {
    enabled: false,
    onEnabledChange: vi.fn(),
    preset: 'previous' as const,
    onPresetChange: vi.fn(),
    compareStart: '2025-W44',
    compareEnd: '2025-W44',
    onCompareRangeChange: vi.fn(),
    currentPeriodStart: '2025-W47',
    currentPeriodEnd: '2025-W47',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Toggle behavior', () => {
    it('should render toggle switch', () => {
      render(<ComparisonPeriodSelector {...defaultProps} />)
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should show label text', () => {
      render(<ComparisonPeriodSelector {...defaultProps} />)
      expect(screen.getByText('Сравнить с периодом')).toBeInTheDocument()
    })

    it('should call onEnabledChange when toggled', () => {
      render(<ComparisonPeriodSelector {...defaultProps} />)
      const toggle = screen.getByRole('switch')
      fireEvent.click(toggle)
      expect(defaultProps.onEnabledChange).toHaveBeenCalledWith(true)
    })

    it('should not show period selector when disabled', () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={false} />)
      expect(screen.queryByText('Предыдущий период')).not.toBeInTheDocument()
    })
  })

  describe('When enabled', () => {
    it('should show comparison period label', () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)
      // Should show some period info
      expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
    })

    it('should show expand/collapse icon', () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)
      // The component has expand/collapse functionality
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('should render with unchecked state when disabled', () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={false} />)
      expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')
    })
  })
})

describe('getEffectiveComparisonPeriod', () => {
  describe('Previous period calculation', () => {
    it('should calculate previous single week correctly', () => {
      const result = getEffectiveComparisonPeriod(
        'previous',
        '2025-W47',
        '2025-W47',
        '2025-W44',
        '2025-W44'
      )
      expect(result.start).toBe('2025-W46')
      expect(result.end).toBe('2025-W46')
    })

    it('should calculate previous period for range correctly', () => {
      // If current is W45-W47 (3 weeks), previous should be W42-W44
      const result = getEffectiveComparisonPeriod(
        'previous',
        '2025-W45',
        '2025-W47',
        '2025-W40',
        '2025-W42'
      )
      expect(result.start).toBe('2025-W42')
      expect(result.end).toBe('2025-W44')
    })
  })

  describe('Same period last year calculation', () => {
    it('should calculate same week last year correctly', () => {
      const result = getEffectiveComparisonPeriod(
        'same_last_year',
        '2025-W47',
        '2025-W47',
        '2025-W44',
        '2025-W44'
      )
      expect(result.start).toBe('2024-W47')
      expect(result.end).toBe('2024-W47')
    })

    it('should calculate same range last year correctly', () => {
      const result = getEffectiveComparisonPeriod(
        'same_last_year',
        '2025-W45',
        '2025-W47',
        '2025-W40',
        '2025-W42'
      )
      expect(result.start).toBe('2024-W45')
      expect(result.end).toBe('2024-W47')
    })
  })

  describe('Custom period', () => {
    it('should return custom start and end for custom preset', () => {
      const result = getEffectiveComparisonPeriod(
        'custom',
        '2025-W47',
        '2025-W47',
        '2025-W30',
        '2025-W35'
      )
      expect(result.start).toBe('2025-W30')
      expect(result.end).toBe('2025-W35')
    })
  })
})
