import { describe, it, expect } from 'vitest'
import { render } from '@/test/utils/test-utils'
import { getSortIcon, MarginIndicator, CostCell } from '../unit-economics-table-utils'
import { Table, TableBody, TableRow } from '@/components/ui/table'

describe('getSortIcon', () => {
  it('shows gray ArrowUpDown for inactive field', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'net_margin_pct', 'desc')}</span>)
    expect(container.querySelector('.text-muted-foreground')).toBeTruthy()
    expect(container.querySelector('.text-status-information')).toBeFalsy()
  })

  it('shows blue ArrowUp for active field asc', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'revenue', 'asc')}</span>)
    const svg = container.querySelector('.text-status-information')
    expect(svg).toBeTruthy()
    expect(container.querySelector('.text-muted-foreground')).toBeFalsy()
    // Store asc SVG markup for comparison
    const ascMarkup = svg!.innerHTML
    expect(ascMarkup).toBeTruthy()
    // Verify it differs from desc (ArrowUp vs ArrowDown have different paths)
    const { container: descContainer } = render(
      <span>{getSortIcon('revenue', 'revenue', 'desc')}</span>
    )
    const descSvg = descContainer.querySelector('.text-status-information')
    expect(descSvg!.innerHTML).not.toBe(ascMarkup)
  })

  it('shows blue ArrowDown for active field desc', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'revenue', 'desc')}</span>)
    expect(container.querySelector('.text-status-information')).toBeTruthy()
  })
})

describe('MarginIndicator', () => {
  it('shows green TrendingUp for margin >= 20%', () => {
    const { container } = render(<MarginIndicator value={25} />)
    expect(container.querySelector('.text-financial-positive')).toBeTruthy()
  })

  it('shows red TrendingDown for margin < 10%', () => {
    const { container } = render(<MarginIndicator value={5} />)
    expect(container.querySelector('.text-financial-negative')).toBeTruthy()
  })

  it('shows gray Minus for margin between 10-20%', () => {
    const { container } = render(<MarginIndicator value={15} />)
    expect(container.querySelector('.text-muted-foreground')).toBeTruthy()
  })

  it('shows neutral Minus for null margin (unknown), never green/red (anti-pattern #8)', () => {
    const { container } = render(<MarginIndicator value={null} />)
    expect(container.querySelector('.text-muted-foreground')).toBeTruthy()
    expect(container.querySelector('.text-financial-positive')).toBeNull()
    expect(container.querySelector('.text-financial-negative')).toBeNull()
  })
})

describe('CostCell', () => {
  function renderCell(value: number | null, highThreshold: number, medThreshold?: number) {
    return render(
      <Table>
        <TableBody>
          <TableRow>
            <CostCell value={value} highThreshold={highThreshold} medThreshold={medThreshold} />
          </TableRow>
        </TableBody>
      </Table>
    )
  }

  it('shows red for value above high threshold', () => {
    const { container } = renderCell(50, 40)
    expect(container.querySelector('.text-status-error')).toBeTruthy()
  })

  it('shows orange for value between med and high', () => {
    const { container } = renderCell(35, 40, 30)
    expect(container.querySelector('.text-status-warning')).toBeTruthy()
  })

  it('shows gray for value below thresholds', () => {
    const { container } = renderCell(20, 40, 30)
    expect(container.querySelector('.text-muted-foreground')).toBeTruthy()
  })

  it('renders "—" + neutral for null cost % (no COGS), never a fabricated "0,0 %"', () => {
    const { container } = renderCell(null, 40, 30)
    expect(container.textContent).toContain('—')
    expect(container.textContent).not.toMatch(/0,0\s*%/)
    expect(container.querySelector('.text-muted-foreground')).toBeTruthy()
    expect(container.querySelector('.text-status-error')).toBeNull()
  })
})
