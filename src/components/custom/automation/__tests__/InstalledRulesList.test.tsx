/**
 * InstalledRulesList + InstalledRuleRow tests (Story 163.2-FE).
 * Focus: populated rendering, RU trigger/action labels, enabled/disabled badges,
 * writeback safety badge + explanatory text, unknown-enum fallback, highlight.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstalledRulesList } from '../InstalledRulesList'
import type { AutomationRule } from '@/types/automation'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

const NOTIFY: AutomationRule = {
  id: 'rule-1',
  name: 'Низкий остаток',
  trigger: 'STOCK_LEVEL',
  action: 'NOTIFY',
  category: 'notify',
  enabled: true,
}

const WRITEBACK_ENABLED: AutomationRule = {
  id: 'rule-2',
  name: 'Уценка неликвида',
  trigger: 'SLOW_MOVER',
  action: 'WRITEBACK_PRICE',
  category: 'price',
  enabled: true,
}

const WRITEBACK_DISABLED: AutomationRule = {
  id: 'rule-3',
  name: 'Сухой прогон цены',
  trigger: 'PRICE_GAP',
  action: 'WRITEBACK_PRICE',
  enabled: false,
}

const UNKNOWN_ENUMS: AutomationRule = {
  id: 'rule-4',
  name: 'Будущее правило',
  trigger: 'FUTURE_TRIGGER',
  action: 'FUTURE_ACTION',
  enabled: false,
}

describe('InstalledRulesList (163.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the populated list with RU trigger/action labels', () => {
    render(<InstalledRulesList rules={[NOTIFY, WRITEBACK_ENABLED]} />)
    expect(screen.getByTestId('installed-rules-list')).toBeInTheDocument()
    expect(screen.getByTestId('installed-rule-name-rule-1')).toHaveTextContent('Низкий остаток')
    // RU labels (not raw enums).
    expect(screen.getByTestId('trigger-rule-1')).toHaveTextContent('Уровень остатка')
    expect(screen.getByTestId('action-rule-1')).toHaveTextContent('Уведомление')
    expect(screen.getByTestId('trigger-rule-2')).toHaveTextContent('Неликвид')
    expect(screen.getByTestId('action-rule-2')).toHaveTextContent('Изменение цены')
  })

  it('shows the enabled badge on an active rule and disabled badge on inactive', () => {
    render(<InstalledRulesList rules={[NOTIFY, WRITEBACK_DISABLED]} />)
    expect(screen.getByTestId('enabled-badge-rule-1')).toHaveTextContent('Включено')
    expect(screen.getByTestId('disabled-badge-rule-3')).toHaveTextContent('Выключено')
  })

  it('shows the safety badge only on writeback rules (enabled and disabled)', () => {
    render(<InstalledRulesList rules={[NOTIFY, WRITEBACK_ENABLED, WRITEBACK_DISABLED]} />)
    expect(screen.queryByTestId(`safety-${NOTIFY.id}`)).not.toBeInTheDocument()
    expect(screen.getByTestId(`safety-${WRITEBACK_ENABLED.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`safety-${WRITEBACK_DISABLED.id}`)).toBeInTheDocument()
  })

  it('never implies immediate price change — disabled writeback emphasizes inertness', () => {
    render(<InstalledRulesList rules={[WRITEBACK_DISABLED]} />)
    const text = screen.getByTestId(`safety-${WRITEBACK_DISABLED.id}`).textContent ?? ''
    expect(text).toContain('PRICE_WRITEBACK_ENABLED')
    // Disabled rule is emphasized as currently inactive.
    expect(text).toContain('сейчас выключено')
  })

  it('enabled writeback safety text explains the cabinet arm, not immediate change', () => {
    render(<InstalledRulesList rules={[WRITEBACK_ENABLED]} />)
    const text = screen.getByTestId(`safety-${WRITEBACK_ENABLED.id}`).textContent ?? ''
    expect(text).toContain('PRICE_WRITEBACK_ENABLED')
    expect(text).toContain('не меняются до включения рубильника')
  })

  it('renders unknown trigger/action enums via fallback (raw value, no crash)', () => {
    render(<InstalledRulesList rules={[UNKNOWN_ENUMS]} />)
    expect(screen.getByTestId('trigger-rule-4')).toHaveTextContent('FUTURE_TRIGGER')
    expect(screen.getByTestId('action-rule-4')).toHaveTextContent('FUTURE_ACTION')
  })

  it('renders nothing for an empty list (empty state is owned by the page)', () => {
    const { container } = render(<InstalledRulesList rules={[]} />)
    expect(container.querySelector('[data-testid="installed-rules-list"]')).toBeNull()
  })

  it('marks the highlightId row as highlighted and leaves others unhighlighted', () => {
    render(<InstalledRulesList rules={[NOTIFY, WRITEBACK_ENABLED]} highlightId={NOTIFY.id} />)
    expect(screen.getByTestId(`installed-rule-row-${NOTIFY.id}`)).toHaveAttribute(
      'data-highlighted',
      'true'
    )
    expect(screen.getByTestId(`installed-rule-row-${WRITEBACK_ENABLED.id}`)).toHaveAttribute(
      'data-highlighted',
      'false'
    )
  })
})
