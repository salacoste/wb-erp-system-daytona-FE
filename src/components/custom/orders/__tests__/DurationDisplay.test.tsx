/**
 * Unit Tests for DurationDisplay Component and formatDuration utility
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

import { durationTestCases } from '@/test/fixtures/order-history'
import { formatDuration, formatDurationCompact, pluralizeDays } from '@/lib/duration-utils'
import { DurationDisplay } from '../timeline/DurationDisplay'
import { HistorySourceBadge } from '../timeline/HistorySourceBadge'

// =============================================================================
// formatDuration Utility Tests
// =============================================================================

describe('formatDuration utility', () => {
  describe('Null/Undefined Handling', () => {
    it('returns "—" (em-dash) for null input', () => {
      expect(formatDuration(null)).toBe('—')
    })

    it('returns "—" (em-dash) for undefined input', () => {
      expect(formatDuration(undefined)).toBe('—')
    })
  })

  describe('Sub-Minute Formatting', () => {
    it('returns "< 1 мин" for 0 minutes', () => {
      expect(formatDuration(0)).toBe('< 1 мин')
    })

    it('returns "< 1 мин" for 0.5 minutes', () => {
      expect(formatDuration(0.5)).toBe('< 1 мин')
    })

    it('returns "< 1 мин" for negative values', () => {
      expect(formatDuration(-5)).toBe('< 1 мин')
    })
  })

  describe('Minutes-Only Formatting (1-59 minutes)', () => {
    it('returns "1 мин" for 1 minute', () => {
      expect(formatDuration(1)).toBe('1 мин')
    })

    it('returns "5 мин" for 5 minutes', () => {
      expect(formatDuration(5)).toBe('5 мин')
    })

    it('returns "15 мин" for 15 minutes', () => {
      expect(formatDuration(15)).toBe('15 мин')
    })

    it('returns "30 мин" for 30 minutes', () => {
      expect(formatDuration(30)).toBe('30 мин')
    })

    it('returns "45 мин" for 45 minutes', () => {
      expect(formatDuration(45)).toBe('45 мин')
    })

    it('returns "59 мин" for 59 minutes', () => {
      expect(formatDuration(59)).toBe('59 мин')
    })
  })

  describe('Hours and Minutes Formatting (1-23 hours)', () => {
    it('returns "1 ч" for exactly 60 minutes', () => {
      expect(formatDuration(60)).toBe('1 ч')
    })

    it('returns "1 ч 30 мин" for 90 minutes', () => {
      expect(formatDuration(90)).toBe('1 ч 30 мин')
    })

    it('returns "2 ч" for exactly 120 minutes', () => {
      expect(formatDuration(120)).toBe('2 ч')
    })

    it('returns "2 ч 45 мин" for 165 minutes', () => {
      expect(formatDuration(165)).toBe('2 ч 45 мин')
    })

    it('returns "5 ч 15 мин" for 315 minutes', () => {
      expect(formatDuration(315)).toBe('5 ч 15 мин')
    })

    it('returns "12 ч" for exactly 720 minutes', () => {
      expect(formatDuration(720)).toBe('12 ч')
    })

    it('returns "23 ч" for 1380 minutes', () => {
      expect(formatDuration(1380)).toBe('23 ч')
    })

    it('returns "23 ч 30 мин" for 1410 minutes', () => {
      expect(formatDuration(1410)).toBe('23 ч 30 мин')
    })

    it('returns "23 ч 59 мин" for 1439 minutes', () => {
      expect(formatDuration(1439)).toBe('23 ч 59 мин')
    })
  })

  describe('Days and Hours Formatting (1-6 days)', () => {
    it('returns "1 д" for exactly 1440 minutes (1 day)', () => {
      expect(formatDuration(1440)).toBe('1 д')
    })

    it('returns "1 д 1 ч" for 1500 minutes', () => {
      expect(formatDuration(1500)).toBe('1 д 1 ч')
    })

    it('returns "1 д 12 ч" for 2160 minutes', () => {
      expect(formatDuration(2160)).toBe('1 д 12 ч')
    })

    it('returns "2 д" for exactly 2880 minutes (2 days)', () => {
      expect(formatDuration(2880)).toBe('2 д')
    })

    it('returns "2 д 6 ч" for 3240 minutes', () => {
      expect(formatDuration(3240)).toBe('2 д 6 ч')
    })

    it('returns "3 д" for exactly 4320 minutes', () => {
      expect(formatDuration(4320)).toBe('3 д')
    })

    it('returns "4 д" for exactly 5760 minutes', () => {
      expect(formatDuration(5760)).toBe('4 д')
    })

    it('returns "5 д" for exactly 7200 minutes', () => {
      expect(formatDuration(7200)).toBe('5 д')
    })

    it('returns "6 д" for exactly 8640 minutes', () => {
      expect(formatDuration(8640)).toBe('6 д')
    })

    it('returns "6 д 23 ч" for 10020 minutes', () => {
      expect(formatDuration(10020)).toBe('6 д 23 ч')
    })
  })

  describe('Days-Only Formatting (7+ days)', () => {
    it('returns "7 дней" for exactly 10080 minutes (7 days)', () => {
      expect(formatDuration(10080)).toBe('7 дней')
    })

    it('returns "8 дней" for 11520 minutes', () => {
      expect(formatDuration(11520)).toBe('8 дней')
    })

    it('returns "10 дней" for 14400 minutes', () => {
      expect(formatDuration(14400)).toBe('10 дней')
    })

    it('returns "14 дней" for 20160 minutes', () => {
      expect(formatDuration(20160)).toBe('14 дней')
    })

    it('returns "21 день" for 30240 minutes', () => {
      expect(formatDuration(30240)).toBe('21 день')
    })

    it('returns "30 дней" for 43200 minutes', () => {
      expect(formatDuration(43200)).toBe('30 дней')
    })

    it('returns "60 дней" for 86400 minutes', () => {
      expect(formatDuration(86400)).toBe('60 дней')
    })
  })

  describe('Russian Pluralization (день/дня/дней)', () => {
    it('uses "день" for 1 day (1 день)', () => {
      expect(pluralizeDays(1)).toBe('день')
    })

    it('uses "день" for 21 days (21 день)', () => {
      expect(pluralizeDays(21)).toBe('день')
    })

    it('uses "день" for 31 days (31 день)', () => {
      expect(pluralizeDays(31)).toBe('день')
    })

    it('uses "дня" for 2 days (2 дня)', () => {
      expect(pluralizeDays(2)).toBe('дня')
    })

    it('uses "дня" for 3 days (3 дня)', () => {
      expect(pluralizeDays(3)).toBe('дня')
    })

    it('uses "дня" for 4 days (4 дня)', () => {
      expect(pluralizeDays(4)).toBe('дня')
    })

    it('uses "дня" for 22 days (22 дня)', () => {
      expect(pluralizeDays(22)).toBe('дня')
    })

    it('uses "дней" for 5 days (5 дней)', () => {
      expect(pluralizeDays(5)).toBe('дней')
    })

    it('uses "дней" for 7 days (7 дней)', () => {
      expect(pluralizeDays(7)).toBe('дней')
    })

    it('uses "дней" for 10 days (10 дней)', () => {
      expect(pluralizeDays(10)).toBe('дней')
    })

    it('uses "дней" for 11 days (11 дней)', () => {
      expect(pluralizeDays(11)).toBe('дней')
    })

    it('uses "дней" for 12 days (12 дней)', () => {
      expect(pluralizeDays(12)).toBe('дней')
    })

    it('uses "дней" for 14 days (14 дней)', () => {
      expect(pluralizeDays(14)).toBe('дней')
    })

    it('uses "дней" for 20 days (20 дней)', () => {
      expect(pluralizeDays(20)).toBe('дней')
    })
  })

  describe('Edge Cases', () => {
    it('handles very large values (365 days)', () => {
      expect(formatDuration(365 * 1440)).toBe('365 дней')
    })

    it('handles floating point minutes correctly', () => {
      // 90.7 should round to 91
      expect(formatDuration(90.7)).toBe('1 ч 31 мин')
    })

    it('rounds to nearest minute', () => {
      // 90.4 rounds to 90
      expect(formatDuration(90.4)).toBe('1 ч 30 мин')
    })

    it('handles NaN input gracefully', () => {
      expect(formatDuration(Number.NaN)).toBe('—')
    })

    it('handles Infinity input gracefully', () => {
      expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('—')
    })
  })
})

// =============================================================================
// formatDurationCompact Utility Tests
// =============================================================================

describe('formatDurationCompact utility', () => {
  it('returns "—" for null input', () => {
    expect(formatDurationCompact(null)).toBe('—')
  })

  it('returns "<1м" for 0 minutes', () => {
    expect(formatDurationCompact(0)).toBe('<1м')
  })

  it('returns "30м" for 30 minutes', () => {
    expect(formatDurationCompact(30)).toBe('30м')
  })

  it('returns "1ч" for 60 minutes', () => {
    expect(formatDurationCompact(60)).toBe('1ч')
  })

  it('returns "1ч30м" for 90 minutes', () => {
    expect(formatDurationCompact(90)).toBe('1ч30м')
  })

  it('returns "1д" for 1440 minutes', () => {
    expect(formatDurationCompact(1440)).toBe('1д')
  })

  it('returns "1д12ч" for 2160 minutes', () => {
    expect(formatDurationCompact(2160)).toBe('1д12ч')
  })

  it('returns "7д" for 10080 minutes', () => {
    expect(formatDurationCompact(10080)).toBe('7д')
  })

  it('returns "—" for NaN', () => {
    expect(formatDurationCompact(Number.NaN)).toBe('—')
  })
})

// =============================================================================
// DurationDisplay Component Tests
// =============================================================================

describe('DurationDisplay Component', () => {
  describe('Basic Rendering', () => {
    it('renders duration text correctly', () => {
      renderWithProviders(<DurationDisplay minutes={90} />)
      expect(screen.getByText('1 ч 30 мин')).toBeInTheDocument()
    })

    it('renders as span element by default', () => {
      renderWithProviders(<DurationDisplay minutes={30} />)
      const el = screen.getByText('30 мин')
      expect(el.tagName).toBe('SPAN')
    })

    it('applies muted text styling', () => {
      renderWithProviders(<DurationDisplay minutes={30} />)
      const el = screen.getByText('30 мин')
      expect(el.className).toContain('text-xs')
      expect(el.className).toContain('text-muted-foreground')
    })

    it('renders em-dash for null duration', () => {
      renderWithProviders(<DurationDisplay minutes={null} />)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('applies default muted/gray text color', () => {
      renderWithProviders(<DurationDisplay minutes={60} />)
      const el = screen.getByText('1 ч')
      expect(el.className).toContain('text-muted-foreground')
    })

    it('applies small font size', () => {
      renderWithProviders(<DurationDisplay minutes={60} />)
      const el = screen.getByText('1 ч')
      expect(el.className).toContain('text-xs')
    })

    it('includes separator dashes when showSeparator=true', () => {
      renderWithProviders(<DurationDisplay minutes={60} showSeparator />)
      // The separator spans exist with aria-hidden
      const separators = screen.getAllByText(/───/)
      expect(separators.length).toBe(2)
    })

    it('separator format: "─── {duration} ───"', () => {
      renderWithProviders(<DurationDisplay minutes={60} showSeparator />)
      expect(screen.getByText('1 ч')).toBeInTheDocument()
      const hiddenSpans = screen.getAllByText(/───/)
      expect(hiddenSpans.length).toBe(2)
      hiddenSpans.forEach(span => {
        expect(span).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('no separator when showSeparator=false', () => {
      renderWithProviders(<DurationDisplay minutes={60} showSeparator={false} />)
      expect(screen.queryByText(/───/)).not.toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('accepts className prop for custom styling', () => {
      renderWithProviders(<DurationDisplay minutes={60} className="custom-class" />)
      const el = screen.getByText('1 ч')
      expect(el.className).toContain('custom-class')
    })

    it('merges custom className with defaults', () => {
      renderWithProviders(<DurationDisplay minutes={60} className="font-bold" />)
      const el = screen.getByText('1 ч')
      expect(el.className).toContain('font-bold')
      expect(el.className).toContain('text-xs')
    })
  })

  describe('Ongoing Status Display', () => {
    it('shows "в процессе" when isOngoing=true', () => {
      renderWithProviders(<DurationDisplay minutes={60} isOngoing />)
      expect(screen.getByText('в процессе')).toBeInTheDocument()
    })

    it('ignores minutes value when isOngoing=true', () => {
      renderWithProviders(<DurationDisplay minutes={9999} isOngoing />)
      expect(screen.queryByText(/9999/)).not.toBeInTheDocument()
      expect(screen.getByText('в процессе')).toBeInTheDocument()
    })

    it('applies appropriate styling for ongoing status', () => {
      renderWithProviders(<DurationDisplay minutes={60} isOngoing />)
      const el = screen.getByText('в процессе')
      expect(el.className).toContain('text-xs')
    })
  })

  describe('Compact Mode', () => {
    it('renders shorter format when compact=true', () => {
      renderWithProviders(<DurationDisplay minutes={30} compact />)
      expect(screen.getByText('30м')).toBeInTheDocument()
    })

    it('uses "м" instead of "мин" in compact mode', () => {
      renderWithProviders(<DurationDisplay minutes={5} compact />)
      expect(screen.getByText('5м')).toBeInTheDocument()
      expect(screen.queryByText('5 мин')).not.toBeInTheDocument()
    })

    it('uses "ч" for hours (same as default)', () => {
      renderWithProviders(<DurationDisplay minutes={60} compact />)
      expect(screen.getByText('1ч')).toBeInTheDocument()
    })

    it('uses "д" for days (same as default)', () => {
      renderWithProviders(<DurationDisplay minutes={1440} compact />)
      expect(screen.getByText('1д')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is readable by screen readers', () => {
      renderWithProviders(<DurationDisplay minutes={90} />)
      expect(screen.getByText('1 ч 30 мин')).toBeInTheDocument()
    })

    it('duration text is announced clearly', () => {
      renderWithProviders(<DurationDisplay minutes={1440} />)
      expect(screen.getByText('1 д')).toBeInTheDocument()
    })

    it('separator characters are decorative (aria-hidden)', () => {
      const { container } = renderWithProviders(<DurationDisplay minutes={60} showSeparator />)
      const hiddenSpans = container.querySelectorAll('span[aria-hidden="true"]')
      expect(hiddenSpans.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Integration with Timeline', () => {
    it('renders inline between timeline entries', () => {
      const { container } = renderWithProviders(<DurationDisplay minutes={45} />)
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span?.className).toContain('text-xs')
      expect(span?.className).toContain('text-muted-foreground')
    })

    it('positioned correctly on connecting line', () => {
      const { container } = renderWithProviders(<DurationDisplay minutes={45} showSeparator />)
      const wrapper = container.querySelector('span')
      expect(wrapper?.className).toContain('inline-flex')
      expect(wrapper?.className).toContain('items-center')
    })

    it('does not disrupt timeline visual flow', () => {
      renderWithProviders(<DurationDisplay minutes={30} />)
      const el = screen.getByText('30 мин')
      expect(el.tagName).toBe('SPAN')
      // No block-level elements that would break inline flow
      expect(el.className).not.toContain('block')
    })
  })
})

// =============================================================================
// HistorySourceBadge Component Tests (AC5)
// =============================================================================

describe('HistorySourceBadge Component', () => {
  describe('WB Badge Variant', () => {
    it('renders "WB" text', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      expect(screen.getByText('WB')).toBeInTheDocument()
    })

    it('applies purple background color', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const badge = screen.getByText('WB').closest('span')
      expect(badge?.className).toContain('bg-purple-100')
      expect(badge?.className).toContain('text-purple-700')
    })

    it('includes Truck icon', () => {
      const { container } = renderWithProviders(<HistorySourceBadge source="wb_native" />)
      // lucide-react renders an SVG with the truck icon
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('has aria-label "Источник: Wildberries"', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const badge = screen.getByLabelText('Источник: Wildberries')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Local Badge Variant', () => {
    it('renders "Локальная" text', () => {
      renderWithProviders(<HistorySourceBadge source="local" />)
      expect(screen.getByText('Локальная')).toBeInTheDocument()
    })

    it('applies blue background color', () => {
      renderWithProviders(<HistorySourceBadge source="local" />)
      const badge = screen.getByText('Локальная').closest('span')
      expect(badge?.className).toContain('bg-blue-100')
      expect(badge?.className).toContain('text-blue-700')
    })

    it('includes Database icon', () => {
      const { container } = renderWithProviders(<HistorySourceBadge source="local" />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('has aria-label "Источник: Локальная система"', () => {
      renderWithProviders(<HistorySourceBadge source="local" />)
      const badge = screen.getByLabelText('Источник: Локальная система')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Badge Sizing', () => {
    it('renders consistent small size', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const badge = screen.getByText('WB').closest('span')
      expect(badge?.className).toContain('text-xs')
    })

    it('icon and text are vertically centered', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const badge = screen.getByText('WB').closest('span')
      expect(badge?.className).toContain('inline-flex')
      expect(badge?.className).toContain('items-center')
    })

    it('has appropriate padding', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const badge = screen.getByText('WB').closest('span')
      expect(badge?.className).toContain('px-1.5')
      expect(badge?.className).toContain('py-0.5')
    })
  })

  describe('Accessibility', () => {
    it('has descriptive aria-label', () => {
      renderWithProviders(<HistorySourceBadge source="wb_native" />)
      expect(screen.getByLabelText('Источник: Wildberries')).toBeInTheDocument()
    })

    it('icon has aria-hidden="true"', () => {
      const { container } = renderWithProviders(<HistorySourceBadge source="wb_native" />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
    })

    it('local badge icon has aria-hidden="true"', () => {
      const { container } = renderWithProviders(<HistorySourceBadge source="local" />)
      const svg = container.querySelector('svg')
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
    })
  })
})

// =============================================================================
// Duration TDD Verification Tests
// =============================================================================

describe('Duration TDD Verification', () => {
  it('should have duration test cases available', () => {
    expect(durationTestCases).toBeDefined()
    expect(durationTestCases.length).toBeGreaterThan(20)
  })

  it('test cases cover null input', () => {
    const nullCase = durationTestCases.find(c => c.minutes === null)
    expect(nullCase).toBeDefined()
    expect(nullCase?.expected).toBe('—')
  })

  it('test cases cover zero input', () => {
    const zeroCase = durationTestCases.find(c => c.minutes === 0)
    expect(zeroCase).toBeDefined()
    expect(zeroCase?.expected).toBe('< 1 мин')
  })

  it('test cases cover minutes only', () => {
    const minuteCase = durationTestCases.find(c => c.minutes === 30)
    expect(minuteCase).toBeDefined()
    expect(minuteCase?.expected).toBe('30 мин')
  })

  it('test cases cover hours and minutes', () => {
    const hourCase = durationTestCases.find(c => c.minutes === 90)
    expect(hourCase).toBeDefined()
    expect(hourCase?.expected).toBe('1 ч 30 мин')
  })

  it('test cases cover days and hours', () => {
    const dayCase = durationTestCases.find(c => c.minutes === 1500)
    expect(dayCase).toBeDefined()
    expect(dayCase?.expected).toBe('1 д 1 ч')
  })

  it('test cases cover 7+ days pluralization', () => {
    const weekCase = durationTestCases.find(c => c.minutes === 10080)
    expect(weekCase).toBeDefined()
    expect(weekCase?.expected).toBe('7 дней')
  })

  it('test cases have descriptions', () => {
    durationTestCases.forEach(testCase => {
      expect(testCase.description).toBeDefined()
      expect(testCase.description.length).toBeGreaterThan(0)
    })
  })

  it('testing utilities are available', () => {
    expect(render).toBeDefined()
    expect(screen).toBeDefined()
  })

  it('all fixture test cases match formatDuration output', () => {
    durationTestCases.forEach(({ minutes, expected, description: _description }) => {
      expect(formatDuration(minutes)).toBe(expected)
    })
  })
})
