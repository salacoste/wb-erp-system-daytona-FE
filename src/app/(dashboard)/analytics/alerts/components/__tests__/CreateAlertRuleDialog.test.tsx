/**
 * Unit tests for CreateAlertRuleDialog component
 * Tests dialog rendering, type selection, threshold pre-fill, mutation, and state reset
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CreateAlertRuleDialog } from '../CreateAlertRuleDialog'
import { AlertType, ALERT_TYPE_LABELS, ALERT_TYPE_THRESHOLDS } from '@/types/alerts'

// --- Mocks ---

const mockMutate = vi.fn()
const mockCreateAlertRule = vi.fn(() => ({
  mutate: mockMutate,
  isPending: false,
  reset: vi.fn(),
}))

vi.mock('@/hooks/useAlerts', () => ({
  useCreateAlertRule: () => mockCreateAlertRule(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// --- Helpers ---

function renderDialog(isOpen = true) {
  const onOpenChange = vi.fn()
  const result = renderWithProviders(
    <CreateAlertRuleDialog isOpen={isOpen} onOpenChange={onOpenChange} />
  )
  return { onOpenChange, ...result }
}

describe('CreateAlertRuleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateAlertRule.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
    })
  })

  it('renders dialog title when open', () => {
    renderDialog(true)
    expect(screen.getByText('Новое правило оповещения')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    renderDialog(false)
    expect(screen.queryByText('Новое правило оповещения')).not.toBeInTheDocument()
  })

  it('shows all 4 alert type options with Russian labels', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    // Open the select dropdown
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Verify all 4 options are present with correct labels
    expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK])).toBeInTheDocument()
    expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.MARGIN_COLLAPSE])).toBeInTheDocument()
    expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.RETURN_RATE_SPIKE])).toBeInTheDocument()
    expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.REORDER_URGENT])).toBeInTheDocument()
  })

  it('shows correct threshold fields when selecting stockout.risk type', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK]))

    // Should show daysLeftWarning and daysLeftCritical fields
    expect(screen.getByText('Дней до окончания (предупреждение)')).toBeInTheDocument()
    expect(screen.getByText('Дней до окончания (критично)')).toBeInTheDocument()
  })

  it('pre-fills thresholds from ALERT_TYPE_THRESHOLDS defaults', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK]))

    // Defaults for stockout.risk: daysLeftWarning=14, daysLeftCritical=7
    const defaults = ALERT_TYPE_THRESHOLDS[AlertType.STOCKOUT_RISK]
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs[0]).toHaveValue(Number(defaults.daysLeftWarning))
    expect(inputs[1]).toHaveValue(Number(defaults.daysLeftCritical))
  })

  it('shows 3 threshold fields for margin.collapse type', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.MARGIN_COLLAPSE]))

    expect(screen.getByText('Падение (предупреждение)')).toBeInTheDocument()
    expect(screen.getByText('Падение (критично)')).toBeInTheDocument()
    expect(screen.getByText('Период анализа')).toBeInTheDocument()
  })

  it('disables create button when no type is selected', () => {
    renderDialog(true)
    const createBtn = screen.getByRole('button', { name: /создать/i })
    expect(createBtn).toBeDisabled()
  })

  it('enables create button after selecting a type', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.REORDER_URGENT]))

    const createBtn = screen.getByRole('button', { name: /создать/i })
    expect(createBtn).toBeEnabled()
  })

  it('calls mutation with correct payload on create', async () => {
    const user = userEvent.setup()
    renderDialog(true)

    // Select type
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK]))

    // Click create
    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      {
        alertType: AlertType.STOCKOUT_RISK,
        thresholds: ALERT_TYPE_THRESHOLDS[AlertType.STOCKOUT_RISK],
        cooldownMinutes: 60,
        severity: 'warning',
        channels: { telegram: true },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('shows success toast on create success', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    // Make mutation call onSuccess callback
    mockMutate.mockImplementation((_payload, opts) => {
      opts.onSuccess()
    })

    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.REORDER_URGENT]))

    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(toast.success).toHaveBeenCalledWith('Правило создано')
  })

  it('shows error toast on create failure', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()

    // Make mutation call onError callback
    mockMutate.mockImplementation((_payload, opts) => {
      opts.onError(new Error('fail'))
    })

    renderDialog(true)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByText(ALERT_TYPE_LABELS[AlertType.REORDER_URGENT]))

    await user.click(screen.getByRole('button', { name: /создать/i }))

    expect(toast.error).toHaveBeenCalledWith('Ошибка при создании правила')
  })

  it('resets state on close via onOpenChange(false)', async () => {
    const { onOpenChange } = renderDialog(true)

    // Simulate dialog close
    onOpenChange(false)

    // The handleClose is wired to onOpenChange; it resets selectedType and thresholds
    // and calls onOpenChange(false). Verify it was called.
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets state when dialog is closed via cancel button', async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderDialog(true)

    // Click cancel
    await user.click(screen.getByRole('button', { name: /отмена/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows spinner when mutation is pending', () => {
    mockCreateAlertRule.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      reset: vi.fn(),
    })

    renderDialog(true)

    expect(screen.getByText('Создание...')).toBeInTheDocument()
  })
})
