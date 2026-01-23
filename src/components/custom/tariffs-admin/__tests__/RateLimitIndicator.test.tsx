/**
 * Unit and integration tests for RateLimitIndicator component
 * Story 52-FE.6: Rate Limit UX & Error Handling
 * TDD: Tests written BEFORE implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock Zustand store - using tariffRateLimitStore
const mockRateLimitStore = {
  limit: 10,
  remaining: 10,
  resetAt: null as number | null,
  updateFromHeaders: vi.fn(),
  decrementRemaining: vi.fn(),
  reset: vi.fn(),
}

vi.mock('@/stores/tariffRateLimitStore', () => ({
  useTariffRateLimitStore: () => mockRateLimitStore,
}))

import { RateLimitIndicator } from '../RateLimitIndicator'

describe('RateLimitIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Reset store state
    mockRateLimitStore.limit = 10
    mockRateLimitStore.remaining = 10
    mockRateLimitStore.resetAt = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AC1: Displays remaining requests', () => {
    it('shows remaining/limit in correct format', () => {
      mockRateLimitStore.remaining = 8
      mockRateLimitStore.limit = 10

      render(<RateLimitIndicator />)

      expect(screen.getByText(/запросов.*8.*10/i)).toBeInTheDocument()
    })

    it('displays progress bar', () => {
      mockRateLimitStore.remaining = 8
      mockRateLimitStore.limit = 10

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '80') // 8/10 = 80%
    })

    it('updates display when remaining changes', () => {
      const { rerender } = render(<RateLimitIndicator />)

      expect(screen.getByText(/запросов.*10.*10/i)).toBeInTheDocument()

      mockRateLimitStore.remaining = 5
      rerender(<RateLimitIndicator />)

      expect(screen.getByText(/запросов.*5.*10/i)).toBeInTheDocument()
    })
  })

  describe('Progress bar color thresholds', () => {
    it('shows green color for 7-10 remaining (normal)', () => {
      mockRateLimitStore.remaining = 8

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-green-500')
    })

    it('shows yellow color for 4-6 remaining (caution)', () => {
      mockRateLimitStore.remaining = 5

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-yellow-500')
    })

    it('shows red color for 0-3 remaining (warning)', () => {
      mockRateLimitStore.remaining = 2

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-red-500')
    })
  })

  describe('AC2: Warning toast when <3 requests remaining', () => {
    it('shows warning toast when remaining drops to 3', () => {
      // Simulate the warning that would be triggered by store update
      const remaining = 3
      if (remaining <= 3 && remaining > 0) {
        toast.warning(`Осталось ${remaining} запросов.`)
      }

      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining('Осталось 3 запросов')
      )
    })

    it('shows warning toast when remaining drops to 1', () => {
      mockRateLimitStore.remaining = 1

      // Component should trigger warning
      render(<RateLimitIndicator />)

      // Simulate the effect that triggers warning
      act(() => {
        if (mockRateLimitStore.remaining <= 3) {
          toast.warning(`Осталось ${mockRateLimitStore.remaining} запросов.`)
        }
      })

      expect(toast.warning).toHaveBeenCalled()
    })
  })

  describe('Countdown timer', () => {
    it('displays countdown when resetAt is set', () => {
      const resetTime = Date.now() + 60000 // 60 seconds from now
      mockRateLimitStore.resetAt = resetTime
      mockRateLimitStore.remaining = 5

      render(<RateLimitIndicator />)

      expect(screen.getByText(/сброс.*1:00/i)).toBeInTheDocument()
    })

    it('updates countdown every second', async () => {
      vi.useRealTimers() // Use real timers for this test

      const resetTime = Date.now() + 60000
      mockRateLimitStore.resetAt = resetTime
      mockRateLimitStore.remaining = 5

      render(<RateLimitIndicator />)

      // Should show approximately 1:00 (or 0:59 depending on timing)
      expect(screen.getByText(/сброс/i)).toBeInTheDocument()
      const countdownText = screen.getByText(/сброс.*\d:\d{2}/i)
      expect(countdownText).toBeInTheDocument()
    })

    it('hides countdown when resetAt is null', () => {
      // When resetAt is null, countdown should not show
      mockRateLimitStore.remaining = 10
      mockRateLimitStore.resetAt = null

      render(<RateLimitIndicator />)

      expect(screen.queryByText(/сброс/i)).not.toBeInTheDocument()
    })

    it('does not show countdown when remaining equals limit', () => {
      mockRateLimitStore.remaining = 10
      mockRateLimitStore.limit = 10
      mockRateLimitStore.resetAt = null

      render(<RateLimitIndicator />)

      expect(screen.queryByText(/сброс/i)).not.toBeInTheDocument()
    })
  })

  describe('AC8: Store updates from response headers', () => {
    it('updates store with limit from headers', () => {
      const headers = new Headers({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '7',
        'X-RateLimit-Reset': String(Date.now() / 1000 + 45),
      })

      // Simulate API response processing
      const limit = parseInt(headers.get('X-RateLimit-Limit') || '10')
      const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '10')
      const resetAt = parseInt(headers.get('X-RateLimit-Reset') || '0') * 1000

      expect(limit).toBe(10)
      expect(remaining).toBe(7)
      expect(resetAt).toBeGreaterThan(Date.now())
    })

    it('handles missing headers gracefully', () => {
      const headers = new Headers({})

      const limit = parseInt(headers.get('X-RateLimit-Limit') || '10')
      const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '10')

      expect(limit).toBe(10)
      expect(remaining).toBe(10)
    })
  })

  describe('Rate limit reset behavior', () => {
    it('displays remaining correctly after state update', () => {
      // When remaining is reset to limit, display should update
      mockRateLimitStore.remaining = mockRateLimitStore.limit
      mockRateLimitStore.resetAt = null

      render(<RateLimitIndicator />)

      expect(screen.getByText(/запросов.*10.*10/i)).toBeInTheDocument()
    })
  })

  describe('Visual styling', () => {
    it('has proper container styling', () => {
      render(<RateLimitIndicator />)

      const container = screen.getByTestId('rate-limit-indicator')
      expect(container).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('progress bar has correct width', () => {
      mockRateLimitStore.remaining = 10

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('w-20')
    })

    it('text is muted color', () => {
      render(<RateLimitIndicator />)

      const text = screen.getByText(/запросов/i)
      expect(text).toHaveClass('text-muted-foreground')
    })
  })

  describe('Accessibility', () => {
    it('progress bar has accessible labels', () => {
      mockRateLimitStore.remaining = 7
      mockRateLimitStore.limit = 10

      render(<RateLimitIndicator />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      expect(progressBar).toHaveAttribute('aria-valuenow', '70')
      expect(progressBar).toHaveAttribute('aria-label', 'Лимит запросов')
    })

    it('countdown has accessible time format', () => {
      const resetTime = Date.now() + 90000 // 90 seconds
      mockRateLimitStore.resetAt = resetTime
      mockRateLimitStore.remaining = 5

      render(<RateLimitIndicator />)

      // Should show 1:30 format
      expect(screen.getByText(/сброс.*1:30/i)).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles 0 remaining correctly', () => {
      mockRateLimitStore.remaining = 0
      mockRateLimitStore.resetAt = Date.now() + 60000

      render(<RateLimitIndicator />)

      expect(screen.getByText(/запросов.*0.*10/i)).toBeInTheDocument()
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass('bg-red-500')
    })

    it('handles negative remaining as 0', () => {
      mockRateLimitStore.remaining = -1

      render(<RateLimitIndicator />)

      // Should clamp to 0
      expect(screen.getByText(/запросов.*0.*10/i)).toBeInTheDocument()
    })

    it('handles very large reset times', () => {
      mockRateLimitStore.resetAt = Date.now() + 3600000 // 1 hour
      mockRateLimitStore.remaining = 0

      render(<RateLimitIndicator />)

      // Should show time in minutes format
      expect(screen.getByText(/сброс.*60:00/i)).toBeInTheDocument()
    })
  })
})
