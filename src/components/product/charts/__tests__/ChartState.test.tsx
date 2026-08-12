import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ChartActivityStatus, ChartState } from '../ChartState'

expect.extend(toHaveNoViolations)

describe('ChartState', () => {
  it.each([
    ['loading', 'Загрузка графика'],
    ['empty', 'За выбранный период значений нет'],
    ['unavailable', 'Источник данных временно недоступен'],
  ] as const)('distinguishes terminal %s meaning', (kind, message) => {
    render(<ChartState state={{ kind, message }} />)

    expect(screen.getByRole('status')).toHaveAttribute('data-state', kind)
    expect(screen.getByRole('status')).toHaveTextContent(message)
  })

  it('renders error recovery supplied by the caller', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <ChartState
        state={{
          kind: 'error',
          message: 'Не удалось получить значения',
          recovery: (
            <button type="button" onClick={onRetry}>
              Повторить получение графика
            </button>
          ),
        }}
      />
    )

    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'error')
    await user.click(screen.getByRole('button', { name: 'Повторить получение графика' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('gives an approved inline recovery role-button an effective target and keyboard behavior', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <ChartState
        state={{
          kind: 'error',
          message: 'Не удалось получить значения',
          recovery: (
            <span
              role="button"
              tabIndex={0}
              onKeyDown={event => event.key === 'Enter' && onRetry()}
            >
              Повторить получение значений
            </span>
          ),
        }}
      />
    )

    const action = screen.getByRole('button', { name: 'Повторить получение значений' })
    expect(action.parentElement).toHaveClass(
      '[&_[role=button]]:inline-flex',
      '[&_[role=button]]:min-h-11',
      '[&_[role=button]]:min-w-11',
      '[&_[role=button]]:items-center',
      '[&_[role=button]]:justify-center'
    )
    await user.tab()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['partial', 'Не получены две категории'],
    ['stale', 'Последнее успешное обновление — 10 августа'],
  ] as const)('names retained %s limitations', (kind, message) => {
    render(<ChartState state={{ kind, message }} />)

    expect(screen.getByRole('status')).toHaveAttribute('data-state', kind)
    expect(screen.getByRole('status')).toHaveTextContent(message)
  })

  it('keeps background updating on a separate activity axis', () => {
    render(<ChartActivityStatus activity={{ kind: 'updating', message: 'Обновляем график' }} />)

    expect(screen.getByRole('status', { name: 'Обновляем график' })).toHaveAttribute(
      'data-activity',
      'updating'
    )
  })

  it('has no detectable accessibility violations for error and updating statuses', async () => {
    const { container } = render(
      <>
        <ChartState
          state={{
            kind: 'error',
            message: 'Ошибка графика',
            recovery: <button type="button">Повторить</button>,
          }}
        />
        <ChartActivityStatus activity={{ kind: 'updating', message: 'Обновляем данные' }} />
      </>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
