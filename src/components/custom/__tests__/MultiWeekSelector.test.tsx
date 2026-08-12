import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAvailableWeeks } from '@/hooks/useFinancialSummary'

import { MultiWeekSelector } from '../MultiWeekSelector'

vi.mock('@/hooks/useFinancialSummary', () => ({
  useAvailableWeeks: vi.fn(),
  formatWeekWithDateRange: vi.fn((week: string) => week),
}))

const weeks = Array.from({ length: 10 }, (_, index) => ({
  week: `2026-W${String(index + 1).padStart(2, '0')}`,
  start_date: `2026-01-${String(index + 1).padStart(2, '0')}`,
}))

function mockAvailableWeeks({
  data = weeks,
  isLoading = false,
  isError = false,
}: {
  data?: typeof weeks
  isLoading?: boolean
  isError?: boolean
} = {}) {
  vi.mocked(useAvailableWeeks).mockReturnValue({
    data,
    isLoading,
    isError,
  } as ReturnType<typeof useAvailableWeeks>)
}

describe('MultiWeekSelector behavior lock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAvailableWeeks()
  })

  it('associates its visible label with the trigger and fits a narrow viewport', () => {
    render(<MultiWeekSelector value={[]} onChange={vi.fn()} label="Периоды отчёта" />)

    const trigger = screen.getByRole('combobox', { name: 'Периоды отчёта' })
    expect(trigger).toHaveClass('w-full')
  })

  it('preserves the current selection while available weeks are loading', () => {
    mockAvailableWeeks({ isLoading: true })

    render(<MultiWeekSelector value={['2026-W01', '2026-W02']} onChange={vi.fn()} />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Загрузка доступных недель')
    expect(status.closest('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByText('Текущий выбор: Выбрано: 2 недели')).toBeInTheDocument()
  })

  it.each([
    ['failed dependency', { data: [], isError: true }, 'Не удалось загрузить список недель'],
    ['empty dependency', { data: [] }, 'Нет доступных недель'],
  ])('preserves the current selection for %s', (_case, dependency, expectedMessage) => {
    mockAvailableWeeks(dependency)

    render(<MultiWeekSelector value={['2026-W01']} onChange={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent(expectedMessage)
    expect(screen.getByText('Текущий выбор: 2026-W01')).toBeInTheDocument()
  })

  it('selects a week exactly once from its checkbox and preserves callback arguments', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MultiWeekSelector value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('checkbox', { name: '2026-W01' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['2026-W01'])
  })

  it('keeps checkbox IDs and label activation isolated between selector instances', async () => {
    const user = userEvent.setup()
    const firstOnChange = vi.fn()
    const secondOnChange = vi.fn()
    render(
      <>
        <MultiWeekSelector value={[]} onChange={firstOnChange} label="Первый период" />
        <MultiWeekSelector value={[]} onChange={secondOnChange} label="Второй период" />
      </>
    )

    await user.click(screen.getByRole('combobox', { name: 'Первый период' }))
    const firstCheckbox = screen.getByRole('checkbox', { name: '2026-W01' })
    const firstId = firstCheckbox.id
    expect(screen.getByText('2026-W01')).toHaveAttribute('for', firstId)
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('combobox', { name: 'Второй период' }))
    const secondCheckbox = screen.getByRole('checkbox', { name: '2026-W01' })
    expect(secondCheckbox.id).not.toBe(firstId)
    expect(screen.getByText('2026-W01')).toHaveAttribute('for', secondCheckbox.id)

    await user.click(screen.getByText('2026-W01'))

    expect(firstOnChange).not.toHaveBeenCalled()
    expect(secondOnChange).toHaveBeenCalledTimes(1)
    expect(secondOnChange).toHaveBeenCalledWith(['2026-W01'])
  })

  it.each([
    ['Последние 4 недели', weeks.slice(0, 4).map(item => item.week)],
    ['2 месяца', weeks.slice(0, 8).map(item => item.week)],
  ])('applies the %s preset once', async (label, expected) => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MultiWeekSelector value={[]} onChange={onChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('button', { name: label }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expected)
  })

  it('preserves inherited preset-over-cap behavior while manual selection remains capped', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MultiWeekSelector value={[]} onChange={onChange} maxSelection={3} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('button', { name: 'Последние 4 недели' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(weeks.slice(0, 4).map(item => item.week))
  })

  it('caps select-all at maxSelection and clears the selection once', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiWeekSelector value={[]} onChange={onChange} maxSelection={3} />
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('button', { name: 'Все (3)' }))
    expect(onChange).toHaveBeenLastCalledWith(weeks.slice(0, 3).map(item => item.week))

    const selected = weeks.slice(0, 3).map(item => item.week)
    rerender(<MultiWeekSelector value={selected} onChange={onChange} maxSelection={3} />)
    await user.click(screen.getByRole('button', { name: 'Очистить' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('disables unselected weeks at the cap and removes a selected tag once', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const selected = ['2026-W01', '2026-W02']
    render(<MultiWeekSelector value={selected} onChange={onChange} maxSelection={2} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('checkbox', { name: '2026-W03' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Удалить 2026-W01' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['2026-W02'])
  })

  it('closes on apply without inventing a callback', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MultiWeekSelector value={['2026-W01']} onChange={onChange} />)

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Применить (1)' }))

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(onChange).not.toHaveBeenCalled()
  })
})
