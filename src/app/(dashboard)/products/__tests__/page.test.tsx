/**
 * Render test for the Assortment management page (/products).
 * Mocks the lifecycle API to empty lists and asserts the page mounts and shows
 * its title + empty states without crashing (graceful empty handling).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
const mockPatch = vi.mocked(apiClient.patch)

const discontinued = {
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
}

const activeSuggestion = {
  ...discontinued,
  id: 'p2',
  nmId: 99887766,
  vendorCode: 'ACTIVE-1',
  isDiscontinued: false,
  discontinuedAt: null,
  discontinuedBy: null,
  discontinuedSuggestedAt: '2026-08-01T00:00:00.000Z',
  discontinuedReason: 'no_sales_90d',
}

describe('ProductsAssortmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Both lifecycle lists resolve empty → exercise empty-state branches.
    mockGet.mockResolvedValue([])
    mockPatch.mockResolvedValue({})
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
    mockGet.mockResolvedValueOnce([discontinued])
    renderWithProviders(<ProductsAssortmentPage />)
    await waitFor(() => {
      expect(screen.getByText(/PR20221010/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Вернуть в ассортимент/ })).toBeInTheDocument()
    })
  })

  it('keeps both route sections identifiable while lifecycle data loads', () => {
    mockGet.mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<ProductsAssortmentPage />)

    expect(screen.getByText('Снятые с продажи')).toBeVisible()
    expect(screen.getByText('Подсказки системы')).toBeVisible()
    expect(screen.getAllByText('Загрузка…')).toHaveLength(2)
  })

  it('keeps one lifecycle section usable when its sibling request fails', async () => {
    mockGet
      .mockRejectedValueOnce(new Error('list failed'))
      .mockResolvedValueOnce([activeSuggestion])

    renderWithProviders(<ProductsAssortmentPage />)

    expect(await screen.findByText('Ошибка загрузки списка.')).toBeVisible()
    expect(await screen.findByText('ACTIVE-1')).toBeVisible()
  })

  it('renders discontinued lifecycle rows with a named reactivation action', async () => {
    mockGet.mockResolvedValueOnce([discontinued]).mockResolvedValueOnce([])
    renderWithProviders(<ProductsAssortmentPage />)

    expect(await screen.findByText(/PR20221010/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Вернуть в ассортимент' })).toBeEnabled()
  })

  it('shows active lifecycle suggestions as reversible destructive confirmations', async () => {
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([activeSuggestion])
    renderWithProviders(<ProductsAssortmentPage />)

    expect(await screen.findByText('ACTIVE-1')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Снять с продажи' })).toBeEnabled()
  })

  it('keeps active and discontinued product identities distinct', async () => {
    mockGet.mockResolvedValueOnce([discontinued]).mockResolvedValueOnce([activeSuggestion])
    renderWithProviders(<ProductsAssortmentPage />)

    expect(await screen.findByText(/PR20221010/)).toBeVisible()
    expect(await screen.findByText('ACTIVE-1')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Вернуть в ассортимент' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Снять с продажи' })).toBeVisible()
  })

  it('requires explicit confirmation before discontinuing a suggested product', async () => {
    const user = userEvent.setup()
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([activeSuggestion])
    renderWithProviders(<ProductsAssortmentPage />)

    await user.click(await screen.findByRole('button', { name: 'Снять с продажи' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Снять товар с продажи?')
    expect(mockPatch).not.toHaveBeenCalled()
  })

  it('disables lifecycle actions while an update is pending', async () => {
    const user = userEvent.setup()
    mockPatch.mockImplementation(() => new Promise(() => {}))
    mockGet.mockResolvedValueOnce([discontinued]).mockResolvedValueOnce([])
    renderWithProviders(<ProductsAssortmentPage />)

    const action = await screen.findByRole('button', { name: 'Вернуть в ассортимент' })
    await user.click(action)
    await waitFor(() => expect(action).toBeDisabled())
  })

  it('persists a successful lifecycle update through the canonical route action', async () => {
    const user = userEvent.setup()
    mockGet.mockResolvedValueOnce([discontinued]).mockResolvedValueOnce([])
    renderWithProviders(<ProductsAssortmentPage />)

    await user.click(await screen.findByRole('button', { name: 'Вернуть в ассортимент' }))
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/v1/products/124781945/lifecycle', {
        status: 'active',
      })
    )
  })
})
