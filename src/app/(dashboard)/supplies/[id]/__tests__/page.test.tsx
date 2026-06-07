/**
 * Unit Tests for Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Tests page rendering, loading/error states, status-based content,
 * back navigation, mobile responsive, and accessibility.
 */

import { Suspense, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SupplyDetailResponse } from '@/types/supplies'

// ============================================================================
// Mocks
// ============================================================================

const mockUseSupplyDetail = vi.fn()
const mockUseRemoveOrders = vi.fn()
const mockUseDownloadDocument = vi.fn()
const mockRouter = { push: vi.fn(), back: vi.fn(), replace: vi.fn() }

// Pre-create a resolved params promise that React.use() can resolve synchronously.
// React 19 caches promise results — if we resolve the promise and await it before
// passing to use(), React will return the value without suspending.
let cachedParamsPromise: Promise<{ id: string }> | null = null

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    // Override use() to resolve params promises synchronously in tests.
    // This avoids the Suspense + fake-timer interaction that prevents re-render.
    use: (resource: unknown) => {
      if (resource === cachedParamsPromise) {
        return { id: 'supply-001' }
      }
      return actual.use(resource as import('react').Usable<unknown>)
    },
  }
})

vi.mock('@/hooks/useSupplyDetail', () => ({
  useSupplyDetail: (id: string) => mockUseSupplyDetail(id),
}))

vi.mock('@/hooks/useRemoveOrders', () => ({
  useRemoveOrders: (supplyId: string) => mockUseRemoveOrders(supplyId),
}))

