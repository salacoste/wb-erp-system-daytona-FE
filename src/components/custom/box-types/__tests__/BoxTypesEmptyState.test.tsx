/**
 * Tests for BoxTypesEmptyState component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypesEmptyState } from '../BoxTypesEmptyState'

describe('BoxTypesEmptyState', () => {
  it('renders empty state text', () => {
    renderWithProviders(<BoxTypesEmptyState onCreateClick={vi.fn()} />)

    expect(
      screen.getByText('Добавьте типы коробок для расчёта стоимости доставки')
    ).toBeInTheDocument()
  })

  it('renders CTA button with correct label', () => {
    renderWithProviders(<BoxTypesEmptyState onCreateClick={vi.fn()} />)

    expect(screen.getByRole('button', { name: /добавить тип коробки/i })).toBeInTheDocument()
  })

  it('calls onCreateClick when CTA button is clicked', async () => {
    const user = userEvent.setup()
    const onCreateClick = vi.fn()
    renderWithProviders(<BoxTypesEmptyState onCreateClick={onCreateClick} />)

    await user.click(screen.getByRole('button', { name: /добавить тип коробки/i }))

    expect(onCreateClick).toHaveBeenCalledTimes(1)
  })
})
