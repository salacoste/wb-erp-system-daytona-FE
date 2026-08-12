import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it } from 'vitest'

import { VirtualizedTableFrame } from '../VirtualizedTableFrame'
import type { VirtualizedTableContract } from '../contracts'

expect.extend(toHaveNoViolations)

const listContract = {
  narrowStrategy: { kind: 'specialized-virtualization' },
  collectionRole: 'list',
  itemRole: 'listitem',
  headerPlacement: 'outside',
  positionFeedback: 'Показаны товары 1–20 из 1000',
  endFeedback: 'Конец списка товаров',
  ownership: {
    rowHeight: 'caller',
    viewportHeight: 'caller',
    overscan: 'caller',
    itemIdentity: 'caller',
    selection: 'caller',
    focus: 'caller',
  },
} satisfies VirtualizedTableContract

function renderList(state: 'populated' | 'updating' = 'populated') {
  return render(
    <VirtualizedTableFrame
      label="Виртуализированный список товаров"
      contract={listContract}
      state={
        state === 'updating'
          ? { kind: 'updating', message: 'Список обновляется' }
          : { kind: 'populated' }
      }
      header={<div data-testid="persistent-header">Выбрать все видимые товары</div>}
      selectionSummary={{ selectedCount: 3, scope: 'page', scopeLabel: 'на текущей странице' }}
      endReached
    >
      <div role="list" aria-label="Товары" data-testid="virtualized-collection">
        <div role="listitem">Товар SKU-001</div>
      </div>
    </VirtualizedTableFrame>
  )
}

describe('VirtualizedTableFrame', () => {
  it('places the persistent header before the caller-owned collection', () => {
    renderList()

    const header = screen.getByTestId('persistent-header')
    const collection = screen.getByTestId('virtualized-collection')
    expect(
      header.compareDocumentPosition(collection) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('preserves caller-provided list and item semantics without forcing a table', () => {
    renderList()

    expect(screen.getByRole('list', { name: 'Товары' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Товар SKU-001')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('preserves caller-provided grid and row semantics', () => {
    render(
      <VirtualizedTableFrame
        label="Виртуализированная сетка"
        contract={{
          narrowStrategy: { kind: 'specialized-virtualization' },
          collectionRole: 'grid',
          itemRole: 'row',
          headerPlacement: 'outside',
          positionFeedback: 'Строки 1–20 из 500',
          endFeedback: 'Конец сетки',
          ownership: {
            rowHeight: 'caller',
            viewportHeight: 'caller',
            overscan: 'caller',
            itemIdentity: 'caller',
            selection: 'caller',
            focus: 'caller',
          },
        }}
        state={{ kind: 'populated' }}
        header={<div>Заголовки сетки</div>}
      >
        <div role="grid" aria-label="Операционные записи">
          <div role="row" aria-label="Запись SKU-002" />
        </div>
      </VirtualizedTableFrame>
    )

    expect(screen.getByRole('grid', { name: 'Операционные записи' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Запись SKU-002' })).toBeInTheDocument()
  })

  it('keeps position, end, and caller-owned selection scope visible', () => {
    renderList()

    expect(screen.getByText('Показаны товары 1–20 из 1000')).toBeInTheDocument()
    expect(screen.getByText('Конец списка товаров')).toBeInTheDocument()
    expect(screen.getByText('Выбрано: 3 — на текущей странице')).toBeInTheDocument()
    expect(screen.getByLabelText('Виртуализированный список товаров')).toHaveAttribute(
      'data-narrow-strategy',
      'specialized-virtualization'
    )
  })

  it('does not announce the end while more virtualized results remain', () => {
    render(
      <VirtualizedTableFrame
        label="Виртуализированный список"
        contract={listContract}
        state={{ kind: 'populated' }}
        header={<div>Заголовок</div>}
      >
        <div role="list" />
      </VirtualizedTableFrame>
    )

    expect(screen.queryByText('Конец списка товаров')).not.toBeInTheDocument()
  })

  it('keeps virtualized content visible while updating', () => {
    renderList('updating')

    expect(screen.getByRole('status')).toHaveTextContent('Список обновляется')
    expect(screen.getByRole('list', { name: 'Товары' })).toBeInTheDocument()
  })

  it('preserves filtered scope/reset and partial missing-scope meaning', () => {
    const { rerender } = render(
      <VirtualizedTableFrame
        label="Виртуализированный список"
        contract={listContract}
        state={{
          kind: 'filtered-empty',
          message: 'Товары не найдены',
          scope: 'Склад: Коледино',
          resetAction: <button type="button">Сбросить фильтры</button>,
        }}
        header={<div>Заголовок</div>}
      />
    )

    expect(screen.getByText('Склад: Коледино')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument()

    rerender(
      <VirtualizedTableFrame
        label="Виртуализированный список"
        contract={listContract}
        state={{
          kind: 'partial',
          message: 'Доступна часть товаров',
          missingScope: 'Не загружен склад Электросталь',
        }}
        header={<div>Заголовок</div>}
      >
        <div role="list" />
      </VirtualizedTableFrame>
    )

    expect(screen.getByText('Не загружен склад Электросталь')).toBeInTheDocument()
  })

  it.each([
    {
      state: { kind: 'empty', message: 'Товаров пока нет' } as const,
      expected: 'Товаров пока нет',
    },
    {
      state: {
        kind: 'filtered-empty',
        message: 'Товары не найдены',
        scope: 'Склад: Коледино',
        resetAction: <button type="button">Сбросить фильтры</button>,
      } as const,
      expected: 'Товары не найдены',
    },
    {
      state: {
        kind: 'error',
        message: 'Не удалось загрузить товары',
        recovery: <button type="button">Повторить</button>,
      } as const,
      expected: 'Не удалось загрузить товары',
    },
  ])(
    'does not announce populated feedback for terminal state $state.kind',
    ({ state, expected }) => {
      render(
        <VirtualizedTableFrame
          label="Виртуализированный список"
          contract={listContract}
          state={state}
          header={<div>Заголовок</div>}
          endReached
        />
      )

      expect(screen.getByText(expected)).toBeInTheDocument()
      expect(screen.queryByText('Показаны товары 1–20 из 1000')).not.toBeInTheDocument()
      expect(screen.queryByText('Конец списка товаров')).not.toBeInTheDocument()
    }
  )

  it('requires an outside header placement at type-check time', () => {
    if (false) {
      const invalid: VirtualizedTableContract = {
        narrowStrategy: { kind: 'specialized-virtualization' },
        collectionRole: 'list',
        itemRole: 'listitem',
        // @ts-expect-error - specialized virtualization keeps its persistent header outside
        headerPlacement: 'inside',
        positionFeedback: 'Позиция',
        endFeedback: 'Конец',
        ownership: {
          rowHeight: 'caller',
          viewportHeight: 'caller',
          overscan: 'caller',
          itemIdentity: 'caller',
          selection: 'caller',
          focus: 'caller',
        },
      }
      expect(invalid).toBeDefined()
    }
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderList()
    expect(await axe(container)).toHaveNoViolations()
  })
})
