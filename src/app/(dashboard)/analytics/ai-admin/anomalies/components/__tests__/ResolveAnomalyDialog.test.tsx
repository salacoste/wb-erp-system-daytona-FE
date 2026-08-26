/**
 * ResolveAnomalyDialog — tests per AC-9 / AC-14 / AC-16.
 * Story 112.3-FE Task 5.
 * AP#3: real ApiError constructor, mockRejectedValueOnce.
 * ARIA: aria-live="polite" + role="status" on inline error Alert (F-12 override).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ResolveAnomalyDialog } from '../ResolveAnomalyDialog'
import * as systemApi from '@/lib/api/ai/system'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'
import type { AnomalyEntry } from '@/types/ai/system'

vi.mock('@/lib/api/ai/system')
vi.mock('@/stores/authStore')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockPatchAnomalyResolve = vi.mocked(systemApi.patchAnomalyResolve)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const mockAnomaly: AnomalyEntry = {
  id: 'anomaly-uuid-1',
  nmId: 12345678,
  vendorCode: null,
  anomalyType: 'demand_spike',
  severity: 'medium',
  value: 50,
  baselineValue: 20,
  deviationPct: 150,
  rootCauseHint: null,
  triggeredAt: '2026-05-15T10:23:00Z',
  status: 'pending',
  cabinetId: 'cab-123',
  resolvedAt: null,
  resolutionCause: null,
  resolutionNote: null,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderDialog(open = true, anomaly: AnomalyEntry | null = mockAnomaly) {
  const onOpenChange = vi.fn()
  render(<ResolveAnomalyDialog anomaly={anomaly} open={open} onOpenChange={onOpenChange} />, {
    wrapper: createWrapper(),
  })
  return { onOpenChange }
}

describe('ResolveAnomalyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
  })

  it('renders DialogDescription for WCAG name/role/value compliance', () => {
    // F-2 (Story 112.3-FE 1st-pass): Radix Dialog requires aria-describedby for screen-reader narration.
    // <DialogDescription> wires this. Test pins the requirement so future refactors regression-fail.
    renderDialog()
    expect(
      screen.getByText(
        'Укажите причину разрешения аномалии. Это поможет AI улучшить точность будущих прогнозов.'
      )
    ).toBeInTheDocument()
  })

  it('renders dialog title with anomaly id (String() AP#10)', () => {
    renderDialog()
    expect(screen.getByText(/Разрешить аномалию #anomaly-uuid-1/)).toBeInTheDocument()
  })

  it('renders anomaly context: nmId as String, type, date', () => {
    renderDialog()
    expect(screen.getByText(/12345678/)).toBeInTheDocument()
    expect(screen.getByText(/demand_spike/)).toBeInTheDocument()
  })

  it('renders all 6 ResolutionCause options in Russian', async () => {
    renderDialog()
    // Open the select to see options
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => {
      expect(screen.getByText('Сезонный фактор')).toBeInTheDocument()
      expect(screen.getByText('Ошибка ценообразования')).toBeInTheDocument()
      expect(screen.getByText('Проблема качества товара')).toBeInTheDocument()
      expect(screen.getByText('Изменение тарифов')).toBeInTheDocument()
      expect(screen.getByText('Реклассификация категории')).toBeInTheDocument()
      expect(screen.getByText('Прочее')).toBeInTheDocument()
    })
  })

  it('submit button is disabled until cause is selected', () => {
    renderDialog()
    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button enables after cause is selected', async () => {
    renderDialog()
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Сезонный фактор'))
    fireEvent.click(screen.getByText('Сезонный фактор'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
  })

  it('fires mutation with correct payload on submit', async () => {
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)
    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Сезонный фактор'))
    fireEvent.click(screen.getByText('Сезонный фактор'))

    const noteField = screen.getByPlaceholderText('Дополнительный контекст')
    fireEvent.change(noteField, { target: { value: 'Test note' } })

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(mockPatchAnomalyResolve).toHaveBeenCalledWith('anomaly-uuid-1', {
        resolutionCause: 'seasonal',
        resolutionNote: 'Test note',
      })
    )
  })

  it('shows success toast and calls onOpenChange(false) on success', async () => {
    const { toast } = await import('sonner')
    mockPatchAnomalyResolve.mockResolvedValueOnce(undefined)
    const { onOpenChange } = renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Аномалия разрешена.')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows 403-specific error message on ApiError 403', async () => {
    // AP#3: real ApiError constructor
    const forbidden = new ApiError('Forbidden', 403)
    mockPatchAnomalyResolve.mockRejectedValueOnce(forbidden)

    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(screen.getByText('Нет доступа. Требуется роль Owner или Manager.')).toBeInTheDocument()
    )
  })

  it('shows generic error message on non-403 failure', async () => {
    mockPatchAnomalyResolve.mockRejectedValueOnce(new Error('Network error'))

    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(
        screen.getByText('Не удалось разрешить аномалию. Попробуйте позже.')
      ).toBeInTheDocument()
    )
  })

  it('error Alert has aria-live="polite" and role="status" (NOT role="alert")', async () => {
    mockPatchAnomalyResolve.mockRejectedValueOnce(new Error('fail'))

    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(
        screen.getByText('Не удалось разрешить аномалию. Попробуйте позже.')
      ).toBeInTheDocument()
    )

    // F-12: must be role="status" NOT role="alert"
    const statusEl = screen.getByRole('status')
    expect(statusEl).toHaveAttribute('aria-live', 'polite')
  })

  it('does not render when open=false', () => {
    renderDialog(false)
    expect(screen.queryByText(/Разрешить аномалию/)).not.toBeInTheDocument()
  })

  it('shows 409-conflict message on ApiError 409, distinct from generic (Story 171.1 gap 5)', async () => {
    // AP#3: real ApiError constructor
    const conflict = new ApiError('Conflict', 409)
    mockPatchAnomalyResolve.mockRejectedValueOnce(conflict)

    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(screen.getByText('Аномалия уже разрешена. Обновите список.')).toBeInTheDocument()
    )
  })

  it('retains cause and note input after 409-conflict failure (AC-2, gap 5)', async () => {
    mockPatchAnomalyResolve.mockRejectedValueOnce(new ApiError('Conflict', 409))
    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const noteField = screen.getByPlaceholderText('Дополнительный контекст')
    fireEvent.change(noteField, { target: { value: 'Test note 409' } })

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() =>
      expect(screen.getByText('Аномалия уже разрешена. Обновите список.')).toBeInTheDocument()
    )
    // Input retained: dialog open, note value preserved
    expect(noteField).toHaveValue('Test note 409')
    expect(screen.getByRole('button', { name: /Подтвердить разрешение/ })).toBeInTheDocument()
  })

  it('announces submitting politely once: aria-busy form + sr-only polite status (gap 7)', async () => {
    // Never-resolving promise keeps the mutation in isPending for assertion
    mockPatchAnomalyResolve.mockImplementationOnce(() => new Promise(() => {}))

    renderDialog()

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    await waitFor(() => screen.getByText('Прочее'))
    fireEvent.click(screen.getByText('Прочее'))

    const submitBtn = screen.getByRole('button', { name: /Подтвердить разрешение/ })
    await waitFor(() => expect(submitBtn).not.toBeDisabled())
    fireEvent.click(submitBtn)

    await waitFor(() => expect(screen.getByText('Отправка данных…')).toBeInTheDocument())
    const live = screen.getByText('Отправка данных…')
    // F-12: polite (not assertive), announced once
    expect(live).toHaveAttribute('role', 'status')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live.className).toMatch(/sr-only/)
    // Form container carries aria-busy while pending
    expect(screen.getByText('Отправка данных…').closest('[aria-busy="true"]')).not.toBeNull()
  })
})
