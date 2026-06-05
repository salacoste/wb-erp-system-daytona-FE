import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InsightsCards } from '../InsightsCards'
import type { CrossReferenceItem } from '../../utils/cross-reference-utils'

function makeItem(overrides: Partial<CrossReferenceItem> = {}): CrossReferenceItem {
  return {
    nmId: 100,
    vendorCode: 'VC-100',
    totalOrders: 10,
    uniqueQueries: 5,
    adSpend: 2000,
    adClicks: 50,
    adRevenue: 800,
    organicContribution: 30,
    channel: 'both',
    ...overrides,
  }
}

describe('InsightsCards', () => {
  it('renders nothing when items array is empty', () => {
    const { container } = render(<InsightsCards items={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders header with title and description', () => {
    render(<InsightsCards items={[makeItem()]} />)
    expect(screen.getByText('Возможная переплата')).toBeInTheDocument()
    expect(
      screen.getByText('Товары присутствуют в органике и имеют высокий рекламный расход')
    ).toBeInTheDocument()
  })

  it('renders card for each item with vendorCode', () => {
    const items = [
      makeItem({ nmId: 1, vendorCode: 'ABC-001', adSpend: 5000 }),
      makeItem({ nmId: 2, vendorCode: 'XYZ-002', adSpend: 3000 }),
    ]
    render(<InsightsCards items={items} />)
    expect(screen.getByText('ABC-001')).toBeInTheDocument()
    expect(screen.getByText('XYZ-002')).toBeInTheDocument()
  })

  it('displays formatted ad spend', () => {
    render(<InsightsCards items={[makeItem({ adSpend: 12500 })]} />)
    expect(screen.getByText('12 500 ₽')).toBeInTheDocument()
  })

  it('displays organic order count', () => {
    render(<InsightsCards items={[makeItem({ totalOrders: 42 })]} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('falls back to nmId when vendorCode is null', () => {
    render(<InsightsCards items={[makeItem({ nmId: 99999, vendorCode: null })]} />)
    expect(screen.getByText('99999')).toBeInTheDocument()
  })
})
