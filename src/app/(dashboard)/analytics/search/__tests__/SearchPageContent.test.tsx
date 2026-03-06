/**
 * Tests for SearchPageContent
 * Story 71.4-FE: Search Page Scaffold & Route Registration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { JamStatusResponse } from '@/types/cabinet'
import { ROUTES } from '@/lib/routes'

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ cabinetId: 'cab-1' }),
}))

import { useJamStatus } from '@/hooks/useJamStatus'
import { SearchPageContent } from '../components/SearchPageContent'

const mockedUseJamStatus = vi.mocked(useJamStatus)
let queryClient: QueryClient

const mockJamData: JamStatusResponse = {
  tier: 'advanced',
  searchTextsLimit: 100,
  checkedAt: '2026-03-06T12:00:00.000Z',
  probeCallsMade: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderPage() {
  return render(<SearchPageContent />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchPageContent', () => {
  describe('route constant', () => {
    it('ROUTES.ANALYTICS.SEARCH equals /analytics/search', () => {
      expect(ROUTES.ANALYTICS.SEARCH).toBe('/analytics/search')
    })
  })

  describe('page rendering', () => {
    beforeEach(() => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)
    })

    it('renders page title', () => {
      renderPage()
      expect(screen.getByText('Поисковая аналитика')).toBeInTheDocument()
    })

    it('renders page subtitle', () => {
      renderPage()
      expect(screen.getByText('Анализ поисковых запросов, позиций и заказов')).toBeInTheDocument()
    })

    it('renders 3 tab triggers', () => {
      renderPage()
      expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'По товарам' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'По запросам' })).toBeInTheDocument()
    })

    it('Заказы tab is default active', () => {
      renderPage()
      const ordersTab = screen.getByRole('tab', { name: 'Заказы' })
      expect(ordersTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches tabs when clicking another tab', async () => {
      const user = userEvent.setup()
      renderPage()
      const byProductTab = screen.getByRole('tab', { name: 'По товарам' })
      await user.click(byProductTab)
      expect(byProductTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Заказы' })).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('RequireJam gating', () => {
    it('shows overlay when tier is none', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderPage()
      expect(screen.getByText('Доступно с подпиской WB Джем')).toBeInTheDocument()
    })

    it('renders tabs when tier is sufficient', () => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderPage()
      expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
      expect(screen.queryByText('Доступно с подпиской WB Джем')).not.toBeInTheDocument()
    })
  })
})
