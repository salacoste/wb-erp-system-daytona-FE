import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test/utils/test-utils'
import type { SkuPackaging } from '@/types/shipment-cost'

import { SkuPackagingTable } from '../SkuPackagingTable'

const mappedItem: SkuPackaging = {
  nmId: 123456789,
  cabinetId: 'cab-001',
  boxTypeId: 'bt-001',
  unitsPerBox: 10,
  boxType: {
    id: 'bt-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
  },
  product: {
    nmId: 123456789,
    vendorCode: 'ART-001',
    brand: 'TestBrand',
    subject: 'Футболка',
  },
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

const inactiveItem: SkuPackaging = {
  ...mappedItem,
  nmId: 222333444,
  product: { ...mappedItem.product, nmId: 222333444, subject: 'Куртка' },
  boxType: { ...mappedItem.boxType, isActive: false },
}

const mismatchedItem: SkuPackaging = {
  ...mappedItem,
  nmId: 333444555,
  product: { ...mappedItem.product, nmId: 333444555, subject: 'Брюки' },
  boxTypeId: 'bt-missing',
}

const productMismatchItem: SkuPackaging = {
  ...mappedItem,
  nmId: 555666777,
  product: { ...mappedItem.product, nmId: 999888777, subject: 'Чужой товар' },
}

const incompleteItem = {
  ...mappedItem,
  nmId: 444555666,
  unitsPerBox: 0,
  product: { ...mappedItem.product, nmId: 0, subject: 'Товар без данных' },
  boxType: { ...mappedItem.boxType, name: '' },
} satisfies SkuPackaging

describe('SkuPackagingTable', () => {
  const defaultProps = {
    items: [mappedItem],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('names the semantic table and declares a complete stacked narrow alternative', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)

    const table = screen.getByRole('table', { name: 'Привязки упаковки SKU' })
    expect(table).toHaveAttribute('data-primary-column', 'product')
    expect(table).toHaveAttribute('data-narrow-strategy', 'stacked-detail')
    expect(
      screen.getByRole('group', { name: 'Карточки привязок упаковки для узкого экрана' })
    ).toBeInTheDocument()
  })

  it('keeps SKU identity, package, status, units, and actions available in wide and narrow views', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)

    expect(screen.getAllByText('123456789 — Футболка')).toHaveLength(2)
    expect(screen.getAllByText('Коробка A')).toHaveLength(2)
    expect(screen.getAllByText('10 шт.')).toHaveLength(2)
    expect(screen.getAllByText('Привязка активна')).toHaveLength(2)
    expect(
      screen.getAllByRole('button', {
        name: 'Редактировать упаковку SKU 123456789',
      })
    ).toHaveLength(2)
    expect(
      screen.getAllByRole('button', {
        name: 'Удалить упаковку SKU 123456789',
      })
    ).toHaveLength(2)
  })

  it.each([
    { item: mappedItem, label: 'Привязка активна', status: 'success' },
    { item: inactiveItem, label: 'Тип коробки неактивен', status: 'neutral' },
    { item: mismatchedItem, label: 'Требует проверки', status: 'warning' },
    { item: productMismatchItem, label: 'Требует проверки', status: 'warning' },
    { item: incompleteItem, label: 'Неполные данные', status: 'warning' },
  ])('renders truthful non-color status "$label"', ({ item, label, status }) => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} items={[item]} />)

    const badges = screen.getAllByText(label).map(labelNode => labelNode.closest('[data-status]'))
    expect(badges).toHaveLength(2)
    expect(badges.every(badge => badge?.getAttribute('data-status') === status)).toBe(true)
  })

  it('never labels a mismatched embedded product identity as active', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} items={[productMismatchItem]} />)

    expect(screen.queryByText('Привязка активна')).not.toBeInTheDocument()
    expect(screen.getAllByText('Требует проверки')).toHaveLength(2)
  })

  it('does not hide malformed package data behind an empty cell', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} items={[incompleteItem]} />)

    expect(screen.getAllByText('Не указан')).toHaveLength(2)
    expect(screen.getAllByText('0 шт.')).toHaveLength(2)
  })

  it.each([
    ['Редактировать', 'onEdit'],
    ['Удалить', 'onDelete'],
  ] as const)('passes the exact entity and invoking %s trigger', async (action, callback) => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(
      <SkuPackagingTable items={[mappedItem]} onEdit={onEdit} onDelete={onDelete} />
    )
    const trigger = screen.getAllByRole('button', {
      name: `${action} упаковку SKU 123456789`,
    })[0]

    await user.click(trigger)

    const spy = callback === 'onEdit' ? onEdit : onDelete
    expect(spy).toHaveBeenCalledWith(mappedItem, trigger)
  })

  it('uses visible, entity-specific 44px actions instead of icon-only controls', () => {
    renderWithProviders(<SkuPackagingTable {...defaultProps} />)

    for (const action of ['Редактировать', 'Удалить']) {
      const buttons = screen.getAllByRole('button', {
        name: `${action} упаковку SKU 123456789`,
      })
      expect(buttons.every(button => button.classList.contains('min-h-11'))).toBe(true)
      expect(buttons.every(button => button.textContent?.includes(action))).toBe(true)
    }
  })
})
