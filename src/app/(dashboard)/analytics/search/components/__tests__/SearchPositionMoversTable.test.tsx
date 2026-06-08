import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  SearchPositionMoversTable,
  SearchPositionOpportunitiesTable,
} from '../SearchPositionMoversTable'
import type { PositionTrendMover, CloseToPageOneItem } from '@/types/search-position-trends'

const mockMovers: PositionTrendMover[] = [
  {
    nmId: 123456,
    currentAvgPosition: 12.5,
    previousAvgPosition: 18.3,
    positionChange: 5.8,
    trend: 'improving',
    totalQueries: 10,
    totalImpressions: 500,
    topQuery: 'красная футболка',
  },
  {
    nmId: 789012,
    currentAvgPosition: 25.1,
    previousAvgPosition: 20.0,
    positionChange: -5.1,
    trend: 'declining',
    totalQueries: 5,
    totalImpressions: 200,
    topQuery: undefined,
  },
]

const mockCloseItems: CloseToPageOneItem[] = [
  {
    nmId: 345678,
    currentAvgPosition: 25.0,
    positionsAway: 5,
    totalImpressions: 300,
    totalQueries: 8,
    topQuery: 'синяя рубашка',
  },
]

describe('SearchPositionMoversTable', () => {
  it('renders table header columns', () => {
    render(<SearchPositionMoversTable movers={mockMovers} />)
    expect(screen.getByText('nmId')).toBeInTheDocument()
    expect(screen.getByText('Позиция')).toBeInTheDocument()
    expect(screen.getByText('Изменение')).toBeInTheDocument()
    expect(screen.getByText('Запросов')).toBeInTheDocument()
    expect(screen.getByText('Топ запрос')).toBeInTheDocument()
  })

  it('renders mover rows with nmId links', () => {
    render(<SearchPositionMoversTable movers={mockMovers} />)
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('789012')).toBeInTheDocument()
  })

  it('shows positive position change in green with + sign', () => {
    render(<SearchPositionMoversTable movers={mockMovers} />)
    const change = screen.getByText('+5,8')
    expect(change).toBeInTheDocument()
    expect(change.className).toContain('text-green-600')
  })

  it('shows negative position change in red', () => {
    render(<SearchPositionMoversTable movers={mockMovers} />)
    const change = screen.getByText('-5,1')
    expect(change).toBeInTheDocument()
    expect(change.className).toContain('text-red-500')
  })

  it('shows dash for null topQuery', () => {
    render(<SearchPositionMoversTable movers={mockMovers} />)
    // The row for 789012 has topQuery: null → renders '—'
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no movers', () => {
    render(<SearchPositionMoversTable movers={[]} />)
    expect(
      screen.getByText('Нет данных об изменениях позиций за выбранный период')
    ).toBeInTheDocument()
  })
})

describe('SearchPositionOpportunitiesTable', () => {
  it('renders opportunity rows', () => {
    render(<SearchPositionOpportunitiesTable items={mockCloseItems} />)
    expect(screen.getByText('345678')).toBeInTheDocument()
  })

  it('shows "До топ-20" column header', () => {
    render(<SearchPositionOpportunitiesTable items={mockCloseItems} />)
    expect(screen.getByText('До топ-20')).toBeInTheDocument()
  })

  it('shows positionsAway as negative blue number', () => {
    render(<SearchPositionOpportunitiesTable items={mockCloseItems} />)
    const away = screen.getByText('-5')
    expect(away).toBeInTheDocument()
    expect(away.className).toContain('text-blue-600')
  })

  it('shows empty state when no items', () => {
    render(<SearchPositionOpportunitiesTable items={[]} />)
    expect(screen.getByText('Нет SKU рядом с первой страницей поиска')).toBeInTheDocument()
  })
})
