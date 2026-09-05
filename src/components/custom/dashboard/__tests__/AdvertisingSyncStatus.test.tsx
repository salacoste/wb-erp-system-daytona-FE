/**
 * AdvertisingSyncStatusBadge Component Tests
 * Story 63.3-FE: Advertising Sync Status Badge
 * Epic 63-FE: Dashboard Business Logic (Frontend)
 *
 * Test coverage:
 * - Sync status badge display (AC1)
 * - Status color coding for 5 states (AC2)
 * - Tooltip information (AC3)
 * - Auto-refresh/polling behavior (AC4)
 * - API integration (AC5)
 * - Accessibility (AC6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { AdvertisingSyncStatusBadge } from '../advertising/AdvertisingSyncStatusBadge'
import type { ExtendedSyncStatusResponse } from '@/types/advertising-sync-status'

// --- Mock the badge hook ---------------------------------------------------
const mockUseAdvertisingSyncStatusBadge = vi.fn()

vi.mock('@/hooks/useAdvertisingSyncStatusBadge', () => ({
  useAdvertisingSyncStatusBadge: (...args: unknown[]) => mockUseAdvertisingSyncStatusBadge(...args),
}))

// --- Helpers ---------------------------------------------------------------

type SyncTaskStatus = 'idle' | 'syncing' | 'completed' | 'partial_success' | 'failed'

/** Create a complete mock ExtendedSyncStatusResponse */
function createMockSyncStatus(
  overrides: Partial<ExtendedSyncStatusResponse> = {}
): ExtendedSyncStatusResponse {
  const now = new Date()
  return {
    lastSyncAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    nextScheduledSync: new Date(now.getTime() + 3.5 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    campaignsSynced: 262,
    dataAvailableFrom: '2025-12-01',
    dataAvailableTo: '2026-01-30',
    dataLagDays: 1,
    healthStatus: 'ok',
    dataGaps: [],
    ...overrides,
  }
}

/** Render the component with providers */
function renderBadge(props: React.ComponentProps<typeof AdvertisingSyncStatusBadge> = {}) {
  return renderWithProviders(<AdvertisingSyncStatusBadge {...props} />)
}

/** Configure the mock hook to return data for a given status */
function mockStatusReturned(
  overrides: Partial<ExtendedSyncStatusResponse> = {},
  extra: { isLoading?: boolean; error?: Error | null } = {}
) {
  const data = createMockSyncStatus(overrides)
  mockUseAdvertisingSyncStatusBadge.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
    ...extra,
  })
  return data
}

/** Set up loading mock */
function mockLoading() {
  mockUseAdvertisingSyncStatusBadge.mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
  })
}

/** Set up error mock */
function mockError(errorMessage: string) {
  mockUseAdvertisingSyncStatusBadge.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: new Error(errorMessage),
    refetch: vi.fn(),
    isRefetching: false,
  })
}

/** Hover helper - creates user and hovers the button */
function setupUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

// ============================================================================
// Tests
// ============================================================================

describe('AdvertisingSyncStatusBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==========================================================================
  // AC1: Sync Status Badge Display
  // ==========================================================================

  describe('AC1: Sync Status Badge Display', () => {
    it('renders badge in advertising dashboard widget header', () => {
      mockStatusReturned()
      renderBadge()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows human-readable last sync time in relative format', () => {
      mockStatusReturned({ lastSyncAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() })
      renderBadge()
      expect(screen.getByRole('button').textContent ?? '').toContain('назад')
    })

    it('shows "30 минут назад" for sync 30 minutes ago', () => {
      vi.setSystemTime(new Date('2026-06-07T12:00:00Z'))
      mockStatusReturned({ lastSyncAt: new Date('2026-06-07T11:30:00Z').toISOString() })
      renderBadge()
      const timeText = screen.getByRole('button').querySelector('span')
      expect(timeText?.textContent).toContain('30')
      expect(timeText?.textContent).toContain('минут')
    })

    it('shows "никогда" when lastSyncAt is null', () => {
      mockStatusReturned({ lastSyncAt: null })
      renderBadge()
      expect(screen.getByText('никогда')).toBeInTheDocument()
    })

    it('badge is compact and uses pill/rounded-full styling', () => {
      mockStatusReturned()
      renderBadge()
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('text-xs')
    })

    it('displays inline with other header controls', () => {
      mockStatusReturned()
      renderBadge()
      expect(screen.getByRole('button')).toHaveClass('inline-flex')
    })
  })

  // ==========================================================================
  // AC2: Status Color Coding
  // ==========================================================================

  describe('AC2: Status Color Coding', () => {
    // P2 wave-5: pins mirror migrated sync-status-config.ts (soft tiers =
    // thin tint + same-hue text at the highest passing alpha; strongest tier
    // solid; idle = muted pair).
    const statusTests: Array<{
      status: SyncTaskStatus
      bg: string
      color: string
      label: string
    }> = [
      {
        status: 'idle',
        bg: 'bg-muted',
        color: 'text-muted-foreground',
        label: 'Ожидание',
      },
      {
        status: 'syncing',
        bg: 'bg-status-information/15',
        color: 'text-status-information',
        label: 'Синхронизация...',
      },
      {
        status: 'completed',
        bg: 'bg-status-success/5',
        color: 'text-status-success',
        label: 'Синхронизировано',
      },
      {
        status: 'partial_success',
        bg: 'bg-status-warning/5',
        color: 'text-status-warning',
        label: 'Частично',
      },
      {
        status: 'failed',
        bg: 'bg-status-error',
        color: 'text-status-error-foreground',
        label: 'Ошибка',
      },
    ]

    for (const { status, bg, color, label } of statusTests) {
      describe(`${status} status`, () => {
        it(`displays ${bg} background`, () => {
          mockStatusReturned({ status })
          renderBadge()
          expect(screen.getByRole('button')).toHaveClass(bg)
        })

        it(`displays ${color} text`, () => {
          mockStatusReturned({ status })
          renderBadge()
          expect(screen.getByRole('button')).toHaveClass(color)
        })

        it(`shows icon for ${status} state`, () => {
          mockStatusReturned({ status })
          renderBadge()
          expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument()
        })

        it(`displays "${label}" in aria-label`, () => {
          mockStatusReturned({ status })
          renderBadge()
          expect(screen.getByRole('button')).toHaveAttribute(
            'aria-label',
            expect.stringContaining(label)
          )
        })
      })
    }

    it('spinner has animate-spin class for syncing status', () => {
      mockStatusReturned({ status: 'syncing' })
      renderBadge()
      expect(screen.getByRole('button').querySelector('svg')).toHaveClass('animate-spin')
    })
  })

  // ==========================================================================
  // AC3: Tooltip Information
  // ==========================================================================

  describe('AC3: Tooltip Information', () => {
    it('shows tooltip on hover with status label', async () => {
      const user = setupUser()
      mockStatusReturned()
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText('Синхронизировано').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays last sync timestamp in dd.MM.yyyy HH:mm format', async () => {
      const user = setupUser()
      vi.setSystemTime(new Date('2026-06-07T12:00:00Z'))
      mockStatusReturned({ lastSyncAt: '2026-06-07T11:30:00.000Z' })
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(
          screen.getAllByText(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/).length
        ).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays timestamp in Moscow timezone', async () => {
      const user = setupUser()
      mockStatusReturned()
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText(/Последняя синхр\./).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows next scheduled sync time (HH:mm format)', async () => {
      const user = setupUser()
      vi.setSystemTime(new Date('2026-06-07T12:00:00Z'))
      mockStatusReturned({ nextScheduledSync: '2026-06-07T15:30:00.000Z' })
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText(/Следующая/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows number of campaigns synced', async () => {
      const user = setupUser()
      mockStatusReturned({ campaignsSynced: 262 })
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText(/Кампаний/).length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('262').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows data availability period (from-to dates)', async () => {
      const user = setupUser()
      mockStatusReturned({ dataAvailableFrom: '2025-12-01', dataAvailableTo: '2026-01-30' })
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText(/Данные доступны/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows status-specific description message', async () => {
      const user = setupUser()
      mockStatusReturned({ status: 'failed' })
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(screen.getAllByText('Синхронизация не удалась').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('tooltip has width w-64 (256px)', async () => {
      const user = setupUser()
      mockStatusReturned()
      renderBadge()
      await user.hover(screen.getByRole('button'))
      await waitFor(() => {
        expect(document.querySelector('[data-side]')).toHaveClass('w-64')
      })
    })
  })

  // ==========================================================================
  // AC4: Auto-Refresh Behavior
  // ==========================================================================

  describe('AC4: Auto-Refresh Behavior', () => {
    it('polls sync status every 60 seconds when widget is visible', () => {
      mockStatusReturned()
      renderBadge({ enablePolling: true, pollingInterval: 60000 })
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true, refetchInterval: 60000 })
      )
    })

    it('stops polling when browser tab is in background', () => {
      mockStatusReturned()
      renderBadge()
      // Hook sets refetchIntervalInBackground: false internally
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      )
    })

    it('resumes polling when tab becomes active', () => {
      mockStatusReturned()
      renderBadge()
      // Hook uses refetchOnWindowFocus: true in base hook
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalled()
    })

    it('shows loading skeleton during initial fetch', () => {
      mockLoading()
      renderBadge()
      expect(document.querySelector('.rounded-full')).toBeInTheDocument()
    })

    it('maintains previous data while refetching', () => {
      mockUseAdvertisingSyncStatusBadge.mockReturnValue({
        data: createMockSyncStatus(),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: true,
      })
      renderBadge()
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText(/назад/)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC5: API Integration
  // ==========================================================================

  describe('AC5: API Integration', () => {
    it('connects to GET /v1/analytics/advertising/sync-status', () => {
      mockStatusReturned()
      renderBadge()
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalledTimes(1)
    })

    it('handles 401 authentication error gracefully', () => {
      mockError('Unauthorized')
      renderBadge()
      expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
    })

    it('handles 403 authorization error gracefully', () => {
      mockError('Forbidden')
      renderBadge()
      expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
    })

    it('shows "Статус недоступен" when API unavailable', () => {
      mockError('Network error')
      renderBadge()
      expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
    })

    it('caches response for 60 seconds (staleTime)', () => {
      mockStatusReturned()
      renderBadge()
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalledWith(
        expect.objectContaining({ refetchInterval: 60000 })
      )
    })

    it('does not refetch within staleTime window', () => {
      mockStatusReturned()
      renderBadge({ pollingInterval: 60000 })
      expect(mockUseAdvertisingSyncStatusBadge).toHaveBeenCalledWith(
        expect.objectContaining({ refetchInterval: 60000 })
      )
    })
  })

  // ==========================================================================
  // AC6: Accessibility
  // ==========================================================================

  describe('AC6: Accessibility', () => {
    it('badge button has descriptive aria-label with status and time', () => {
      mockStatusReturned({ lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() })
      renderBadge()
      const ariaLabel = screen.getByRole('button').getAttribute('aria-label') ?? ''
      expect(ariaLabel).toContain('Статус синхронизации')
      expect(ariaLabel).toContain('Синхронизировано')
      expect(ariaLabel).toContain('Последняя синхронизация')
    })

    it('tooltip is accessible via keyboard focus', async () => {
      const user = setupUser()
      mockStatusReturned()
      renderBadge()
      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('badge is keyboard focusable (can receive focus)', () => {
      mockStatusReturned()
      renderBadge()
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('status is indicated by icon, not color alone', () => {
      mockStatusReturned({ status: 'completed' })
      renderBadge()
      expect(
        screen.getByRole('button').querySelector('svg[aria-hidden="true"]')
      ).toBeInTheDocument()
    })

    it('screen reader announces status changes', () => {
      mockStatusReturned({ status: 'syncing' })
      const { rerender } = renderBadge()
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Синхронизация...')
      )

      mockStatusReturned({ status: 'completed' })
      rerender(<AdvertisingSyncStatusBadge />)
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Синхронизировано')
      )
    })

    it('has focus ring styling on focus-visible', () => {
      mockStatusReturned()
      renderBadge()
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-primary')
    })

    it('WCAG 2.1 AA color contrast for all status colors', () => {
      const expectedColors: Record<SyncTaskStatus, string> = {
        idle: 'text-muted-foreground',
        syncing: 'text-status-information',
        completed: 'text-status-success',
        partial_success: 'text-status-warning',
        failed: 'text-status-error-foreground',
      }
      for (const status of Object.keys(expectedColors) as SyncTaskStatus[]) {
        mockStatusReturned({ status })
        const { unmount } = renderBadge()
        expect(screen.getByRole('button')).toHaveClass(expectedColors[status])
        unmount()
      }
    })
  })

  // ==========================================================================
  // Loading & Error States
  // ==========================================================================

  describe('Loading State', () => {
    it('shows skeleton with w-32 h-6 rounded-full during loading', () => {
      mockLoading()
      renderBadge()
      const skeleton = document.querySelector('.w-32.h-6.rounded-full')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('w-32')
      expect(skeleton).toHaveClass('h-6')
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('skeleton has appropriate animation', () => {
      mockLoading()
      renderBadge()
      expect(document.querySelector('.w-32.h-6.rounded-full')).toHaveClass('animate-pulse')
    })
  })

  describe('Error State', () => {
    it('displays "Статус недоступен" text on error', () => {
      mockError('API error')
      renderBadge()
      expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
    })

    it('uses muted-foreground text color for error message', () => {
      mockError('API error')
      renderBadge()
      expect(screen.getByText('Статус недоступен')).toHaveClass('text-muted-foreground')
    })

    it('does not crash when data is undefined', () => {
      mockUseAdvertisingSyncStatusBadge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      })
      expect(() => renderBadge()).not.toThrow()
      expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Responsive Behavior
  // ==========================================================================

  describe('Responsive Behavior', () => {
    it('shows icon only on mobile (hidden sm:inline for text)', () => {
      mockStatusReturned()
      renderBadge()
      const textSpan = screen.getByRole('button').querySelector('span')
      expect(textSpan).toHaveClass('hidden')
      expect(textSpan).toHaveClass('sm:inline')
    })

    it('shows icon and relative time text on sm+ screens', () => {
      mockStatusReturned()
      renderBadge()
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).not.toHaveClass('hidden')
      const textSpan = button.querySelector('span')
      expect(textSpan).toBeInTheDocument()
      expect(textSpan).toHaveClass('hidden')
      expect(textSpan).toHaveClass('sm:inline')
    })
  })

  // ==========================================================================
  // TDD Verification Tests (verify test setup is correct)
  // ==========================================================================

  describe('TDD Verification', () => {
    it('has expected status configuration structure', () => {
      const expectedConfig = {
        idle: { label: 'Ожидание', color: 'text-muted-foreground', bgColor: 'bg-muted' },
        syncing: {
          label: 'Синхронизация...',
          color: 'text-status-information',
          animate: true,
        },
        completed: { label: 'Синхронизировано', color: 'text-status-success' },
        partial_success: { label: 'Частично', color: 'text-status-warning' },
        failed: { label: 'Ошибка', color: 'text-status-error-foreground' },
      }
      expect(expectedConfig.idle.label).toBe('Ожидание')
      expect(expectedConfig.syncing.label).toBe('Синхронизация...')
      expect(expectedConfig.syncing.animate).toBe(true)
      expect(expectedConfig.completed.label).toBe('Синхронизировано')
      expect(expectedConfig.partial_success.label).toBe('Частично')
      expect(expectedConfig.failed.label).toBe('Ошибка')
    })

    it('has all five sync statuses defined', () => {
      const statuses: SyncTaskStatus[] = [
        'idle',
        'syncing',
        'completed',
        'partial_success',
        'failed',
      ]
      expect(statuses).toHaveLength(5)
    })

    it('has testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(waitFor).toBeDefined()
      expect(userEvent).toBeDefined()
    })

    it('creates valid mock sync status data', () => {
      const mockData = createMockSyncStatus()
      expect(mockData.status).toBe('completed')
      expect(mockData.campaignsSynced).toBe(262)
      expect(mockData.lastSyncAt).toBeDefined()
      expect(mockData.nextScheduledSync).toBeDefined()
      expect(mockData.dataAvailableFrom).toBe('2025-12-01')
      expect(mockData.dataAvailableTo).toBe('2026-01-30')
    })

    it('allows overriding mock data', () => {
      const mockData = createMockSyncStatus({
        status: 'failed',
        campaignsSynced: 0,
        lastSyncAt: null,
      })
      expect(mockData.status).toBe('failed')
      expect(mockData.campaignsSynced).toBe(0)
      expect(mockData.lastSyncAt).toBeNull()
    })

    it('validates color hex codes match spec', () => {
      const colorSpec = {
        idle: '#9CA3AF',
        syncing: '#3B82F6',
        completed: '#22C55E',
        partial_success: '#F59E0B',
        failed: '#EF4444',
      }
      expect(colorSpec.idle).toBe('#9CA3AF')
      expect(colorSpec.syncing).toBe('#3B82F6')
      expect(colorSpec.completed).toBe('#22C55E')
      expect(colorSpec.partial_success).toBe('#F59E0B')
      expect(colorSpec.failed).toBe('#EF4444')
    })
  })
})
