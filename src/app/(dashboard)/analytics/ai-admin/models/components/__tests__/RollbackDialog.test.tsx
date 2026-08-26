/**
 * RollbackDialog — tests: reason validation, confirm/cancel, success toast, error states.
 * Story 112.1-FE Task 4.
 * AP#3: real ApiError constructor for 403 test.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RollbackDialog } from '../RollbackDialog'
import * as useModelRollbackModule from '@/hooks/useModelRollback'
import { ApiError } from '@/types/api'
import type { AiModel } from '@/types/ai/models'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/hooks/useModelRollback')
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string }) => unknown) =>
    selector({ cabinetId: 'cab-123' })
  ),
}))

const mockUseModelRollback = vi.mocked(useModelRollbackModule.useModelRollback)

const mockModel: AiModel = {
  id: 'model-42',
  modelType: 'sales_forecast',
  engine: 'prophet',
  version: 3,
  status: 'active',
  metrics: { mape: 12.5, dataPointsCount: 100 },
  trainedAt: '2026-01-15T00:00:00Z',
}

function buildMutationMock(
  overrides: Partial<ReturnType<typeof useModelRollbackModule.useModelRollback>> = {}
) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useModelRollbackModule.useModelRollback>
}

function renderDialog(props: Partial<React.ComponentProps<typeof RollbackDialog>> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <RollbackDialog
        model={mockModel}
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  )
}

describe('RollbackDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseModelRollback.mockReturnValue(buildMutationMock())
  })

  it('renders dialog title with model version', () => {
    renderDialog()
    expect(screen.getByText(/Откатить модель v3/)).toBeInTheDocument()
  })

  it('renders body text with version', () => {
    renderDialog()
    expect(screen.getByText(/Модель v3 будет откачена/)).toBeInTheDocument()
  })

  it('confirm button disabled when reason is empty', () => {
    renderDialog()
    const btn = screen.getByRole('button', { name: /Подтвердить откат/i })
    expect(btn).toBeDisabled()
  })

  it('confirm button disabled when reason shorter than 10 chars', () => {
    renderDialog()
    const textarea = screen.getByRole('textbox', { name: /Причина отката/i })
    fireEvent.change(textarea, { target: { value: 'short' } })
    const btn = screen.getByRole('button', { name: /Подтвердить откат/i })
    expect(btn).toBeDisabled()
  })

  it('shows minLength validation hint when reason < 10 chars and not empty', () => {
    renderDialog()
    const textarea = screen.getByRole('textbox', { name: /Причина отката/i })
    fireEvent.change(textarea, { target: { value: 'too short' } })
    expect(screen.getByText(/Минимальная длина причины/)).toBeInTheDocument()
  })

  it('confirm button enabled when reason >= 10 chars', () => {
    renderDialog()
    const textarea = screen.getByRole('textbox', { name: /Причина отката/i })
    fireEvent.change(textarea, { target: { value: 'valid reason text here' } })
    const btn = screen.getByRole('button', { name: /Подтвердить откат/i })
    expect(btn).not.toBeDisabled()
  })

  it('calls mutate with modelId and trimmed reason on confirm', () => {
    const mutateMock = vi.fn()
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog()

    const textarea = screen.getByRole('textbox', { name: /Причина отката/i })
    fireEvent.change(textarea, { target: { value: '  valid reason here  ' } })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    expect(mutateMock).toHaveBeenCalledWith(
      { modelId: 'model-42', reason: 'valid reason here' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )
  })

  it('success: shows toast and calls onOpenChange(false)', async () => {
    const { toast } = await import('sonner')
    const mutateMock = vi.fn((_vars, callbacks) => {
      callbacks.onSuccess()
    })
    const onOpenChange = vi.fn()
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog({ onOpenChange })

    fireEvent.change(screen.getByRole('textbox', { name: /Причина отката/i }), {
      target: { value: 'valid reason here text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Модель откачена. Причина залогирована.')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('error: shows generic message for non-403 error', async () => {
    const mutateMock = vi.fn((_vars, callbacks) => {
      callbacks.onError(new Error('Server error'))
    })
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog()

    fireEvent.change(screen.getByRole('textbox', { name: /Причина отката/i }), {
      target: { value: 'valid reason here text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    await waitFor(() => {
      expect(screen.getByText('Не удалось выполнить откат. Попробуйте позже.')).toBeInTheDocument()
    })
  })

  it('error: shows 403-specific message for ApiError 403 — real ApiError constructor (AP#3)', async () => {
    const forbidden = new ApiError('Forbidden', 403)
    const mutateMock = vi.fn((_vars, callbacks) => {
      callbacks.onError(forbidden)
    })
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog()

    fireEvent.change(screen.getByRole('textbox', { name: /Причина отката/i }), {
      target: { value: 'valid reason here text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Нет доступа. Проверьте, что вы являетесь владельцем кабинета.')
      ).toBeInTheDocument()
    })
  })

  it('error 409: shows conflict-specific message AND retains entered reason (171.2 gap-6)', async () => {
    const conflict = new ApiError('Conflict', 409)
    const mutateMock = vi.fn((_vars, callbacks) => {
      callbacks.onError(conflict)
    })
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog()

    const textarea = screen.getByRole('textbox', { name: /Причина отката/i })
    fireEvent.change(textarea, { target: { value: 'деградация MAPE после релиза' } })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    await waitFor(() => {
      expect(screen.getByText('Модель уже откатана. Обновите список.')).toBeInTheDocument()
    })
    // Dialog stays open with the reason retained (bounded recovery, no duplicate rollback offer)
    expect(textarea).toHaveValue('деградация MAPE после релиза')
  })

  it('pending: confirm disabled + spinner while mutation is in flight (171.2 pin)', () => {
    mockUseModelRollback.mockReturnValue(buildMutationMock({ isPending: true }))
    renderDialog()

    const btn = screen.getByRole('button', { name: /Подтвердить откат/i })
    expect(btn).toBeDisabled()
    expect(screen.getByRole('button', { name: /Отменить/i })).toBeDisabled()
    expect(document.querySelector('.animate-spin')).not.toBeNull()
  })

  it('AC-2 server truth: description states status is determined on the server (171.2 gap-7)', () => {
    renderDialog()
    expect(
      screen.getByText(/Актуальный статус определяется на сервере после отката\./)
    ).toBeInTheDocument()
  })

  it('cancel button calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderDialog({ onOpenChange })
    fireEvent.click(screen.getByRole('button', { name: /Отменить/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('confirm button shows aria-label with model version', () => {
    renderDialog()
    expect(screen.getByRole('button', { name: 'Подтвердить откат модели v3' })).toBeInTheDocument()
  })

  it('F-7: Textarea is NOT nested inside AlertDialogDescription (ARIA contract)', () => {
    renderDialog()
    const description = document.querySelector('[data-slot="alert-dialog-description"]')
    if (description) {
      // If description element exists, textarea must not be inside it
      expect(description.querySelector('textarea')).toBeNull()
    }
    // Textarea must still be present in the dialog
    expect(screen.getByRole('textbox', { name: /Причина отката/i })).toBeInTheDocument()
  })

  it('F-12: error Alert uses role="status" (not role="alert") to avoid WAI-ARIA conflict', async () => {
    // shadcn Alert has role="alert" baked in (implies aria-live="assertive").
    // We override to role="status" (implies aria-live="polite") via ...props spread.
    // This avoids conflicting attributes and uses less intrusive announcement for
    // errors shown inside an already-open dialog.
    const mutateMock = vi.fn((_vars, callbacks) => {
      callbacks.onError(new Error('Server error'))
    })
    mockUseModelRollback.mockReturnValue(buildMutationMock({ mutate: mutateMock }))
    renderDialog()

    fireEvent.change(screen.getByRole('textbox', { name: /Причина отката/i }), {
      target: { value: 'valid reason here text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Подтвердить откат/i }))

    await waitFor(() => {
      // role="status" — find via getByRole; confirms override worked
      const alertEl = screen.getByRole('status')
      expect(alertEl).toHaveAttribute('aria-atomic', 'true')
      // Confirm override: no conflicting role="alert" on same element
      expect(alertEl).not.toHaveAttribute('role', 'alert')
      expect(alertEl).toHaveTextContent('Не удалось выполнить откат. Попробуйте позже.')
    })
  })
})
