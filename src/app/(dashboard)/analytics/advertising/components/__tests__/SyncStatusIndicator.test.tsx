/**
 * Unit Tests for SyncStatusIndicator Component
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Loading state
 * - Error state
 * - Health status display (derived from response)
 * - Accessibility
 *
 * Updated for backend response format (Request #72)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { SyncStatusIndicator } from '../SyncStatusIndicator'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create a fresh query client for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: Infinity,
        staleTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows skeleton while loading', () => {
      // Delay the response to keep loading state
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return HttpResponse.json({})
        })
      )

      const { container } = renderWithProviders(<SyncStatusIndicator />)

      // Should show skeleton
      const skeleton = container.querySelector('[class*="animate-pulse"]')
      expect(skeleton).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when API fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Server error' } },
            { status: 500 }
          )
        })
      )

      renderWithProviders(<SyncStatusIndicator />)

      await waitFor(
        () => {
          expect(screen.getByText('Статус недоступен')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Health Status Display', () => {
    it('shows healthy status with green dot for recent sync', async () => {
      // Recent sync = healthy (within 24h)
      const recentSyncTime = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
          return HttpResponse.json({
            lastSyncAt: recentSyncTime,
            nextScheduledSync: '2025-12-22T04:00:00Z',
            status: 'completed',
            campaignsSynced: 10,
            dataAvailableFrom: '2025-11-01',
            dataAvailableTo: '2025-12-21',
          })
        })
      )

      const { container } = renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        expect(screen.getByText(/Обновлено/)).toBeInTheDocument()
      })

      // Should have green dot for healthy status
      const dot = container.querySelector('[class*="bg-green"]')
      expect(dot).toBeInTheDocument()
    })

    it('shows relative time text', async () => {
      renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        // Should show "Обновлено" with relative time
        expect(screen.getByText(/Обновлено/)).toBeInTheDocument()
      })
    })

    it('shows stale status with orange dot for old sync', async () => {
      // Old sync = stale (more than 26h ago)
      const oldSyncTime = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 48 hours ago
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
          return HttpResponse.json({
            lastSyncAt: oldSyncTime,
            nextScheduledSync: '2025-12-22T04:00:00Z',
            status: 'completed',
            campaignsSynced: 10,
            dataAvailableFrom: '2025-11-01',
            dataAvailableTo: '2025-12-21',
          })
        })
      )

      const { container } = renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        const dot = container.querySelector('[class*="bg-orange"]')
        expect(dot).toBeInTheDocument()
      })
    })

    it('shows unhealthy status with red dot for failed sync', async () => {
      // Failed status = unhealthy
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
          return HttpResponse.json({
            lastSyncAt: '2025-12-21T06:00:00Z',
            nextScheduledSync: '2025-12-22T04:00:00Z',
            status: 'failed',
            lastTask: {
              taskUuid: 'adv-sync-failed',
              status: 'failed',
              startedAt: '2025-12-21T05:55:00Z',
              finishedAt: '2025-12-21T05:56:00Z',
              error: 'WB API timeout',
            },
            campaignsSynced: 0,
            dataAvailableFrom: null,
            dataAvailableTo: null,
          })
        })
      )

      const { container } = renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        const dot = container.querySelector('[class*="bg-red"]')
        expect(dot).toBeInTheDocument()
      })
    })

    it('shows stale status when never synced', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
          return HttpResponse.json({
            lastSyncAt: null,
            nextScheduledSync: '2025-12-22T04:00:00Z',
            status: 'idle',
            campaignsSynced: 0,
            dataAvailableFrom: null,
            dataAvailableTo: null,
          })
        })
      )

      const { container } = renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        // Should show orange dot for stale (never synced)
        const dot = container.querySelector('[class*="bg-orange"]')
        expect(dot).toBeInTheDocument()
      })

      // Should show "никогда" for never synced
      expect(screen.getByText(/никогда/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible button with aria-label', async () => {
      renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        expect(screen.getByText(/Обновлено/)).toBeInTheDocument()
      })

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button.getAttribute('aria-label')).toContain('Статус синхронизации')
    })

    it('hides decorative dot from screen readers', async () => {
      const { container } = renderWithProviders(<SyncStatusIndicator />)

      await waitFor(() => {
        expect(screen.getByText(/Обновлено/)).toBeInTheDocument()
      })

      const dots = container.querySelectorAll('[aria-hidden="true"]')
      expect(dots.length).toBeGreaterThan(0)
    })
  })
})
