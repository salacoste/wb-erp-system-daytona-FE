/**
 * AnomaliesList — tests: role gating, state-precedence chain, live anomaly table.
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
import type { AnomalyListResponse } from '@/types/ai/system'

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
      anomalies: [
        {
          id: 'anomaly-1',
          nmId: 11111111,
          anomalyType: 'demand_spike',
          triggeredAt: '2026-05-15T10:00:00Z',
          status: 'pending',
          cabinetId: 'cab-123',
          vendorCode: 'VC-111',
          severity: 'critical',
          value: 20,
          baselineValue: 10,
          deviationPct: 100,
          rootCauseHint: null,
          resolvedAt: null,
          resolutionCause: null,
          resolutionNote: null,
        },
      ],
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
      anomalies: [
        {
          id: 'anomaly-1',
          nmId: 11111111,
          anomalyType: 'demand_spike',
          triggeredAt: '2026-05-15T10:00:00Z',
          status: 'pending',
          cabinetId: 'cab-123',
          vendorCode: 'VC-111',
          severity: 'critical',
          value: 20,
          baselineValue: 10,
          deviationPct: 100,
          rootCauseHint: null,
          resolvedAt: null,
          resolutionCause: null,
          resolutionNote: null,
        },
      ],
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
    // Table row "Разрешить" button per anomaly.
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Разрешить' })
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })
  })
})
