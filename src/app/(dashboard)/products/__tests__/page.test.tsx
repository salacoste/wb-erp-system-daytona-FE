/**
 * Render test for the Assortment management page (/products).
 * Mocks the lifecycle API to empty lists and asserts the page mounts and shows
 * its title + empty states without crashing (graceful empty handling).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import ProductsAssortmentPage from '../page'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string | null }) => unknown) =>
    selector({ cabinetId: 'cab-1' })
  ),
}))

vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)

describe('ProductsAssortmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Both lifecycle lists resolve empty → exercise empty-state branches.
    mockGet.mockResolvedValue([])
  })

  it('renders the page title and description', async () => {
    renderWithProviders(<ProductsAssortmentPage />)
    expect(screen.getByText('Ассортимент')).toBeInTheDocument()
    expect(screen.getByText(/Управление статусом «Снят с продажи»/)).toBeInTheDocument()
  })

  it('renders both section cards', async () => {
    renderWithProviders(<ProductsAssortmentPage />)
    expect(screen.getByText('Снятые с продажи')).toBeInTheDocument()
    expect(screen.getByText('Подсказки системы')).toBeInTheDocument()
  })

  it('shows empty-state messages when there are no discontinued SKUs / suggestions', async () => {
    renderWithProviders(<ProductsAssortmentPage />)
    await waitFor(() => {
      expect(screen.getByText('Нет снятых товаров.')).toBeInTheDocument()
      expect(screen.getByText(/Подсказок нет — все товары активны\./)).toBeInTheDocument()
    })
  })

  it('renders a product row when discontinued list is non-empty', async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: 'p1',
        nmId: 124781945,
        vendorCode: 'PR20221010',
        imtId: 1,
        brand: 'Space Chemical',
        subject: 'Краски',
        isDiscontinued: true,
        discontinuedAt: '2026-01-01T00:00:00.000Z',
        discontinuedBy: 'u',
        discontinuedSuggestedAt: null,
        discontinuedReason: 'manual',
      },
    ])
    renderWithProviders(<ProductsAssortmentPage />)
    await waitFor(() => {
      expect(screen.getByText(/PR20221010/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Вернуть в ассортимент/ })).toBeInTheDocument()
    })
  })
})
