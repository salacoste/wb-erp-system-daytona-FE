/**
 * Tests for single-cogs sub-components
 * Epic 74-FE: ProductInfoCard, FutureDateWarning, SingleCogsFormActions, SingleCogsFormStatus
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductInfoCard } from '../ProductInfoCard'
import { SingleCogsFormActions } from '../SingleCogsFormActions'

// --- ProductInfoCard ---

describe('ProductInfoCard', () => {
  it('renders product name and article', () => {
    render(<ProductInfoCard productName="Футболка" nmId="12345" />)

    expect(screen.getByText('Футболка')).toBeInTheDocument()
    expect(screen.getByText(/12345/)).toBeInTheDocument()
  })

  it('renders without existing COGS when not provided', () => {
    render(<ProductInfoCard productName="Футболка" nmId="12345" />)

    expect(screen.queryByText('Текущая себестоимость')).not.toBeInTheDocument()
  })

  it('renders existing COGS when provided', () => {
    const existingCogs = {
      id: '1',
      unit_cost_rub: '1500.00',
      valid_from: '2025-01-15',
      valid_to: null,
      source: 'manual',
      created_at: '2025-01-15T10:00:00Z',
    }

    render(<ProductInfoCard productName="Футболка" nmId="12345" existingCogs={existingCogs} />)

    expect(screen.getByText('Текущая себестоимость')).toBeInTheDocument()
    expect(screen.getByText(/1 500/)).toBeInTheDocument()
  })
})

// --- SingleCogsFormActions ---

describe('SingleCogsFormActions', () => {
  it('renders submit button with default label for new assignment', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={false} isEditMode={false} />)

    expect(screen.getByRole('button', { name: /Назначить себестоимость/ })).toBeInTheDocument()
  })

  it('renders update label in edit mode', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={false} isEditMode={true} />)

    expect(screen.getByRole('button', { name: /Обновить себестоимость/ })).toBeInTheDocument()
  })

  it('shows loading spinner when pending', () => {
    render(<SingleCogsFormActions isPending={true} isPolling={false} isEditMode={false} />)

    expect(screen.getByText('Сохранение...')).toBeInTheDocument()
  })

  it('shows polling spinner when polling', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={true} isEditMode={false} />)

    expect(screen.getByText(/Ожидание расчёта/)).toBeInTheDocument()
  })

  it('disables submit button when pending or polling', () => {
    const { rerender } = render(
      <SingleCogsFormActions isPending={true} isPolling={false} isEditMode={false} />
    )

    expect(screen.getByRole('button', { name: /Сохранение/ })).toBeDisabled()

    rerender(<SingleCogsFormActions isPending={false} isPolling={true} isEditMode={false} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders cancel button when onCancel is provided', () => {
    const onCancel = vi.fn()
    render(
      <SingleCogsFormActions
        isPending={false}
        isPolling={false}
        isEditMode={false}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('button', { name: /Отмена/ })).toBeInTheDocument()
  })

  it('does not render cancel button when onCancel is not provided', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={false} isEditMode={false} />)

    expect(screen.queryByRole('button', { name: /Отмена/ })).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(
      <SingleCogsFormActions
        isPending={false}
        isPolling={false}
        isEditMode={false}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /Отмена/ }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows edit mode tip text', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={false} isEditMode={true} />)

    expect(
      screen.getByText(/При обновлении себестоимости будет создана новая версия/)
    ).toBeInTheDocument()
  })

  it('shows new assignment tip text', () => {
    render(<SingleCogsFormActions isPending={false} isPolling={false} isEditMode={false} />)

    expect(screen.getByText(/маржа будет рассчитана автоматически/)).toBeInTheDocument()
  })
})
