import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GapsTable } from '../GapsTable'
import type { MissingDate } from '@/types/financial-gaps'

const mockMissingDates: MissingDate[] = [
  { missing_date: '2026-05-10', day_of_week: 6, day_name: 'Saturday' },
  { missing_date: '2026-05-15', day_of_week: 4, day_name: 'Thursday' },
]

describe('GapsTable', () => {
  it('shows loading skeletons', () => {
    const { container } = render(
      <GapsTable
        missingDates={undefined}
        isLoading={true}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.getByRole('status')).toHaveTextContent('Таблица пропусков загружается')
  })

  it('shows "no gaps" message when no missing dates', () => {
    render(
      <GapsTable missingDates={[]} isLoading={false} analyzingDate={null} onAnalyze={vi.fn()} />
    )
    expect(screen.getByText('Пропуски не обнаружены — все данные на месте')).toBeInTheDocument()
  })

  it('renders table header columns', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    expect(screen.getByText('Дата')).toBeInTheDocument()
    expect(screen.getByText('День недели')).toBeInTheDocument()
    expect(screen.getByText('Действие')).toBeInTheDocument()
  })

  it('renders missing date rows with Russian day names', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    expect(screen.getByText('Суббота')).toBeInTheDocument()
    expect(screen.getByText('Четверг')).toBeInTheDocument()
  })

  it('renders analyze button for each row', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    const analyzeButtons = screen.getAllByText('Анализ')
    expect(analyzeButtons).toHaveLength(2)
  })

  it('serializes analysis by disabling every row while one request is pending', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate="2026-05-10"
        onAnalyze={onAnalyze}
      />
    )
    const buttons = screen.getAllByText('Анализ')
    expect(buttons[0].closest('button')).toBeDisabled()
    expect(buttons[1].closest('button')).toBeDisabled()

    await user.click(buttons[1].closest('button')!)
    expect(onAnalyze).not.toHaveBeenCalled()
  })

  it('calls onAnalyze with correct date when clicked', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={onAnalyze}
      />
    )
    const buttons = screen.getAllByText('Анализ')
    const analyzeAction = buttons[0].closest('button')!
    await user.click(analyzeAction)
    expect(onAnalyze).toHaveBeenCalledWith('2026-05-10', analyzeAction)
  })

  it('names each repeated analyze button with its date (AX contract)', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Анализ за 10.05.2026' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Анализ за 15.05.2026' })).toBeInTheDocument()
  })

  it('renders a static table caption identifying the table', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    const caption = document.querySelector('caption')
    expect(caption).not.toBeNull()
    expect(caption).toHaveTextContent('Пропущенные дни в финансовых данных')
  })

  it('exposes the scroll region with a name and no outer overflow container', () => {
    const { container } = render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate={null}
        onAnalyze={vi.fn()}
      />
    )
    const region = screen.getByRole('region', {
      name: 'Область прокрутки таблицы пропущенных дней',
    })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(container.firstElementChild).not.toHaveClass('overflow-x-auto')
  })
})
