/**
 * Box Types Page Tests
 * Tests for src/app/(dashboard)/shipments/box-types/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'

// Mock the box-types barrel export
vi.mock('@/components/custom/box-types', () => ({
  BoxTypesEmptyState: ({
    onCreateClick,
  }: {
    onCreateClick: (trigger: HTMLButtonElement) => void
  }) => (
    <button data-testid="empty-state" onClick={event => onCreateClick(event.currentTarget)}>
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
        isFetching: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isCreateOpen: false,
        handleCreate: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
        returnFocusRef: { current: null },
      })
    })

    it('should render without crash', () => {
      render(<BoxTypesPage />)
    })

    it('should show heading during loading', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('heading', { level: 1, name: 'Типы коробок' })).toBeInTheDocument()
    })

    it('announces the loading state politely without replacing route identity', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('status')).toHaveTextContent('Получаем типы коробок')
      expect(screen.getByRole('region', { name: 'Загружаем типы коробок' })).toHaveAttribute(
        'aria-busy',
        'true'
      )
    })
  })

  describe('Loaded with data', () => {
    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [{ id: '1', name: 'Small' }],
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isCreateOpen: false,
        handleCreate: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
        returnFocusRef: { current: null },
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

    it('renders the create action in the stable page header', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('button', { name: 'Добавить тип коробки' })).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Навигация по странице' })).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    const refetch = vi.fn()

    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [],
        isLoading: false,
        isFetching: false,
        isError: true,
        error: new Error('Network error'),
        refetch,
        isCreateOpen: false,
        handleCreate: vi.fn(),
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
        returnFocusRef: { current: null },
      })
    })

    it('renders a safe semantic error instead of the raw backend message', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('alert')).toHaveAccessibleName('Не удалось загрузить типы коробок')
      expect(screen.queryByText('Network error')).not.toBeInTheDocument()
    })

    it('should show retry button', () => {
      render(<BoxTypesPage />)

      expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
    })

    it('retries exactly once from the error state', async () => {
      const user = userEvent.setup()
      render(<BoxTypesPage />)

      await user.click(screen.getByRole('button', { name: /повторить/i }))

      expect(refetch).toHaveBeenCalledTimes(1)
    })

    it('disables repeated retry while the recovery request is fetching', () => {
      mockPageState.mockReturnValue({
        ...mockPageState(),
        isFetching: true,
      })

      render(<BoxTypesPage />)

      expect(screen.getByRole('button', { name: 'Повторяем...' })).toBeDisabled()
    })

    it('does not expose an unavailable create action for cached data in terminal error', () => {
      mockPageState.mockReturnValue({
        ...mockPageState(),
        boxTypes: [{ id: '1', name: 'Small' }],
      })

      render(<BoxTypesPage />)

      expect(screen.queryByRole('button', { name: 'Добавить тип коробки' })).not.toBeInTheDocument()
    })
  })

  describe('Empty state', () => {
    const handleCreate = vi.fn()

    beforeEach(() => {
      mockPageState.mockReturnValue({
        boxTypes: [],
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isCreateOpen: false,
        handleCreate,
        editingBoxType: null,
        deactivatingBoxType: null,
        handleEdit: vi.fn(),
        handleDeactivate: vi.fn(),
        handleFormClose: vi.fn(),
        handleDeactivateClose: vi.fn(),
        returnFocusRef: { current: null },
      })
    })

    it('renders the route-owned empty state', () => {
      render(<BoxTypesPage />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('opens creation from the exact empty-state trigger', async () => {
      const user = userEvent.setup()
      render(<BoxTypesPage />)
      const trigger = screen.getByTestId('empty-state')

      await user.click(trigger)

      expect(handleCreate).toHaveBeenCalledWith(trigger)
    })
  })
})
