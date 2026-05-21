/**
 * ManualResolveForm — direct tests (F-3, Story 112.3-FE 1st-pass review).
 * Covers: disabled state, enabled state, mutation payload, cause labels,
 * form reset on success, and backend-pending Alert text.
 * AP#3: real ApiError constructor, mockRejectedValueOnce.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ManualResolveForm } from '../ManualResolveForm'
import * as useResolveAnomalyModule from '@/hooks/useResolveAnomaly'
import * as authStore from '@/stores/authStore'

vi.mock('@/hooks/useResolveAnomaly')
vi.mock('@/stores/authStore')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockUseAuthStore = vi.mocked(authStore.useAuthStore)
const mockUseResolveAnomaly = vi.mocked(useResolveAnomalyModule.useResolveAnomaly)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function makeMutationMock(
  overrides: Partial<ReturnType<typeof useResolveAnomalyModule.useResolveAnomaly>> = {}
) {
  const mutateFn = vi.fn()
  return {
    mutate: mutateFn,
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useResolveAnomalyModule.useResolveAnomaly>
}

function renderForm() {
  return render(<ManualResolveForm />, { wrapper: createWrapper() })
}

describe('ManualResolveForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockUseResolveAnomaly.mockReturnValue(makeMutationMock())
  })

  it('submit button is DISABLED when ID is empty', () => {
    renderForm()
    const submitBtn = screen.getByRole('button', { name: 'Разрешить' })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is DISABLED when cause is empty but ID is filled', async () => {
    renderForm()
    const idInput = screen.getByPlaceholderText('UUID аномалии')
    fireEvent.change(idInput, { target: { value: 'some-uuid' } })
    const submitBtn = screen.getByRole('button', { name: 'Разрешить' })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is ENABLED when both ID and cause are filled', async () => {
    renderForm()
    const idInput = screen.getByPlaceholderText('UUID аномалии')
    fireEvent.change(idInput, { target: { value: 'some-uuid' } })

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    // getAllByText — shadcn Select renders text in both trigger area and open portal listbox
    await waitFor(() => expect(screen.getAllByText('Сезонный фактор').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Сезонный фактор').at(-1)!)

    const submitBtn = screen.getByRole('button', { name: 'Разрешить' })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
  })

  it('mutation fires with correct payload when submitted', async () => {
    const mutateFn = vi.fn()
    mockUseResolveAnomaly.mockReturnValue(makeMutationMock({ mutate: mutateFn }))
    renderForm()

    const idInput = screen.getByPlaceholderText('UUID аномалии')
    fireEvent.change(idInput, { target: { value: 'my-anomaly-id' } })

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() =>
      expect(screen.getAllByText('Ошибка ценообразования').length).toBeGreaterThan(0)
    )
    fireEvent.click(screen.getAllByText('Ошибка ценообразования').at(-1)!)

    const submitBtn = screen.getByRole('button', { name: 'Разрешить' })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    expect(mutateFn).toHaveBeenCalledWith(
      {
        anomalyId: 'my-anomaly-id',
        resolutionCause: 'pricing_error',
        resolutionNote: undefined,
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('all 6 Russian cause labels render in the select', async () => {
    renderForm()
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    // Use getAllByText — shadcn may duplicate text in trigger + portal; at least one instance means label is present
    await waitFor(() => {
      expect(screen.getAllByText('Сезонный фактор').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ошибка ценообразования').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Проблема качества товара').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Изменение тарифов').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Реклассификация категории').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Прочее').length).toBeGreaterThan(0)
    })
  })

  it('form fields reset on mutation success (onSuccess callback clears state)', async () => {
    // Capture the mutate call and invoke its onSuccess callback synchronously
    const mutateFn = vi.fn().mockImplementation((_vars, options) => {
      options?.onSuccess?.()
    })
    mockUseResolveAnomaly.mockReturnValue(makeMutationMock({ mutate: mutateFn }))
    renderForm()

    const idInput = screen.getByPlaceholderText('UUID аномалии')
    fireEvent.change(idInput, { target: { value: 'reset-test-id' } })

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => expect(screen.getAllByText('Прочее').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByText('Прочее').at(-1)!)

    const submitBtn = screen.getByRole('button', { name: 'Разрешить' })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    // After onSuccess fires, the ID input should be cleared
    await waitFor(() => expect(idInput).toHaveValue(''))
    // Submit button should be disabled again (both fields empty)
    expect(submitBtn).toBeDisabled()
  })

  it('renders backend-pending Alert with Russian text (F-9)', () => {
    renderForm()
    expect(
      screen.getByText(/Эндпоинт \/v1\/ai\/anomalies ещё не реализован на бэкенде \(запрос #167\)/)
    ).toBeInTheDocument()
  })
})
