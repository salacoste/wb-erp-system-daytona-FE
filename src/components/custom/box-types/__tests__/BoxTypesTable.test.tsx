/**
 * Tests for BoxTypesTable component
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #2, #6)
 */

import { describe, it, expect, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BoxTypesTable } from '../BoxTypesTable'
import type { BoxType } from '@/types/shipment-cost'

expect.extend(toHaveNoViolations)

const mockBoxTypes: BoxType[] = [
  {
    id: 'bt-001',
    cabinetId: 'cab-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: false,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'bt-002',
    cabinetId: 'cab-001',
    name: 'Коробка B',
    lengthCm: '30.00',
    widthCm: '20.00',
    heightCm: '15.00',
    volumeCm3: '9000.00',
    isActive: true,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
]

describe('BoxTypesTable', () => {
  const defaultProps = {
    boxTypes: mockBoxTypes,
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
  }

  it('renders a row for each box type', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })

    expect(within(table).getByText('Коробка A')).toBeInTheDocument()
    expect(within(table).getByText('Коробка B')).toBeInTheDocument()
  })

  it('shows parsed dimensions and volume', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })

    expect(within(table).getByText('60 × 40 × 30 см')).toBeInTheDocument()
    expect(within(table).getByText('30 × 20 × 15 см')).toBeInTheDocument()
  })

  it('shows formatted volume', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })

    expect(within(table).getByText(/72\s?000 см³/)).toBeInTheDocument()
    expect(within(table).getByText(/9\s?000 см³/)).toBeInTheDocument()
  })

  it('has edit actions per row and a deactivate action only for the active row', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })

    const editButtons = within(table).getAllByRole('button', { name: /Редактировать «Коробка/ })
    const deactivateButtons = within(table).getAllByRole('button', {
      name: /Деактивировать «Коробка/,
    })
    expect(editButtons).toHaveLength(2)
    expect(deactivateButtons).toHaveLength(1)
  })

  it('calls onEdit with the correct item when edit is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderWithProviders(<BoxTypesTable {...defaultProps} onEdit={onEdit} />)

    const table = screen.getByRole('table', { name: 'Типы коробок' })
    const row = within(table).getByText('Коробка A').closest('tr')!
    const trigger = within(row).getByRole('button', { name: 'Редактировать «Коробка A»' })
    await user.click(trigger)

    expect(onEdit).toHaveBeenCalledWith(mockBoxTypes[0], trigger)
  })

  it('calls onDeactivate with the correct item when deactivate is clicked', async () => {
    const user = userEvent.setup()
    const onDeactivate = vi.fn()
    renderWithProviders(<BoxTypesTable {...defaultProps} onDeactivate={onDeactivate} />)

    const table = screen.getByRole('table', { name: 'Типы коробок' })
    const row = within(table).getByText('Коробка B').closest('tr')!
    const trigger = within(row).getByRole('button', { name: 'Деактивировать «Коробка B»' })
    await user.click(trigger)

    expect(onDeactivate).toHaveBeenCalledWith(mockBoxTypes[1], trigger)
  })

  it('exposes an accessible table name and a declared stacked-detail narrow strategy', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    const table = screen.getByRole('table', { name: 'Типы коробок' })
    expect(table).toHaveAttribute('data-primary-column', 'name')
    expect(table).toHaveAttribute('data-narrow-strategy', 'stacked-detail')
    expect(
      screen.getByRole('group', { name: 'Карточки типов коробок для узкого экрана' })
    ).toBeInTheDocument()
  })

  it('renders active and inactive state with non-color meaning', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })
    const narrow = screen.getByRole('group', {
      name: 'Карточки типов коробок для узкого экрана',
    })

    for (const projection of [table, narrow]) {
      expect(within(projection).getByText('Активен')).toBeInTheDocument()
      expect(within(projection).getByText('Неактивен')).toBeInTheDocument()
    }
  })

  it('names every row action with the box-type identity', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })
    const narrow = screen.getByRole('group', {
      name: 'Карточки типов коробок для узкого экрана',
    })

    for (const projection of [table, narrow]) {
      const edit = within(projection).getByRole('button', { name: 'Редактировать «Коробка A»' })
      expect(edit).toHaveTextContent('Редактировать')
      expect(edit).toHaveClass('min-h-11')
      expect(
        within(projection).getByRole('button', { name: 'Редактировать «Коробка B»' })
      ).toBeInTheDocument()
      const deactivate = within(projection).getByRole('button', {
        name: 'Деактивировать «Коробка B»',
      })
      expect(deactivate).toHaveTextContent('Деактивировать')
      expect(deactivate).toHaveClass('min-h-11')
      expect(deactivate.parentElement).toHaveClass('min-w-0', 'flex-col', 'items-stretch')
      expect(deactivate).toHaveClass('min-w-0', 'w-full')
    }
  })

  it('omits the destructive action for inactive rows', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)

    expect(
      screen.queryByRole('button', { name: 'Деактивировать «Коробка A»' })
    ).not.toBeInTheDocument()
  })

  it('keeps centimeter and cubic-centimeter units visible in table and narrow content', () => {
    renderWithProviders(<BoxTypesTable {...defaultProps} />)
    const table = screen.getByRole('table', { name: 'Типы коробок' })
    const narrow = screen.getByRole('group', {
      name: 'Карточки типов коробок для узкого экрана',
    })

    expect(
      within(table).getByRole('columnheader', { name: 'Размеры (Д×Ш×В, см)' })
    ).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Объём (см³)' })).toBeInTheDocument()
    for (const projection of [table, narrow]) {
      expect(within(projection).getByText(/60 × 40 × 30 см/)).toBeInTheDocument()
      expect(within(projection).getByText(/72\s?000 см³/)).toBeInTheDocument()
    }
  })

  it('has no detectable accessibility violations in the populated presentation', async () => {
    const { container } = renderWithProviders(<BoxTypesTable {...defaultProps} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
