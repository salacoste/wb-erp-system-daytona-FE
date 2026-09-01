import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { AlertHistoryTable } from '../AlertHistoryTable'

describe('AlertHistoryTable owner states', () => {
  it('keeps a visible reset path when active filters produce no history rows', () => {
    const onFilterChange = vi.fn()
    render(
      <AlertHistoryTable
        items={[]}
        isLoading={false}
        historyParams={{ limit: 50, status: 'failed' }}
        onFilterChange={onFilterChange}
      />
    )

    expect(screen.getByText('Нет уведомлений')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }))
    expect(onFilterChange).toHaveBeenCalledWith({ alertType: undefined, status: undefined })
  })
})
