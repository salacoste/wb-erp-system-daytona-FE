/**
 * ActionsDropdown — BD-13 follow-up: МойСклад-synced COGS rows are externally managed.
 * The next sync closes this version and writes a new one (moysklad-sync.service.ts →
 * CogsService.createCogs), so local edit/delete is futile. The kebab stays (discoverable)
 * but the actions are disabled with an explanatory label.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionsDropdown } from './CogsHistoryTableCells'
import type { CogsHistoryItem } from '@/types/cogs'

const baseRecord: CogsHistoryItem = {
  cogs_id: 'c1',
  nm_id: '1',
  unit_cost_rub: 500,
  currency: 'RUB',
  valid_from: '2026-01-01',
  valid_to: null,
  source: 'manual',
  notes: null,
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  is_active: true,
  affected_weeks: [],
}

/** The kebab menu must be opened to inspect its items (Radix renders content on open). */
async function openMenu(record: CogsHistoryItem) {
  render(<ActionsDropdown record={record} onEdit={() => undefined} onDelete={() => undefined} />)
  await userEvent.click(screen.getByRole('button', { name: /Открыть меню/ }))
}

describe('ActionsDropdown — BD-13 follow-up: moysklad rows are read-only', () => {
  it('opens dropdown and invokes edit action by keyboard with focus return', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<ActionsDropdown record={baseRecord} onEdit={onEdit} onDelete={() => undefined} />)
    const trigger = screen.getByRole('button', { name: /Открыть меню/ })
    trigger.focus()
    await user.keyboard('{Enter}')
    const edit = screen.getByRole('menuitem', { name: 'Редактировать' })
    expect(edit).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onEdit).toHaveBeenCalledWith(baseRecord)
    expect(trigger).toHaveFocus()
  })

  it('disables edit/delete with an explanatory label for a МойСклад-synced row', async () => {
    await openMenu({ ...baseRecord, source: 'moysklad' })
    expect(screen.getByText(/Управляется МойСклад/)).toBeInTheDocument()
    expect(screen.getByText('Редактировать').closest('[role="menuitem"]')).toHaveAttribute(
      'data-disabled'
    )
    expect(screen.getByText('Удалить').closest('[role="menuitem"]')).toHaveAttribute(
      'data-disabled'
    )
  })

  it('enables edit/delete for a manually-entered row', async () => {
    await openMenu({ ...baseRecord, source: 'manual' })
    expect(screen.queryByText(/Управляется МойСклад/)).not.toBeInTheDocument()
    expect(screen.getByText('Редактировать').closest('[role="menuitem"]')).not.toHaveAttribute(
      'data-disabled'
    )
  })
})
