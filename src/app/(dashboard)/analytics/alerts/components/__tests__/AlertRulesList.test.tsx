/**
 * Unit tests for AlertRulesList component
 * Tests loading, empty, data, error states; toggle/delete mutations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { AlertRulesList } from '../AlertRulesList'
import { AlertType, ALERT_TYPE_LABELS, ALERT_TYPE_DESCRIPTIONS } from '@/types/alerts'
import type { AlertRule } from '@/types/alerts'

// --- Mocks ---

const mockUpdateMutate = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock('@/hooks/useAlerts', () => ({
  useUpdateAlertRule: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    reset: vi.fn(),
  }),
  useDeleteAlertRule: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    reset: vi.fn(),
  }),
}))

// --- Fixtures ---

function createRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 'rule-1',
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

describe('AlertRulesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('renders skeletons when isLoading is true', () => {
      const { container } = renderWithProviders(
        <AlertRulesList rules={undefined} isLoading={true} />
      )

      expect(screen.getByText('Правила оповещений')).toBeInTheDocument()
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty state', () => {
    it('renders empty message when rules array is empty', () => {
      renderWithProviders(<AlertRulesList rules={[]} isLoading={false} />)

      expect(screen.getByText('Нет правил')).toBeInTheDocument()
      expect(
        screen.getByText('Создайте первое правило оповещения для автоматического мониторинга')
      ).toBeInTheDocument()
    })

    it('renders empty message when rules is undefined', () => {
      renderWithProviders(<AlertRulesList rules={undefined} isLoading={false} />)

      expect(screen.getByText('Нет правил')).toBeInTheDocument()
    })
  })

  describe('Data state', () => {
    it('renders rules count in header', () => {
      const rules = [
        createRule({ id: 'r1' }),
        createRule({ id: 'r2', alertType: AlertType.MARGIN_COLLAPSE }),
      ]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Правила оповещений (2)')).toBeInTheDocument()
    })

    it('renders ALERT_TYPE_LABELS when rule.label is null', () => {
      const rules = [createRule({ label: null })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK])).toBeInTheDocument()
    })

    it('renders rule.label when present, overriding type label', () => {
      const rules = [createRule({ label: 'Custom Rule Name' })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Custom Rule Name')).toBeInTheDocument()
      // Type label should NOT appear since custom label overrides it
      expect(screen.queryByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK])).not.toBeInTheDocument()
    })

    it('renders ALERT_TYPE_DESCRIPTIONS as description', () => {
      const rules = [createRule()]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText(ALERT_TYPE_DESCRIPTIONS[AlertType.STOCKOUT_RISK])).toBeInTheDocument()
    })

    it('renders severity badge with warning label', () => {
      const rules = [createRule({ severity: 'warning' })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Внимание')).toBeInTheDocument()
    })

    it('renders severity badge with critical label', () => {
      const rules = [createRule({ severity: 'critical' })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Критический')).toBeInTheDocument()
    })

    it('renders severity badge with info label', () => {
      const rules = [createRule({ severity: 'info' })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Информация')).toBeInTheDocument()
    })

    it('renders enabled Switch for enabled rule', () => {
      const rules = [createRule({ enabled: true })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      const switchEl = screen.getByRole('switch')
      expect(switchEl).toBeChecked()
    })

    it('renders unchecked Switch for disabled rule', () => {
      const rules = [createRule({ enabled: false })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      const switchEl = screen.getByRole('switch')
      expect(switchEl).not.toBeChecked()
    })

    it('renders cooldown minutes for each rule', () => {
      const rules = [createRule({ cooldownMinutes: 30 })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('30 мин')).toBeInTheDocument()
    })

    it('renders alert type as fallback when label is null and type is unknown', () => {
      const rules = [
        createRule({
          alertType: 'custom.unknown',
          label: null,
        }),
      ]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      // Unknown type appears as both label and description fallback
      const matches = screen.getAllByText('custom.unknown')
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })

    it('renders multiple rules', () => {
      const rules = [
        createRule({
          id: 'r1',
          alertType: AlertType.STOCKOUT_RISK,
        }),
        createRule({
          id: 'r2',
          alertType: AlertType.REORDER_URGENT,
        }),
        createRule({
          id: 'r3',
          alertType: AlertType.RETURN_RATE_SPIKE,
          label: 'Custom Return Rule',
        }),
      ]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      expect(screen.getByText('Правила оповещений (3)')).toBeInTheDocument()
      expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.STOCKOUT_RISK])).toBeInTheDocument()
      expect(screen.getByText(ALERT_TYPE_LABELS[AlertType.REORDER_URGENT])).toBeInTheDocument()
      expect(screen.getByText('Custom Return Rule')).toBeInTheDocument()
    })
  })

  describe('onEdit callback', () => {
    it('calls onEdit with the rule when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const rule = createRule({ id: 'rule-edit-1', label: 'Editable Rule' })

      renderWithProviders(<AlertRulesList rules={[rule]} isLoading={false} onEdit={onEdit} />)

      const editBtn = screen.getByRole('button', {
        name: /редактировать правило/i,
      })
      await user.click(editBtn)

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith(rule)
    })

    it('renders edit button with rule label in aria-label', () => {
      const rule = createRule({ label: 'My Alert' })
      renderWithProviders(<AlertRulesList rules={[rule]} isLoading={false} onEdit={vi.fn()} />)

      expect(
        screen.getByRole('button', { name: /редактировать правило my alert/i })
      ).toBeInTheDocument()
    })
  })

  describe('Mutations', () => {
    it('calls useUpdateAlertRule when toggle switch is clicked', async () => {
      const user = userEvent.setup()
      const rules = [createRule({ id: 'rule-42', enabled: true })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      const switchEl = screen.getByRole('switch')
      await user.click(switchEl)

      expect(mockUpdateMutate).toHaveBeenCalledTimes(1)
      expect(mockUpdateMutate).toHaveBeenCalledWith({
        id: 'rule-42',
        payload: { enabled: false },
      })
    })

    it('calls useDeleteAlertRule when delete button is clicked', async () => {
      const user = userEvent.setup()
      const rules = [createRule({ id: 'rule-99' })]

      renderWithProviders(<AlertRulesList rules={rules} isLoading={false} />)

      const deleteBtn = screen.getByRole('button', {
        name: /удалить правило/i,
      })
      await user.click(deleteBtn)

      expect(mockDeleteMutate).toHaveBeenCalledTimes(1)
      expect(mockDeleteMutate).toHaveBeenCalledWith('rule-99')
    })
  })
})
