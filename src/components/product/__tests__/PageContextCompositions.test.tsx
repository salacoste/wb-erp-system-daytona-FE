import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ContextBar, type ContextBarState } from '../ContextBar'
import { Breadcrumbs, PageHeader } from '../PageHeader'

expect.extend(toHaveNoViolations)

describe('PageHeader', () => {
  it('keeps one logical h1 and exposes useful breadcrumb semantics', () => {
    render(
      <PageHeader
        title="Очень длинный заголовок страницы"
        description="Описание бизнес-контекста"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Аналитика', href: '/analytics' },
          { label: 'Текущий отчёт' },
        ]}
        actions={<button type="button">Создать</button>}
      />
    )

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Очень длинный заголовок')
    expect(screen.getByRole('navigation', { name: 'Навигация по странице' })).toBeInTheDocument()
    expect(screen.getByText('Текущий отчёт')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Создать' })).toBeInTheDocument()
  })

  it('exposes exactly one caller-selected current breadcrumb', () => {
    render(
      <Breadcrumbs
        currentIndex={1}
        items={[
          { label: 'Аналитика', href: '/analytics' },
          { label: 'Текущий раздел' },
          { label: 'Контекст без ссылки' },
        ]}
      />
    )

    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(screen.getByText('Текущий раздел')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Контекст без ссылки')).not.toHaveAttribute('aria-current')
  })

  it('falls back to the final breadcrumb and a useful landmark name', () => {
    render(
      <Breadcrumbs
        ariaLabel="   "
        currentIndex={99}
        items={[{ label: 'Первый', href: '/' }, { label: 'Последний' }]}
      />
    )

    expect(screen.getByRole('navigation', { name: 'Навигация по странице' })).toBeInTheDocument()
    expect(screen.getByText('Последний')).toHaveAttribute('aria-current', 'page')
  })

  it.each([0.5, -0.5])('treats fractional current index %s as invalid', currentIndex => {
    render(
      <Breadcrumbs
        currentIndex={currentIndex}
        items={[{ label: 'Первый', href: '/' }, { label: 'Последний' }]}
      />
    )

    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(screen.getByText('Последний')).toHaveAttribute('aria-current', 'page')
  })

  it('rejects empty breadcrumb labels', () => {
    expect(() =>
      render(<Breadcrumbs items={[{ label: '   ', href: '/' }, { label: 'Текущая' }]} />)
    ).toThrow('Breadcrumb item labels must be non-empty')
  })

  it('announces metadata refresh without replacing route identity', () => {
    render(
      <PageHeader
        title="Отчёт"
        busy
        compact
        status="Обновление контекста"
        className="story-header"
      />
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Отчёт')
    expect(document.querySelector('[data-slot="page-header-identity"]')).toHaveAttribute(
      'aria-busy',
      'true'
    )
    expect(screen.getByRole('banner')).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('banner')).toHaveAttribute('data-compact', 'true')
    expect(screen.getByRole('banner')).toHaveClass('story-header')
    expect(screen.getByRole('status')).toHaveTextContent('Обновление контекста')
  })

  it('preserves caller action order and visible keyboard focus styling', () => {
    render(
      <PageHeader
        title="Управление данными"
        breadcrumbs={[{ label: 'Главная', href: '/' }, { label: 'Управление данными' }]}
        actions={
          <>
            <button type="button">Основное действие</button>
            <button type="button">Вторичное действие</button>
          </>
        }
      />
    )

    const actions = document.querySelector('[data-slot="page-header-actions"]')
    expect(actions).not.toBeNull()
    if (!actions) throw new Error('PageHeader actions slot was not rendered')
    const buttons = actions.querySelectorAll('button')
    expect(buttons[0]).toHaveTextContent('Основное действие')
    expect(buttons[1]).toHaveTextContent('Вторичное действие')
    expect(screen.getByRole('link', { name: 'Главная' })).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-background'
    )
    expect(actions).toHaveClass('[&_button]:whitespace-normal', '[&_button]:break-words')
  })
})

