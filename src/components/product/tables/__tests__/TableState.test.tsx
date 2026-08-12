import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { TableState } from '../TableState'
import type { RetainedTableStateKind, TerminalTableStateKind } from '../contracts'

expect.extend(toHaveNoViolations)

describe('TableState', () => {
  const terminalCases: Array<[Exclude<TerminalTableStateKind, 'filtered-empty'>, string]> = [
    ['loading', 'Загрузка товаров'],
    ['empty', 'Товаров пока нет'],
  ]

  it.each(terminalCases)('exposes %s as visible semantic status', (state, message) => {
    render(<TableState state={state} message={message} />)

    expect(screen.getByRole('status')).toHaveAttribute('data-state', state)
    expect(screen.getByRole('status')).toHaveTextContent(message)
  })

  it('distinguishes filtered-empty from globally empty results', () => {
    render(
      <TableState
        state="filtered-empty"
        message="По выбранным фильтрам товары не найдены"
        scope="Период: 2026-W31; склад: Коледино"
        resetAction={<button type="button">Сбросить фильтры товаров</button>}
      />
    )

    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'filtered-empty')
    expect(screen.getByText('Период: 2026-W31; склад: Коледино')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры товаров' })).toBeInTheDocument()
    expect(screen.queryByText('Товаров пока нет')).not.toBeInTheDocument()
  })

  it('requires filtered scope and caller-owned reset content at compile time', () => {
    if (false) {
      // @ts-expect-error - filtered-empty must disclose scope and provide reset content
      ;<TableState state="filtered-empty" message="Ничего не найдено" />
    }

    expect(true).toBe(true)
  })

  it('requires caller-owned error recovery at compile time', () => {
    if (false) {
      // @ts-expect-error - recoverable errors must expose caller-owned recovery content
      ;<TableState state="error" message="Не удалось загрузить" />
    }

    expect(true).toBe(true)
  })

  it('renders recoverable errors as alerts with caller-owned recovery content', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <TableState
        state="error"
        message="Не удалось загрузить товары"
        recovery={
          <button type="button" onClick={onRetry}>
            Повторить загрузку товаров
          </button>
        }
      />
    )

    expect(screen.getByRole('alert')).toHaveAttribute('data-state', 'error')
    await user.click(screen.getByRole('button', { name: 'Повторить загрузку товаров' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it.each<Exclude<RetainedTableStateKind, 'partial'>>(['stale', 'updating'])(
    'retains caller-rendered usable data while %s',
    state => {
      render(
        <TableState state={state} message={`Состояние: ${state}`}>
          <table>
            <caption>Доступные товары</caption>
            <tbody>
              <tr>
                <th scope="row">Артикул WB-001</th>
                <td>1 250 ₽</td>
              </tr>
            </tbody>
          </table>
        </TableState>
      )

      expect(screen.getByRole('status')).toHaveAttribute('data-state', state)
      expect(screen.getByRole('table', { name: 'Доступные товары' })).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: 'Артикул WB-001' })).toBeInTheDocument()
    }
  )

  it('retains trustworthy rows and identifies missing scope for partial data', () => {
    render(
      <TableState
        state="partial"
        message="Доступна часть результатов"
        missingScope="Не загружены остатки склада Электросталь"
      >
        <table>
          <caption>Доступные товары</caption>
          <tbody>
            <tr>
              <th scope="row">Артикул WB-001</th>
            </tr>
          </tbody>
        </table>
      </TableState>
    )

    expect(screen.getByText('Не загружены остатки склада Электросталь')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Доступные товары' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations for an updating data state', async () => {
    const { container } = render(
      <TableState state="updating" message="Цены обновляются">
        <table>
          <caption>Цены товаров</caption>
          <tbody>
            <tr>
              <th scope="row">Артикул WB-001</th>
              <td>1 250 ₽</td>
            </tr>
          </tbody>
        </table>
      </TableState>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
