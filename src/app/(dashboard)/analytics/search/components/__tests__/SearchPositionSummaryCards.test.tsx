import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchPositionSummaryCards } from '../SearchPositionSummaryCards'
import type { PositionTrendsSummary } from '../SearchPositionSummaryCards'

const mockSummary: PositionTrendsSummary = {
  improvingCount: 12,
  decliningCount: 5,
  stableCount: 3,
  closeToPageOneCount: 8,
  totalSkusAnalyzed: 20,
}

function renderCards(summary: PositionTrendsSummary) {
  return render(<SearchPositionSummaryCards summary={summary} />)
}

describe('SearchPositionSummaryCards', () => {
  it('renders all four metric cards', () => {
    renderCards(mockSummary)
    expect(screen.getByText('Растут')).toBeInTheDocument()
    expect(screen.getByText('Падают')).toBeInTheDocument()
    expect(screen.getByText('Рядом с топ')).toBeInTheDocument()
    expect(screen.getByText('Всего SKU')).toBeInTheDocument()
  })

  it('displays improving count in green', () => {
    renderCards(mockSummary)
    const improvingValue = screen.getByText('12')
    expect(improvingValue).toBeInTheDocument()
    expect(improvingValue.className).toContain('text-green-600')
  })

  it('displays declining count in red', () => {
    renderCards(mockSummary)
    const decliningValue = screen.getByText('5')
    expect(decliningValue).toBeInTheDocument()
    expect(decliningValue.className).toContain('text-red-500')
  })

  it('displays close-to-page-one count in blue', () => {
    renderCards(mockSummary)
    const closeValue = screen.getByText('8')
    expect(closeValue).toBeInTheDocument()
    expect(closeValue.className).toContain('text-blue-600')
  })

  it('formats total SKU count with locale', () => {
    const largeSummary = { ...mockSummary, totalSkusAnalyzed: 1500 }
    renderCards(largeSummary)
    expect(screen.getByText('1 500')).toBeInTheDocument()
  })

  it('shows "позиция 20-40" subtitle on close-to-page-one card', () => {
    renderCards(mockSummary)
    expect(screen.getByText('позиция 20-40')).toBeInTheDocument()
  })

  it('renders with zero values', () => {
    const zeroSummary: PositionTrendsSummary = {
      improvingCount: 0,
      decliningCount: 0,
      stableCount: 0,
      closeToPageOneCount: 0,
      totalSkusAnalyzed: 0,
    }
    renderCards(zeroSummary)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(4)
  })
})
