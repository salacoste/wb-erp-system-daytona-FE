import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'

import { ResponsiveTable } from '@/components/product/tables'

import { BulkResultSummary } from '../BulkResultSummary'
import { createBulkResultCounts } from '../contracts'

expect.extend(toHaveNoViolations)

const failedTableContract = {
  primaryColumn: { id: 'item', label: 'Товар' },
  numericColumns: [],
  sorting: { kind: 'none' },
  selection: { kind: 'none' },
  rowActions: { kind: 'none' },
  narrowStrategy: {
    kind: 'stacked-detail',
    description: 'На узком экране причина остаётся рядом с товаром.',
    narrowContent: <div>SKU-2 — не найдена себестоимость</div>,
  },
  pagination: { kind: 'none' },
} as const

function FailedItemsTable() {
  return (
    <ResponsiveTable caption="Неуспешные товары" contract={failedTableContract}>
      <thead>
        <tr>
          <th scope="col">Товар</th>
          <th scope="col">Причина</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">SKU-2</th>
          <td>Не найдена себестоимость</td>
        </tr>
      </tbody>
    </ResponsiveTable>
  )
}

describe('BulkResultSummary', () => {
  it('renders exact attempted/succeeded/failed/skipped/pending counts including zero', () => {
    render(
      <BulkResultSummary
        operation="Назначение себестоимости"
        scope="24 выбранных товара"
        outcome="complete"
        counts={createBulkResultCounts({
          attempted: 24,
          succeeded: 24,
          failed: 0,
          skipped: 0,
          pending: 0,
        })}
      />
    )

    const summary = screen.getByRole('region', { name: 'Результат: Назначение себестоимости' })
    expect(within(summary).getByText('Попыток')).toBeInTheDocument()
    expect(within(summary).getAllByText('24')).toHaveLength(2)
    expect(within(summary).getAllByText('0')).toHaveLength(3)
    expect(summary).toHaveTextContent('24 выбранных товара')
  })

  it('persists partial evidence inline with failed reasons and retry scope', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <BulkResultSummary
        operation="Назначение себестоимости"
        scope="24 выбранных товара"
        outcome="partial"
        counts={createBulkResultCounts({
          attempted: 24,
          succeeded: 20,
          failed: 1,
          skipped: 2,
          pending: 1,
        })}
        limitation="Результат частичный: успешные изменения сохранены."
        failedItems={<FailedItemsTable />}
        retry={{
          scope: 'Повторить только 1 неуспешный товар',
          action: <button onClick={onRetry}>Повторить ошибку</button>,
        }}
      />
    )

    const summary = screen.getByRole('region', { name: 'Результат: Назначение себестоимости' })
    expect(summary).toHaveAttribute('data-outcome', 'partial')
    expect(summary).toHaveTextContent('успешные изменения сохранены')
    expect(within(summary).getByRole('table', { name: 'Неуспешные товары' })).toBeInTheDocument()
    expect(summary).toHaveTextContent('Повторить только 1 неуспешный товар')
    await user.click(screen.getByRole('button', { name: 'Повторить ошибку' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid count invariants before presentation', () => {
    expect(() =>
      createBulkResultCounts({ attempted: 10, succeeded: 8, failed: 1, skipped: 0, pending: 0 })
    ).toThrow(/attempted/i)
    expect(() =>
      createBulkResultCounts({ attempted: 1, succeeded: -1, failed: 1, skipped: 0, pending: 1 })
    ).toThrow(/non-negative integers/i)
    expect(() =>
      createBulkResultCounts({ attempted: 1.5, succeeded: 1, failed: 0, skipped: 0, pending: 0.5 })
    ).toThrow(/non-negative integers/i)
  })

  it('rejects outcome/count contradictions and retry evidence without failures', () => {
    expect(() =>
      render(
        <BulkResultSummary
          operation="Импорт"
          scope="2 строки"
          outcome="complete"
          counts={createBulkResultCounts({
            attempted: 2,
            succeeded: 1,
            failed: 0,
            skipped: 0,
            pending: 1,
          })}
        />
      )
    ).toThrow(/complete.*pending/i)

    expect(() =>
      render(
        <BulkResultSummary
          operation="Импорт"
          scope="2 строки"
          outcome="pending"
          counts={createBulkResultCounts({
            attempted: 2,
            succeeded: 2,
            failed: 0,
            skipped: 0,
            pending: 0,
          })}
        />
      )
    ).toThrow(/pending.*pending count/i)

    expect(() =>
      render(
        <BulkResultSummary
          operation="Импорт"
          scope="2 строки"
          outcome="partial"
          counts={createBulkResultCounts({
            attempted: 2,
            succeeded: 1,
            failed: 0,
            skipped: 1,
            pending: 0,
          })}
          limitation="Одна строка пропущена."
          retry={{ scope: 'Повторить ошибки', action: <button type="button">Повторить</button> }}
        />
      )
    ).toThrow(/retry.*failed/i)

    expect(() =>
      render(
        <BulkResultSummary
          operation="Импорт"
          scope="2 строки"
          outcome="failed"
          counts={createBulkResultCounts({
            attempted: 2,
            succeeded: 0,
            failed: 1,
            skipped: 1,
            pending: 0,
          })}
          failedItems={<FailedItemsTable />}
          retry={{ scope: 'Повторить ошибку', action: <button type="button">Повторить</button> }}
        />
      )
    ).toThrow('Failed bulk results require every attempted item to fail.')
  })

  it('keeps already-failed evidence visible while other items remain pending', () => {
    render(
      <BulkResultSummary
        operation="Импорт упаковок"
        scope="4 строки"
        outcome="pending"
        counts={createBulkResultCounts({
          attempted: 4,
          succeeded: 1,
          failed: 1,
          skipped: 0,
          pending: 2,
        })}
        limitation="Две строки ещё обрабатываются."
        failedItems={<FailedItemsTable />}
        retry={{ scope: 'Повторить одну ошибку', action: <button type="button">Повторить</button> }}
      />
    )

    const summary = screen.getByRole('region', { name: 'Результат: Импорт упаковок' })
    expect(summary).toHaveTextContent('Две строки ещё обрабатываются.')
    expect(within(summary).getByRole('table', { name: 'Неуспешные товары' })).toBeInTheDocument()
    expect(screen.getByText('Повторить одну ошибку')).toBeInTheDocument()
  })

  it('renders a truthful partial terminal result containing only failed and skipped items', () => {
    render(
      <BulkResultSummary
        operation="Импорт упаковок"
        scope="2 строки"
        outcome="partial"
        counts={createBulkResultCounts({
          attempted: 2,
          succeeded: 0,
          failed: 1,
          skipped: 1,
          pending: 0,
        })}
        limitation="Одна строка завершилась ошибкой, другая была пропущена."
        failedItems={<FailedItemsTable />}
        retry={{ scope: 'Повторить одну ошибку', action: <button type="button">Повторить</button> }}
      />
    )

    const summary = screen.getByRole('region', { name: 'Результат: Импорт упаковок' })
    expect(summary).toHaveAttribute('data-outcome', 'partial')
    expect(summary).toHaveTextContent('Одна строка завершилась ошибкой')
    expect(within(summary).getByRole('table', { name: 'Неуспешные товары' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('requires inline partial evidence and failed retry evidence only when applicable', () => {
    if (false) {
      // @ts-expect-error - partial results require a limitation message
      ;<BulkResultSummary
        operation="Импорт"
        scope="10 строк"
        outcome="partial"
        counts={createBulkResultCounts({
          attempted: 10,
          succeeded: 8,
          failed: 0,
          skipped: 2,
          pending: 0,
        })}
      />

      ;<BulkResultSummary
        operation="Импорт"
        scope="10 строк"
        outcome="failed"
        counts={createBulkResultCounts({
          attempted: 10,
          succeeded: 0,
          failed: 10,
          skipped: 0,
          pending: 0,
        })}
        failedItems={<FailedItemsTable />}
        retry={{
          scope: 'Повторить ошибки',
          // @ts-expect-error - retry evidence must be a rendered action element
          action: 'Повторить',
        }}
      />

      // @ts-expect-error - a failed count requires failed-item evidence and retry scope/action
      ;<BulkResultSummary
        operation="Импорт"
        scope="10 строк"
        outcome="failed"
        counts={createBulkResultCounts({
          attempted: 10,
          succeeded: 0,
          failed: 10,
          skipped: 0,
          pending: 0,
        })}
      />
    }

    expect(true).toBe(true)
  })

  it('rejects a non-rendered retry action at runtime', () => {
    expect(() =>
      render(
        <BulkResultSummary
          operation="Импорт"
          scope="2 строки"
          outcome="partial"
          counts={createBulkResultCounts({
            attempted: 2,
            succeeded: 1,
            failed: 1,
            skipped: 0,
            pending: 0,
          })}
          limitation="Одна строка требует исправления."
          failedItems={<FailedItemsTable />}
          retry={{ scope: 'Повторить ошибку', action: 'Повторить' as never }}
        />
      )
    ).toThrow(/retry action must be a rendered element/i)
  })

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <BulkResultSummary
        operation="Импорт упаковок"
        scope="2 строки"
        outcome="partial"
        counts={createBulkResultCounts({
          attempted: 2,
          succeeded: 1,
          failed: 1,
          skipped: 0,
          pending: 0,
        })}
        limitation="Одна строка требует исправления."
        failedItems={<FailedItemsTable />}
        retry={{ scope: 'Повторить одну строку', action: <button type="button">Повторить</button> }}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
