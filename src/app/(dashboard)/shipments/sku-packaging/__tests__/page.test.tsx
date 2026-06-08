/**
 * SKU Packaging Page Tests
 * Tests for src/app/(dashboard)/shipments/sku-packaging/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock the page state hook
const mockState = {
  items: [],
  hasBoxTypes: false,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  isCreateOpen: false,
  setIsCreateOpen: vi.fn(),
  isBulkOpen: false,
  setIsBulkOpen: vi.fn(),
  editingItem: null,
  deletingItem: null,
  handleEdit: vi.fn(),
  handleDelete: vi.fn(),
  handleFormClose: vi.fn(),
  handleDeleteClose: vi.fn(),
  handleBulkClose: vi.fn(),
}

vi.mock('../useSkuPackagingPageState', () => ({
  useSkuPackagingPageState: () => mockState,
}))

// Mock SKU packaging components
vi.mock('@/components/custom/sku-packaging', () => ({
  SkuPackagingEmptyState: ({ onCreateClick }: { onCreateClick: () => void }) => (
    <div data-testid="empty-state" onClick={onCreateClick}>
      EmptyState
    </div>
  ),
  SkuPackagingTable: ({ items }: { items: unknown[] }) => (
    <div data-testid="packaging-table">Table with {items.length} items</div>
  ),
  SkuPackagingFormDialog: ({ open }: { open: boolean }) => (
    <div data-testid="form-dialog" data-open={open}>
      FormDialog
    </div>
  ),
  SkuPackagingDeleteDialog: ({ item }: { item: unknown }) => (
    <div data-testid="delete-dialog">{item ? 'DeleteDialog with item' : 'DeleteDialog'}</div>
  ),
  BulkAddDialog: ({ open }: { open: boolean }) => (
    <div data-testid="bulk-add-dialog" data-open={open}>
      BulkAddDialog
    </div>
  ),
}))

// Import after mocks
import SkuPackagingPage from '../page'

describe('SkuPackagingPage', () => {
  it('should render without crash', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByRole('heading', { name: /упаковка товаров/i })).toBeInTheDocument()
  })

  it('should render page heading "Упаковка товаров"', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByRole('heading', { name: /упаковка товаров/i, level: 1 })).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.queryByTestId('packaging-table')).not.toBeInTheDocument()
  })

  it('should show table when items exist', () => {
    const originalItems = mockState.items
    mockState.items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ] as unknown[]

    render(<SkuPackagingPage />)

    expect(screen.getByTestId('packaging-table')).toBeInTheDocument()
    expect(screen.getByTestId('packaging-table')).toHaveTextContent('2 items')

    // Cleanup
    mockState.items = originalItems
  })

  it('should show loading state', () => {
    mockState.isLoading = true

    const { container } = render(<SkuPackagingPage />)

    expect(screen.getByRole('heading', { name: /упаковка товаров/i })).toBeInTheDocument()
    const pulse = container.querySelectorAll('.animate-pulse')
    expect(pulse.length).toBeGreaterThan(0)

    // Cleanup
    mockState.isLoading = false
  })

  it('should show error state when isError is true', () => {
    mockState.isError = true
    mockState.error = new Error('Test error message')

    render(<SkuPackagingPage />)

    expect(screen.getByText(/test error message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()

    // Cleanup
    mockState.isError = false
    mockState.error = null
  })

  it('should render form dialog', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByTestId('form-dialog')).toBeInTheDocument()
  })

  it('should render delete dialog', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
  })

  it('should render bulk add dialog', () => {
    render(<SkuPackagingPage />)

    expect(screen.getByTestId('bulk-add-dialog')).toBeInTheDocument()
  })
})
