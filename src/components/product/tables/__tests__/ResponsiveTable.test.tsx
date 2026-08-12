import type { ComponentProps, ReactNode } from 'react'

import { render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { ResponsiveTable, ResponsiveTableRow } from '../ResponsiveTable'
import type { TableConsumerContract } from '../contracts'

expect.extend(toHaveNoViolations)

function TableRows(): ReactNode {
  return (
    <>
      <thead>
        <tr>
          <th scope="col" data-column-id="product">
            Товар
          </th>
          <th scope="col">Цена</th>
          <th scope="col">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Очень длинный артикул поставщика зимней коллекции 2026</th>
          <td>−1 234 567,89 ₽</td>
          <td>
            <button type="button" aria-label="Открыть товар SKU-12345678901234567890">
              Открыть
            </button>
          </td>
        </tr>
        <tr>
          <th scope="row">SKU-12345678901234567890</th>
          <td>0 ₽</td>
          <td>—</td>
        </tr>
      </tbody>
    </>
  )
}

const tableContract = {
  primaryColumn: { id: 'product', label: 'Товар' },
  numericColumns: [
    {
      id: 'price',
      label: 'Цена',
      alignment: 'end',
      precision: '2 fraction digits',
      unit: { kind: 'currency', code: 'RUB' },
      tabularNumerals: true,
      fullValueAccess: 'visible',
    },
  ],
  sorting: { kind: 'caller-controlled', activeColumnId: 'price', direction: 'descending' },
  selection: {
    kind: 'caller-controlled',
    mode: 'multiple',
    scope: 'filtered-results',
    accessibleNamePattern: 'Выбрать товар {entityId}',
  },
  rowActions: {
    kind: 'caller-rendered',
    accessibleNamePattern: 'Открыть товар {entityId}',
  },
  narrowStrategy: {
    kind: 'horizontal-scroll',
    regionLabel: 'Прокручиваемая таблица товаров',
    minimumWidth: '48rem',
  },
  pagination: { kind: 'offset' },
} satisfies TableConsumerContract

type CaptionTableOverrides = Omit<
  Extract<ComponentProps<typeof ResponsiveTable>, { caption: ReactNode }>,
  'caption' | 'children'
>

function renderTable(overrides: Partial<CaptionTableOverrides> = {}) {
  return render(
    <ResponsiveTable caption="Товары и цены" contract={tableContract} {...overrides}>
      <TableRows />
    </ResponsiveTable>
  )
}

describe('ResponsiveTable', () => {
  it('renders native caption, header, row, and cell semantics', () => {
    renderTable()

    const table = screen.getByRole('table', { name: 'Товары и цены' })
    expect(within(table).getByText('Товары и цены').tagName).toBe('CAPTION')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(
      within(table).getByRole('rowheader', {
        name: 'Очень длинный артикул поставщика зимней коллекции 2026',
      })
    ).toHaveAttribute('scope', 'row')
    expect(within(table).getAllByRole('cell')).toHaveLength(4)
    expect(within(table).getByText('−1 234 567,89 ₽')).toBeInTheDocument()
    expect(within(table).getByText('0 ₽')).toBeInTheDocument()
    expect(within(table).getByText('—')).toBeInTheDocument()
    expect(
      within(table).getByRole('button', {
        name: 'Открыть товар SKU-12345678901234567890',
      })
    ).toBeInTheDocument()
  })

  it('supports an accessible label when a visible caption is not appropriate', () => {
    render(
      <ResponsiveTable accessibleLabel="Товары и цены без видимой подписи" contract={tableContract}>
        <TableRows />
      </ResponsiveTable>
    )

    const table = screen.getByRole('table', { name: 'Товары и цены без видимой подписи' })
    expect(within(table).queryByText('Товары и цены без видимой подписи')).not.toBeInTheDocument()
    expect(table.querySelector('caption')).toBeNull()
  })

  it('requires exactly one table naming path at compile time', () => {
    if (false) {
      // @ts-expect-error - a table must have a caption or accessible label
      ;<ResponsiveTable contract={tableContract}>
        <TableRows />
      </ResponsiveTable>

      // @ts-expect-error - caption and accessible label are mutually exclusive naming paths
      ;<ResponsiveTable caption="Товары" accessibleLabel="Товары" contract={tableContract}>
        <TableRows />
      </ResponsiveTable>
    }

    expect(true).toBe(true)
  })

  it('exposes the caller-declared primary column and narrow strategy', () => {
    renderTable()

    expect(screen.getByRole('table', { name: 'Товары и цены' })).toHaveAttribute(
      'data-primary-column',
      'product'
    )
    expect(screen.getByRole('table', { name: 'Товары и цены' })).toHaveAttribute(
      'data-narrow-strategy',
      'horizontal-scroll'
    )
  })

  it('requires a complete caller-declared consumer contract at compile time', () => {
    if (false) {
      // @ts-expect-error - every table declares the full consumer contract
      ;<ResponsiveTable caption="Товары">
        <TableRows />
      </ResponsiveTable>
    }

    expect(true).toBe(true)
  })

  it('requires horizontal overflow to have an accessible region name at compile time', () => {
    if (false) {
      ;<ResponsiveTable
        caption="Товары"
        contract={{
          ...tableContract,
          // @ts-expect-error - horizontal overflow must provide an accessible region name
          narrowStrategy: { kind: 'horizontal-scroll' },
        }}
      >
        <TableRows />
      </ResponsiveTable>
    }

    expect(true).toBe(true)
  })

  it('makes deliberate horizontal overflow a named keyboard-reachable region', () => {
    renderTable()

    const overflow = screen.getByRole('region', {
      name: 'Прокручиваемая таблица товаров',
    })
    expect(overflow).toHaveAttribute('tabindex', '0')
    expect(within(overflow).getByRole('table', { name: 'Товары и цены' })).toBeInTheDocument()
    expect(within(overflow).getByRole('table')).toHaveClass('min-w-[48rem]')
  })

  it('does not create a named overflow region for a priority-column strategy', () => {
    renderTable({
      contract: {
        ...tableContract,
        narrowStrategy: {
          kind: 'priority-columns',
          description: 'Сохраняет товар, цену и действие в узкой проекции.',
          narrowContent: <button type="button">Показать вторичные поля товара</button>,
        },
      },
    })

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Товары и цены' })
    const wideProjection = table.closest('[data-table-wide-content]')
    const narrowProjection = screen
      .getByRole('button', { name: 'Показать вторичные поля товара' })
      .closest('[data-table-narrow-content]')

    expect(table).toHaveAttribute('data-narrow-strategy', 'priority-columns')
    expect(wideProjection).toHaveClass('hidden', 'md:block')
    expect(wideProjection).toHaveClass('[&>div]:overflow-visible')
    expect(table).toHaveClass('table-fixed')
    expect(narrowProjection).toHaveClass('md:hidden')
    expect(narrowProjection).toHaveAttribute('role', 'group')
    expect(narrowProjection).toHaveAttribute(
      'aria-label',
      'Сохраняет товар, цену и действие в узкой проекции.'
    )
  })

  it.each(['expanded-detail', 'stacked-detail'] as const)(
    'keeps %s narrow behavior explicit without adding a scroll region',
    kind => {
      renderTable({
        contract: {
          ...tableContract,
          narrowStrategy: {
            kind,
            description: 'Вторичные поля раскрывает владелец.',
            narrowContent: <button type="button">Показать подробности товара</button>,
          },
        },
      })

      expect(screen.queryByRole('region')).not.toBeInTheDocument()
      expect(screen.getByRole('table', { name: 'Товары и цены' })).toHaveAttribute(
        'data-narrow-strategy',
        kind
      )
      expect(
        screen.getByRole('button', { name: 'Показать подробности товара' })
      ).toBeInTheDocument()
      expect(
        screen
          .getByRole('button', { name: 'Показать подробности товара' })
          .closest('[data-table-narrow-content]')
      ).toHaveClass('md:hidden')
      expect(
        screen.getByRole('table', { name: 'Товары и цены' }).closest('[data-table-wide-content]')
      ).toHaveClass('hidden', 'md:block')
    }
  )

  it('rejects specialized virtualization as a semantic table strategy', () => {
    if (false) {
      ;<ResponsiveTable
        caption="Товары"
        contract={{
          ...tableContract,
          // @ts-expect-error - specialized virtualization uses VirtualizedTableFrame
          narrowStrategy: { kind: 'specialized-virtualization' },
        }}
      >
        <TableRows />
      </ResponsiveTable>
    }

    expect(true).toBe(true)
  })

  it('presents caller-owned selection scope, toolbar, and pagination content', () => {
    renderTable({
      toolbar: <div>Фильтры принадлежат маршруту</div>,
      selectionSummary: {
        selectedCount: 12,
        scope: 'filtered-results',
        scopeLabel: 'во всех отфильтрованных результатах',
        actions: <button type="button">Обработать 12 выбранных товаров</button>,
      },
      pagination: <nav aria-label="Страницы из владельца маршрута">Пагинация</nav>,
    })

    expect(screen.getByText('Фильтры принадлежат маршруту')).toBeInTheDocument()
    expect(
      screen.getByText('Выбрано: 12 — во всех отфильтрованных результатах')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Обработать 12 выбранных товаров' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Страницы из владельца маршрута' })
    ).toBeInTheDocument()
  })

  it('exposes selected state on a caller-controlled row', () => {
    render(
      <table>
        <tbody>
          <ResponsiveTableRow selected>
            <td>Товар выбран</td>
          </ResponsiveTableRow>
        </tbody>
      </table>
    )

    expect(screen.getByRole('row')).toHaveAttribute('data-state', 'selected')
    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'true')
  })

  it('exposes disabled state on a caller-controlled row', () => {
    render(
      <table>
        <tbody>
          <ResponsiveTableRow disabled>
            <td>Товар недоступен</td>
          </ResponsiveTableRow>
        </tbody>
      </table>
    )

    expect(screen.getByRole('row')).toHaveAttribute('aria-disabled', 'true')
  })

  it('exposes expanded state on a caller-controlled row', () => {
    render(
      <table>
        <tbody>
          <ResponsiveTableRow expanded>
            <td>Подробности раскрыты</td>
          </ResponsiveTableRow>
        </tbody>
      </table>
    )

    expect(screen.getByRole('row')).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not allow caller attributes to erase declared row state', () => {
    render(
      <table>
        <tbody>
          <ResponsiveTableRow
            selected
            disabled
            expanded
            data-state="caller-value"
            aria-selected={false}
            aria-disabled={false}
            aria-expanded={false}
          >
            <td>Состояние строки</td>
          </ResponsiveTableRow>
        </tbody>
      </table>
    )

    expect(screen.getByRole('row')).toHaveAttribute('data-state', 'selected')
    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('row')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('row')).toHaveAttribute('aria-expanded', 'true')
  })

  it('has no detectable accessibility violations for dense labeled content', async () => {
    const { container } = renderTable()

    expect(await axe(container)).toHaveNoViolations()
  })
})
