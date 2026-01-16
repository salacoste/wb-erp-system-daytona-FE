/**
 * Unit tests for WeekFilterBadge component
 * Story 24.10-FE: Chart Click-to-Filter Interaction
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * QA Issue: Missing unit tests for WeekFilterBadge component
 * @see docs/stories/epic-24/story-24.10-fe-chart-click-filter.md
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeekFilterBadge } from '../WeekFilterBadge'

describe('WeekFilterBadge', () => {
  describe('rendering', () => {
    it('renders week label with formatted week', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)

      expect(screen.getByText('Фильтр: W47')).toBeInTheDocument()
    })

    it('renders clear button with aria-label', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)

      const button = screen.getByRole('button', {
        name: 'Сбросить фильтр недели',
      })
      expect(button).toBeInTheDocument()
    })

    it('displays X icon in clear button', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)

      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('formatWeekShort', () => {
    it('formats week correctly: 2025-W47 → W47', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)
      expect(screen.getByText('Фильтр: W47')).toBeInTheDocument()
    })

    it('formats week correctly: 2024-W01 → W01', () => {
      render(<WeekFilterBadge week="2024-W01" onClear={vi.fn()} />)
      expect(screen.getByText('Фильтр: W01')).toBeInTheDocument()
    })

    it('formats week correctly: 2025-W52 → W52', () => {
      render(<WeekFilterBadge week="2025-W52" onClear={vi.fn()} />)
      expect(screen.getByText('Фильтр: W52')).toBeInTheDocument()
    })

    it('handles edge case: no dash in week string', () => {
      render(<WeekFilterBadge week="W99" onClear={vi.fn()} />)
      // When there's no dash, the second part is undefined, falls back to original
      expect(screen.getByText('Фильтр: W99')).toBeInTheDocument()
    })
  })

  describe('clear button interaction', () => {
    it('calls onClear when clear button is clicked', () => {
      const onClear = vi.fn()
      render(<WeekFilterBadge week="2025-W47" onClear={onClear} />)

      const button = screen.getByRole('button', {
        name: 'Сбросить фильтр недели',
      })
      fireEvent.click(button)

      expect(onClear).toHaveBeenCalledTimes(1)
    })

    it('calls onClear multiple times on multiple clicks', () => {
      const onClear = vi.fn()
      render(<WeekFilterBadge week="2025-W47" onClear={onClear} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      expect(onClear).toHaveBeenCalledTimes(3)
    })
  })

  describe('accessibility', () => {
    it('has accessible button with descriptive aria-label', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Сбросить фильтр недели')
    })

    it('button is keyboard focusable', () => {
      render(<WeekFilterBadge week="2025-W47" onClear={vi.fn()} />)

      const button = screen.getByRole('button')
      // Button elements are naturally focusable
      expect(button.tabIndex).not.toBe(-1)
    })
  })

  describe('styling', () => {
    it('applies primary color theme classes', () => {
      const { container } = render(
        <WeekFilterBadge week="2025-W47" onClear={vi.fn()} />
      )

      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('bg-primary/10')
      expect(badge.className).toContain('text-primary')
      expect(badge.className).toContain('rounded-full')
    })
  })
})