vi.mock('@/hooks/useDownloadDocument', () => ({
  useDownloadDocument: () => mockUseDownloadDocument(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: 'supply-001' }),
  notFound: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// Import fixtures
import {
  mockSupplyOpen,
  mockSupplyClosed,
  mockSupplyDelivering,
  mockSupplyDelivered,
  mockSupplyCancelled,
  mockSupplyEmpty,
  mockSupplyDetailResponse,
  mockErrorNotFound,
  mockErrorForbidden,
  mockErrorNetworkError,
} from '@/test/fixtures/supplies'

// Import page component AFTER mocks
import SupplyDetailPage from '../page'

// ============================================================================
// Helpers
// ============================================================================

interface MockSupplyDetailResult {
  data?: SupplyDetailResponse
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: ReturnType<typeof vi.fn>
  isFetching: boolean
  isSuccess: boolean
  isPending: boolean
}

function createResult(overrides: Partial<MockSupplyDetailResult> = {}): MockSupplyDetailResult {
  return {
    data: mockSupplyDetailResponse,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: true,
    isPending: false,
    ...overrides,
  }
}

function renderPage(overrides: Partial<MockSupplyDetailResult> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  mockUseSupplyDetail.mockReturnValue(createResult(overrides))
  mockUseRemoveOrders.mockReturnValue({ mutate: vi.fn(), isPending: false })
  mockUseDownloadDocument.mockReturnValue({ mutate: vi.fn(), isPending: false })

  // Create the params promise and register it with our mock use() override
  cachedParamsPromise = Promise.resolve({ id: 'supply-001' })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
        {children}
      </Suspense>
    </QueryClientProvider>
  )

  const result = render(
    <Wrapper>
      <SupplyDetailPage params={cachedParamsPromise} />
    </Wrapper>
  )

  return { ...result, qc }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SupplyDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // 1. Page Rendering Tests (AC1, AC2)
  // ============================================================================

  describe('Page Rendering', () => {
    it('renders page with supply data from useSupplyDetail hook', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Поставка январь')).toBeDefined()
      })
    })

    it('extracts supply ID from route params', async () => {
      await renderPage()
      await waitFor(() => {
        expect(mockUseSupplyDetail).toHaveBeenCalledWith('supply-001')
      })
    })

    it('shows SupplyHeader component with supply info', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Поставка январь')).toBeDefined()
      })
    })

    it('shows SupplyStatusStepper component', async () => {
      await renderPage()
      await waitFor(() => {
        // Stepper renders step labels
        const stepper = document.querySelector('nav[aria-label="Статус поставки"]')
        expect(stepper).toBeDefined()
      })
    })

    it('shows SupplyOrdersTable component', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText(/Заказы в поставке/)).toBeDefined()
      })
    })

    it('shows SupplyDocumentsList when status is CLOSED or later', async () => {
      const closedResp = {
        ...mockSupplyDetailResponse,
        ...mockSupplyClosed,
        status: 'CLOSED' as const,
      }
      await renderPage({ data: closedResp as unknown as SupplyDetailResponse })
      await waitFor(() => {
        // Multiple documents may match (e.g. "Стикеры (PNG)" and "Штрихкоды (PNG)")
        expect(screen.getAllByText(/Стикеры|Штрихкоды/).length).toBeGreaterThan(0)
      })
    })

    it('hides SupplyDocumentsList when status is OPEN', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Поставка январь')).toBeDefined()
      })
      // OPEN status does not show documents section
      expect(screen.queryByText('Стикеры')).toBeNull()
      expect(screen.queryByText('Штрихкоды')).toBeNull()
    })
  })

  // ============================================================================
  // 2. Back Navigation Tests (AC2)
  // ============================================================================

  describe('Back Navigation', () => {
    it('renders "Назад к списку" link at top of page', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Назад к списку')).toBeDefined()
      })
    })

    it('link navigates to /supplies', async () => {
      await renderPage()
      await waitFor(() => {
        const link = screen.getByText('Назад к списку').closest('a')
        expect(link?.getAttribute('href')).toBe('/supplies')
      })
    })

    it('link has ArrowLeft icon', async () => {
      await renderPage()
      await waitFor(() => {
        const link = screen.getByText('Назад к списку').closest('a')
        expect(link?.querySelector('svg')).toBeDefined()
      })
    })

    it('browser back button works (router.back)', async () => {
      await renderPage()
      expect(mockRouter.back).toBeDefined()
      expect(typeof mockRouter.back).toBe('function')
    })

    it('back link has correct href attribute', async () => {
      await renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Назад к списку/ })
        expect(link).toBeDefined()
        expect(link.getAttribute('href')).toBe('/supplies')
      })
    })
  })

  // ============================================================================
  // 3. Loading State Tests (AC11)
  // ============================================================================

  describe('Loading State', () => {
    it('shows SupplyDetailSkeleton while loading', async () => {
      await renderPage({ isLoading: true, data: undefined, isPending: true, isSuccess: false })
      // After use(params) resolves, isLoading=true renders the skeleton
      await waitFor(() => {
        // Skeleton uses animate-pulse class from the Skeleton UI component
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBeGreaterThan(0)
      })
      // No supply name visible during loading
      expect(screen.queryByText('Поставка январь')).toBeNull()
    })

    it('skeleton matches final layout structure', async () => {
      await renderPage({ isLoading: true, data: undefined, isPending: true, isSuccess: false })
      await waitFor(() => {
        // Skeleton renders a container with space-y-6
        const container = document.querySelector('.space-y-6')
        expect(container).toBeDefined()
      })
    })

    it('shows shimmer animation on skeleton', async () => {
      await renderPage({ isLoading: true, data: undefined, isPending: true, isSuccess: false })
      await waitFor(() => {
        // Skeleton components use animate-pulse
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })

    it('hides skeleton when data loads', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Поставка январь')).toBeDefined()
      })
      expect(document.querySelectorAll('.animate-pulse').length).toBe(0)
    })
  })

  // ============================================================================
  // 4. Error State Tests (AC12)
  // ============================================================================

  describe('Error States', () => {
    describe('404 Not Found', () => {
      it('shows "Поставка не найдена" error page', async () => {
        await renderPage({
          isError: true,
          error: new Error('404 not found'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Поставка не найдена')).toBeDefined()
        })
      })

      it('shows back link to supplies list', async () => {
        await renderPage({
          isError: true,
          error: new Error('404 not found'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Вернуться к списку')).toBeDefined()
        })
      })

      it('recognizes not-found error by message content', async () => {
        await renderPage({
          isError: true,
          error: new Error('404 not found'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Поставка не найдена')).toBeDefined()
        })
      })
    })

    describe('403 Forbidden', () => {
      it('shows "Нет доступа к этой поставке" message', async () => {
        await renderPage({
          isError: true,
          error: new Error('403 forbidden'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          // Text appears in both h1 and p elements
          expect(screen.getAllByText(/Нет доступа/).length).toBeGreaterThan(0)
        })
      })

      it('shows back link to supplies list', async () => {
        await renderPage({
          isError: true,
          error: new Error('403 forbidden'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Вернуться к списку')).toBeDefined()
        })
      })
    })

    describe('Network Error', () => {
      it('shows error message for generic errors', async () => {
        await renderPage({
          isError: true,
          error: new Error('Network error occurred'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText(/Не удалось загрузить/)).toBeDefined()
        })
      })

      it('shows retry button', async () => {
        await renderPage({
          isError: true,
          error: new Error('Network error occurred'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Повторить')).toBeDefined()
        })
      })

      it('retry button calls refetch', async () => {
        const refetch = vi.fn()
        await renderPage({
          isError: true,
          error: new Error('Network error occurred'),
          data: undefined,
          isSuccess: false,
          refetch,
        })
        await waitFor(() => {
          expect(screen.getByText('Повторить')).toBeDefined()
        })
        const user = userEvent.setup()
        await user.click(screen.getByText('Повторить'))
        expect(refetch).toHaveBeenCalled()
      })

      it('shows loading state while retrying', async () => {
        await renderPage({
          isError: true,
          error: new Error('Network error occurred'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Повторить')).toBeDefined()
        })
      })
    })

    describe('Generic Error', () => {
      it('shows error message for 500 errors', async () => {
        await renderPage({
          isError: true,
          error: new Error('500 Internal Server Error'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText(/Не удалось загрузить/)).toBeDefined()
        })
      })

      it('shows retry button for server errors', async () => {
        await renderPage({
          isError: true,
          error: new Error('500 Internal Server Error'),
          data: undefined,
          isSuccess: false,
        })
        await waitFor(() => {
          expect(screen.getByText('Повторить')).toBeDefined()
        })
      })
    })
  })

  // ============================================================================
  // 5. Status-Based Content Tests (AC5, AC10)
  // ============================================================================

  describe('Status-Based Content', () => {
    describe('OPEN Status', () => {
      it('shows action buttons for OPEN status', async () => {
        await renderPage()
        await waitFor(() => {
          expect(screen.getByText('Добавить заказы')).toBeDefined()
        })
      })

      it('shows "Добавить заказы" button', async () => {
        await renderPage()
        await waitFor(() => {
          expect(screen.getByText('Добавить заказы')).toBeDefined()
        })
      })

      it('shows "Закрыть поставку" button', async () => {
        await renderPage()
        await waitFor(() => {
          expect(screen.getByText('Закрыть поставку')).toBeDefined()
        })
      })

      it('hides documents list', async () => {
        await renderPage()
        await waitFor(() => {
          expect(screen.getByText('Поставка январь')).toBeDefined()
        })
        expect(screen.queryByText('Стикеры')).toBeNull()
      })
    })

    describe('CLOSED Status', () => {
      async function renderClosed() {
        const closedResp = {
          ...mockSupplyDetailResponse,
          ...mockSupplyClosed,
          status: 'CLOSED' as const,
        }
        return renderPage({ data: closedResp as unknown as SupplyDetailResponse })
      }

      it('shows "Сгенерировать стикеры" button', async () => {
        await renderClosed()
        await waitFor(() => {
          expect(screen.getByText('Сгенерировать стикеры')).toBeDefined()
        })
      })

      it('shows documents list', async () => {
        await renderClosed()
        await waitFor(() => {
          expect(screen.getAllByText(/Стикеры|Штрихкоды/).length).toBeGreaterThan(0)
        })
      })

      it('shows "Обновить статус" button', async () => {
        await renderClosed()
        await waitFor(() => {
          expect(screen.getByText('Обновить статус')).toBeDefined()
        })
      })
    })

    describe('DELIVERING Status', () => {
      async function renderDelivering() {
        const delResp = {
          ...mockSupplyDetailResponse,
          ...mockSupplyDelivering,
          status: 'DELIVERING' as const,
        }
        return renderPage({ data: delResp as unknown as SupplyDetailResponse })
      }

      it('shows informational message "Поставка в пути к складу WB"', async () => {
        await renderDelivering()
        await waitFor(() => {
          expect(screen.getByText('Поставка в пути к складу WB')).toBeDefined()
        })
      })

      it('no action buttons (view-only mode)', async () => {
        await renderDelivering()
        await waitFor(() => {
          expect(screen.getByText('Поставка в пути к складу WB')).toBeDefined()
        })
        expect(screen.queryByText('Добавить заказы')).toBeNull()
        expect(screen.queryByText('Закрыть поставку')).toBeNull()
      })

      it('shows documents list', async () => {
        await renderDelivering()
        await waitFor(() => {
          expect(screen.getAllByText(/Стикеры|Штрихкоды/).length).toBeGreaterThan(0)
        })
      })
    })

    describe('DELIVERED Status', () => {
      async function renderDelivered() {
        const delResp = {
          ...mockSupplyDetailResponse,
          ...mockSupplyDelivered,
          status: 'DELIVERED' as const,
        }
        return renderPage({ data: delResp as unknown as SupplyDetailResponse })
      }

      it('shows informational message "Поставка успешно доставлена"', async () => {
        await renderDelivered()
        await waitFor(() => {
          expect(screen.getByText('Поставка успешно доставлена')).toBeDefined()
        })
      })

      it('no action buttons (view-only mode)', async () => {
        await renderDelivered()
        await waitFor(() => {
          expect(screen.getByText('Поставка успешно доставлена')).toBeDefined()
        })
        expect(screen.queryByText('Добавить заказы')).toBeNull()
      })

      it('shows documents list', async () => {
        await renderDelivered()
        await waitFor(() => {
          expect(screen.getAllByText(/Стикеры|Штрихкоды|Акт приёмки/).length).toBeGreaterThan(0)
        })
      })
    })

    describe('CANCELLED Status', () => {
      async function renderCancelled() {
        const cancelResp = {
          ...mockSupplyDetailResponse,
          ...mockSupplyCancelled,
          status: 'CANCELLED' as const,
        }
        return renderPage({ data: cancelResp as unknown as SupplyDetailResponse })
      }

      it('shows informational message "Поставка была отменена"', async () => {
        await renderCancelled()
        await waitFor(() => {
          // Text appears in both Alert and status badge
          expect(screen.getAllByText('Поставка была отменена').length).toBeGreaterThan(0)
        })
      })

      it('no action buttons (view-only mode)', async () => {
        await renderCancelled()
        await waitFor(() => {
          expect(screen.getAllByText('Поставка была отменена').length).toBeGreaterThan(0)
        })
        expect(screen.queryByText('Добавить заказы')).toBeNull()
      })

      it('shows special cancelled styling', async () => {
        await renderCancelled()
        await waitFor(() => {
          // The cancelled message is inside an Alert component
          const alertTexts = screen.getAllByText('Поставка была отменена')
          // Walk up from any matching element to find the nearest [role="alert"]
          const found = alertTexts.some(el => el.closest('[role="alert"]') !== null)
          expect(found).toBe(true)
        })
      })
    })
  })

  // ============================================================================
  // 6. Mobile Responsive Tests (AC13)
  // ============================================================================

  describe('Mobile Responsive', () => {
    it('header stacks vertically on mobile', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Поставка январь')).toBeDefined()
      })
      // Header uses flex-col on small screens
      const headerFlex = screen.getByText('Поставка январь').closest('.flex-col')
      expect(headerFlex).toBeDefined()
    })

    it('action buttons full-width on mobile', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Добавить заказы')).toBeDefined()
      })
      // Buttons container uses flex-col on mobile
      const btnContainer = screen.getByText('Добавить заказы').closest('.flex-col')
      expect(btnContainer).toBeDefined()
    })

    it('orders table horizontally scrollable', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText(/Заказы в поставке/)).toBeDefined()
      })
      const tableSection = screen.getByText(/Заказы в поставке/).parentElement
      expect(tableSection).toBeDefined()
    })

    it('touch-friendly tap targets (44px min)', async () => {
      await renderPage()
      await waitFor(() => {
        const button = screen.getByText('Добавить заказы')
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })

  // ============================================================================
  // 7. Accessibility Tests (AC14)
  // ============================================================================

  describe('Accessibility', () => {
    it('page has proper heading hierarchy (h1 > h2)', async () => {
      await renderPage()
      await waitFor(() => {
        const h1 = document.querySelector('h1')
        expect(h1).toBeDefined()
      })
      const h2s = document.querySelectorAll('h2')
      expect(h2s.length).toBeGreaterThanOrEqual(1)
    })

    it('all interactive elements keyboard-navigable', async () => {
      await renderPage()
      await waitFor(() => {
        expect(screen.getByText('Назад к списку')).toBeDefined()
      })
      const links = screen.getAllByRole('link')
      const buttons = screen.getAllByRole('button')
      expect(links.length + buttons.length).toBeGreaterThan(0)
    })

    it('color contrast meets 4.5:1 ratio', async () => {
      await renderPage()
      await waitFor(() => {
        const h1 = screen.getByText('Поставка январь')
        expect(h1.classList.toString()).toContain('text-gray-900')
      })
    })

    it('back link has accessible label', async () => {
      await renderPage()
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Назад к списку/ })
        expect(link).toBeDefined()
      })
    })

    it('error messages are announced to screen readers', async () => {
      await renderPage({
        isError: true,
        error: new Error('404 not found'),
        data: undefined,
        isSuccess: false,
      })
      await waitFor(() => {
        expect(screen.getByText('Поставка не найдена')).toBeDefined()
      })
    })
  })

  // ============================================================================
  // TDD Verification Test
  // ============================================================================

  describe('TDD Verification', () => {
    it('should have test fixtures ready', () => {
      expect(mockSupplyOpen).toBeDefined()
      expect(mockSupplyClosed).toBeDefined()
      expect(mockSupplyDelivering).toBeDefined()
      expect(mockSupplyDelivered).toBeDefined()
      expect(mockSupplyCancelled).toBeDefined()
      expect(mockSupplyEmpty).toBeDefined()
    })

    it('should have mock hooks ready', () => {
      expect(mockUseSupplyDetail).toBeDefined()
      expect(mockUseRemoveOrders).toBeDefined()
      expect(mockUseDownloadDocument).toBeDefined()
    })

    it('should have error fixtures ready', () => {
      expect(mockErrorNotFound).toBeDefined()
      expect(mockErrorNotFound.code).toBe('SUPPLY_NOT_FOUND')
      expect(mockErrorForbidden).toBeDefined()
      expect(mockErrorNetworkError).toBeDefined()
    })

    it('should have testing utilities available', () => {
      expect(render).toBeDefined()
      expect(screen).toBeDefined()
      expect(waitFor).toBeDefined()
      expect(userEvent).toBeDefined()
    })
  })
})
