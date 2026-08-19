/**
 * BuyoutReconciliationPageContent Unit Tests — Story 96.14-FE
 *
 * Verifies the 5-branch state machine (AC-4):
 *   1. Loading skeleton — isLoading && !hasData
 *   2. Full error — isError && !hasData
 *   3. No data — empty data array
 *   4. No anomalies — data present, all anomaly counts = 0
 *   5. Populated table — data present with anomaly counts > 0
 *
 * Also verifies post-1st-pass-review fixes:
 *   H-1: cabinet switch resets local state (dateRange + nmIdInput)
 *   M-1: nmId=0 treated as invalid (showNmIdError shown)
 *
 * Pattern 3 wiring: fixtures imported from buyout-reconciliation-empty.ts.
 * Mocks useBuyoutReconciliation + authStore to avoid TanStack Query setup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import {
  createSuccessQueryResult,
  createLoadingQueryResult,
  createErrorQueryResult,
  createMockQueryResult,
} from '@/test/utils/query-mock'
import type { BuyoutReconciliationResponse } from '@/types/buyout-reconciliation'
import {
  emptyBuyoutReconciliationResponse,
  noAnomalyResponse,
  withAnomalyResponse,
} from '@/test/fixtures/buyout-reconciliation-empty'

// Mock hook before component import (hoisting requirement)
const mockUseBuyoutReconciliation = vi.fn()
vi.mock('@/hooks/use-buyout-reconciliation', () => ({
  useBuyoutReconciliation: (...args: unknown[]) => mockUseBuyoutReconciliation(...args),
}))

// H-1: mutable cabinetId so tests can simulate cabinet switches
let mockCabinetId: string | null = 'cabinet-A'
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: mockCabinetId }),
}))

import { BuyoutReconciliationPageContent } from '../BuyoutReconciliationPageContent'

function mockLoading() {
  mockUseBuyoutReconciliation.mockReturnValue(
    createLoadingQueryResult<BuyoutReconciliationResponse>()
  )
}

function mockError() {
  mockUseBuyoutReconciliation.mockReturnValue(
    createErrorQueryResult<BuyoutReconciliationResponse>()
  )
}

function mockSuccess(data: BuyoutReconciliationResponse) {
  mockUseBuyoutReconciliation.mockReturnValue(createSuccessQueryResult(data))
}

describe('BuyoutReconciliationPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCabinetId = 'cabinet-A'
  })

  it('branch 1 — renders loading skeleton when isLoading and no data', () => {
    mockLoading()
    renderWithProviders(<BuyoutReconciliationPageContent />)
    // aria-busy skeleton region
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Загрузка данных')).toBeInTheDocument()
  })

  it('branch 2 — renders full-error alert with retry button when isError and no data', () => {
    mockError()
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByText(/Не удалось загрузить данные сверки/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Повторить/ })).toBeInTheDocument()
  })

  it('branch 3 — renders no-data empty state when data array is empty', () => {
    mockSuccess(emptyBuyoutReconciliationResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByText(/Данных по выкупам за выбранный период нет/)).toBeInTheDocument()
    expect(screen.queryByTestId('reconciliation-table')).toBeNull()
  })

  it('branch 4 — renders no-anomalies success state when all anomaly counts are 0', () => {
    mockSuccess(noAnomalyResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByText(/Аномалий не найдено за выбранный период/)).toBeInTheDocument()
    expect(screen.queryByTestId('reconciliation-table')).toBeNull()
  })

  it('branch 5 — renders populated table when anomaly counts > 0', () => {
    mockSuccess(withAnomalyResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByTestId('reconciliation-table')).toBeInTheDocument()
    // M2-2 fix: role="button" dropped from tooltip triggers — query by aria-label instead
    const indicators = screen.getAllByLabelText(/Аномалия/)
    expect(indicators.length).toBeGreaterThanOrEqual(1)
  })

  it('renders page landmark and header', () => {
    mockSuccess(emptyBuyoutReconciliationResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByTestId('buyout-reconciliation-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Сверка выкупов и возвратов/ })).toBeInTheDocument()
  })

  it('renders refresh schedule disclosure note', () => {
    mockSuccess(emptyBuyoutReconciliationResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)
    expect(screen.getByText(/Данные обновляются ежедневно в 06:30 МСК/)).toBeInTheDocument()
  })

  it('H-1: cabinet switch resets nmIdInput and dateRange to default (Story 96.12 M2-2 lesson)', () => {
    mockSuccess(emptyBuyoutReconciliationResponse())
    const { rerender } = renderWithProviders(<BuyoutReconciliationPageContent />)

    // Type a value into the nmId filter
    const input = screen.getByRole('textbox', { name: /Фильтр по артикулу WB/ })
    fireEvent.change(input, { target: { value: '12345' } })
    expect(input).toHaveValue('12345')

    // Simulate cabinet switch by changing mockCabinetId and re-rendering
    act(() => {
      mockCabinetId = 'cabinet-B'
    })
    rerender(<BuyoutReconciliationPageContent />)

    // nmIdInput should be reset to empty after cabinet switch
    expect(screen.getByRole('textbox', { name: /Фильтр по артикулу WB/ })).toHaveValue('')
  })

  it('L2-2: stale-data banner shown in no-anomalies branch when isError && hasData', () => {
    // Simulate: refetch failed but cached no-anomaly data is present
    mockUseBuyoutReconciliation.mockReturnValue(
      createMockQueryResult(noAnomalyResponse(), { isError: true })
    )
    renderWithProviders(<BuyoutReconciliationPageContent />)
    // Green check still visible (no-anomalies state)
    expect(screen.getByText(/Аномалий не найдено за выбранный период/)).toBeInTheDocument()
    // Stale banner also visible — parity with showTable branch (L2-2 fix)
    expect(screen.getByTestId('stale-data-banner')).toBeInTheDocument()
    expect(
      screen.getByText(/Не удалось обновить. Показаны кэшированные данные./)
    ).toBeInTheDocument()
  })

  it('M-1: nmId=0 shows validation error (0 is not a valid positive article)', () => {
    mockSuccess(emptyBuyoutReconciliationResponse())
    renderWithProviders(<BuyoutReconciliationPageContent />)

    const input = screen.getByRole('textbox', { name: /Фильтр по артикулу WB/ })
    fireEvent.change(input, { target: { value: '0' } })

    // "0" passes the /^\d+$/ regex but fails the > 0 guard — should show error
    expect(screen.getByText(/Должно быть положительное целое число/)).toBeInTheDocument()
    // Epic 169.5: validation hint uses status token (exact pin)
    expect(screen.getByText(/Должно быть положительное целое число/)).toHaveClass(
      'text-status-warning'
    )
  })

  // Epic 169.5: token pins for stale banner + no-anomalies success state (exact classes)
  it('Epic 169.5: stale-data banner uses status-warning /15+30 idiom, testid preserved', () => {
    mockUseBuyoutReconciliation.mockReturnValue(
      createMockQueryResult(noAnomalyResponse(), { isError: true })
    )
    renderWithProviders(<BuyoutReconciliationPageContent />)
    const banner = screen.getByTestId('stale-data-banner')
    expect(banner).toHaveClass('border-status-warning/30')
    expect(banner).toHaveClass('bg-status-warning/15')
    expect(banner).toHaveClass('text-status-warning')
  })

  it('Epic 169.5: no-anomalies alert uses status-success /15+30 idiom', () => {
    mockUseBuyoutReconciliation.mockReturnValue(
      createMockQueryResult(noAnomalyResponse(), { isError: true })
    )
    renderWithProviders(<BuyoutReconciliationPageContent />)
    // Alert root carries the border+bg pair; icon and description carry the text token
    const alert = screen
      .getByText(/Аномалий не найдено за выбранный период/)
      .closest('[role="alert"]')
    expect(alert).not.toBeNull()
    expect(alert).toHaveClass('border-status-success/30')
    expect(alert).toHaveClass('bg-status-success/15')
    const icon = alert?.querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon).toHaveClass('text-status-success')
    expect(screen.getByText(/Аномалий не найдено за выбранный период/)).toHaveClass(
      'text-status-success'
    )
  })
})
