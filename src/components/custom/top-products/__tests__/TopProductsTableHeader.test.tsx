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

  it('renders named tooltip buttons for columns', () => {
    render(
      <table>
        <TopProductsTableHeader />
      </table>
    )
    for (const label of ['Товар', 'Выручка', 'Прибыль', 'Маржа', 'Доля']) {
      expect(screen.getByRole('button', { name: `Подробнее о столбце «${label}»` })).toBeVisible()
    }
  })
})
