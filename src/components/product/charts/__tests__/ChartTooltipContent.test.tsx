import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { ChartTooltipContent } from '../ChartTooltipContent'
import type { ChartTooltipEntry } from '../contracts'

expect.extend(toHaveNoViolations)

const entries = [
  {
    id: 'profit',
    label: 'Валовая прибыль',
    formattedValue: '−1 234 567,891',
    unit: '₽',
    role: 'negative',
    marker: 'solid',
    detail: 'Полная точность; без округления',
  },
  {
    id: 'forecast',
    label: 'Прогноз',
    formattedValue: '+0,000',
    unit: '₽',
    role: 'forecast',
    marker: 'dashed',
  },
  {
    id: 'missing',
    label: 'Доверительный интервал',
    formattedValue: 'Данные недоступны',
    role: 'confidence',
    marker: 'band',
  },
] satisfies readonly ChartTooltipEntry[]

describe('ChartTooltipContent', () => {
  it('preserves caller-formatted values signs precision units and missing text exactly', () => {
    render(<ChartTooltipContent label="12 августа 2026" entries={entries} />)

    expect(screen.getByText('12 августа 2026')).toBeVisible()
    expect(screen.getByText('−1 234 567,891')).toBeVisible()
    expect(screen.getAllByText('₽')).toHaveLength(2)
    expect(screen.getByText('+0,000')).toBeVisible()
    expect(screen.getByText('Данные недоступны')).toBeVisible()
    expect(screen.getByText('Полная точность; без округления')).toBeVisible()
  })

  it('exposes role and marker meaning as text rather than color alone', () => {
    render(<ChartTooltipContent label="Значения" entries={entries} />)

    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Отрицательное значение')
    expect(items[0]).toHaveTextContent('Сплошная линия')
    expect(items[1]).toHaveTextContent('Прогноз')
    expect(items[1]).toHaveTextContent('Пунктирная линия')
    expect(items[2]).toHaveTextContent('Доверительный интервал')
    expect(items[2]).toHaveTextContent('Полоса')

    for (const entry of entries) {
      expect(screen.queryByText(entry.role, { exact: true })).not.toBeInTheDocument()
      expect(screen.queryByText(entry.marker, { exact: true })).not.toBeInTheDocument()
    }
  })

  it('preserves a numeric zero label and gives line markers positive width', () => {
    render(<ChartTooltipContent label={0} entries={entries} />)

    expect(screen.getByText('0')).toBeVisible()
    for (const marker of document.querySelectorAll('[data-chart-marker]')) {
      expect(marker).toHaveClass('w-4', 'shrink-0')
    }
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<ChartTooltipContent label="Значения графика" entries={entries} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
