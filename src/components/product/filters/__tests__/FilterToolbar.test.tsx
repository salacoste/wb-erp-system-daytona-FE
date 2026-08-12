import { createRef, useState } from 'react'

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FilterToolbar } from '../FilterToolbar'
import type { FilterToolbarState } from '../FilterToolbar.types'

expect.extend(toHaveNoViolations)

describe('FilterToolbar', () => {
  afterEach(() => vi.useRealTimers())

  if (false) {
    // @ts-expect-error - filtered-empty requires explicit zero-result evidence
    ;<FilterToolbar state="empty" primaryControls={null} appliedSummary="Категория" />
    // @ts-expect-error - applied scope requires a caller-owned reset action and visible scope
    ;<FilterToolbar state="applied" primaryControls={null} appliedSummary="Категория" />
    // @ts-expect-error - filtered-empty cannot carry a positive count
    ;<FilterToolbar
      state="empty"
      primaryControls={null}
      appliedSummary="Категория"
      resultCount={1}
      onReset={() => undefined}
      resetScope="Категория"
    />
    // @ts-expect-error - applied scope cannot use a non-rendering null value
    ;<FilterToolbar
      state="applied"
      primaryControls={null}
      appliedSummary={null}
      onReset={() => undefined}
      resetScope="Категория"
    />
    // @ts-expect-error - applied scope cannot use a non-rendering undefined value
    ;<FilterToolbar
      state="applied"
      primaryControls={null}
      appliedSummary={undefined}
      onReset={() => undefined}
      resetScope="Категория"
    />
    // @ts-expect-error - applied scope cannot use a non-rendering boolean value
    ;<FilterToolbar
      state="applied"
      primaryControls={null}
      appliedSummary={false}
      onReset={() => undefined}
      resetScope="Категория"
    />
  }

  const stateCases: Array<[FilterToolbarState, string]> = [
    ['default', 'Фильтры готовы'],
    ['applied', 'Фильтры применены'],
    ['dependency-loading', 'Загрузка зависимых фильтров'],
    ['updating', 'Результаты обновляются'],
    ['invalid', 'Комбинация фильтров недоступна'],
    ['empty', 'По выбранным фильтрам ничего не найдено'],
    ['disabled', 'Фильтры временно недоступны'],
  ]

  it.each(stateCases)('exposes %s as visible semantic text', (state, label) => {
    const stateProps =
      state === 'empty'
        ? ({ state, resultCount: 0, onReset: vi.fn(), resetScope: 'Категория' } as const)
        : state === 'applied'
          ? ({ state, onReset: vi.fn(), resetScope: 'Категория' } as const)
          : ({ state, resultCount: 125 } as const)

    render(
      <FilterToolbar
        {...stateProps}
        primaryControls={<button type="button">Категория: Все</button>}
        appliedSummary="Категория: Все"
      />
    )

    expect(screen.getByRole('region', { name: 'Фильтры данных' })).toHaveAttribute(
      'data-state',
      state
    )
    expect(screen.getByRole('status')).toHaveTextContent(label)
    expect(document.querySelector('[data-slot="filter-toolbar-applied"]')).toHaveTextContent(
      'Категория: Все'
    )
  })

  it('keeps applied scope, zero result count, and reset scope visible together', () => {
    render(
      <FilterToolbar
        state="empty"
        primaryControls={<button type="button">Период: 2026-W31</button>}
        appliedSummary="Период: 2026-W31; Статус: Требует внимания"
        resultCount={0}
        resultLabel="Найдено товаров"
        onReset={vi.fn()}
        resetLabel="Сбросить фильтры товаров"
        resetScope="Период, статус и поиск"
      />
    )

    expect(screen.getByText('Период: 2026-W31; Статус: Требует внимания')).toBeInTheDocument()
    expect(screen.getByText('Найдено товаров: 0')).toBeInTheDocument()
    expect(screen.getByText('Сбросит: Период, статус и поиск')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры товаров' })).toBeInTheDocument()
  })

  it('expands secondary controls without firing reset or applying filters', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <FilterToolbar
        primaryControls={<button type="button">Основной фильтр</button>}
        secondaryControls={<button type="button">Дополнительный фильтр</button>}
        onReset={onReset}
      />
    )

    const trigger = screen.getByRole('button', { name: 'Показать дополнительные фильтры' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Дополнительный фильтр' })).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Дополнительный фильтр' })).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })

  it('supports a controlled expanded state without owning caller filter state', async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()

    render(
      <FilterToolbar
        expanded={false}
        onExpandedChange={onExpandedChange}
        primaryControls={<button type="button">Основной фильтр</button>}
        secondaryControls={<button type="button">Дополнительный фильтр</button>}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Показать дополнительные фильтры' }))

    expect(onExpandedChange).toHaveBeenCalledTimes(1)
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('button', { name: 'Дополнительный фильтр' })).not.toBeInTheDocument()
  })

  it('calls reset once and moves focus to the caller-designated target', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onReset = vi.fn()
    const resetFocusRef = createRef<HTMLButtonElement>()

    render(
      <FilterToolbar
        primaryControls={
          <button ref={resetFocusRef} type="button">
            Поиск товаров
          </button>
        }
        appliedSummary="Поиск: зимняя куртка"
        onReset={onReset}
        resetScope="Поиск товаров"
        resetFocusRef={resetFocusRef}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    await act(() => vi.runOnlyPendingTimersAsync())

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Поиск товаров' })).toHaveFocus()
  })

  it('falls back to the toolbar when the requested reset target is disconnected', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const resetFocusRef = createRef<HTMLButtonElement>()
    const { rerender } = render(
      <FilterToolbar
        primaryControls={
          <button ref={resetFocusRef} type="button">
            Поиск товаров
          </button>
        }
        onReset={vi.fn()}
        resetFocusRef={resetFocusRef}
      />
    )
    const disconnected = resetFocusRef.current
    rerender(
      <FilterToolbar
        primaryControls={<span>Поиск удалён</span>}
        onReset={vi.fn()}
        resetFocusRef={{ current: disconnected }}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    await act(() => vi.runOnlyPendingTimersAsync())

    expect(screen.getByRole('region', { name: 'Фильтры данных' })).toHaveFocus()
  })

  it.each([
    ['disabled', { disabled: true }],
    ['hidden', { hidden: true }],
  ])('falls back when the caller target is connected but %s', async (_case, attributes) => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const resetFocusRef = createRef<HTMLButtonElement>()

    render(
      <FilterToolbar
        primaryControls={
          <button ref={resetFocusRef} type="button" {...attributes}>
            Поиск товаров
          </button>
        }
        onReset={vi.fn()}
        resetFocusRef={resetFocusRef}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    await act(() => vi.runOnlyPendingTimersAsync())

    expect(screen.getByRole('region', { name: 'Фильтры данных' })).toHaveFocus()
  })

  it('waits for the caller reset commit before choosing its focus destination', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const resetFocusRef = createRef<HTMLButtonElement>()
    const order: string[] = []

    function ResetHarness() {
      const [showTarget, setShowTarget] = useState(true)
      return (
        <FilterToolbar
          primaryControls={
            showTarget ? (
              <button ref={resetFocusRef} type="button">
                Поиск товаров
              </button>
            ) : (
              <span>Поиск очищен</span>
            )
          }
          onReset={() => {
            order.push('callback')
            setShowTarget(false)
          }}
          resetFocusRef={resetFocusRef}
        />
      )
    }

    render(<ResetHarness />)
    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))

    expect(order).toEqual(['callback'])
    expect(screen.queryByRole('button', { name: 'Поиск товаров' })).not.toBeInTheDocument()
    await act(() => vi.runOnlyPendingTimersAsync())
    expect(screen.getByRole('region', { name: 'Фильтры данных' })).toHaveFocus()
  })

  it('rejects a semantically empty applied scope at runtime', () => {
    expect(() =>
      render(
        <FilterToolbar
          state="applied"
          primaryControls={<button type="button">Категория</button>}
          appliedSummary="   "
          onReset={vi.fn()}
          resetScope="Категория"
        />
      )
    ).toThrow('FilterToolbar applied state requires a visible applied summary')
  })

  it('renders a visible toolbar title and suppresses invalid result counts', () => {
    render(
      <FilterToolbar
        label="Фильтры каталога"
        primaryControls={<button type="button">Категория</button>}
        resultCount={Number.NaN}
      />
    )

    expect(screen.getByRole('heading', { name: 'Фильтры каталога' })).toBeVisible()
    expect(document.querySelector('[data-slot="filter-toolbar-results"]')).toBeNull()
  })

  it('keeps current scope visible while dependencies load or results update', () => {
    const { rerender } = render(
      <FilterToolbar
        state="dependency-loading"
        primaryControls={<button type="button">Бренд: WB</button>}
        appliedSummary="Бренд: WB"
        resultCount={48}
      />
    )

    expect(document.querySelector('[data-slot="filter-toolbar-applied"]')).toHaveTextContent(
      'Бренд: WB'
    )
    expect(screen.getByText('Результатов: 48')).toBeInTheDocument()

    rerender(
      <FilterToolbar
        state="updating"
        primaryControls={<button type="button">Бренд: WB</button>}
        appliedSummary="Бренд: WB"
        resultCount={48}
      />
    )

    expect(document.querySelector('[data-slot="filter-toolbar-applied"]')).toHaveTextContent(
      'Бренд: WB'
    )
    expect(screen.getByText('Результатов: 48')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Фильтры данных' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('keeps long caller content block-safe and narrow actions reachable', () => {
    render(
      <FilterToolbar
        className="story-filter-toolbar"
        primaryControls={
          <div data-testid="long-primary-control">
            Очень длинное название категории товаров для проверки узкой компоновки
          </div>
        }
        appliedSummary={
          <div data-testid="long-applied-summary">
            Применён очень длинный перечень фильтров, который должен переноситься целиком
          </div>
        }
        resultCount={1234567}
        onReset={vi.fn()}
        resetScope="Все видимые параметры длинного аналитического запроса"
      />
    )

    const toolbar = screen.getByRole('region', { name: 'Фильтры данных' })
    expect(toolbar).toHaveClass('story-filter-toolbar')
    expect(screen.getByTestId('long-primary-control')).toBeInTheDocument()
    expect(screen.getByTestId('long-applied-summary')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toHaveClass(
      'whitespace-normal',
      'break-words'
    )
  })

  it('does not render an unexplained reset action without a visible reset scope', () => {
    render(
      <FilterToolbar
        primaryControls={<button type="button">Основной фильтр</button>}
        onReset={vi.fn()}
      />
    )

    expect(screen.getByText('Сбросит: Все применённые фильтры')).toBeInTheDocument()
  })

  it('has no automated accessibility violations in the complete applied state', async () => {
    const { container } = render(
      <FilterToolbar
        state="applied"
        primaryControls={<button type="button">Категория: Все</button>}
        secondaryControls={<button type="button">Статус: Активен</button>}
        appliedSummary="Категория: Все; Статус: Активен"
        resultCount={42}
        onReset={vi.fn()}
        resetScope="Категория и статус"
      />
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
