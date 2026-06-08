import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { TopBrandsTableHeader } from '../TopBrandsTableHeader'

describe('TopBrandsTableHeader', () => {
  it('renders all column headers', () => {
    render(
      <table>
        <TopBrandsTableHeader />
      </table>
    )
    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Бренд')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('Прибыль')).toBeInTheDocument()
    expect(screen.getByText('Маржа')).toBeInTheDocument()
  })

  it('renders tooltip icons for column headers', () => {
    render(
      <table>
        <TopBrandsTableHeader />
      </table>
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })
})
