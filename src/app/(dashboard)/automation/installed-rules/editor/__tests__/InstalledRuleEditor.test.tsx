/**
 * Story 163.3-FE: InstalledRuleEditor component tests.
 * Covers: render from normalized data; validation blocks submit; writeback ack
 * required to enable save for an activating change; error preserves input;
 * unsaved-changes guard fires. Mocks useInstalledRule + useUpdateInstalledRule.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ApiError } from '@/types/api'
import type { AutomationRuleDetail } from '@/types/automation'

const mockUseInstalledRule = vi.fn()
const mockUseUpdateInstalledRule = vi.fn()
const mockPush = vi.fn()

vi.mock('@/hooks/useAutomation', () => ({
  useInstalledRule: (...args: unknown[]) => mockUseInstalledRule(...args),
  useUpdateInstalledRule: () => mockUseUpdateInstalledRule(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import { InstalledRuleEditor } from '../InstalledRuleEditor'

function makeRule(overrides: Partial<AutomationRuleDetail> = {}): AutomationRuleDetail {
  return {
    id: 'r1',
    name: 'Низкий остаток',
    trigger: 'STOCK_LEVEL',
    action: 'NOTIFY',
    enabled: true,
    triggerParams: { threshold: 10, operator: 'lt' },
    actionParams: { message: 'Внимание' },
    ...overrides,
  }
}

function detailResult(overrides: Partial<ReturnType<typeof mockUseInstalledRule>> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  }
}

function mutationResult(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    ...overrides,
  }
}

describe('InstalledRuleEditor (163.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUpdateInstalledRule.mockReturnValue(mutationResult())
  })

  it('renders the loading state', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ isLoading: true }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('editor-loading')).toBeInTheDocument()
  })

  it('renders the populated form from normalized data', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('editor-title')).toHaveTextContent('Низкий остаток')
    expect(screen.getByTestId('field-name')).toHaveValue('Низкий остаток')
    expect(screen.getByTestId('field-threshold')).toHaveValue('10')
  })

  it('blocks Save when validation fails (empty name disables Save)', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    const save = screen.getByTestId('editor-save') as HTMLButtonElement
    // Make the name valid first so Save can enable, then clear it.
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'A name' } })
    expect(save.disabled).toBe(false)
    // Clear the name → invalid → Save must be disabled (AC #3: invalid cannot submit).
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: '' } })
    expect(save.disabled).toBe(true)
    expect(mockUseUpdateInstalledRule().mutate).not.toHaveBeenCalled()
  })

  it('requires the writeback acknowledgement before enabling Save on an activating change', () => {
    // WRITEBACK_PRICE rule currently disabled → enabling it "could activate".
    const rule = makeRule({ action: 'WRITEBACK_PRICE', enabled: false, category: 'price' })
    mockUseInstalledRule.mockReturnValue(detailResult({ data: rule }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)

    // Flip the enabled switch → activating.
    fireEvent.click(screen.getByTestId('field-enabled'))
    const save = screen.getByTestId('editor-save') as HTMLButtonElement
    expect(save.disabled).toBe(true) // gated by ack
    expect(screen.getByTestId('writeback-ack-checkbox')).toBeInTheDocument()

    // Acknowledge → Save enables.
    fireEvent.click(screen.getByTestId('writeback-ack-checkbox'))
    expect(save.disabled).toBe(false)
  })

  it('shows the passive writeback notice when the save is not activating', () => {
    const rule = makeRule({ action: 'WRITEBACK_PRICE', enabled: true, category: 'price' })
    mockUseInstalledRule.mockReturnValue(detailResult({ data: rule }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('writeback-safety-passive')).toBeInTheDocument()
    expect(screen.queryByTestId('writeback-ack-checkbox')).not.toBeInTheDocument()
  })

  it('preserves unsaved input + shows actionable error on mutation failure', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    mockUseUpdateInstalledRule.mockReturnValue(
      mutationResult({ isError: true, error: new Error('boom') })
    )
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    // Edit a field (unsaved input).
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'Changed' } })
    expect(screen.getByTestId('editor-update-error')).toBeInTheDocument()
    // The edited value is preserved.
    expect(screen.getByTestId('field-name')).toHaveValue('Changed')
  })

  // Story 172.4: success feedback (status-success tint) — unit twin of the
  // e2e AC5 assertion on editor-update-success.
  it('shows the success status alert on mutation success', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    mockUseUpdateInstalledRule.mockReturnValue(mutationResult({ isSuccess: true }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    const success = screen.getByTestId('editor-update-success')
    expect(success).toBeInTheDocument()
    expect(success).toHaveTextContent('Правило обновлено.')
  })

  it('fires the unsaved-changes guard when leaving with dirty edits', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    // Make the form dirty.
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByTestId('editor-cancel'))
    expect(screen.getByTestId('unsaved-changes-guard')).toBeInTheDocument()
    // "Stay" keeps the input.
    fireEvent.click(screen.getByTestId('unsaved-stay'))
    expect(screen.queryByTestId('unsaved-changes-guard')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('navigates back immediately when there are no unsaved edits', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    fireEvent.click(screen.getByTestId('editor-cancel'))
    expect(mockPush).toHaveBeenCalledWith('/automation/installed-rules')
  })

  // Pass-1 FIX 2 (AC #7): browser-level leave (tab close / reload) must be
  // intercepted while dirty, and cleaned up when the form is clean again.
  it('registers a beforeunload listener when dirty and removes it when clean', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))

    const { unmount } = renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    // Clean on first render — no beforeunload listener registered.
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))

    // Dirty the form → listener registered.
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'Changed' } })
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    // Revert the edit → form clean again → effect cleanup removed the listener.
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'Низкий остаток' } })
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    addSpy.mockRestore()
    removeSpy.mockRestore()
    unmount()
  })

  it('intercepts the back-link leave path while dirty (AC #7 second leave path)', () => {
    mockUseInstalledRule.mockReturnValue(detailResult({ data: makeRule() }))
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    // Dirty the form, then click the "Назад к списку" link in the shell header.
    fireEvent.change(screen.getByTestId('field-name'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByTestId('editor-back'))
    // The unsaved-changes guard fires (not an immediate navigate).
    expect(screen.getByTestId('unsaved-changes-guard')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders the not-found (404) error state without a retry button', () => {
    mockUseInstalledRule.mockReturnValue(
      detailResult({ isError: true, error: new ApiError('Not found', 404, {}) })
    )
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('editor-error-state')).toBeInTheDocument()
    expect(screen.getByText(/Правило не найдено/)).toBeInTheDocument()
    expect(screen.queryByTestId('editor-retry')).not.toBeInTheDocument()
  })

  // Pass-1 FIX 4 (AC #1): load-path 401 must show an explanatory body
  // (consistent with 403/404), not an empty body.
  it('renders the authorization (401) error state with an explanatory body', () => {
    mockUseInstalledRule.mockReturnValue(
      detailResult({ isError: true, error: new ApiError('Unauthorized', 401, {}) })
    )
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('editor-error-state')).toBeInTheDocument()
    expect(screen.getByText(/Требуется авторизация/)).toBeInTheDocument()
    // The explanatory body is present (not empty), consistent with 403/404.
    expect(screen.getByText(/Войдите снова и откройте правило/)).toBeInTheDocument()
    expect(screen.queryByTestId('editor-retry')).not.toBeInTheDocument()
  })

  it('renders the retryable (5xx) error state with a retry button', () => {
    const refetch = vi.fn()
    mockUseInstalledRule.mockReturnValue(
      detailResult({ isError: true, error: new ApiError('Server', 500, {}), refetch })
    )
    renderWithProviders(<InstalledRuleEditor ruleId="r1" />)
    expect(screen.getByTestId('editor-retry')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-retry'))
    expect(refetch).toHaveBeenCalled()
  })
})
