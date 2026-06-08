/**
 * Box Types Page Tests
 * Tests for src/app/(dashboard)/shipments/box-types/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock the box-types barrel export
vi.mock('@/components/custom/box-types', () => ({
  BoxTypesEmptyState: ({ onCreateClick }: { onCreateClick: () => void }) => (
    <button data-testid="empty-state" onClick={onCreateClick}>
      EmptyState
    </button>
  ),
  BoxTypesTable: () => <div data-testid="box-types-table">Table</div>,
  BoxTypeFormDialog: () => <div data-testid="form-dialog">FormDialog</div>,
  BoxTypeDeactivateDialog: () => <div data-testid="deactivate-dialog">DeactivateDialog</div>,
}))

// Mock the page state hook
const mockPageState = vi.fn()
vi.mock('../useBoxTypesPageState', () => ({
  useBoxTypesPageState: () => mockPageState(),
}))

import BoxTypesPage from '../page'

describe('BoxTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isCreateOpen: false,
        setIsCreateOpen: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
      })
    })

    it('should render without crash', () => {
      render(<BoxTypesPage />)
    })

    it('should show heading during loading', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('heading', { name: /типы коробок/i })).toBeInTheDocument()
    })
  })

  describe('Loaded with data', () => {
    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [{ id: '1', name: 'Small' }],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isCreateOpen: false,
        setIsCreateOpen: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
      })
    })

    it('should render without crash', () => {
      render(<BoxTypesPage />)
    })

    it('should show heading "Типы коробок"', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('heading', { name: /типы коробок/i })).toBeInTheDocument()
    })

    it('should render the table when box types exist', () => {
      render(<BoxTypesPage />)

      expect(screen.getByTestId('box-types-table')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [],
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: vi.fn(),
        isCreateOpen: false,
        setIsCreateOpen: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
      })
    })

    it('should render error message', () => {
      render(<BoxTypesPage />)

      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    it('should show retry button', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })
  })
})
