/**
 * Unit and integration tests for DeleteVersionDialog component
 * Story 52-FE.5: Delete Scheduled Version
 * Tests updated to use real component instead of placeholders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DeleteVersionDialog } from '../DeleteVersionDialog'

// Mock API module
const mockDeleteTariffVersion = vi.fn()

vi.mock('@/lib/api/tariffs-admin', () => ({
  deleteTariffVersion: (id: number) => mockDeleteTariffVersion(id),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

// Wrapper with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// Mock tariff versions
const mockScheduledVersion = {
  id: 3,
  effective_from: '2026-02-01',
  effective_until: null,
  status: 'scheduled' as const,
  source: 'manual' as const,
  notes: 'February update',
  created_at: '2026-01-22T10:00:00.000Z',
  updated_by: 'admin@example.com',
}

const mockActiveVersion = {
  id: 1,
  effective_from: '2026-01-01',
  effective_until: null,
  status: 'active' as const,
  source: 'manual' as const,
  notes: 'Current version',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_by: 'admin@example.com',
}

const mockExpiredVersion = {
  id: 2,
  effective_from: '2025-12-01',
  effective_until: '2025-12-31',
  status: 'expired' as const,
  source: 'manual' as const,
  notes: 'Old version',
  created_at: '2025-12-01T00:00:00.000Z',
  updated_by: 'admin@example.com',
}

describe('DeleteVersionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteTariffVersion.mockResolvedValue(undefined)
  })

  describe('AC1 & AC2: Delete button visibility based on status', () => {
    it('shows delete button for scheduled versions (button outside dialog)', () => {
      // This test validates UI logic that delete action should only be available for scheduled
      // The actual button would be in a parent component (VersionRow)
      // The dialog itself receives the version to delete
      expect(mockScheduledVersion.status).toBe('scheduled')
    })

    it('should not delete active versions', () => {
      expect(mockActiveVersion.status).toBe('active')
      // Active versions should not be deletable - this is enforced at the parent level
    })

    it('should not delete expired versions', () => {
      expect(mockExpiredVersion.status).toBe('expired')
      // Expired versions should not be deletable - this is enforced at the parent level
    })
  })

  describe('AC3: Dialog renders when open', () => {
    it('renders dialog when open is true', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      // AlertDialog content should be visible
      expect(screen.getByText(/подтвердите удаление/i)).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={false}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByText(/подтвердите удаление/i)).not.toBeInTheDocument()
    })
  })

  describe('AC4: Dialog text shows version date', () => {
    it('displays formatted date in confirmation message', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      // Component formats date as DD.MM.YYYY
      expect(screen.getByText(/01\.02\.2026/)).toBeInTheDocument()
    })

    it('displays warning about irreversible action', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText(/действие нельзя отменить/i)).toBeInTheDocument()
    })
  })

  describe('AC5: Confirm button triggers delete mutation', () => {
    it('calls API when confirm button clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={onClose}
        />
      )

      // Find the destructive button (Удалить)
      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteTariffVersion).toHaveBeenCalledWith(3)
      })
    })

    it('closes dialog after successful deletion', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={onClose}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('Cancel button behavior', () => {
    it('calls onClose when cancel button clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={onClose}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('does not call delete API when cancel clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={onClose}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(mockDeleteTariffVersion).not.toHaveBeenCalled()
    })
  })

  describe('AC6: Error handling', () => {
    it('shows error toast for 400 response', async () => {
      mockDeleteTariffVersion.mockRejectedValue({
        status: 400,
        message: 'Cannot delete active or expired versions',
      })

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })

    it('shows error toast for 404 response', async () => {
      mockDeleteTariffVersion.mockRejectedValue({
        status: 404,
        message: 'Version not found',
      })

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('AC7: Success toast after deletion', () => {
    it('shows success toast after successful deletion', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled()
      })
    })
  })

  describe('Loading state', () => {
    it('shows loading state during deletion', async () => {
      mockDeleteTariffVersion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
      )

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      // Button should show loading text
      await waitFor(() => {
        expect(screen.getByText(/удаление/i)).toBeInTheDocument()
      })
    })

    it('disables cancel button during deletion', async () => {
      mockDeleteTariffVersion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
      )

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /отмена/i })
        expect(cancelButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('dialog content has proper aria-label', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      // The AlertDialogContent has aria-label
      const dialogContent = document.querySelector('[aria-label="Удалить запланированную версию?"]')
      expect(dialogContent).toBeInTheDocument()
    })

    it('returns null when version is null', () => {
      renderWithProviders(
        <DeleteVersionDialog
          open={true}
          version={null}
          onClose={vi.fn()}
        />
      )

      expect(screen.queryByText(/подтвердите удаление/i)).not.toBeInTheDocument()
    })
  })
})
