import { describe, it, expect } from 'vitest'
import { render } from '@/test/utils/test-utils'
import { getSortIcon, MarginIndicator, CostCell } from '../unit-economics-table-utils'
import { Table, TableBody, TableRow } from '@/components/ui/table'

describe('getSortIcon', () => {
  it('shows gray ArrowUpDown for inactive field', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'net_margin_pct', 'desc')}</span>)
    expect(container.querySelector('.text-gray-400')).toBeTruthy()
    expect(container.querySelector('.text-blue-500')).toBeFalsy()
  })

  it('shows blue ArrowUp for active field asc', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'revenue', 'asc')}</span>)
    const svg = container.querySelector('.text-blue-500')
    expect(svg).toBeTruthy()
    expect(container.querySelector('.text-gray-400')).toBeFalsy()
    // Store asc SVG markup for comparison
    const ascMarkup = svg!.innerHTML
    expect(ascMarkup).toBeTruthy()
    // Verify it differs from desc (ArrowUp vs ArrowDown have different paths)
    const { container: descContainer } = render(
      <span>{getSortIcon('revenue', 'revenue', 'desc')}</span>
    )
    const descSvg = descContainer.querySelector('.text-blue-500')
    expect(descSvg!.innerHTML).not.toBe(ascMarkup)
  })

  it('shows blue ArrowDown for active field desc', () => {
    const { container } = render(<span>{getSortIcon('revenue', 'revenue', 'desc')}</span>)
    expect(container.querySelector('.text-blue-500')).toBeTruthy()
  })
})

describe('MarginIndicator', () => {
  it('shows green TrendingUp for margin >= 20%', () => {
    const { container } = render(<MarginIndicator value={25} />)
    expect(container.querySelector('.text-green-500')).toBeTruthy()
  })

  it('shows red TrendingDown for margin < 10%', () => {
    const { container } = render(<MarginIndicator value={5} />)
    expect(container.querySelector('.text-red-500')).toBeTruthy()
  })

  it('shows gray Minus for margin between 10-20%', () => {
    const { container } = render(<MarginIndicator value={15} />)
    expect(container.querySelector('.text-gray-400')).toBeTruthy()
  })
})

describe('CostCell', () => {
  function renderCell(value: number, highThreshold: number, medThreshold?: number) {
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
    expect(container.querySelector('.text-red-600')).toBeTruthy()
  })

  it('shows orange for value between med and high', () => {
    const { container } = renderCell(35, 40, 30)
    expect(container.querySelector('.text-orange-600')).toBeTruthy()
  })

  it('shows gray for value below thresholds', () => {
    const { container } = renderCell(20, 40, 30)
    expect(container.querySelector('.text-gray-700')).toBeTruthy()
  })
})
