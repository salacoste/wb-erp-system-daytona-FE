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

  it('renders named tooltip buttons for column headers', () => {
    render(
      <table>
        <TopBrandsTableHeader />
      </table>
    )
    for (const label of ['Бренд', 'Выручка', 'Прибыль', 'Маржа']) {
      expect(screen.getByRole('button', { name: `Подробнее о столбце «${label}»` })).toBeVisible()
    }
  })
})
