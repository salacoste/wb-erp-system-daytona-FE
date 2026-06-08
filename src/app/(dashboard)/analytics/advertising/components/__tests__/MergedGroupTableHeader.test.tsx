/**
 * Tests for MergedGroupTableHeader component
 * Tests column headers, sort indicators, and sort click handlers.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MergedGroupTableHeader } from '../MergedGroupTableHeader'

describe('MergedGroupTableHeader', () => {
  it('renders all column headers', () => {
    render(<MergedGroupTableHeader />)
    expect(screen.getByText('Склейка')).toBeInTheDocument()
    expect(screen.getByText('Артикул')).toBeInTheDocument()
    expect(screen.getByText(/Всего продаж/)).toBeInTheDocument()
    expect(screen.getByText(/Из рекламы/)).toBeInTheDocument()
    expect(screen.getByText('Органика')).toBeInTheDocument()
    expect(screen.getByText('Расход')).toBeInTheDocument()
    expect(screen.getByText('ROAS')).toBeInTheDocument()
  })

  it('renders sort icon for active sort field ascending', () => {
    render(
      <MergedGroupTableHeader
        sortConfig={{ field: 'totalSales', direction: 'asc' }}
        onSort={vi.fn()}
      />
    )
    const header = screen.getByText(/Всего продаж/)
    expect(header.textContent).toContain('↑')
  })

  it('renders sort icon for active sort field descending', () => {
    render(
      <MergedGroupTableHeader
        sortConfig={{ field: 'totalRevenue', direction: 'desc' }}
        onSort={vi.fn()}
      />
    )
    const header = screen.getByText(/Из рекламы/)
    expect(header.textContent).toContain('↓')
  })

  it('does not render sort icon for inactive sort fields', () => {
    render(
      <MergedGroupTableHeader
        sortConfig={{ field: 'totalSales', direction: 'asc' }}
        onSort={vi.fn()}
      />
    )
    // Revenue header should NOT have a sort arrow
    const revenueHeader = screen.getByText(/Из рекламы/)
    expect(revenueHeader.textContent).not.toContain('↑')
    expect(revenueHeader.textContent).not.toContain('↓')
  })

  it('calls onSort with correct field when header is clicked', async () => {
    const user = userEvent.setup()
    const handleSort = vi.fn()
    render(<MergedGroupTableHeader onSort={handleSort} />)

    await user.click(screen.getByText(/Всего продаж/))
    expect(handleSort).toHaveBeenCalledWith('totalSales')

    await user.click(screen.getByText(/Расход/))
    expect(handleSort).toHaveBeenCalledWith('totalSpend')
  })

  it('applies sortable cursor style when onSort is provided', () => {
    render(<MergedGroupTableHeader onSort={vi.fn()} />)
    const totalSalesHeader = screen.getByText(/Всего продаж/).closest('th')
    expect(totalSalesHeader?.className).toContain('cursor-pointer')
  })

  it('does not apply sortable cursor when onSort is undefined', () => {
    render(<MergedGroupTableHeader />)
    const totalSalesHeader = screen.getByText(/Всего продаж/).closest('th')
    expect(totalSalesHeader?.className).not.toContain('cursor-pointer')
  })

  it('renders ROAS header with tooltip trigger', () => {
    render(<MergedGroupTableHeader />)
    // ROAS text is wrapped in a span inside TooltipTrigger
    expect(screen.getByText('ROAS')).toBeInTheDocument()
  })

  it('renders column headers in <thead>', () => {
    const { container } = render(<MergedGroupTableHeader />)
    const thead = container.querySelector('thead')
    expect(thead).toBeInTheDocument()
    const cells = thead?.querySelectorAll('th')
    expect(cells?.length).toBe(7)
  })
})
