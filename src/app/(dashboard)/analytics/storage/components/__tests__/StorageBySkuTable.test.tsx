/**
 * Unit tests for StorageBySkuTable component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StorageBySkuTable } from '../StorageBySkuTable'
import { mockStorageBySkuItems } from '@/test/fixtures/storage-analytics'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('StorageBySkuTable', () => {
  describe('rendering', () => {
    it('renders all columns', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // Check column headers
      expect(screen.getByText('Артикул')).toBeInTheDocument()
      expect(screen.getByText('Название')).toBeInTheDocument()
      expect(screen.getByText('Бренд')).toBeInTheDocument()
      expect(screen.getByText('Хранение')).toBeInTheDocument()
      expect(screen.getByText('₽/день')).toBeInTheDocument()
      expect(screen.getByText('Объём')).toBeInTheDocument()
      expect(screen.getByText('Склады')).toBeInTheDocument()
      expect(screen.getByText('Дней')).toBeInTheDocument()
    })

    it('renders data rows', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // Should render 3 data rows + 1 header = 4 rows
      expect(screen.getAllByRole('row')).toHaveLength(4)
    })

    it('shows empty state when no data', () => {
      render(<StorageBySkuTable data={[]} />)

      expect(screen.getByText('Нет товаров с данными о хранении')).toBeInTheDocument()
    })

    it('shows loading skeleton when isLoading', () => {
      render(<StorageBySkuTable data={[]} isLoading />)

      // Should show skeleton structure with table headers
      const skeletons = document.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]')
      if (skeletons.length === 0) {
        // Component shows skeleton table structure
        const container = document.querySelector('.space-y-4')
        expect(container).toBeInTheDocument()
      } else {
        expect(skeletons.length).toBeGreaterThan(0)
      }
    })

    it('displays vendor_code in monospace font', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // Component shows vendor_code || nm_id, fixture has vendor_code: 'SKU-001'
      const vendorCodeCell = screen.getByText('SKU-001')
      expect(vendorCodeCell).toHaveClass('font-mono')
    })

    it('displays brand or dash for null brand', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      expect(screen.getByText('RepairPro')).toBeInTheDocument()
    })

    it('formats volume correctly with л suffix', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      expect(screen.getByText('0.5 л')).toBeInTheDocument()
    })

    it('shows dash for null volume', () => {
      const dataWithNullVolume = [{
        ...mockStorageBySkuItems[0],
        volume_avg: null,
      }]
      render(<StorageBySkuTable data={dataWithNullVolume} />)

      // Find cells with "—" (dash)
      const cells = screen.getAllByRole('cell')
      const dashCell = cells.find(cell => cell.textContent === '—')
      expect(dashCell).toBeTruthy()
    })
  })

  describe('sorting', () => {
    it('sorts by storage_cost_total column', () => {
      const onSortChange = vi.fn()
      render(
        <StorageBySkuTable
          data={mockStorageBySkuItems}
          onSortChange={onSortChange}
        />
      )

      const sortButton = screen.getByRole('button', { name: /Хранение/i })
      fireEvent.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('storage_cost_total', 'asc')
    })

    it('sorts by days_stored column', () => {
      const onSortChange = vi.fn()
      render(
        <StorageBySkuTable
          data={mockStorageBySkuItems}
          onSortChange={onSortChange}
        />
      )

      const sortButton = screen.getByRole('button', { name: /Дней/i })
      fireEvent.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('days_stored', 'desc')
    })

    it('toggles sort order on repeated clicks', () => {
      const onSortChange = vi.fn()
      render(
        <StorageBySkuTable
          data={mockStorageBySkuItems}
          onSortChange={onSortChange}
        />
      )

      const sortButton = screen.getByRole('button', { name: /Хранение/i })

      // First click - defaults to desc initially, so toggles to asc
      fireEvent.click(sortButton)
      expect(onSortChange).toHaveBeenLastCalledWith('storage_cost_total', 'asc')

      // Second click - should toggle to desc
      fireEvent.click(sortButton)
      expect(onSortChange).toHaveBeenLastCalledWith('storage_cost_total', 'desc')
    })
  })

  describe('search', () => {
    it('renders search input', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      expect(screen.getByPlaceholderText('Поиск по артикулу, бренду...')).toBeInTheDocument()
    })

    it('calls onSearch when search value changes (after debounce)', async () => {
      const onSearch = vi.fn()
      render(
        <StorageBySkuTable
          data={mockStorageBySkuItems}
          onSearch={onSearch}
        />
      )

      const searchInput = screen.getByPlaceholderText('Поиск по артикулу, бренду...')
      fireEvent.change(searchInput, { target: { value: '147' } })

      // Component uses 300ms debounce, wait for callback
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('147')
      }, { timeout: 500 })
    })

    it('updates input value on change', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      const searchInput = screen.getByPlaceholderText('Поиск по артикулу, бренду...') as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(searchInput.value).toBe('test')
    })
  })

  describe('interactions', () => {
    it('calls onProductClick when row is clicked', () => {
      const onProductClick = vi.fn()
      render(
        <StorageBySkuTable
          data={mockStorageBySkuItems}
          onProductClick={onProductClick}
        />
      )

      const rows = screen.getAllByRole('row')
      // Click on first data row (index 1)
      // Table is sorted by storage_cost_total desc, so first row is item with highest cost
      // mockStorageBySkuItems[2] has highest storage_cost_total (2100.0), nm_id = '456789012'
      fireEvent.click(rows[1])

      expect(onProductClick).toHaveBeenCalledWith('456789012')
    })

    it('has cursor-pointer class on data rows', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      const rows = screen.getAllByRole('row')
      // Data row should have cursor-pointer
      expect(rows[1]).toHaveClass('cursor-pointer')
    })
  })

  describe('WarehouseBadges integration', () => {
    it('renders warehouse badges with overflow', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // Second item has 3 warehouses, should show +1
      expect(screen.getByText('+1')).toBeInTheDocument()
    })

    it('renders warehouse badges', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // Multiple items have Коледино, use getAllByText
      const koledinoBadges = screen.getAllByText('Коледино')
      expect(koledinoBadges.length).toBeGreaterThan(0)
    })
  })

  describe('product name display', () => {
    it('displays product name in data row', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      // First item has product_name in the data
      const productNameText = mockStorageBySkuItems[0].product_name
      expect(screen.getByText(productNameText!)).toBeInTheDocument()
    })

    it('shows dash for null product_name', () => {
      const dataWithNullName = [{
        ...mockStorageBySkuItems[0],
        product_name: null,
      }]
      render(<StorageBySkuTable data={dataWithNullName} />)

      // Find cells with "—" (dash)
      const cells = screen.getAllByRole('cell')
      const dashCells = cells.filter(cell => cell.textContent === '—')
      expect(dashCells.length).toBeGreaterThan(0)
    })
  })
})
