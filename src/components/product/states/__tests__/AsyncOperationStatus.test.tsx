import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { AsyncOperationStatus } from '../AsyncOperationStatus'

expect.extend(toHaveNoViolations)

describe('AsyncOperationStatus', () => {
  it('renders exact scope, cancellability, safe-leave guidance, and truthful progress', () => {
    render(
      <AsyncOperationStatus
        operation="Перерасчёт себестоимости"
        scope="24 выбранных товара в кабинете Север"
        phase="cancellable"
        message="Проверяем исходные значения."
        progress={{ value: 0, label: 'Обработано 0 из 24 товаров' }}
        cancellability={{
          kind: 'cancellable',
          action: <button type="button">Отменить перерасчёт</button>,
        }}
        safeLeave="Можно закрыть страницу: операция продолжится в фоне."
      />
    )

    const region = screen.getByRole('region', { name: 'Перерасчёт себестоимости' })
    expect(region).toHaveAttribute('data-phase', 'cancellable')
    expect(region).toHaveTextContent('24 выбранных товара в кабинете Север')
    expect(region).toHaveTextContent('Можно закрыть страницу')
    expect(screen.getByRole('progressbar', { name: 'Обработано 0 из 24 товаров' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
    expect(screen.getByRole('button', { name: 'Отменить перерасчёт' })).toBeInTheDocument()
  })

  it('does not fabricate a percentage for indeterminate queued work', () => {
    render(
      <AsyncOperationStatus
        operation="Экспорт отчёта"
        scope="Все отфильтрованные строки"
        phase="queued"
        message="Операция поставлена в очередь."
        cancellability={{
          kind: 'non-cancellable',
          reason: 'Экспорт уже зафиксирован в очереди и пока не может быть отменён.',
        }}
        safeLeave="Можно безопасно перейти к другим задачам."
      />
    )

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Экспорт отчёта' })).toHaveTextContent(
      'Операция поставлена в очередь'
    )
  })

  it('keeps progress and actions outside the concise live transition message', () => {
    render(
      <AsyncOperationStatus
        operation="Экспорт"
        scope="Один отчёт"
        phase="running"
        message="Формируем файл."
        progress={{ value: 50, label: 'Выполнено 50 процентов' }}
        cancellability={{ kind: 'non-cancellable', reason: 'Файл уже формируется.' }}
        safeLeave="Можно вернуться позже."
        action={<button type="button">Открыть журнал</button>}
      />
    )

    const liveStatus = screen.getByRole('status')
    expect(liveStatus).toHaveTextContent('Экспорт: Выполняется')
    expect(liveStatus).not.toHaveTextContent('Выполнено 50 процентов')
    expect(liveStatus).not.toHaveTextContent('Открыть журнал')
    expect(screen.getByRole('region', { name: 'Экспорт' })).toContainElement(
      screen.getByRole('progressbar')
    )
  })

  it('rejects non-finite and out-of-range progress', () => {
    const renderProgress = (value: number) =>
      render(
        <AsyncOperationStatus
          operation="Экспорт"
          scope="Один отчёт"
          phase="running"
          message="Формируем файл."
          progress={{ value, label: 'Ход операции' }}
          cancellability={{ kind: 'non-cancellable', reason: 'Экспорт уже выполняется.' }}
          safeLeave="Можно вернуться позже."
        />
      )

    expect(() => renderProgress(-1)).toThrow(/finite percentage from 0 to 100/i)
    expect(() => renderProgress(101)).toThrow(/finite percentage from 0 to 100/i)
    expect(() => renderProgress(Number.NaN)).toThrow(/finite percentage from 0 to 100/i)
    expect(() => renderProgress(Number.POSITIVE_INFINITY)).toThrow(
      /finite percentage from 0 to 100/i
    )
  })

  it('requires explicit cancel evidence and non-cancellable reasoning', () => {
    if (false) {
      // @ts-expect-error - cancellable phase requires a cancel action
      ;<AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="cancellable"
        message="Запущено."
        cancellability={{ kind: 'non-cancellable', reason: 'Поздно отменять.' }}
        safeLeave="Можно закрыть страницу."
      />

      ;<AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="idle"
        message="Ожидает запуска."
        cancellability={{ kind: 'not-applicable' }}
        safeLeave="Можно закрыть страницу."
        // @ts-expect-error - optional follow-up actions must be rendered elements
        action="Открыть журнал"
      />

      // @ts-expect-error - non-cancellable phase must state why cancellation is unavailable
      ;<AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="non-cancellable"
        message="Применяем изменения."
        cancellability={{ kind: 'cancellable', action: <button>Отмена</button> }}
        safeLeave="Не закрывайте страницу."
      />

      // @ts-expect-error - active phases cannot hide cancellability as not applicable
      ;<AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="running"
        message="Запущено."
        cancellability={{ kind: 'not-applicable' }}
        safeLeave="Можно закрыть страницу."
      />

      ;<AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="running"
        message="Запущено."
        cancellability={{
          kind: 'cancellable',
          // @ts-expect-error - cancellation evidence must be a rendered action element
          action: 'Отменить синхронизацию',
        }}
        safeLeave="Можно закрыть страницу."
      />
    }

    expect(true).toBe(true)
  })

  it('rejects hidden or non-rendered cancellation evidence at runtime', () => {
    for (const phase of ['validating', 'queued', 'running', 'retrying'] as const) {
      expect(() =>
        render(
          <AsyncOperationStatus
            operation="Синхронизация"
            scope="Один кабинет"
            phase={phase}
            message="Запущено."
            cancellability={{ kind: 'not-applicable' } as never}
            safeLeave="Можно закрыть страницу."
          />
        )
      ).toThrow(/active operation phases require explicit cancellability evidence/i)
    }

    expect(() =>
      render(
        <AsyncOperationStatus
          operation="Синхронизация"
          scope="Один кабинет"
          phase="running"
          message="Запущено."
          cancellability={{ kind: 'cancellable', action: 'Отменить' } as never}
          safeLeave="Можно закрыть страницу."
        />
      )
    ).toThrow(/cancellation action must be a rendered element/i)

    expect(() =>
      render(
        <AsyncOperationStatus
          operation="Синхронизация"
          scope="Один кабинет"
          phase="idle"
          message="Ожидает запуска."
          cancellability={{ kind: 'not-applicable' }}
          safeLeave="Можно закрыть страницу."
          action={'Открыть журнал' as never}
        />
      )
    ).toThrow(/operation action must be a rendered element/i)
  })

  it('preserves not-applicable cancellability for passive lifecycle phases', () => {
    render(
      <AsyncOperationStatus
        operation="Синхронизация"
        scope="Один кабинет"
        phase="idle"
        message="Операция ещё не запущена."
        cancellability={{ kind: 'not-applicable' }}
        safeLeave="Можно перейти к другой задаче."
      />
    )

    expect(screen.getByRole('region', { name: 'Синхронизация' })).toHaveAttribute(
      'data-phase',
      'idle'
    )
  })

  it('keeps focus stable when progress changes and preserves caller actions', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const props = {
      operation: 'Синхронизация остатков',
      scope: '120 складских позиций',
      phase: 'running' as const,
      message: 'Получаем изменения.',
      cancellability: { kind: 'non-cancellable' as const, reason: 'Синхронизация уже запущена.' },
      safeLeave: 'Можно оставить страницу открытой или вернуться позже.',
      action: <button onClick={onOpen}>Открыть журнал синхронизации</button>,
    }
    const { rerender } = render(
      <AsyncOperationStatus {...props} progress={{ value: 25, label: 'Выполнено 25 процентов' }} />
    )
    const action = screen.getByRole('button', { name: 'Открыть журнал синхронизации' })
    action.focus()

    rerender(
      <AsyncOperationStatus {...props} progress={{ value: 50, label: 'Выполнено 50 процентов' }} />
    )

    expect(action).toHaveFocus()
    await user.click(action)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <AsyncOperationStatus
        operation="Повторная обработка ошибок"
        scope="3 неуспешных товара"
        phase="non-cancellable"
        message="Повтор уже выполняется для неуспешных элементов."
        cancellability={{ kind: 'non-cancellable', reason: 'Повтор уже передан исполнителю.' }}
        safeLeave="Результат останется доступен после завершения."
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
