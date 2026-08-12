import type { ComponentProps } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ChartFrame } from '../ChartFrame'

expect.extend(toHaveNoViolations)

const evidence = {
  summary: 'Выручка растёт, прогноз отмечен пунктиром.',
  alternativeLabel: 'Точные данные выручки',
  dataAlternative: (
    <table>
      <caption>Выручка по неделям</caption>
      <tbody>
        <tr>
          <th scope="row">1–7 августа</th>
          <td>125 400,50 ₽</td>
        </tr>
      </tbody>
    </table>
  ),
}

describe('ChartFrame', () => {
  it('renders chart identity and context in semantic reading order', () => {
    const { container } = render(
      <ChartFrame
        title="Динамика выручки"
        description={<div>Фактические и прогнозные значения</div>}
        period={<div>1–31 августа 2026</div>}
        units={<div>Российские рубли</div>}
        freshness={<div>Обновлено 12 августа в 18:40</div>}
        comparison={<div>Сравнение с июлем</div>}
        annotation={<div>Цель: 2 000 000 ₽</div>}
        actions={<button type="button">Открыть детализацию графика</button>}
        plotLabel="График выручки"
        state={{ kind: 'rendered' }}
        plot={<div data-testid="caller-plot">Caller plot</div>}
        evidence={evidence}
      />
    )

    const figure = screen.getByRole('figure', { name: 'Динамика выручки' })
    expect(within(figure).getByText('1–31 августа 2026')).toBeVisible()
    expect(within(figure).getByText('Российские рубли')).toBeVisible()
    expect(within(figure).getByText('Обновлено 12 августа в 18:40')).toBeVisible()
    expect(within(figure).getByText('Сравнение с июлем')).toBeVisible()
    expect(within(figure).getByText('Цель: 2 000 000 ₽')).toBeVisible()
    expect(
      within(figure).getByRole('button', { name: 'Открыть детализацию графика' }).parentElement
    ).toHaveClass('[&_button]:min-h-11', '[&_button]:min-w-11')
    expect(
      [...container.querySelectorAll('[data-chart-order]')].map(node =>
        node.getAttribute('data-chart-order')
      )
    ).toEqual(['identity', 'context', 'plot', 'evidence'])
  })

  it('gives an approved inline role-button action an effective target and keyboard behavior', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(
      <ChartFrame
        title="Динамика выручки"
        period="Август"
        units="₽"
        actions={
          <span role="button" tabIndex={0} onKeyDown={event => event.key === 'Enter' && onOpen()}>
            Открыть контекст графика
          </span>
        }
        plotLabel="График выручки"
        state={{ kind: 'rendered' }}
        plot={<div>Plot</div>}
        evidence={evidence}
      />
    )

    const action = screen.getByRole('button', { name: 'Открыть контекст графика' })
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
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('creates a positive-size named plot group without image semantics and preserves the child', () => {
    const plot = <button type="button">Выбрать точку 12 августа</button>
    render(
      <ChartFrame
        title="Заказы"
        period="Август 2026"
        units="штук"
        plotLabel="График заказов"
        state={{ kind: 'rendered' }}
        plot={plot}
        evidence={evidence}
      />
    )

    const plotGroup = screen.getByRole('group', { name: 'График заказов' })
    expect(plotGroup).toHaveClass('min-h-[240px]', 'min-w-0', 'overflow-hidden')
    expect(plotGroup).not.toHaveAttribute('role', 'img')
    expect(
      within(plotGroup).getByRole('button', { name: 'Выбрать точку 12 августа' })
    ).toBeVisible()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it.each(['loading', 'empty', 'unavailable'] as const)(
    'renders terminal %s truthfully without plot or evidence',
    kind => {
      render(
        <ChartFrame
          title="Маржа"
          period="Август"
          units="%"
          state={{ kind, message: `Состояние: ${kind}` }}
        />
      )

      expect(screen.getByRole('status')).toHaveAttribute('data-state', kind)
      expect(screen.queryByTestId('caller-plot')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('region', { name: 'Точные данные выручки' })
      ).not.toBeInTheDocument()
    }
  )

  it('uses the data-trust discriminant when forbidden terminal slots are explicitly undefined', () => {
    const terminalWithUndefinedSlots = {
      title: 'Маржа',
      period: 'Август',
      units: '%',
      state: { kind: 'loading', message: 'Загрузка графика' },
      plotLabel: undefined,
      plot: undefined,
      evidence: undefined,
    } as unknown as ComponentProps<typeof ChartFrame>

    render(<ChartFrame {...terminalWithUndefinedSlots} />)

    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'loading')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chart-evidence')).not.toBeInTheDocument()
  })

  it('preserves numeric zero in optional identity context', () => {
    render(
      <ChartFrame
        title="Нулевая база"
        description={0}
        period="Август"
        units="₽"
        freshness={0}
        comparison={0}
        annotation={0}
        plotLabel="График"
        state={{ kind: 'rendered' }}
        plot={<div>Plot</div>}
        evidence={evidence}
      />
    )

    expect(screen.getAllByText('0')).toHaveLength(4)
  })

  it('renders an error without evidence and preserves caller-owned recovery', () => {
    render(
      <ChartFrame
        title="Маржа"
        period="Август"
        units="%"
        state={{
          kind: 'error',
          message: 'Не удалось загрузить график',
          recovery: <button type="button">Повторить загрузку графика</button>,
        }}
      />
    )

    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'error')
    expect(screen.getByRole('button', { name: 'Повторить загрузку графика' })).toBeVisible()
    expect(screen.queryByRole('group', { name: /График/ })).not.toBeInTheDocument()
  })

  it.each([
    ['partial', 'Не получены данные за два дня'],
    ['stale', 'Последнее обновление 10 августа'],
  ] as const)('retains plot and evidence while naming %s limitations', (kind, limitation) => {
    render(
      <ChartFrame
        title="Выручка"
        period="Август"
        units="₽"
        plotLabel="График выручки"
        state={{ kind, message: limitation }}
        plot={<div data-testid="caller-plot">Plot</div>}
        evidence={evidence}
      />
    )

    expect(screen.getByRole('status')).toHaveAttribute('data-state', kind)
    expect(screen.getByText(limitation)).toBeVisible()
    expect(screen.getByTestId('caller-plot')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Точные данные выручки' })).toBeVisible()
  })

  it('keeps updating orthogonal to retained evidence', () => {
    render(
      <ChartFrame
        title="Выручка"
        period="Август"
        units="₽"
        plotLabel="График выручки"
        state={{ kind: 'rendered' }}
        activity={{ kind: 'updating', message: 'Обновляем данные графика' }}
        plot={<div data-testid="caller-plot">Plot</div>}
        evidence={evidence}
      />
    )

    expect(screen.getByRole('status', { name: 'Обновляем данные графика' })).toBeVisible()
    expect(screen.getByTestId('caller-plot')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Точные данные выручки' })).toBeVisible()
  })

  it('accepts block slots without invalid DOM nesting and has no axe violations', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(
      <ChartFrame
        title="Длинное название аналитического графика по Российской Федерации"
        description={<div>Описание блоком</div>}
        period={<div>Период блоком</div>}
        units={<div>Единицы блоком</div>}
        plotLabel="Аналитический график"
        state={{ kind: 'rendered' }}
        plot={<div>Plot</div>}
        evidence={evidence}
      />
    )

    expect(consoleError).not.toHaveBeenCalled()
    expect(await axe(container)).toHaveNoViolations()
    consoleError.mockRestore()
  })
})
