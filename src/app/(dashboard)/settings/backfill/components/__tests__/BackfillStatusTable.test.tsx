import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { BackfillCabinetStatus } from '@/types/backfill'

import { BackfillStatusTable } from '../BackfillStatusTable'
import { BackfillErrorLog } from '../BackfillErrorLog'
import { BACKFILL_NUMERIC_COLUMNS, getCombinedProgressStatus } from '../backfill-presentation'

const cabinet = {
  cabinet_id: 'cabinet-1',
  cabinet_name: 'Основной кабинет с длинным названием',
  status: 'failed',
  analytics_status: 'completed',
  data_source: 'report',
  oldest_available_date: '2025-08-01',
  newest_available_date: '2026-08-01',
  progress: {
    total_days: 365,
    completed_days: 120,
    current_date: '2025-12-01',
    percentage: 32.9,
    estimated_remaining_seconds: 7200,
  },
  last_error: null,
  started_at: '2026-08-29T08:00:00Z',
  completed_at: null,
  updated_at: '2026-08-29T09:00:00Z',
} satisfies BackfillCabinetStatus

const callbacks = {
  onPause: vi.fn(),
  onResume: vi.fn(),
  onRetry: vi.fn(),
  onRetrySource: vi.fn(),
}

describe('BackfillStatusTable', () => {
  it('separates named mobile cards from the keyboard-focusable desktop scroll region', () => {
    const { container } = render(<BackfillStatusTable cabinets={[cabinet]} {...callbacks} />)

    const scrollRegion = screen.getByRole('region', {
      name: 'Горизонтальная прокрутка таблицы бэкфилла',
    })
    const table = screen.getByRole('table', {
      name: 'Состояние загрузки исторических данных по кабинетам',
    })
    expect(scrollRegion).toHaveAttribute('tabindex', '0')
    expect(scrollRegion).toHaveClass('relative', 'w-full', 'overflow-auto')
    expect(scrollRegion).toContainElement(table)
    const tableFrame = table.closest('[data-table-frame]')
    expect(tableFrame).not.toHaveClass('border')
    expect(tableFrame).not.toHaveClass('bg-card')
    const desktopProjection = container.querySelector('[data-table-wide-content]')
    expect(desktopProjection).toHaveClass('hidden', 'md:block', 'border', 'bg-card')
    expect(desktopProjection).toContainElement(scrollRegion)
    expect(
      within(table).getByText('Состояние загрузки исторических данных по кабинетам')
    ).toBeInTheDocument()
    expect(
      within(table).getByRole('button', {
        name: `Повторить загрузку «Повторить отчёты» для ${cabinet.cabinet_name}`,
      })
    ).toBeInTheDocument()
    expect(table).toHaveAttribute('data-narrow-strategy', 'horizontal-scroll')
    expect(within(table).getByText(cabinet.cabinet_name)).toBeInTheDocument()

    expect(container.querySelector('[data-table-wide-content]')).toContainElement(table)
    expect(container.querySelector('[data-table-narrow-content]')).not.toContainElement(table)
    expect(within(table).getByRole('columnheader', { name: 'Прогресс' })).toHaveClass(
      'text-right',
      'tabular-nums'
    )
    const progressCell = within(table).getByRole('progressbar').closest('td')
    expect(progressCell).toHaveClass('text-right', 'tabular-nums')
    expect(within(table).getByText(/^32,9\s%$/)).toHaveClass('tabular-nums')
    expect(within(table).getByRole('columnheader', { name: 'ETA' })).toHaveClass(
      'text-right',
      'tabular-nums'
    )
    expect(within(table).getByText('~2 ч').closest('td')).toHaveClass('text-right', 'tabular-nums')
    expect(BACKFILL_NUMERIC_COLUMNS).toContainEqual({
      id: 'eta',
      label: 'ETA',
      alignment: 'end',
      precision: 'caller-preserved',
      unit: { kind: 'quantity', label: 'время' },
      tabularNumerals: true,
      fullValueAccess: 'visible',
    })
  })

  it.each([
    ['completed', 'failed', 'bg-status-error'],
    ['failed', 'completed', 'bg-status-error'],
    ['in_progress', 'failed', 'bg-status-error'],
    ['paused', 'completed', 'bg-status-warning'],
  ] as const)(
    'derives overall progress severity from reports=%s and analytics=%s',
    (status, analyticsStatus, className) => {
      render(
        <BackfillStatusTable
          cabinets={[{ ...cabinet, status, analytics_status: analyticsStatus }]}
          {...callbacks}
        />
      )

      expect(screen.getAllByRole('progressbar')).not.toHaveLength(0)
      for (const progressbar of screen.getAllByRole('progressbar')) {
        expect(progressbar).toHaveClass(className)
      }
    }
  )

  it.each([
    ['failed', 'completed', 'failed'],
    ['completed', 'failed', 'failed'],
    ['in_progress', 'pending', 'in_progress'],
    ['pending', 'in_progress', 'in_progress'],
    ['pending', 'paused', 'pending'],
    ['paused', 'pending', 'pending'],
    ['paused', 'completed', 'paused'],
    ['completed', 'paused', 'paused'],
    ['completed', 'completed', 'completed'],
    ['not_started', 'not_started', 'not_started'],
    ['completed', 'idle', 'idle'],
    ['not_started', 'completed', 'idle'],
  ] as const)(
    'locks combined precedence for reports=%s and analytics=%s as %s',
    (status, analyticsStatus, expected) => {
      expect(
        getCombinedProgressStatus({
          ...cabinet,
          status,
          analytics_status: analyticsStatus,
        })
      ).toBe(expected)
    }
  )

  it('renders a deliberate stacked narrow detail with identity, progress, ETA, and actions', () => {
    render(<BackfillStatusTable cabinets={[cabinet]} {...callbacks} />)

    const narrow = screen.getByRole('group', {
      name: 'Карточки состояния загрузки исторических данных по кабинетам',
    })
    expect(within(narrow).getByText(cabinet.cabinet_name)).toBeInTheDocument()
    expect(within(narrow).getByText('Прогресс')).toBeInTheDocument()
    expect(within(narrow).getByText('Осталось')).toBeInTheDocument()
    expect(
      within(narrow).getByRole('button', { name: /Перезапустить бэкфилл с нуля/ })
    ).toBeVisible()
    expect(
      within(narrow).getByRole('button', { name: /Повторить загрузку «Повторить отчёты»/ })
    ).toBeVisible()
  })

  it.each([
    ['idle', 'Ожидает', ['border-border', 'bg-muted', 'text-muted-foreground']],
    ['not_started', 'Не начат', ['border-border', 'bg-muted', 'text-muted-foreground']],
    [
      'pending',
      'В очереди',
      ['border-status-warning/40', 'bg-status-warning/10', 'text-foreground'],
    ],
    [
      'in_progress',
      'Выполняется',
      ['border-status-information/40', 'bg-status-information/10', 'text-foreground'],
    ],
    [
      'completed',
      'Завершено',
      ['border-status-success/40', 'bg-status-success/10', 'text-foreground'],
    ],
    ['failed', 'Ошибка', ['border-status-error/40', 'bg-status-error/10', 'text-foreground']],
    [
      'paused',
      'Приостановлено',
      ['border-status-warning/40', 'bg-status-warning/10', 'text-foreground'],
    ],
  ] as const)('maps %s to the text-labelled semantic presentation', (status, label, classNames) => {
    render(
      <BackfillStatusTable
        cabinets={[{ ...cabinet, status, analytics_status: 'idle' }]}
        {...callbacks}
      />
    )
    const narrow = screen.getByRole('group', {
      name: 'Карточки состояния загрузки исторических данных по кабинетам',
    })

    const reports = within(narrow).getByText('Отчёты').parentElement
    expect(reports).not.toBeNull()
    expect(within(reports as HTMLElement).getByText(label)).toHaveClass(...classNames)
    expect(within(narrow).getByText('Аналитика')).toBeInTheDocument()
  })

  it('announces loading', () => {
    render(<BackfillStatusTable cabinets={[]} isLoading {...callbacks} />)
    expect(screen.getByRole('status')).toHaveTextContent('Загружаем состояние бэкфилла')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('preserves the explicit empty state', () => {
    render(<BackfillStatusTable cabinets={[]} {...callbacks} />)
    expect(screen.getByText('Нет кабинетов для бэкфилла')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it.each(['escape', 'visible action', 'built-in control'] as const)(
    'returns focus to the error trigger after closing with %s',
    async closeMethod => {
      const user = userEvent.setup()
      render(<BackfillErrorLog cabinet={{ ...cabinet, last_error: 'Ошибка сети' }} />)
      const trigger = screen.getByRole('button', {
        name: `Показать ошибку для ${cabinet.cabinet_name}`,
      })

      await user.click(trigger)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      if (closeMethod === 'escape') {
        await user.keyboard('{Escape}')
      } else {
        const closeButtons = screen.getAllByRole('button', { name: 'Закрыть' })
        const closeButton = closeButtons.find(button =>
          closeMethod === 'built-in control'
            ? button.querySelector('.sr-only')
            : !button.querySelector('.sr-only')
        )
        expect(closeButton).toBeDefined()
        if (closeMethod === 'visible action') expect(closeButton).toHaveClass('min-h-11')
        await user.click(closeButton as HTMLButtonElement)
      }

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
    }
  )
})
