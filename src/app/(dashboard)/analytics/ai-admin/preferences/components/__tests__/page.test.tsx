/**
 * AiPreferencesPage — tests: page renders AiPreferencesForm.
 * Story 112.2-FE Task 4.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AiPreferencesPage from '../../page'
import * as authStore from '@/stores/authStore'
import * as useAiPreferencesModule from '@/hooks/useAiPreferences'
import * as useUpdateAiPreferencesModule from '@/hooks/useUpdateAiPreferences'

vi.mock('@/stores/authStore')
vi.mock('@/hooks/useAiPreferences')
vi.mock('@/hooks/useUpdateAiPreferences')
vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

const mockUseAuthStore = vi.mocked(authStore.useAuthStore)
const mockUseAiPreferences = vi.mocked(useAiPreferencesModule.useAiPreferences)
const mockUseUpdateAiPreferences = vi.mocked(useUpdateAiPreferencesModule.useUpdateAiPreferences)

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AiPreferencesPage />
    </QueryClientProvider>
  )
}

describe('AiPreferencesPage', () => {
  it('renders AiPreferencesForm for Owner with data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockUseAiPreferences.mockReturnValue({
      data: { aiEnabled: true },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    mockUseUpdateAiPreferences.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)

    renderPage()
    expect(screen.getByRole('switch', { name: /Включить AI прогнозы/ })).toBeInTheDocument()
  })

  it('renders denied Alert for non-Owner', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    mockUseAiPreferences.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    mockUseUpdateAiPreferences.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)

    renderPage()
    expect(screen.getByText(/Доступ запрещён/)).toBeInTheDocument()
  })
})
