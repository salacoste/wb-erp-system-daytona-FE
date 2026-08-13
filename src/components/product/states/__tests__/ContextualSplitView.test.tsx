import { createRef } from 'react'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ContextualSplitView } from '../ContextualSplitView'

expect.extend(toHaveNoViolations)

const inactiveFocus = {
  selectionKey: 'fixture',
  detailTargetRef: createRef<HTMLElement>(),
  returnTargetRef: createRef<HTMLElement>(),
}

function ListPane({ selectedItemRef = createRef<HTMLButtonElement>() }) {
  return (
    <div>
      <label htmlFor="contextual-search">Поиск</label>
      <input id="contextual-search" aria-label="Поиск" defaultValue="SKU" />
      <button ref={selectedItemRef} type="button">
        SKU-42
      </button>
    </div>
  )
}

describe('ContextualSplitView', () => {
  it('renders one named list/detail DOM and deliberate responsive projections', () => {
    render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane />}
        detailState="selected"
        detail={<h2>Товар SKU-42</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={inactiveFocus}
        onClose={() => undefined}
      />
    )

    expect(screen.getByRole('region', { name: 'Очередь товаров' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Карточка товара' })).toBeInTheDocument()
    expect(screen.getByTestId('contextual-split')).toHaveClass(
      'grid',
      'md:grid-cols-[minmax(16rem,2fr)_minmax(20rem,3fr)]'
    )
    expect(screen.getByTestId('contextual-list-pane')).toHaveClass('hidden', 'md:block')
    expect(screen.getByTestId('contextual-detail-pane')).not.toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'Вернуться к очереди товаров' })).toBeInTheDocument()
  })

  it('renders no-selection and detail-error states without interpreting domain data', () => {
    const { rerender } = render(
      <ContextualSplitView
        listLabel="Поставки"
        detailLabel="Детали поставки"
        list={<ListPane />}
        detailState="no-selection"
        stateMessage="Выберите поставку, чтобы открыть детали."
      />
    )
    expect(screen.getByText('Выберите поставку, чтобы открыть детали.')).toBeInTheDocument()
    expect(screen.getByTestId('contextual-list-pane')).not.toHaveClass('hidden')
    expect(screen.getByTestId('contextual-detail-pane')).toHaveClass('hidden', 'md:block')

    rerender(
      <ContextualSplitView
        listLabel="Поставки"
        detailLabel="Детали поставки"
        list={<ListPane />}
        detailState="detail-error"
        stateMessage="Не удалось загрузить выбранную поставку."
        recovery={<button type="button">Повторить загрузку поставки</button>}
        narrowBackLabel="Вернуться к поставкам"
        focus={inactiveFocus}
        onClose={() => undefined}
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить загрузку поставки' })).toBeInTheDocument()
  })

  it('requires detail and mobile back actions for selected/error detail states', () => {
    if (false) {
      // @ts-expect-error - selected detail requires rendered detail, narrow back label, and close
      ;<ContextualSplitView
        listLabel="Список"
        detailLabel="Детали"
        list={<ListPane />}
        detailState="selected"
      />

      // @ts-expect-error - detail error requires recovery, narrow back label, and close
      ;<ContextualSplitView
        listLabel="Список"
        detailLabel="Детали"
        list={<ListPane />}
        detailState="detail-error"
        stateMessage="Ошибка"
      />

      ;<ContextualSplitView
        listLabel="Список"
        detailLabel="Детали"
        list={<ListPane />}
        detailState="detail-error"
        stateMessage="Ошибка"
        // @ts-expect-error - recovery evidence must be a rendered action element
        recovery="Повторить загрузку"
        narrowBackLabel="Вернуться к списку"
        focus={inactiveFocus}
        onClose={() => undefined}
      />

      ;<ContextualSplitView
        listLabel="Список"
        detailLabel="Детали"
        list={<ListPane />}
        detailState="stale-detail"
        stateMessage="Детали могли измениться."
        detail={<h2>SKU-42</h2>}
        // @ts-expect-error - retained recovery must be a rendered action element
        recovery="Обновить детали"
        narrowBackLabel="Вернуться к списку"
        focus={inactiveFocus}
        onClose={() => undefined}
      />
    }
    expect(true).toBe(true)
  })

  it('rejects non-rendered contextual recovery at runtime', () => {
    expect(() =>
      render(
        <ContextualSplitView
          listLabel="Список"
          detailLabel="Детали"
          list={<ListPane />}
          detailState="detail-error"
          stateMessage="Ошибка"
          recovery={'Повторить загрузку' as never}
          narrowBackLabel="Вернуться к списку"
          focus={inactiveFocus}
          onClose={() => undefined}
        />
      )
    ).toThrow(/recovery must be a rendered action element/i)
  })

  it('retries close focus restoration until caller exposes a connected return target', async () => {
    const user = userEvent.setup()
    const frameCallbacks: FrameRequestCallback[] = []
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    })
    const detailHeadingRef = createRef<HTMLHeadingElement>()
    const returnTargetRef = createRef<HTMLButtonElement>()
    const deferredTarget = document.createElement('button')
    deferredTarget.type = 'button'
    deferredTarget.textContent = 'SKU-42'

    render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane />}
        detailState="selected"
        detail={<h2 ref={detailHeadingRef}>Товар SKU-42</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{ selectionKey: 'SKU-42', detailTargetRef: detailHeadingRef, returnTargetRef }}
        onClose={() => undefined}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Вернуться к очереди товаров' }))
    expect(frameCallbacks).toHaveLength(1)
    frameCallbacks.shift()?.(0)
    expect(frameCallbacks).toHaveLength(1)

    document.body.append(deferredTarget)
    returnTargetRef.current = deferredTarget
    frameCallbacks.shift()?.(16)
    expect(deferredTarget).toHaveFocus()

    deferredTarget.remove()
    requestFrame.mockRestore()
  })

  it('focuses deliberate detail selection and restores focus after caller-owned close', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const detailHeadingRef = createRef<HTMLHeadingElement>()
    const selectedItemRef = createRef<HTMLButtonElement>()

    const { rerender } = render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="no-selection"
        stateMessage="Выберите товар."
      />
    )
    selectedItemRef.current?.focus()

    rerender(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="selected"
        detail={<h2 ref={detailHeadingRef}>Товар SKU-42</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-42',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: selectedItemRef,
        }}
        onClose={onClose}
      />
    )

    expect(detailHeadingRef.current).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Вернуться к очереди товаров' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(selectedItemRef.current).toHaveFocus())
    expect(selectedItemRef.current).not.toHaveAttribute('tabindex', '-1')
    await user.tab()
    expect(selectedItemRef.current).not.toHaveFocus()
  })

  it('owns a native narrow back button with Enter and Space activation', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <ContextualSplitView
        listLabel="Поставки"
        detailLabel="Детали поставки"
        list={<ListPane />}
        detailState="selected"
        detail={<h2>Поставка SKU-42</h2>}
        narrowBackLabel="Вернуться к поставкам"
        focus={inactiveFocus}
        onClose={onClose}
      />
    )

    const backButton = screen.getByRole('button', { name: 'Вернуться к поставкам' })
    backButton.focus()
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledTimes(1)

    backButton.focus()
    await user.keyboard(' ')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('focuses a new deliberate selection with the same detail state and stable refs', () => {
    const detailHeadingRef = createRef<HTMLHeadingElement>()
    const selectedItemRef = createRef<HTMLButtonElement>()

    const { rerender } = render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="selected"
        detail={<h2 ref={detailHeadingRef}>Товар SKU-42</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-42',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: selectedItemRef,
        }}
        onClose={() => undefined}
      />
    )
    expect(detailHeadingRef.current).toHaveFocus()
    expect(detailHeadingRef.current).toHaveAttribute('tabindex', '-1')
    detailHeadingRef.current?.blur()
    expect(detailHeadingRef.current).not.toHaveAttribute('tabindex')

    selectedItemRef.current?.focus()
    rerender(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="selected"
        detail={<h2 ref={detailHeadingRef}>Товар SKU-99</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-99',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: selectedItemRef,
        }}
        onClose={() => undefined}
      />
    )

    expect(detailHeadingRef.current).toHaveFocus()
  })

  it('preserves a caller-owned tabindex change when temporary focus cleanup runs', () => {
    const detailHeadingRef = createRef<HTMLHeadingElement>()

    render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane />}
        detailState="selected"
        detail={<h2 ref={detailHeadingRef}>Товар SKU-42</h2>}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-42',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: createRef<HTMLButtonElement>(),
        }}
        onClose={() => undefined}
      />
    )

    expect(detailHeadingRef.current).toHaveAttribute('tabindex', '-1')
    detailHeadingRef.current?.setAttribute('tabindex', '0')
    detailHeadingRef.current?.blur()
    expect(detailHeadingRef.current).toHaveAttribute('tabindex', '0')
  })

  it('does not steal focus when presentation state changes for the same selection', () => {
    const detailHeadingRef = createRef<HTMLHeadingElement>()
    const selectedItemRef = createRef<HTMLButtonElement>()
    const detail = (
      <div>
        <h2 ref={detailHeadingRef}>Товар SKU-42</h2>
        <button type="button">Действие с товаром</button>
      </div>
    )

    const { rerender } = render(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="selected"
        detail={detail}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-42',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: selectedItemRef,
        }}
        onClose={() => undefined}
      />
    )
    const detailAction = screen.getByRole('button', { name: 'Действие с товаром' })
    detailAction.focus()

    rerender(
      <ContextualSplitView
        listLabel="Очередь товаров"
        detailLabel="Карточка товара"
        list={<ListPane selectedItemRef={selectedItemRef} />}
        detailState="stale-detail"
        stateMessage="Карточка могла измениться."
        detail={detail}
        narrowBackLabel="Вернуться к очереди товаров"
        focus={{
          selectionKey: 'SKU-42',
          detailTargetRef: detailHeadingRef,
          returnTargetRef: selectedItemRef,
        }}
        onClose={() => undefined}
      />
    )

    expect(screen.getByRole('button', { name: 'Действие с товаром' })).toHaveFocus()
  })

  it('sizes native, link, and approved role-button actions for touch and keyboard use', () => {
    const { container } = render(
      <ContextualSplitView
        listLabel="Поставки"
        detailLabel="Детали поставки"
        list={<ListPane />}
        detailState="detail-error"
        stateMessage="Не удалось загрузить выбранную поставку."
        recovery={<a href="/">Вернуться на главную</a>}
        narrowBackLabel="Вернуться к поставкам"
        focus={inactiveFocus}
        onClose={() => undefined}
      />
    )

    const slots = container.querySelectorAll('[data-slot="state-actions"]')
    expect(slots).toHaveLength(2)
    for (const slot of slots) {
      expect(slot).toHaveClass(
        '[&_a]:min-h-11',
        '[&_a]:min-w-11',
        '[&_button]:min-h-11',
        '[&_[role=button]]:min-h-11',
        '[&_[role=button]]:min-w-11'
      )
    }
  })

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <ContextualSplitView
        listLabel="Диалоги"
        detailLabel="Сообщения диалога"
        list={<ListPane />}
        detailState="stale-detail"
        stateMessage="Детали могли измениться после последнего обновления."
        detail={<h2>Диалог с покупателем</h2>}
        narrowBackLabel="Вернуться к диалогам"
        focus={inactiveFocus}
        onClose={() => undefined}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
