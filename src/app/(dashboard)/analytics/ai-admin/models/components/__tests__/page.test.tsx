/**
 * AiAdminModelsPage — tests: renders AdminModelsList, metadata title.
 * Story 112.1-FE Task 5.
 * Owner/non-Owner gate is tested in AdminModelsList.test.tsx (component level).
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AiAdminModelsPage from '../../page'
import * as useAdminModelsModule from '@/hooks/useAdminModels'
import * as authStore from '@/stores/authStore'

vi.mock('@/hooks/useAdminModels')
vi.mock('@/hooks/useModelRollback', () => ({
  useModelRollback: vi.fn(() => ({ mutate: vi.fn(), isPending: false, reset: vi.fn() })),
}))
vi.mock('@/stores/authStore')
vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

const mockUseAdminModels = vi.mocked(useAdminModelsModule.useAdminModels)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AiAdminModelsPage />
    </QueryClientProvider>
  )
}

describe('AiAdminModelsPage', () => {
  it('renders AdminModelsList for Owner with data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-1', user: { role: 'Owner' } })
    )
    mockUseAdminModels.mockReturnValue({
      data: { models: [], total: 0, page: 1, limit: 20 },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)

    renderPage()
    // Header title from AdminModelsList renders
    expect(screen.getByText('Управление AI моделями')).toBeInTheDocument()
  })

  it('renders access-denied Alert for non-Owner', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-1', user: { role: 'Manager' } })
    )
    mockUseAdminModels.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)

    renderPage()
    expect(screen.getByText(/Доступ запрещён/)).toBeInTheDocument()
  })

  it('back-link for non-Owner has correct href', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-1', user: { role: 'Analyst' } })
    )
    mockUseAdminModels.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminModelsModule.useAdminModels>)

    renderPage()
    const link = screen.getByRole('link', { name: /Вернуться к списку моделей/ })
    expect(link).toHaveAttribute('href', '/analytics/models')
  })
})
