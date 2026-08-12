/**
 * Unit tests for ComparisonPeriodSelector component
 * Story 6.2-FE: Period Comparison Enhancement
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComparisonPeriodSelector, getEffectiveComparisonPeriod } from '../ComparisonPeriodSelector'

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
      expect(screen.getByRole('switch', { name: 'Сравнить с периодом' })).toBeInTheDocument()
    })

    it('should show label text', () => {
      render(<ComparisonPeriodSelector {...defaultProps} />)
      expect(screen.getByText('Сравнить с периодом')).toBeInTheDocument()
    })

    it('enables the default previous preset with exact callback values', async () => {
      const user = userEvent.setup()
      render(<ComparisonPeriodSelector {...defaultProps} />)
      const toggle = screen.getByRole('switch', { name: 'Сравнить с периодом' })
      await user.click(toggle)

      expect(defaultProps.onEnabledChange).toHaveBeenCalledTimes(1)
      expect(defaultProps.onEnabledChange).toHaveBeenCalledWith(true)
      expect(defaultProps.onCompareRangeChange).toHaveBeenCalledTimes(1)
      expect(defaultProps.onCompareRangeChange).toHaveBeenCalledWith('2025-W46', '2025-W46')
      expect(defaultProps.onPresetChange).not.toHaveBeenCalled()
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

    it('discloses the visibly labelled preset selector by pointer without changing domain state', async () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)
      const user = userEvent.setup()
      const disclosure = screen.getByRole('button', { name: '2025-W46' })

      expect(disclosure).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Сравнить с:')).not.toBeInTheDocument()

      await user.click(disclosure)

      const label = screen.getByText('Сравнить с:')
      const preset = screen.getByRole('combobox', { name: 'Сравнить с:' })
      expect(disclosure).toHaveAttribute('aria-expanded', 'true')
      expect(
        document.getElementById(disclosure.getAttribute('aria-controls') ?? '')
      ).toContainElement(preset)
      expect(label).toHaveAttribute('for', preset.id)
      expect(defaultProps.onPresetChange).not.toHaveBeenCalled()
      expect(defaultProps.onCompareRangeChange).not.toHaveBeenCalled()
    })

    it('supports keyboard disclosure without toggling comparison or firing callbacks', async () => {
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)
      const user = userEvent.setup()
      const disclosure = screen.getByRole('button', { name: '2025-W46' })

      disclosure.focus()
      await user.keyboard('{Enter}')

      expect(disclosure).toHaveFocus()
      expect(disclosure).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('combobox', { name: 'Сравнить с:' })).toBeInTheDocument()
      expect(defaultProps.onEnabledChange).not.toHaveBeenCalled()
      expect(defaultProps.onPresetChange).not.toHaveBeenCalled()
      expect(defaultProps.onCompareRangeChange).not.toHaveBeenCalled()
    })

    it('selects the same-last-year preset before emitting its calculated range', async () => {
      const user = userEvent.setup()
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)

      await user.click(screen.getByRole('button', { name: '2025-W46' }))
      await user.click(screen.getByRole('combobox', { name: 'Сравнить с:' }))
      await user.click(screen.getByRole('option', { name: /Тот же период прошлого года/ }))

      expect(defaultProps.onPresetChange).toHaveBeenCalledTimes(1)
      expect(defaultProps.onPresetChange).toHaveBeenCalledWith('same_last_year')
      expect(defaultProps.onCompareRangeChange).toHaveBeenCalledTimes(1)
      expect(defaultProps.onCompareRangeChange).toHaveBeenCalledWith('2024-W47', '2024-W47')
      expect(defaultProps.onPresetChange.mock.invocationCallOrder[0]).toBeLessThan(
        defaultProps.onCompareRangeChange.mock.invocationCallOrder[0]
      )
    })

    it('selects a custom preset without inventing a calculated range callback', async () => {
      const user = userEvent.setup()
      render(<ComparisonPeriodSelector {...defaultProps} enabled={true} />)

      await user.click(screen.getByRole('button', { name: '2025-W46' }))
      await user.click(screen.getByRole('combobox', { name: 'Сравнить с:' }))
      await user.click(screen.getByRole('option', { name: 'Выбрать период...' }))

      expect(defaultProps.onPresetChange).toHaveBeenCalledTimes(1)
      expect(defaultProps.onPresetChange).toHaveBeenCalledWith('custom')
      expect(defaultProps.onCompareRangeChange).not.toHaveBeenCalled()
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
