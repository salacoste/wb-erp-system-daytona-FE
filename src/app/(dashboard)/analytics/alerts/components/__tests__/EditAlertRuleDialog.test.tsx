/**
 * Unit tests for EditAlertRuleDialog component
 * Tests dialog rendering, pre-fill from rule, threshold editing, mutation, and null rule guard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { EditAlertRuleDialog } from '../EditAlertRuleDialog'
import { AlertType } from '@/types/alerts'
import type { AlertRule } from '@/types/alerts'

// --- Mocks ---

const mockMutate = vi.fn()
const mockUpdateAlertRule = vi.fn(() => ({
  mutate: mockMutate,
  isPending: false,
  reset: vi.fn(),
}))

vi.mock('@/hooks/useAlerts', () => ({
  useUpdateAlertRule: () => mockUpdateAlertRule(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// --- Fixtures ---

function createRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 'rule-edit-1',
    cabinetId: 'cab-1',
    alertType: AlertType.STOCKOUT_RISK,
    enabled: true,
    thresholds: { daysLeftWarning: 14, daysLeftCritical: 7 },
    cooldownMinutes: 60,
    severity: 'warning',
    channels: { telegram: true },
    label: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// --- Helpers ---

function renderDialog(rule: AlertRule | null = createRule()) {
  const onOpenChange = vi.fn()
  const result = renderWithProviders(
    <EditAlertRuleDialog isOpen={rule !== null} onOpenChange={onOpenChange} rule={rule} />
  )
  return { onOpenChange, ...result }
}

describe('EditAlertRuleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateAlertRule.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
    })
  })

  it('renders dialog title when open with a rule', () => {
    renderDialog(createRule())
    expect(screen.getByText('Редактирование правила')).toBeInTheDocument()
  })

  it('returns null when rule is null', () => {
    const { container } = renderWithProviders(
      <EditAlertRuleDialog isOpen={false} onOpenChange={vi.fn()} rule={null} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows type label in description', () => {
    renderDialog(createRule({ alertType: AlertType.MARGIN_COLLAPSE }))
    // Description uses &laquo;/&raquo; around the type label
    expect(screen.getByText(/Падение маржи/)).toBeInTheDocument()
  })

  it('pre-fills label input from rule.label', () => {
    renderDialog(createRule({ label: 'My Custom Label' }))
    const input = screen.getByDisplayValue('My Custom Label')
    expect(input).toBeInTheDocument()
  })

  it('pre-fills thresholds from rule.thresholds', () => {
    renderDialog(createRule({ thresholds: { daysLeftWarning: 21, daysLeftCritical: 10 } }))

    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(21)
    expect(inputs[1]).toHaveValue(10)
  })

  it('renders threshold fields with correct labels for stockout.risk', () => {
    renderDialog(createRule({ alertType: AlertType.STOCKOUT_RISK }))
    expect(screen.getByText('Дней до окончания (предупреждение)')).toBeInTheDocument()
    expect(screen.getByText('Дней до окончания (критично)')).toBeInTheDocument()
  })

  it('renders 3 threshold fields for margin.collapse type', () => {
    renderDialog(
      createRule({
        alertType: AlertType.MARGIN_COLLAPSE,
        thresholds: { deltaWarning: -5, deltaCritical: -10, lookbackWeeks: 4 },
      })
    )

    expect(screen.getByText('Падение (предупреждение)')).toBeInTheDocument()
    expect(screen.getByText('Падение (критично)')).toBeInTheDocument()
    expect(screen.getByText('Период анализа')).toBeInTheDocument()
  })

  it('calls mutation with updated thresholds on save', async () => {
    const user = userEvent.setup()
    const rule = createRule({
      id: 'rule-42',
      thresholds: { daysLeftWarning: 14, daysLeftCritical: 7 },
    })
    renderDialog(rule)

    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      {
        id: 'rule-42',
        payload: {
          thresholds: { daysLeftWarning: 14, daysLeftCritical: 7 },
          label: undefined,
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('shows success toast on save success', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    mockMutate.mockImplementation((_payload, opts) => {
      opts.onSuccess()
    })

    renderDialog(createRule())

    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(toast.success).toHaveBeenCalledWith('Правило обновлено')
  })

  it('shows error toast on save failure', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    mockMutate.mockImplementation((_payload, opts) => {
      opts.onError(new Error('fail'))
    })

    renderDialog(createRule())

    await user.click(screen.getByRole('button', { name: /сохранить/i }))

    expect(toast.error).toHaveBeenCalledWith('Ошибка при обновлении правила')
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog(createRule())

    await user.click(screen.getByRole('button', { name: /отмена/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows spinner when mutation is pending', () => {
    mockUpdateAlertRule.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      reset: vi.fn(),
    })

    renderDialog(createRule())

    expect(screen.getByText('Сохранение...')).toBeInTheDocument()
  })

  it('disables buttons when mutation is pending', () => {
    mockUpdateAlertRule.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      reset: vi.fn(),
    })

    renderDialog(createRule())

    expect(screen.getByRole('button', { name: /отмена/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /сохранение/i })).toBeDisabled()
  })
})
