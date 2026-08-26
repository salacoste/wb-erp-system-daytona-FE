/**
 * AiPreferencesForm — tests: Owner/non-Owner gate, toggle interaction, ARIA, error states.
 * Story 112.2-FE Task 3.
 * AP#3: mockRejectedValueOnce + real ApiError constructor for 403 tests.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AiPreferencesForm } from '../AiPreferencesForm'
import * as useAiPreferencesModule from '@/hooks/useAiPreferences'
import * as useUpdateAiPreferencesModule from '@/hooks/useUpdateAiPreferences'
import * as authStore from '@/stores/authStore'
import { ApiError } from '@/types/api'
import type { AiPreferences } from '@/types/ai/system'

vi.mock('@/hooks/useAiPreferences')
vi.mock('@/hooks/useUpdateAiPreferences')
vi.mock('@/stores/authStore')
vi.mock('next/navigation', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockUseAiPreferences = vi.mocked(useAiPreferencesModule.useAiPreferences)
const mockUseUpdateAiPreferences = vi.mocked(useUpdateAiPreferencesModule.useUpdateAiPreferences)
const mockUseAuthStore = vi.mocked(authStore.useAuthStore)

const PREFS_ENABLED: AiPreferences = { aiEnabled: true }
const PREFS_DISABLED: AiPreferences = { aiEnabled: false }

const mockMutate = vi.fn()
const defaultMutation = {
  mutate: mockMutate,
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  reset: vi.fn(),
}

function renderComponent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <AiPreferencesForm />
    </QueryClientProvider>
  )
}

describe('AiPreferencesForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: Owner with data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Owner' } })
    )
    mockUseAiPreferences.mockReturnValue({
      data: PREFS_ENABLED,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    mockUseUpdateAiPreferences.mockReturnValue(
      defaultMutation as unknown as ReturnType<
        typeof useUpdateAiPreferencesModule.useUpdateAiPreferences
      >
    )
  })

  it('Owner sees toggle (happy state)', () => {
    renderComponent()
    expect(screen.getByRole('switch', { name: /Включить AI прогнозы/ })).toBeInTheDocument()
    expect(screen.getByText('Настройки AI')).toBeInTheDocument()
    expect(screen.getByText(/Управление AI функциями/)).toBeInTheDocument()
  })

  it('non-Owner sees denied Alert and back-link', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Manager' } })
    )
    renderComponent()
    expect(screen.getByText(/Доступ запрещён/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Вернуться к списку моделей/ })).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('back-link points to /analytics/models for non-Owner', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: { role: 'Analyst' } })
    )
    renderComponent()
    const link = screen.getByRole('link', { name: /Вернуться к списку моделей/ })
    expect(link).toHaveAttribute('href', '/analytics/models')
  })

  // Story 112.2 F-11: hydration-skeleton vs denied-Alert distinction
  it('renders skeleton (NOT denied Alert) when user is null (auth hydrating)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseAuthStore.mockImplementation((selector: any) =>
      selector({ cabinetId: 'cab-123', user: null })
    )
    renderComponent()
    expect(screen.queryByText(/Доступ запрещён/)).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Загрузка')).toBeInTheDocument()
  })

  it('toggle click triggers mutation with correct body {aiEnabled: boolean}', () => {
    mockUseAiPreferences.mockReturnValue({
      data: PREFS_ENABLED,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    renderComponent()
    const toggle = screen.getByRole('switch', { name: /Включить AI прогнозы/ })
    fireEvent.click(toggle)
    expect(mockMutate).toHaveBeenCalledWith(
      { aiEnabled: false },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })

  it('toggle checked=false when aiEnabled is false', () => {
    mockUseAiPreferences.mockReturnValue({
      data: PREFS_DISABLED,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    renderComponent()
    const toggle = screen.getByRole('switch', { name: /Включить AI прогнозы/ })
    expect(toggle).not.toBeChecked()
  })

  it('pending state disables switch', () => {
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    renderComponent()
    expect(screen.getByRole('switch', { name: /Включить AI прогнозы/ })).toBeDisabled()
  })

  it('success toast renders on mutation success (via onSuccess callback)', async () => {
    const { toast } = await import('sonner')
    // Simulate calling onSuccess
    let capturedOnSuccess: (() => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnSuccess = opts?.onSuccess
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnSuccess?.()
    expect(toast.success).toHaveBeenCalledWith('Настройки сохранены.')
  })

  // 1st-pass review F-7: 403 must fire distinct access-denied toast
  it('403 error fires toast.error with access-denied message', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new ApiError('Forbidden', 403))
    expect(toast.error).toHaveBeenCalledWith(
      'Нет доступа. Проверьте, что вы являетесь владельцем кабинета.'
    )
  })

  // 1st-pass review F-7: generic ApiError must fire retry toast (not 403 message)
  it('generic ApiError fires toast.error with retry message', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new ApiError('Internal Server Error', 500))
    expect(toast.error).toHaveBeenCalledWith('Не удалось сохранить настройки. Попробуйте позже.')
  })

  // Story 112.2 F-7 + 2nd-pass F-1: pre-check errors (hydration race) stay silent — no toast
  it('generic Error (hydration race) does NOT fire toast.error (stay silent)', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new Error('Auth not yet loaded'))
    expect(toast.error).not.toHaveBeenCalled()
  })

  // 2nd-pass review F-1: network/JSON-parse errors must NOT be silent (pre-fix they were)
  it('network error fires toast.error with generic retry message', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new Error('Network failed'))
    expect(toast.error).toHaveBeenCalledWith('Не удалось сохранить настройки. Попробуйте позже.')
  })

  // 2nd-pass review F-1: JSON parse errors must also produce toast (not silent)
  it('JSON parse error fires toast.error with generic retry message', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new SyntaxError('Unexpected token < in JSON at position 0'))
    expect(toast.error).toHaveBeenCalledWith('Не удалось сохранить настройки. Попробуйте позже.')
  })

  // 2nd-pass review F-1: 'Cabinet not selected' pre-check must stay silent (not generic toast)
  it('cabinet-null pre-check error does NOT fire toast.error (stay silent)', async () => {
    const { toast } = await import('sonner')
    let capturedOnError: ((e: Error) => void) | undefined
    mockMutate.mockImplementation(
      (_body: unknown, opts: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
        capturedOnError = opts?.onError
      }
    )
    renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: /Включить AI прогнозы/ }))
    capturedOnError?.(new Error('Cabinet not selected'))
    expect(toast.error).not.toHaveBeenCalled()
  })

  // 1st-pass review F-10: sub-text must render verbatim for screen readers and visual users
  it('renders exact Russian sub-text for screen readers and visual users', () => {
    renderComponent()
    expect(
      screen.getByText(/Когда отключено, все AI-эндпоинты возвращают пустые ответы/)
    ).toBeInTheDocument()
  })

  it('403 error message renders when mutation.error is ApiError(403)', () => {
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isError: true,
      error: new ApiError('Forbidden', 403),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    renderComponent()
    expect(screen.getByText(/Нет доступа/)).toBeInTheDocument()
    expect(screen.getByText(/владельцем кабинета/)).toBeInTheDocument()
  })

  it('generic error message renders for non-403 ApiError', () => {
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isError: true,
      error: new ApiError('Internal Server Error', 500),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    renderComponent()
    expect(screen.getByText(/Не удалось сохранить настройки/)).toBeInTheDocument()
  })

  it('hydration-race generic Error does NOT show error message (stay silent)', () => {
    // F-11: generic Error (user===null hydration race) → no error message shown
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isError: true,
      error: new Error('Auth not yet loaded'),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    renderComponent()
    expect(screen.queryByText(/Нет доступа/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Не удалось сохранить настройки/)).not.toBeInTheDocument()
  })

  // Story 112.1 F-12 propagated to Story 112.2: shadcn Alert role="alert" override via role="status"
  it('inline error Alert has aria-live="polite" (NOT role="alert")', () => {
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isError: true,
      error: new ApiError('Forbidden', 403),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    renderComponent()
    const alerts = document.querySelectorAll('[role="status"]')
    expect(alerts.length).toBeGreaterThan(0)
    const alertWithLive = Array.from(alerts).find(el => el.getAttribute('aria-live') === 'polite')
    expect(alertWithLive).toBeTruthy()
  })

  it('Switch has focus-visible ring classes (WCAG 2.1 AA)', () => {
    renderComponent()
    const toggle = screen.getByRole('switch', { name: /Включить AI прогнозы/ })
    expect(toggle.className).toContain('focus-visible:ring-2')
    expect(toggle.className).toContain('focus-visible:ring-offset-2')
  })

  it('Label htmlFor matches switch id (screen-reader association)', () => {
    renderComponent()
    const label = screen.getByText('Включить AI прогнозы').closest('label')
    expect(label).toHaveAttribute('for', 'ai-enabled-toggle')
    const toggle = document.getElementById('ai-enabled-toggle')
    expect(toggle).toBeInTheDocument()
  })

  it('Switch has aria-describedby pointing to sub-text element', () => {
    renderComponent()
    const toggle = screen.getByRole('switch', { name: /Включить AI прогнозы/ })
    const describedById = toggle.getAttribute('aria-describedby')
    expect(describedById).toBe('ai-enabled-desc')
    expect(document.getElementById('ai-enabled-desc')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading=true (inside Owner branch)', () => {
    mockUseAiPreferences.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    renderComponent()
    expect(screen.getByLabelText('Загрузка настроек')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('shows fetch error Alert when isError=true (inside Owner branch)', () => {
    mockUseAiPreferences.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('fetch failed'),
    } as unknown as ReturnType<typeof useAiPreferencesModule.useAiPreferences>)
    renderComponent()
    expect(screen.getByText(/Не удалось загрузить настройки/)).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('Story 171.3 AC-3: mutation error is ASSOCIATED to the Switch (describedby chain)', async () => {
    // happy render first: describedby = desc only
    const { rerender } = renderComponent()
    const sw = screen.getByRole('switch')
    expect(sw.getAttribute('aria-describedby')).toBe('ai-enabled-desc')
    // fail the mutation (mock-state pattern — same as the 403 test): describedby chains
    mockUseUpdateAiPreferences.mockReturnValue({
      ...defaultMutation,
      isError: true,
      error: new Error('Network down'),
    } as unknown as ReturnType<typeof useUpdateAiPreferencesModule.useUpdateAiPreferences>)
    rerender(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AiPreferencesForm />
      </QueryClientProvider>
    )
    expect(sw.getAttribute('aria-describedby')).toContain('ai-enabled-mutation-error')
    expect(document.getElementById('ai-enabled-mutation-error')).toBeInTheDocument()
    // review-MEDIUM: chain REVERTS to desc-only when the error clears.
    mockUseUpdateAiPreferences.mockReturnValue(
      defaultMutation as unknown as ReturnType<
        typeof useUpdateAiPreferencesModule.useUpdateAiPreferences
      >
    )
    rerender(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AiPreferencesForm />
      </QueryClientProvider>
    )
    expect(sw.getAttribute('aria-describedby')).toBe('ai-enabled-desc')
  })

  it('Story 171.3 RTC: form wrapper has max-w-2xl readable width', () => {
    render(<AiPreferencesForm />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.closest('.max-w-2xl')).not.toBeNull()
  })
})
