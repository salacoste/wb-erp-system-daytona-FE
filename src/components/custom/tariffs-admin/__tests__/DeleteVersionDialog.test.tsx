/**
 * Unit and integration tests for DeleteVersionDialog component
 * Story 52-FE.5: Delete Scheduled Version
 * TDD: Tests written BEFORE implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'

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
    it('shows delete button for scheduled versions', () => {
      renderWithProviders(
        <VersionRowPlaceholder version={mockScheduledVersion} />
      )

      expect(screen.getByRole('button', { name: /удалить/i })).toBeInTheDocument()
    })

    it('hides delete button for active versions', () => {
      renderWithProviders(
        <VersionRowPlaceholder version={mockActiveVersion} />
      )

      expect(screen.queryByRole('button', { name: /удалить/i })).not.toBeInTheDocument()
    })

    it('hides delete button for expired versions', () => {
      renderWithProviders(
        <VersionRowPlaceholder version={mockExpiredVersion} />
      )

      expect(screen.queryByRole('button', { name: /удалить/i })).not.toBeInTheDocument()
    })
  })

  describe('AC3: Confirmation dialog opens on click', () => {
    it('opens confirmation dialog when delete button clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={false}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })
  })

  describe('AC4: Dialog text shows version date', () => {
    it('displays formatted date in confirmation message', () => {
      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Should show formatted date: 01.02.2026
      expect(
        screen.getByText(/вы уверены.*удалить версию.*01\.02\.2026/i)
      ).toBeInTheDocument()
    })

    it('displays warning about irreversible action', () => {
      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByText(/действие нельзя отменить/i)).toBeInTheDocument()
    })
  })

  describe('AC5: Confirm button triggers delete mutation', () => {
    it('calls onConfirm when confirm button clicked', async () => {
      const onConfirm = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalled()
    })

    it('DELETE request sent with correct version ID', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteTariffVersion).toHaveBeenCalledWith(3)
      })
    })
  })

  describe('Cancel button behavior', () => {
    it('calls onCancel when cancel button clicked', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('closes dialog without calling delete', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /отмена/i })
      await user.click(cancelButton)

      expect(mockDeleteTariffVersion).not.toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalled()
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
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Нельзя удалить активную или истекшую версию'
        )
      })
    })

    it('shows error toast for 404 response', async () => {
      mockDeleteTariffVersion.mockRejectedValue({
        status: 404,
        message: 'Version not found',
      })

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Версия не найдена')
      })
    })
  })

  describe('AC7: Success toast after deletion', () => {
    it('shows success toast after successful deletion', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Запланированная версия удалена')
      })
    })
  })

  describe('AC8: Table refresh after deletion', () => {
    it('closes dialog after successful deletion', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
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

  describe('Loading state', () => {
    it('shows loading spinner during deletion', async () => {
      mockDeleteTariffVersion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
      )

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      // Confirm button should show loading state
      expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: /удаление/i })).toBeInTheDocument()
    })

    it('disables buttons during deletion', async () => {
      mockDeleteTariffVersion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 1000))
      )

      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogWithMutationPlaceholder
          open={true}
          version={mockScheduledVersion}
          onClose={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /удалить/i })
      await user.click(confirmButton)

      // Both buttons should be disabled
      const dialog = screen.getByRole('alertdialog')
      expect(within(dialog).getByRole('button', { name: /отмена/i })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('dialog is properly labeled', () => {
      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const dialog = screen.getByRole('alertdialog')
      expect(dialog).toHaveAccessibleName(/удалить запланированную версию/i)
    })

    it('dialog can be closed with Escape key', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <DeleteVersionDialogPlaceholder
          open={true}
          version={mockScheduledVersion}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      await user.keyboard('{Escape}')

      expect(onCancel).toHaveBeenCalled()
    })

    it('delete button has tooltip', () => {
      renderWithProviders(
        <VersionRowPlaceholder version={mockScheduledVersion} />
      )

      const deleteButton = screen.getByRole('button', { name: /удалить/i })
      expect(deleteButton).toHaveAttribute('title', 'Удалить версию')
    })
  })
})

// Placeholder types for TDD
interface TariffVersion {
  id: number
  effective_from: string
  effective_until: string | null
  status: 'scheduled' | 'active' | 'expired'
  source: 'manual' | 'api'
  notes?: string
  created_at: string
  updated_by: string
}

interface VersionRowPlaceholderProps {
  version: TariffVersion
}

// Placeholder components for TDD - will be replaced with actual imports
function VersionRowPlaceholder({ version }: VersionRowPlaceholderProps) {
  if (version.status !== 'scheduled') {
    return <div>Version row without delete button</div>
  }
  return (
    <div>
      <button title="Удалить версию">Удалить</button>
    </div>
  )
}

interface DeleteVersionDialogPlaceholderProps {
  open: boolean
  version: TariffVersion | null
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

function DeleteVersionDialogPlaceholder({
  open,
  version,
}: DeleteVersionDialogPlaceholderProps) {
  if (!open || !version) return null
  return (
    <div role="alertdialog" aria-label="Удалить запланированную версию?">
      TDD: Component not yet implemented - {version.effective_from}
    </div>
  )
}

interface DeleteVersionDialogWithMutationPlaceholderProps {
  open: boolean
  version: TariffVersion | null
  onClose: () => void
}

function DeleteVersionDialogWithMutationPlaceholder({
  open,
  version,
}: DeleteVersionDialogWithMutationPlaceholderProps) {
  if (!open || !version) return null
  return (
    <div role="alertdialog" aria-label="Удалить запланированную версию?">
      TDD: Component with mutation not yet implemented
    </div>
  )
}
