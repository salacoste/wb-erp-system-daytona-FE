import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ChartEvidence } from '../ChartEvidence'

expect.extend(toHaveNoViolations)

function DataAlternative() {
  return (
    <table>
      <caption>Данные по валовой прибыли</caption>
      <thead>
        <tr>
          <th scope="col">Период</th>
          <th scope="col">Факт, ₽</th>
          <th scope="col">Прогноз, ₽</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">1–7 августа 2026</th>
          <td>−1 234 567,891 ₽</td>
          <td>0 ₽</td>
        </tr>
        <tr>
          <th scope="row">8–14 августа 2026</th>
          <td>—</td>
          <td>Данные недоступны</td>
        </tr>
      </tbody>
    </table>
  )
}

describe('ChartEvidence', () => {
  it('keeps a decision summary and named keyboard-reachable data alternative available', () => {
    render(
      <ChartEvidence
        summary="Прибыль снизилась относительно базового периода; часть прогноза недоступна."
        alternativeLabel="Открыть данные графика валовой прибыли"
        dataAlternative={<DataAlternative />}
      />
    )

    expect(
      screen.getByText(
        'Прибыль снизилась относительно базового периода; часть прогноза недоступна.'
      )
    ).toBeVisible()
    const alternative = screen.getByRole('region', {
      name: 'Открыть данные графика валовой прибыли',
    })
    expect(alternative).toHaveAttribute('tabindex', '0')
    expect(
      within(alternative).getByRole('table', { name: 'Данные по валовой прибыли' })
    ).toBeVisible()
  })

  it('preserves caller-rendered signs precision units zero and missing meaning verbatim', () => {
    render(
      <ChartEvidence
        summary="Сводка"
        alternativeLabel="Точные значения"
        dataAlternative={<DataAlternative />}
      />
    )

    const alternative = screen.getByRole('region', { name: 'Точные значения' })
    expect(alternative).toHaveTextContent('−1 234 567,891 ₽')
    expect(alternative).toHaveTextContent('0 ₽')
    expect(alternative).toHaveTextContent('—')
    expect(alternative).toHaveTextContent('Данные недоступны')
  })

  it('presents caller-owned selection evidence and actions without owning their behavior', async () => {
    const user = userEvent.setup()
    const onDownload = vi.fn()
    render(
      <ChartEvidence
        summary="Выбрана неделя 1–7 августа"
        alternativeLabel="Данные выбранной недели"
        dataAlternative={<DataAlternative />}
        selection={{
          label: 'Выбрана точка: 1–7 августа 2026',
          effect: 'Детализация ниже ограничена выбранной неделей',
        }}
        actions={
          <button type="button" onClick={onDownload}>
            Скачать данные графика
          </button>
        }
      />
    )

    expect(screen.getByText('Выбрана точка: 1–7 августа 2026')).toBeVisible()
    expect(screen.getByText('Детализация ниже ограничена выбранной неделей')).toBeVisible()
    const action = screen.getByRole('button', { name: 'Скачать данные графика' })
    expect(action.parentElement).toHaveClass('[&_button]:min-h-11', '[&_button]:min-w-11')
    await user.click(action)
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('sizes caller-owned links as adequate keyboard targets', async () => {
    const user = userEvent.setup()
    render(
      <ChartEvidence
        summary="Сводка"
        alternativeLabel="Точные значения"
        dataAlternative={<DataAlternative />}
        actions={<a href="#chart-details">Открыть данные</a>}
      />
    )

    const link = screen.getByRole('link', { name: 'Открыть данные' })
    expect(link.parentElement).toHaveClass('[&_a]:min-h-11', '[&_a]:min-w-11')
    await user.tab()
    await user.tab()
    expect(link).toHaveFocus()
  })

  it('gives an approved inline role-button action an effective target and keyboard behavior', async () => {
    const user = userEvent.setup()
    const onDownload = vi.fn()
    render(
      <ChartEvidence
        summary="Сводка"
        alternativeLabel="Точные значения"
        dataAlternative={<DataAlternative />}
        actions={
          <span
            role="button"
            tabIndex={0}
            onKeyDown={event => event.key === 'Enter' && onDownload()}
          >
            Скачать точные значения
          </span>
        }
      />
    )

    const action = screen.getByRole('button', { name: 'Скачать точные значения' })
    expect(action.parentElement).toHaveClass(
      '[&_[role=button]]:inline-flex',
      '[&_[role=button]]:min-h-11',
      '[&_[role=button]]:min-w-11',
      '[&_[role=button]]:items-center',
      '[&_[role=button]]:justify-center'
    )
    await user.tab()
    await user.tab()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('has no detectable accessibility violations with interactive evidence', async () => {
    const { container } = render(
      <ChartEvidence
        summary="Фактическая прибыль ниже цели на 12,4%."
        alternativeLabel="Точные данные прибыли"
        dataAlternative={<DataAlternative />}
        selection={{ label: 'Выбрана фактическая серия', effect: 'Показан текущий период' }}
        actions={<button type="button">Скачать точные данные</button>}
      />
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
