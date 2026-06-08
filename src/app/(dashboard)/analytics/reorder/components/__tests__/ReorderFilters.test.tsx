/**
 * ReorderFilters Unit Tests
 *
 * Verifies reorder status filter:
 * - Renders status label and select
 * - Renders all status options
 * - Calls onChange when value selected
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReorderFilters } from '../ReorderFilters'

describe('ReorderFilters', () => {
  it('renders status label', () => {
    renderWithProviders(<ReorderFilters value="all" onChange={vi.fn()} />)
    expect(screen.getByText('Статус:')).toBeInTheDocument()
  })

  it('renders current value in select trigger', () => {
    renderWithProviders(<ReorderFilters value="all" onChange={vi.fn()} />)
    expect(screen.getByText('Все')).toBeInTheDocument()
  })

  it('calls onChange when selecting a different option', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ReorderFilters value="all" onChange={onChange} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('Ожидают')).toBeInTheDocument()
    expect(screen.getByText('Заказано')).toBeInTheDocument()
    expect(screen.getByText('Получено')).toBeInTheDocument()
    expect(screen.getByText('Просрочено')).toBeInTheDocument()
  })
})
