/**
 * AnomaliesList — tests: role gating, state-precedence chain, backend-pending Alert.
 * Story 112.3-FE Task 4.
 * Dual-role gate: Owner AND Manager see table; Analyst and Service see denied Alert.
 * user===null shows skeleton (no flicker per F-11).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnomaliesList } from '../AnomaliesList'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import type { AnomalyListResponse, AnomalyEntry } from '@/types/ai/system'

/** Minimal valid AnomalyEntry for test mocks */
const makeAnomaly = (overrides: Partial<AnomalyEntry> = {}): AnomalyEntry => ({
  id: 'anomaly-1',
  nmId: 11111111,
  vendorCode: null,
  anomalyType: 'demand_spike',
  severity: 'medium',
  value: 50,
  baselineValue: 20,
  deviationPct: 150,
  rootCauseHint: null,
  triggeredAt: '2026-05-15T10:00:00Z',
  status: 'pending',
  cabinetId: 'cab-123',
  resolvedAt: null,
  resolutionCause: null,
  resolutionNote: null,
  ...overrides,
})

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
// Stub next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

const mockGetAnomalies = vi.mocked(systemApi.getAnomalies)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const emptyResponse: AnomalyListResponse = { anomalies: [], total: 0, page: 1, limit: 20 }

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderList() {
  return render(<AnomaliesList />, { wrapper: createWrapper() })
}

describe('AnomaliesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAnomalies.mockResolvedValue(emptyResponse)
  })

  it('shows skeleton when user is null (hydration — no flicker)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: null })
    )
    renderList()
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
    expect(screen.queryByText(/Доступ запрещён/)).not.toBeInTheDocument()
  })

  it('shows denied Alert for Analyst role', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    renderList()
    // Pin dual-role phrasing — catches regression if "только владельцу или менеджеру" changes.
    await waitFor(() =>
      expect(screen.getByText(/только владельцу или менеджеру/)).toBeInTheDocument()
    )
  })

  it('shows denied Alert for Service role', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Service' } })
    )
    renderList()
    await waitFor(() => expect(screen.getByText(/Доступ запрещён/)).toBeInTheDocument())
  })

  it('renders page header for Owner role', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    await waitFor(() => expect(screen.getByText('Разрешение аномалий')).toBeInTheDocument())
  })

  it('renders page header for Manager role (dual-role gate)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    renderList()
    await waitFor(() => expect(screen.getByText('Разрешение аномалий')).toBeInTheDocument())
  })

  it('shows empty state when anomalies array is empty', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    await waitFor(() =>
      expect(screen.getByText('Нет аномалий, требующих внимания.')).toBeInTheDocument()
    )
  })

  it('shows error Alert when fetch fails', async () => {
    mockGetAnomalies.mockRejectedValueOnce(new Error('Network error'))
    mockGetAnomalies.mockRejectedValueOnce(new Error('Network error'))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    await waitFor(
      () =>
        expect(
          screen.getByText('Не удалось загрузить список аномалий. Попробуйте позже.')
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('renders table with anomaly rows when data is present', async () => {
    const responseWithData: AnomalyListResponse = {
      anomalies: [makeAnomaly()],
      total: 1,
      page: 1,
      limit: 20,
    }
    mockGetAnomalies.mockResolvedValue(responseWithData)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    await waitFor(() => {
      // AP#10: id and nmId rendered as String()
      expect(screen.getByText('anomaly-1')).toBeInTheDocument()
      expect(screen.getByText('11111111')).toBeInTheDocument()
      expect(screen.getByText('demand_spike')).toBeInTheDocument()
    })
  })

  it('renders "Разрешить" button for pending anomalies', async () => {
    const responseWithData: AnomalyListResponse = {
      anomalies: [makeAnomaly()],
      total: 1,
      page: 1,
      limit: 20,
    }
    mockGetAnomalies.mockResolvedValue(responseWithData)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    // Table row "Разрешить" button per anomaly (STUB_PENDING_BACKEND_167=false — live mode).
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Разрешить' })
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ── F-1: STUB_PENDING_BACKEND_167 = false branch ──────────────────────────────
// Uses vi.doMock + vi.resetModules + dynamic import to override the helpers constant
// without affecting the top-level vi.mock hoisting above.

describe('AnomaliesList — STUB_PENDING_BACKEND_167=false (backend shipped)', () => {
  const anomalyData: AnomalyListResponse = {
    anomalies: [
      makeAnomaly({ id: 'live-anomaly-1', nmId: 99999999, anomalyType: 'price_anomaly' }),
    ],
    total: 1,
    page: 1,
    limit: 20,
  }

  beforeEach(() => {
    vi.resetModules()
    // Override helpers to flip the stub flag off
    vi.doMock('../anomalies-helpers', () => ({
      STUB_PENDING_BACKEND_167: false,
      RESOLUTION_CAUSE_LABELS: {
        seasonal: 'Сезонный фактор',
        pricing_error: 'Ошибка ценообразования',
        quality_issue: 'Проблема качества товара',
        tariff_change: 'Изменение тарифов',
        category_reclassification: 'Реклассификация категории',
        other: 'Прочее',
      },
      RESOLUTION_CAUSES: [
        'seasonal',
        'pricing_error',
        'quality_issue',
        'tariff_change',
        'category_reclassification',
        'other',
      ],
    }))
    vi.doMock('@/lib/api/ai/system', () => ({
      getAnomalies: vi.fn().mockResolvedValue(anomalyData),
      patchAnomalyResolve: vi.fn().mockResolvedValue(undefined),
    }))
    vi.doMock('@/stores/authStore', () => ({
      useAuthStore: vi.fn().mockImplementation((selector: unknown) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector as any)({ cabinetId: 'cab-123', user: { role: 'Owner' } })
      ),
    }))
    vi.doMock('next/link', () => ({
      default: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    }))
    vi.doMock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('backend-pending Alert is NOT in document when STUB_PENDING_BACKEND_167=false', async () => {
    const { AnomaliesList: AnomaliesListLive } = await import('../AnomaliesList')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(AnomaliesListLive)
      )
    )
    // Positive: verify the table actually rendered with mock data (catches doMock-path failure
    // silently regressing to true-branch which also lacks the Alert during loading state).
    expect(await screen.findByText('live-anomaly-1')).toBeInTheDocument()
    // Wait for data to load
    await waitFor(() =>
      expect(screen.queryByLabelText('Загрузка аномалий')).not.toBeInTheDocument()
    )
    expect(
      screen.queryByText(/Эндпоинт \/v1\/ai\/anomalies ещё не реализован/)
    ).not.toBeInTheDocument()
  })

  it('"Разрешить аномалию по ID" heading is NOT in document when STUB_PENDING_BACKEND_167=false', async () => {
    const { AnomaliesList: AnomaliesListLive } = await import('../AnomaliesList')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(AnomaliesListLive)
      )
    )
    await waitFor(() =>
      expect(screen.queryByLabelText('Загрузка аномалий')).not.toBeInTheDocument()
    )
    expect(screen.queryByText('Разрешить аномалию по ID')).not.toBeInTheDocument()
  })

  it('table renders normally with live anomaly data when STUB_PENDING_BACKEND_167=false', async () => {
    const { AnomaliesList: AnomaliesListLive } = await import('../AnomaliesList')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(AnomaliesListLive)
      )
    )
    await waitFor(() => {
      expect(screen.getByText('live-anomaly-1')).toBeInTheDocument()
      expect(screen.getByText('99999999')).toBeInTheDocument()
      expect(screen.getByText('price_anomaly')).toBeInTheDocument()
    })
  })
})
