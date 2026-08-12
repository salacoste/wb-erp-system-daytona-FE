import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  ResponsiveTableHeader,
  ResponsiveTableNumericCell,
  ResponsiveTableSortButton,
} from '../ResponsiveTableHeader'

describe('ResponsiveTableHeader', () => {
  it('places caller-controlled sort direction on the owning column header', () => {
    render(
      <table>
        <thead>
          <tr>
            <ResponsiveTableHeader
              columnId="price"
              sorting={{
                kind: 'caller-controlled',
                activeColumnId: 'price',
                direction: 'descending',
              }}
            >
              Цена
            </ResponsiveTableHeader>
          </tr>
        </thead>
      </table>
    )

    expect(screen.getByRole('columnheader', { name: 'Цена' })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })

  it('keeps inactive and unsorted headers free of misleading direction', () => {
    render(
      <table>
        <thead>
          <tr>
            <ResponsiveTableHeader
              columnId="product"
              sorting={{
                kind: 'caller-controlled',
                activeColumnId: 'price',
                direction: 'ascending',
              }}
            >
              Товар
            </ResponsiveTableHeader>
            <ResponsiveTableHeader
              columnId="status"
              sorting={{ kind: 'caller-controlled', direction: 'none' }}
            >
              Статус
            </ResponsiveTableHeader>
          </tr>
        </thead>
      </table>
    )

    expect(screen.getByRole('columnheader', { name: 'Товар' })).not.toHaveAttribute('aria-sort')
    expect(screen.getByRole('columnheader', { name: 'Статус' })).not.toHaveAttribute('aria-sort')
  })

  it('keeps sorting keyboardable and caller-controlled with an entity name', async () => {
    const user = userEvent.setup()
    const onSort = vi.fn()

    render(
      <ResponsiveTableSortButton entityLabel="товары по цене" onClick={onSort}>
        Цена
      </ResponsiveTableSortButton>
    )

    const button = screen.getByRole('button', { name: 'Сортировать товары по цене' })
    button.focus()
    await user.keyboard('{Enter}')
    expect(onSort).toHaveBeenCalledTimes(1)
  })

  it('projects numeric alignment, unit, precision, and full-value access', () => {
    render(
      <table>
        <tbody>
          <tr>
            <ResponsiveTableNumericCell
              contract={{
                id: 'price',
                label: 'Цена',
                alignment: 'end',
                precision: '2 fraction digits',
                unit: { kind: 'currency', code: 'RUB' },
                tabularNumerals: true,
                fullValueAccess: 'accessible-description',
              }}
              fullValue="−1 234 567,89 ₽"
            >
              −1,2 млн ₽
            </ResponsiveTableNumericCell>
          </tr>
        </tbody>
      </table>
    )

    const cell = screen.getByRole('cell', { name: '−1 234 567,89 ₽' })
    expect(cell).toHaveTextContent('−1,2 млн ₽')
    expect(cell).toHaveClass('text-right', 'tabular-nums')
    expect(cell).toHaveAttribute('data-unit', 'RUB')
    expect(cell).toHaveAttribute('data-precision', '2 fraction digits')
  })
})
