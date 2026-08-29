import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { BackfillCabinetStatus, BackfillStatus } from '@/types/backfill'

import { StartBackfillDialog } from '../StartBackfillDialog'

const cabinet = {
  cabinet_id: 'cabinet-1',
  cabinet_name: 'Основной кабинет с длинным названием',
  status: 'idle',
  analytics_status: 'idle',
  data_source: 'none',
  oldest_available_date: null,
  newest_available_date: null,
  progress: null,
  last_error: null,
  started_at: null,
  completed_at: null,
  updated_at: '',
} satisfies BackfillCabinetStatus

const STARTABLE_STATUSES = ['idle', 'not_started', 'completed', 'failed'] as const
const STARTABLE_PRODUCTS = STARTABLE_STATUSES.flatMap(status =>
  STARTABLE_STATUSES.map(analyticsStatus => [status, analyticsStatus] as const)
) satisfies readonly (readonly [BackfillStatus, BackfillStatus])[]

describe('StartBackfillDialog', () => {
  it('moves initial focus to the cabinet selector', async () => {
    render(
      <StartBackfillDialog cabinets={[cabinet]} isOpen onOpenChange={vi.fn()} onStart={vi.fn()} />
    )

    const selector = screen.getByRole('combobox', { name: 'Кабинет' })
    await waitFor(() => expect(selector).toHaveFocus())
    expect(selector).toHaveClass('min-h-11')
  })

  it('gives every cabinet option a route-owned 44px minimum touch height', async () => {
    const user = userEvent.setup()
    render(
      <StartBackfillDialog
        cabinets={[
          cabinet,
          { ...cabinet, cabinet_id: 'cabinet-2', cabinet_name: 'Второй кабинет' },
        ]}
        isOpen
        onOpenChange={vi.fn()}
        onStart={vi.fn()}
      />
    )

    await user.click(screen.getByRole('combobox', { name: 'Кабинет' }))
    expect(screen.getByRole('listbox')).toHaveClass('max-w-[calc(100vw-2rem)]')
    expect(screen.getAllByRole('option')).toHaveLength(2)
    for (const option of screen.getAllByRole('option')) {
      expect(option).toHaveClass('min-h-11', 'whitespace-normal', 'break-words')
    }
  })

  it('prevents duplicate submission while the first start request is unresolved', async () => {
    const user = userEvent.setup()
    let resolveStart!: () => void
    const onStart = vi.fn(() => new Promise<void>(resolve => (resolveStart = resolve)))
    const onOpenChange = vi.fn()

    render(
      <StartBackfillDialog
        cabinets={[cabinet]}
        isOpen
        onOpenChange={onOpenChange}
        onStart={onStart}
      />
    )

    try {
      await user.click(screen.getByRole('combobox', { name: 'Кабинет' }))
      await user.click(screen.getByRole('option', { name: cabinet.cabinet_name }))

      const startButton = screen.getByRole('button', { name: 'Запустить' })
      await user.click(startButton)
      await user.click(startButton)

      expect(onStart).toHaveBeenCalledTimes(1)
      expect(onStart).toHaveBeenCalledWith({ cabinet_id: cabinet.cabinet_id })
      expect(startButton).toBeDisabled()
      expect(startButton).toHaveAttribute('aria-busy', 'true')

      await user.keyboard('{Escape}')
      await user.click(screen.getByRole('button', { name: 'Закрыть' }))

      expect(onOpenChange).toHaveBeenCalledTimes(2)
      expect(onOpenChange).toHaveBeenNthCalledWith(1, false)
      expect(onOpenChange).toHaveBeenNthCalledWith(2, false)
    } finally {
      resolveStart()
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Запустить' })).not.toHaveAttribute(
          'aria-busy',
          'true'
        )
      )
    }
  })

  it('shows a semantic explanation when every cabinet is unavailable', () => {
    render(
      <StartBackfillDialog
        cabinets={[{ ...cabinet, status: 'in_progress' }]}
        isOpen
        onOpenChange={vi.fn()}
        onStart={vi.fn()}
      />
    )

    expect(screen.getByText(/Все кабинеты уже загружают данные/)).toHaveClass('text-status-warning')
  })

  it.each([
    ['in_progress', 'idle'],
    ['idle', 'pending'],
    ['paused', 'completed'],
    ['completed', 'in_progress'],
  ] as const)(
    'requires both pipelines to be startable for reports=%s and analytics=%s',
    (status, analyticsStatus) => {
      render(
        <StartBackfillDialog
          cabinets={[{ ...cabinet, status, analytics_status: analyticsStatus }]}
          isOpen
          onOpenChange={vi.fn()}
          onStart={vi.fn()}
        />
      )

      expect(screen.getByText(/Все кабинеты уже загружают данные/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Запустить' })).toBeDisabled()
    }
  )

  it.each(STARTABLE_PRODUCTS)(
    'offers the cabinet for every startable product reports=%s and analytics=%s',
    async (status, analyticsStatus) => {
      const user = userEvent.setup()
      render(
        <StartBackfillDialog
          cabinets={[{ ...cabinet, status, analytics_status: analyticsStatus }]}
          isOpen
          onOpenChange={vi.fn()}
          onStart={vi.fn()}
        />
      )

      expect(screen.queryByText(/Все кабинеты уже загружают данные/)).not.toBeInTheDocument()
      await user.click(screen.getByRole('combobox', { name: 'Кабинет' }))
      expect(screen.getByRole('option', { name: cabinet.cabinet_name })).toBeVisible()
    }
  )

  it('cannot submit a selection that becomes ineligible while the dialog is open', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    const { rerender } = render(
      <StartBackfillDialog cabinets={[cabinet]} isOpen onOpenChange={vi.fn()} onStart={onStart} />
    )

    await user.click(screen.getByRole('combobox', { name: 'Кабинет' }))
    await user.click(screen.getByRole('option', { name: cabinet.cabinet_name }))
    expect(screen.getByRole('button', { name: 'Запустить' })).toBeEnabled()

    rerender(
      <StartBackfillDialog
        cabinets={[{ ...cabinet, analytics_status: 'in_progress' }]}
        isOpen
        onOpenChange={vi.fn()}
        onStart={onStart}
      />
    )

    const startButton = screen.getByRole('button', { name: 'Запустить' })
    expect(startButton).toBeDisabled()
    await user.click(startButton)
    await user.keyboard('{Enter}')

    expect(onStart).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Кабинет' })).toHaveTextContent(
        'Выберите кабинет'
      )
    )
  })
})