describe('ContextBar', () => {
  const stateCases: Array<[ContextBarState, string]> = [
    ['default', 'Контекст по умолчанию'],
    ['fresh', 'Данные актуальны'],
    ['refreshing', 'Обновление данных'],
    ['stale', 'Данные требуют обновления'],
    ['partial', 'Данные неполные'],
    ['unavailable', 'Данные недоступны'],
    ['restricted', 'Доступ ограничен'],
    ['overridden', 'Контекст переопределён'],
  ]

  it.each(stateCases)('exposes the %s state as visible semantic text', (state, label) => {
    render(<ContextBar state={state} cabinet="Основной кабинет" />)

    expect(screen.getByRole('region', { name: 'Контекст страницы' })).toHaveAttribute(
      'data-state',
      state
    )
    expect(screen.getByRole('status')).toHaveTextContent(label)
  })

  it('makes the implicit default state explicit', () => {
    render(<ContextBar cabinet="Основной кабинет" />)

    expect(screen.getByRole('status')).toHaveTextContent('Контекст по умолчанию')
  })

  it('keeps definition-list semantics valid while announcing state changes', async () => {
    const { container } = render(<ContextBar cabinet="Основной кабинет" state="fresh" />)

    expect(screen.getByRole('status')).toHaveTextContent('Данные актуальны')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders explicit scope values and route-owned refresh/reset callbacks', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    const onReset = vi.fn()

    render(
      <ContextBar
        cabinet="Кабинет продавца"
        period="1–7 августа 2026"
        comparison="Предыдущая неделя"
        freshness="Сегодня, 12:40"
        state="fresh"
        onRefresh={onRefresh}
        onReset={onReset}
      />
    )

    expect(screen.getByRole('region', { name: 'Контекст страницы' })).toHaveAttribute(
      'data-state',
      'fresh'
    )
    expect(screen.getByText('Кабинет продавца')).toBeInTheDocument()
    expect(screen.getByText('1–7 августа 2026')).toBeInTheDocument()
    expect(screen.getByText('Данные актуальны')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Обновить данные' }))
    await user.click(screen.getByRole('button', { name: 'Сбросить контекст' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('keeps refresh state visible and keyboard-operable without moving focus', () => {
    const onRefresh = vi.fn()
    const { rerender } = render(
      <ContextBar
        items={[{ id: 'filter', label: 'Фильтр', value: 'Товары с продажами' }]}
        onRefresh={onRefresh}
      />
    )

    const idleRefresh = screen.getByRole('button', { name: 'Обновить данные' })
    idleRefresh.focus()
    expect(idleRefresh).toHaveFocus()

    rerender(
      <ContextBar
        items={[{ id: 'filter', label: 'Фильтр', value: 'Товары с продажами' }]}
        state="refreshing"
        isRefreshing
        onRefresh={onRefresh}
      />
    )

    const refresh = screen.getByRole('button', { name: 'Обновить данные — выполняется' })
    expect(refresh).not.toBeDisabled()
    expect(refresh).toHaveAttribute('aria-disabled', 'true')
    expect(refresh).toHaveAttribute('aria-busy', 'true')
    expect(refresh).toHaveFocus()
    expect(screen.getByText('Товары с продажами')).toBeInTheDocument()
    expect(screen.getByText('Обновление данных')).toBeInTheDocument()
    refresh.click()
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('normalizes refresh state and non-empty control labels from one effective state', () => {
    render(
      <ContextBar
        state="fresh"
        isRefreshing
        stateLabel="   "
        refreshLabel=" "
        resetLabel=" "
        onRefresh={vi.fn()}
        onReset={vi.fn()}
      />
    )

    const region = screen.getByRole('region', { name: 'Контекст страницы' })
    expect(region).toHaveAttribute('data-state', 'refreshing')
    expect(screen.getByRole('status')).toHaveTextContent('Обновление данных')
    expect(screen.getByRole('button', { name: 'Обновить данные — выполняется' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Сбросить контекст' })).toBeInTheDocument()
  })

  it('does not preserve a contradictory custom label during a refresh override', () => {
    render(
      <ContextBar state="fresh" stateLabel="Данные актуальны" isRefreshing onRefresh={vi.fn()} />
    )

    expect(screen.getByRole('region', { name: 'Контекст страницы' })).toHaveAttribute(
      'data-state',
      'refreshing'
    )
    expect(screen.getByRole('status')).toHaveTextContent('Обновление данных')
    expect(screen.getByRole('status')).not.toHaveTextContent('Данные актуальны')
  })

  it('requires unique stable generic item ids', () => {
    expect(() =>
      render(
        <ContextBar
          items={[
            { id: 'duplicate', label: 'Первый', value: 'Один' },
            { id: 'duplicate', label: 'Второй', value: 'Два' },
          ]}
        />
      )
    ).toThrow('ContextBar item ids must be unique')
  })

  it('falls back from empty common labels and rejects empty generic labels or values', () => {
    const { rerender } = render(<ContextBar cabinet="Основной кабинет" cabinetLabel="   " />)

    expect(screen.getByText('Кабинет')).toBeInTheDocument()

    expect(() =>
      rerender(<ContextBar items={[{ id: 'scope', label: '   ', value: 'Все позиции' }]} />)
    ).toThrow('ContextBar item labels must be non-empty')

    expect(() =>
      rerender(<ContextBar items={[{ id: 'scope', label: 'Область', value: '' }]} />)
    ).toThrow('ContextBar item values must be non-empty')
  })

  it('renders every common labeled value and a caller-provided state label', () => {
    render(
      <ContextBar
        cabinet="Основной кабинет"
        period="1–7 августа"
        comparison="Предыдущая неделя"
        freshness="Сегодня, 12:40"
        completeness="98%"
        scope="Все товары"
        state="partial"
        stateLabel="Часть данных ещё загружается"
        className="story-context"
      />
    )

    const region = screen.getByRole('region', { name: 'Контекст страницы' })
    expect(region).toHaveClass('story-context')
    expect(screen.getByText('Основной кабинет')).toBeInTheDocument()
    expect(screen.getByText('1–7 августа')).toBeInTheDocument()
    expect(screen.getByText('Предыдущая неделя')).toBeInTheDocument()
    expect(screen.getByText('Сегодня, 12:40')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
    expect(screen.getByText('Все товары')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Часть данных ещё загружается')
  })

  it('keeps caller-owned contextual controls outside the definition list', () => {
    render(
      <ContextBar cabinet="Основной кабинет">
        <button type="button">Выбрать дополнительный срез</button>
      </ContextBar>
    )

    const region = screen.getByRole('region', { name: 'Контекст страницы' })
    const definitions = region.querySelector('dl')
    const control = screen.getByRole('button', { name: 'Выбрать дополнительный срез' })

    expect(definitions).not.toContainElement(control)
  })
})
