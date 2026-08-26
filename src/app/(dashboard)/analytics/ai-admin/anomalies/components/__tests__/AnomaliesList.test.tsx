/**
 * AnomaliesList — tests: role gating, state-precedence chain.
 * Story 112.3-FE Task 4.
 * Dual-role gate: Owner AND Manager see table; Analyst and Service see denied Alert.
 * user===null shows skeleton (no flicker per F-11).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
    // Table row "Разрешить" button per anomaly (live mode — Request #167 shipped).
    // Story 171.1 gap 2: accessible name carries anomaly identity.
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: 'Разрешить аномалию #anomaly-1' })
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders TableCaption naming the analysis (Story 171.1 gap 1)', async () => {
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
    await waitFor(() => expect(screen.getByText('Аномалии ИИ-прогнозов')).toBeInTheDocument())
  })

  it('nmId and triggeredAt cells are tabular-nums; id stays font-mono without tabular (gap 3)', async () => {
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
    await waitFor(() => expect(screen.getByText('anomaly-1')).toBeInTheDocument())
    const row = screen.getByText('anomaly-1').closest('tr')
    expect(row).not.toBeNull()
    const cells = row?.querySelectorAll('td')
    expect(cells?.length).toBe(6)
    // id: font-mono, NO tabular-nums (169.x negative pin)
    expect(cells?.[0]).toHaveClass('font-mono')
    expect(cells?.[0]).not.toHaveClass('tabular-nums')
    // nmId: tabular-nums
    expect(cells?.[1]).toHaveClass('tabular-nums')
    // triggeredAt: tabular-nums
    expect(cells?.[3]).toHaveClass('tabular-nums')
  })

  it('filtered-empty shows distinct message + reset path; reset returns to no-anomalies (gap 4)', async () => {
    mockGetAnomalies.mockResolvedValue(emptyResponse)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    renderList()
    // Default 'all' → no-anomalies message, no reset button
    await waitFor(() =>
      expect(screen.getByText('Нет аномалий, требующих внимания.')).toBeInTheDocument()
    )
    expect(screen.queryByText('Сбросить фильтр')).not.toBeInTheDocument()

    // Apply server-side status filter via the control (mirror of its reset idiom)
    fireEvent.click(screen.getByRole('combobox'))
    await waitFor(() => screen.getByText('Разрешено'))
    fireEvent.click(screen.getByText('Разрешено'))

    await waitFor(() =>
      expect(screen.getByText('Нет аномалий с выбранным фильтром.')).toBeInTheDocument()
    )
    const resetBtn = screen.getByRole('button', { name: 'Сбросить фильтр' })
    // Round-1 F1: pin the SERVER-PARAM contract — the static mock made the
    // refetch invisible; a dropped status param would pass unchanged without this.
    expect(mockGetAnomalies).toHaveBeenLastCalledWith({ status: 'resolved' })
    fireEvent.click(resetBtn)
    await waitFor(() =>
      expect(screen.getByText('Нет аномалий, требующих внимания.')).toBeInTheDocument()
    )
    expect(mockGetAnomalies).toHaveBeenLastCalledWith({}) // reset → status undefined
  })

  it('empty anomalyType renders muted «Неизвестный тип» fallback (gap 6)', async () => {
    const responseWithData: AnomalyListResponse = {
      anomalies: [makeAnomaly({ anomalyType: '' })],
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
      const fallback = screen.getByText('Неизвестный тип')
      expect(fallback).toBeInTheDocument()
      // muted (169.x unknown=muted canon), not an error color
      expect(fallback).toHaveClass('text-muted-foreground')
    })
  })
})
