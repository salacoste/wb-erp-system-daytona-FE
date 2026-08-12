import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ChartLegend } from '../ChartLegend'
import type { ChartSeriesEvidence } from '../contracts'

expect.extend(toHaveNoViolations)

const series = [
  { id: 'actual', label: 'Фактическая выручка', role: 'positive', marker: 'solid' },
  { id: 'cost', label: 'Расходы', role: 'negative', marker: 'bar' },
  { id: 'baseline', label: 'Базовый период', role: 'reference', marker: 'dotted' },
  { id: 'goal', label: 'Целевое значение', role: 'target', marker: 'point' },
  { id: 'forecast', label: 'Прогноз', role: 'forecast', marker: 'dashed' },
  { id: 'range', label: 'Доверительный интервал', role: 'confidence', marker: 'band' },
  { id: 'selection', label: 'Выбранная неделя', role: 'selection', marker: 'area' },
  { id: 'orders', label: 'Количество заказов', role: 'categorical', marker: 'bar' },
] satisfies readonly ChartSeriesEvidence[]

const roleLabels = [
  'Положительное значение',
  'Отрицательное значение',
  'Справочное значение',
  'Целевое значение',
  'Прогноз',
  'Доверительный интервал',
  'Выбранная серия',
  'Категория',
]

const markerLabels = [
  'Сплошная линия',
  'Столбец',
  'Точечная линия',
  'Точечный маркер',
  'Пунктирная линия',
  'Полоса',
  'Область',
  'Столбец',
]

describe('ChartLegend', () => {
  it('renders all semantic roles using readable labels and non-color marker text', () => {
    render(<ChartLegend label="Легенда финансового графика" series={series} />)

    const legend = screen.getByRole('list', { name: 'Легенда финансового графика' })
    for (const [index, item] of series.entries()) {
      const listItem = within(legend).getByRole('listitem', { name: item.label })
      expect(listItem).toHaveAttribute('data-series-role', item.role)
      expect(listItem).toHaveAttribute('data-series-marker', item.marker)
      expect(listItem).toHaveTextContent(item.label)
      expect(listItem).toHaveTextContent(roleLabels[index])
      expect(listItem).toHaveTextContent(markerLabels[index])
      expect(listItem).toHaveAccessibleDescription(`${roleLabels[index]}. ${markerLabels[index]}.`)
      expect(listItem).not.toHaveTextContent(new RegExp(`\\b${item.role}\\b`))
      expect(listItem).not.toHaveTextContent(new RegExp(`\\b${item.marker}\\b`))
      const marker = listItem.querySelector('[data-chart-marker]')
      expect(marker).toHaveClass('w-4', 'shrink-0')
    }
  })

  it('sizes caller-owned link actions as adequate keyboard targets', () => {
    render(
      <ChartLegend
        label="Ссылки легенды"
        series={[{ ...series[0], action: <a href="#actual">Открыть фактические данные</a> }]}
      />
    )

    expect(screen.getByRole('link').parentElement).toHaveClass('[&_a]:min-h-11', '[&_a]:min-w-11')
  })

  it('preserves caller order and exposes visible and hidden meaning programmatically', () => {
    render(
      <ChartLegend
        label="Легенда"
        series={[
          { ...series[4], visibility: 'visible' },
          { ...series[2], visibility: 'hidden' },
        ]}
      />
    )

    const items = screen.getAllByRole('listitem')
    expect(items.map(item => item.textContent)).toEqual([
      expect.stringContaining('Прогноз'),
      expect.stringContaining('Базовый период'),
    ])
    expect(items[0]).toHaveAttribute('data-visibility', 'visible')
    expect(items[0]).toHaveTextContent('Видима')
    expect(items[1]).toHaveAttribute('data-visibility', 'hidden')
    expect(items[1]).toHaveTextContent('Скрыта')
  })

  it('keeps controlled caller actions keyboard operable and touch-sized', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <ChartLegend
        label="Управление сериями"
        series={[
          {
            ...series[0],
            visibility: 'visible',
            action: (
              <button type="button" aria-pressed="true" onClick={onToggle}>
                Скрыть фактическую выручку
              </button>
            ),
          },
        ]}
      />
    )

    const action = screen.getByRole('button', { name: 'Скрыть фактическую выручку' })
    expect(action.parentElement).toHaveClass('[&_button]:min-h-11', '[&_button]:min-w-11')
    await user.tab()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('gives an approved inline role-button action an effective target and keyboard behavior', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <ChartLegend
        label="Управление сериями"
        series={[
          {
            ...series[0],
            action: (
              <span
                role="button"
                tabIndex={0}
                onKeyDown={event => event.key === 'Enter' && onToggle()}
              >
                Переключить фактическую выручку
              </span>
            ),
          },
        ]}
      />
    )

    const action = screen.getByRole('button', { name: 'Переключить фактическую выручку' })
    expect(action.parentElement).toHaveClass(
      '[&_[role=button]]:inline-flex',
      '[&_[role=button]]:min-h-11',
      '[&_[role=button]]:min-w-11',
      '[&_[role=button]]:items-center',
      '[&_[role=button]]:justify-center'
    )
    await user.tab()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('has no detectable accessibility violations for a dense legend', async () => {
    const { container } = render(<ChartLegend label="Полная легенда" series={series} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
