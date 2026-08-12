import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StatusBadge } from '../StatusBadge'
import { StatusStrip } from '../StatusStrip'

describe('StatusBadge', () => {
  it.each([
    ['success', 'Синхронизация завершена', 'status-success'],
    ['warning', 'Требуется внимание', 'status-warning'],
    ['error', 'Синхронизация завершилась ошибкой', 'status-error'],
    ['information', 'Доступно обновление', 'status-information'],
    ['pending', 'Операция ожидает выполнения', 'status-pending'],
  ] as const)(
    'renders %s with visible text and its registered semantic family',
    (status, label, token) => {
      render(<StatusBadge status={status} label={label} />)

      const badge = screen.getByText(label).closest('[data-slot="status-badge"]')
      expect(badge).not.toBeNull()
      expect(badge).toHaveAttribute('data-status', status)
      expect(badge?.className).toContain(token)
      expect(badge?.querySelector('svg')).not.toBeNull()
    }
  )

  it('uses explicit neutral meaning for unknown status and preserves source value as detail', () => {
    render(
      <StatusBadge
        status="unknown"
        label="Неизвестный статус"
        description="Получено неподдерживаемое значение"
        sourceValue="future_backend_value"
      />
    )

    const badge = screen.getByText('Неизвестный статус').closest('[data-slot="status-badge"]')
    expect(badge).toHaveAttribute('data-status', 'unknown')
    expect(badge?.className).toContain('availability-unknown')
    expect(badge?.className).not.toMatch(/brand|primary|destructive|status-error/)
    expect(screen.getByText('future_backend_value')).toBeInTheDocument()
    expect(screen.getByText('Получено неподдерживаемое значение')).toBeInTheDocument()
  })

  it('keeps a known neutral status distinct from unknown and semantic action roles', () => {
    render(<StatusBadge status="neutral" label="Без изменений" />)

    const badge = screen.getByText('Без изменений').closest('[data-slot="status-badge"]')
    expect(badge).toHaveAttribute('data-status', 'neutral')
    expect(badge?.className).toContain('status-neutral')
    expect(badge?.className).not.toMatch(
      /brand|primary|destructive|status-error|financial-|availability-/
    )
    expect(badge?.querySelector('svg')).not.toBeNull()
  })

  it('accepts block content in description and source-value slots', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <StatusBadge
        status="information"
        label="Статус"
        description={<div>Описание блоком</div>}
        sourceValue={<div>source_value</div>}
      />
    )

    expect(screen.getByText('Описание блоком')).toBeInTheDocument()
    expect(screen.getByText('source_value')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})

describe('StatusStrip', () => {
  const items = [
    { id: 'warning', status: 'warning' as const, label: 'Два показателя требуют внимания' },
    { id: 'pending', status: 'pending' as const, label: 'Обновление ожидает выполнения' },
  ]

  it('exposes a native keyboard disclosure and keeps item order', () => {
    render(<StatusStrip title="Статус отчёта" items={items} detailsLabel="Показать подробности" />)

    const region = screen.getByRole('region', { name: 'Статус отчёта' })
    const summary = within(region).getByText('Показать подробности')
    expect(summary.closest('summary')).not.toBeNull()
    expect(
      within(region)
        .getAllByText(/внимания|выполнения/)
        .map(node => node.textContent)
    ).toEqual(['Два показателя требуют внимания', 'Обновление ожидает выполнения'])
  })

  it('preserves caller-controlled highest status and default-open behavior', () => {
    render(<StatusStrip title="Статус отчёта" items={items} highestStatus="error" defaultOpen />)

    const region = screen.getByRole('region', { name: 'Статус отчёта' })
    expect(region).toHaveAttribute('data-status', 'error')
    expect(within(region).getByTestId('status-strip-disclosure')).toHaveAttribute('open')
    expect(within(region).getByTestId('status-strip-summary')).toHaveTextContent('Ошибка')
    expect(within(region).getByTestId('status-strip-summary').querySelector('svg')).not.toBeNull()
  })

  it('preserves caller-supplied status detail', () => {
    render(
      <StatusStrip
        title="Статус отчёта"
        items={[
          {
            id: 'updated-details',
            status: 'information',
            label: 'Отчёт обновлён',
            description: 'Данные получены из основного кабинета',
          },
        ]}
        defaultOpen
      />
    )

    const region = screen.getByRole('region', { name: 'Статус отчёта' })
    expect(within(region).getByText('Данные получены из основного кабинета')).toBeInTheDocument()
  })

  it('preserves a caller-supplied status timestamp', () => {
    render(
      <StatusStrip
        title="Статус отчёта"
        items={[
          {
            id: 'updated-time',
            status: 'information',
            label: 'Отчёт обновлён',
            timestamp: 'Сегодня, 12:40',
          },
        ]}
        defaultOpen
      />
    )

    const region = screen.getByRole('region', { name: 'Статус отчёта' })
    expect(within(region).getByText('Сегодня, 12:40')).toBeInTheDocument()
  })

  it('preserves a caller-owned native status action', () => {
    render(
      <StatusStrip
        title="Статус отчёта"
        items={[
          {
            id: 'updated-action',
            status: 'information',
            label: 'Отчёт обновлён',
            action: <button type="button">Открыть журнал</button>,
          },
        ]}
        defaultOpen
      />
    )

    const region = screen.getByRole('region', { name: 'Статус отчёта' })
    expect(within(region).getByRole('button', { name: 'Открыть журнал' })).toBeInTheDocument()
  })

  it('accepts block content in timestamp and action slots without invalid DOM nesting warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <StatusStrip
        title="Статус отчёта"
        items={[
          {
            id: 'block-slots',
            status: 'information',
            label: 'Отчёт обновлён',
            timestamp: <div>Сегодня, 12:40</div>,
            action: <div>Действие блочным содержимым</div>,
          },
        ]}
        defaultOpen
      />
    )

    expect(screen.getByText('Сегодня, 12:40')).toBeInTheDocument()
    expect(screen.getByText('Действие блочным содержимым')).toBeInTheDocument()
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
