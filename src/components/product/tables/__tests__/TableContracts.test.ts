import { describe, expect, it } from 'vitest'

import {
  entityAccessibleName,
  type TableConsumerContract,
  type TableNumericColumnContract,
} from '../index'

const completeContract = {
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
  sorting: {
    kind: 'caller-controlled',
    activeColumnId: 'price',
    direction: 'descending',
  },
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

describe('table consumer contracts', () => {
  it('declares numeric, sort, selection, action, pagination, and narrow-width meaning', () => {
    expect(completeContract.numericColumns[0]).toMatchObject({
      alignment: 'end',
      tabularNumerals: true,
      fullValueAccess: 'visible',
    })
    expect(completeContract.sorting).toMatchObject({
      kind: 'caller-controlled',
      direction: 'descending',
    })
    expect(completeContract.selection).toMatchObject({ scope: 'filtered-results' })
    expect(completeContract.rowActions.accessibleNamePattern).toContain('{entityId}')
  })

  it('requires all numeric precision and full-value semantics at compile time', () => {
    if (false) {
      // @ts-expect-error - numeric columns must declare tabular numerals and full-value access
      const incomplete: TableNumericColumnContract = {
        id: 'price',
        label: 'Цена',
        alignment: 'end',
        precision: '2 fraction digits',
        unit: { kind: 'currency', code: 'RUB' },
      }

      const misaligned: TableNumericColumnContract = {
        id: 'price',
        label: 'Цена',
        // @ts-expect-error - dense numeric values use end alignment
        alignment: 'start',
        precision: '2 fraction digits',
        unit: { kind: 'currency', code: 'RUB' },
        tabularNumerals: true,
        fullValueAccess: 'visible',
      }

      expect([incomplete, misaligned]).toHaveLength(2)
    }

    expect(true).toBe(true)
  })

  it('builds entity-specific selection and action names from typed templates', () => {
    expect(entityAccessibleName('Выбрать товар {entityId}', 'SKU-001')).toBe(
      'Выбрать товар SKU-001'
    )
    expect(entityAccessibleName('Открыть товар {entityId}', 'SKU-001')).toBe(
      'Открыть товар SKU-001'
    )
  })

  it('rejects accessibility templates without an entity identity placeholder', () => {
    if (false) {
      const invalid: TableConsumerContract = {
        ...completeContract,
        selection: {
          kind: 'caller-controlled',
          mode: 'multiple',
          scope: 'page',
          // @ts-expect-error - selection names must include entity identity
          accessibleNamePattern: 'Выбрать товар',
        },
      }
      expect(invalid).toBeDefined()
    }

    expect(true).toBe(true)
  })
})
