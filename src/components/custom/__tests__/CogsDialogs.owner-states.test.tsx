import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CogsDeleteDialog } from '../CogsDeleteDialog'
import { CogsEditDialog } from '../CogsEditDialog'

const mocks = vi.hoisted(() => ({
  deleteMutation: vi.fn(),
  editMutation: vi.fn(),
}))

vi.mock('@/hooks/useCogsDelete', () => ({
  useCogsDelete: () => mocks.deleteMutation(),
  analyzeVersionChain: () => ({
    isCurrentVersion: true,
    hasPreviousVersion: false,
    isOnlyVersion: false,
  }),
  formatDateForDelete: (value: string | null) => value ?? 'Текущий',
  formatCurrencyForDelete: (value: number) => `${value} ₽`,
}))

vi.mock('@/hooks/useCogsEdit', () => ({
  useCogsEdit: () => mocks.editMutation(),
  hasCogsChanges: () => false,
  buildUpdatePayload: () => ({}),
  validateUnitCost: () => null,
  validateNotes: () => null,
}))

const record = {
  cogs_id: 'cogs-1',
  nm_id: '12345678',
  unit_cost_rub: 450,
  currency: 'RUB',
  valid_from: '2026-01-01',
  valid_to: null,
  source: 'manual' as const,
  notes: 'Текущая версия',
  created_by: 'owner-1',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
  is_active: true,
  affected_weeks: ['2026-W01'],
}

describe('COGS dialog owner states', () => {
  beforeEach(() => {
    mocks.deleteMutation.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mocks.editMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    })
  })

  it('keeps COGS deletion confirmation contained while delete is pending', () => {
    mocks.deleteMutation.mockReturnValue({ mutate: vi.fn(), isPending: true })

    render(<CogsDeleteDialog open onOpenChange={vi.fn()} record={record} history={[record]} />)

    expect(screen.getByRole('alertdialog', { name: 'Удаление записи COGS' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
  })

  it('keeps the COGS edit dialog open and exposes save failure', () => {
    mocks.editMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error('Не удалось сохранить COGS'),
    })

    render(<CogsEditDialog open onOpenChange={vi.fn()} record={record} />)

    expect(screen.getByRole('dialog', { name: 'Редактирование COGS' })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось сохранить изменения COGS')
  })
})
