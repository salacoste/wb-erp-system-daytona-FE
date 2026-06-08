/**
 * ReorderPageHeader Unit Tests
 *
 * Verifies reorder page header:
 * - Renders title with icon
 * - Renders description
 * - Renders refresh button
 * - Disables refresh when isRefreshing is true
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { ReorderPageHeader } from '../ReorderPageHeader'

describe('ReorderPageHeader', () => {
  it('renders page title', () => {
    renderWithProviders(<ReorderPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Дашборд пополнения')).toBeInTheDocument()
  })

  it('renders description', () => {
    renderWithProviders(<ReorderPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(
      screen.getByText('Рекомендации по пополнению запасов на складах Wildberries')
    ).toBeInTheDocument()
  })

  it('renders refresh button', () => {
    renderWithProviders(<ReorderPageHeader isRefreshing={false} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('calls onRefresh when button clicked', async () => {
    const onRefresh = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ReorderPageHeader isRefreshing={false} onRefresh={onRefresh} />)
    await user.click(screen.getByText('Обновить'))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('disables button when refreshing', () => {
    renderWithProviders(<ReorderPageHeader isRefreshing={true} onRefresh={vi.fn()} />)
    expect(screen.getByText('Обновить')).toBeDisabled()
  })
})
