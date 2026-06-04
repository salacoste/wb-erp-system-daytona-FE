/**
 * Unit tests for buyout table cell components
 * Story 69.7: Tests for buyout analytics UI components
 * Epic 69: Buyout Rate per-SKU analytics (Frontend)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ariaSort,
  ReasonCell,
  TrendIndicator,
  ConfidenceBadge,
  SortBtn,
} from '../buyout-table-cells'

/** Wraps TableCell in valid HTML structure */
function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <table>
      <tbody>
        <tr>{children}</tr>
      </tbody>
    </table>
  )
}

describe('ariaSort', () => {
  it('returns "ascending" when field matches current sort asc', () => {
    expect(ariaSort('buyoutRate', 'buyoutRate', 'asc')).toBe('ascending')
  })

  it('returns "descending" when field matches current sort desc', () => {
    expect(ariaSort('salesCount', 'salesCount', 'desc')).toBe('descending')
  })

  it('returns "none" when field does not match current sort', () => {
    expect(ariaSort('buyoutRate', 'salesCount', 'asc')).toBe('none')
  })

  it('returns "none" for all non-matching fields', () => {
    expect(ariaSort('trend', 'returnRate', 'desc')).toBe('none')
    expect(ariaSort('returnRate', 'trend', 'asc')).toBe('none')
  })
})

describe('ReasonCell', () => {
  it('shows dash when count is undefined', () => {
    render(
      <TableWrapper>
        <ReasonCell count={undefined} color="text-red-500" />
      </TableWrapper>
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows zero when count is 0 (valid data, not missing)', () => {
    render(
      <TableWrapper>
        <ReasonCell count={0} color="text-red-500" />
      </TableWrapper>
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows tilde with title when estimated (FBO)', () => {
    render(
      <TableWrapper>
        <ReasonCell count={0} color="text-blue-500" estimated />
      </TableWrapper>
    )
    expect(screen.getByText('~')).toBeInTheDocument()
    expect(screen.getByText('~').closest('td')).toHaveAttribute(
      'title',
      expect.stringContaining('FBO')
    )
  })

  it('shows count with color class when count is present', () => {
    render(
      <TableWrapper>
        <ReasonCell count={42} color="text-orange-500" />
      </TableWrapper>
    )
    const cell = screen.getByText('42')
    expect(cell).toBeInTheDocument()
    expect(cell).toHaveClass('font-medium', 'text-orange-500')
  })

  it('applies muted styling for dash variant', () => {
    render(
      <TableWrapper>
        <ReasonCell count={undefined} color="text-green-500" />
      </TableWrapper>
    )
    const cell = screen.getByText('—').closest('td')
    expect(cell).toHaveClass('text-muted-foreground')
  })
})

describe('TrendIndicator', () => {
  it('shows Minus icon when trend is undefined', () => {
    const { container } = render(<TrendIndicator trend={undefined} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-muted-foreground')
  })

  it('shows Minus icon when trend is stable', () => {
    const { container } = render(<TrendIndicator trend="stable" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-muted-foreground')
  })

  it('shows green color for up trend', () => {
    const { container } = render(<TrendIndicator trend="up" />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-green-500')
  })

  it('shows red color for down trend', () => {
    const { container } = render(<TrendIndicator trend="down" />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-red-500')
  })

  it('shows delta with + sign for up trend', () => {
    render(<TrendIndicator trend="up" delta={5.3} />)
    expect(screen.getByText('+5,3')).toBeInTheDocument() // ru-RU comma decimal
  })

  it('shows delta without + sign for down trend', () => {
    render(<TrendIndicator trend="down" delta={-2.1} />)
    expect(screen.getByText('-2,1')).toBeInTheDocument() // ru-RU comma decimal
  })

  it('does not show delta when not provided', () => {
    const { container } = render(<TrendIndicator trend="up" />)
    const innerSpans = container.querySelectorAll('span span')
    expect(innerSpans).toHaveLength(0)
  })

  it('formats delta to 1 decimal place', () => {
    render(<TrendIndicator trend="up" delta={3.456} />)
    expect(screen.getByText('+3,5')).toBeInTheDocument() // ru-RU comma decimal (3.456 → "3,5")
  })

  it('uses Intl halfExpand rounding at .x5 (5.35 → "5,4"; differs from toFixed "5,3" — display-only)', () => {
    // documents the intentional rounding shift from toFixed FP-half-to-even to Intl halfExpand
    render(<TrendIndicator trend="up" delta={5.35} />)
    expect(screen.getByText('+5,4')).toBeInTheDocument()
  })
})

describe('ConfidenceBadge', () => {
  it('returns null for high confidence', () => {
    const { container } = render(<ConfidenceBadge confidence="high" />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null for undefined confidence', () => {
    const { container } = render(<ConfidenceBadge confidence={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows "Мало данных" for medium confidence', () => {
    render(<ConfidenceBadge confidence="medium" />)
    expect(screen.getByText('Мало данных')).toBeInTheDocument()
  })

  it('shows "Недостаточно данных" for low confidence', () => {
    render(<ConfidenceBadge confidence="low" />)
    expect(screen.getByText('Недостаточно данных')).toBeInTheDocument()
  })

  it('applies gray styling for medium confidence', () => {
    render(<ConfidenceBadge confidence="medium" />)
    const badge = screen.getByText('Мало данных')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-600')
  })

  it('applies yellow styling for low confidence', () => {
    render(<ConfidenceBadge confidence="low" />)
    const badge = screen.getByText('Недостаточно данных')
    expect(badge).toHaveClass('bg-yellow-50', 'text-yellow-700')
  })
})

describe('SortBtn', () => {
  it('renders children text', () => {
    render(
      <SortBtn active={false} onClick={vi.fn()}>
        Выкуп
      </SortBtn>
    )
    expect(screen.getByText('Выкуп')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(
      <SortBtn active={false} onClick={onClick}>
        Sort
      </SortBtn>
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies foreground color to icon when active', () => {
    const { container } = render(
      <SortBtn active={true} onClick={vi.fn()}>
        Active
      </SortBtn>
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-foreground')
  })

  it('applies muted color to icon when inactive', () => {
    const { container } = render(
      <SortBtn active={false} onClick={vi.fn()}>
        Inactive
      </SortBtn>
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('text-muted-foreground/50')
  })
})
