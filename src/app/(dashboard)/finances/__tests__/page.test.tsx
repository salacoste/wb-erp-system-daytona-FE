/**
 * NEW-7 — Finances page integration test.
 *
 * Verifies the page renders the heading + both independent sections (BalanceCard
 * + DocumentsTable), and gates them on cabinet readiness (cabinetId from the
 * auth store). Mocks the auth store + hooks so no real network fires.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import FinancesPage from '../page'

// Mock the auth store BEFORE importing the page (it reads cabinetId at render).
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the hooks so no real queries fire.
vi.mock('@/hooks/useFinances', () => ({
  useAccountBalance: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
  useFinanceDocuments: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
  useFinanceDocumentCategories: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
  useDownloadDocument: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false })),
}))

import { useAuthStore } from '@/stores/authStore'
import { useAccountBalance, useFinanceDocuments } from '@/hooks/useFinances'

const useAuthStoreMock = useAuthStore as unknown as ReturnType<typeof vi.fn>
const useAccountBalanceMock = useAccountBalance as unknown as ReturnType<typeof vi.fn>
const useFinanceDocumentsMock = useFinanceDocuments as unknown as ReturnType<typeof vi.fn>

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <FinancesPage />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

describe('FinancesPage — NEW-7 integration', () => {
  beforeEach(() => {
    useAuthStoreMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the page heading + both sections when a cabinet is selected', () => {
    useAuthStoreMock.mockImplementation((selector: (s: { cabinetId: string | null }) => unknown) =>
      selector({ cabinetId: 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e' })
    )
    renderPage()
    expect(screen.getByRole('heading', { name: 'Финансы', level: 1 })).toBeInTheDocument()
    // Balance card + documents table headings.
    expect(screen.getByText('Баланс кабинета')).toBeInTheDocument()
    expect(screen.getByText('Финансовые документы')).toBeInTheDocument()
  })

  it('disables the hooks (enabled:false) when no cabinet is selected', () => {
    useAuthStoreMock.mockImplementation((selector: (s: { cabinetId: string | null }) => unknown) =>
      selector({ cabinetId: null })
    )
    useAccountBalanceMock.mockClear()
    useFinanceDocumentsMock.mockClear()
    renderPage()
    // The page passes enabled={cabinetReady} — false when cabinetId is null.
    expect(useAccountBalanceMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(useFinanceDocumentsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )
  })
})
