import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { TopProductsTableHeader } from '../TopProductsTableHeader'

describe('TopProductsTableHeader', () => {
  it('renders all column headers', () => {
    render(
      <table>
        <TopProductsTableHeader />
      </table>
    )
    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('Прибыль')).toBeInTheDocument()
    expect(screen.getByText('Маржа')).toBeInTheDocument()
    expect(screen.getByText('Доля')).toBeInTheDocument()
  })

  it('renders tooltip buttons for columns', () => {
    render(
      <table>
        <TopProductsTableHeader />
      </table>
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })
})
