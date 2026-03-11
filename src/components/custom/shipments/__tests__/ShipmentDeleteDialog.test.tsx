/**
 * Unit tests for ShipmentDeleteDialog component
 * Epic 76-FE: Shipment Cost UI
 *
 * Tests:
 * - Trigger button rendering (text + aria-label)
 * - Dialog open with confirmation title and description
 * - Cancel closes dialog without calling onDelete
 * - Confirm action calls onDelete
 * - Disabled state when isDeleting=true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShipmentDeleteDialog } from '../ShipmentDeleteDialog'

describe('ShipmentDeleteDialog', () => {
  const defaultProps = {
    isDeleting: false,
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 2.1: Trigger button renders with text and aria-label
  describe('Trigger button rendering', () => {
    it('renders trigger button with "Удалить" text and aria-label', () => {
      render(<ShipmentDeleteDialog {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveTextContent('Удалить')
    })
  })

  // 2.2: Clicking trigger opens AlertDialog with title and description
  describe('Dialog open behavior', () => {
    it('opens dialog with title "Удалить отправку?" on trigger click', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      expect(screen.getByText('Удалить отправку?')).toBeInTheDocument()
    })

    it('shows description "Вы уверены? Это действие невозможно отменить."', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      expect(screen.getByText('Вы уверены? Это действие невозможно отменить.')).toBeInTheDocument()
    })
  })

  // 2.3: Cancel button closes dialog without calling onDelete
  describe('Cancel button', () => {
    it('closes dialog without calling onDelete', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog {...defaultProps} />)

      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(defaultProps.onDelete).not.toHaveBeenCalled()
      // Dialog title should no longer be visible
      expect(screen.queryByText('Удалить отправку?')).not.toBeInTheDocument()
    })
  })

  // 2.4: Confirm action calls onDelete
  describe('Confirm action', () => {
    it('calls onDelete when confirm button is clicked', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog {...defaultProps} />)

      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: 'Удалить' })
      await user.click(confirmButton)

      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1)
    })
  })

  // 2.5: Disabled state when isDeleting=true
  describe('Deleting state', () => {
    it('disables Cancel button when isDeleting is true', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog isDeleting={true} onDelete={vi.fn()} />)

      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      expect(cancelButton).toBeDisabled()
    })

    it('disables Confirm button when isDeleting is true', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog isDeleting={true} onDelete={vi.fn()} />)

      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      const confirmButton = screen.getByRole('button', { name: /удален/i })
      expect(confirmButton).toBeDisabled()
    })

    it('shows "Удаление..." text on confirm button when isDeleting is true', async () => {
      const user = userEvent.setup()
      render(<ShipmentDeleteDialog isDeleting={true} onDelete={vi.fn()} />)

      // Open dialog
      const trigger = screen.getByRole('button', { name: 'Удалить отправку' })
      await user.click(trigger)

      expect(screen.getByText('Удаление...')).toBeInTheDocument()
    })
  })
})
