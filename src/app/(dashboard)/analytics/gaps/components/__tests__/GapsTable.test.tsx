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

  it('disables analyze button for currently analyzing date', () => {
    render(
      <GapsTable
        missingDates={mockMissingDates}
        isLoading={false}
        analyzingDate="2026-05-10"
        onAnalyze={vi.fn()}
      />
    )
    const buttons = screen.getAllByText('Анализ')
    // First button (2026-05-10) should be disabled
    expect(buttons[0].closest('button')).toBeDisabled()
    // Second button (2026-05-15) should not be disabled
    expect(buttons[1].closest('button')).not.toBeDisabled()
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
    await user.click(buttons[0].closest('button')!)
    expect(onAnalyze).toHaveBeenCalledWith('2026-05-10')
  })
})
