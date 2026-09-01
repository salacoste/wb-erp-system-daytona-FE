import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CompletenessRow } from '../CompletenessRow'
import type { DataCompletenessTable } from '../../types/monitoring'

const row: DataCompletenessTable = {
  table: 'orders',
  displayName: 'Заказы',
  completenessRatio: 0.85,
  status: 'incomplete',
}

function renderRow(onToggle = vi.fn()) {
  render(
    <table>
      <tbody>
        <CompletenessRow
          row={row}
          detail={undefined}
          isExpanded={false}
          onToggle={onToggle}
          isLoadingDetail={false}
        />
      </tbody>
    </table>
  )
  return onToggle
}

function renderExpandedRow() {
  render(
    <table>
      <tbody>
        <CompletenessRow
          row={row}
          detail={undefined}
          isExpanded
          onToggle={vi.fn()}
          isLoadingDetail={false}
        />
      </tbody>
    </table>
  )
}

describe('CompletenessRow interactions', () => {
  it('toggles from a real focused control while preserving native row and cell semantics', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()
    const action = screen.getByRole('button', { name: 'Показать полноту данных Заказы' })
    const tableRow = action.closest('tr')

    expect(tableRow).toHaveRole('row')
    expect(tableRow).not.toHaveAttribute('role')
    expect(tableRow).not.toHaveAttribute('tabindex')
    expect(tableRow?.querySelectorAll('td')).toHaveLength(4)
    expect(action).toHaveAttribute('aria-expanded', 'false')
    action.focus()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('keeps pointer row activation as a single convenience action', async () => {
    const onToggle = renderRow()
    const user = userEvent.setup()

    await user.click(screen.getByRole('cell', { name: 'Заказы' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('announces the collapse action while expanded', () => {
    renderExpandedRow()
    expect(screen.getByRole('button', { name: 'Скрыть полноту данных Заказы' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
