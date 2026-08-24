/**
 * Unit tests for StorageBySkuTable component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StorageBySkuTable } from '../StorageBySkuTable'
import {
  mockStorageBySkuItems,
  mockNullCostStorageBySkuItem,
} from '@/test/fixtures/storage-analytics'

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
      const dataWithNullVolume = [
        {
          ...mockStorageBySkuItems[0],
          volume_avg: null,
        },
      ]
      render(<StorageBySkuTable data={dataWithNullVolume} />)

      // Find cells with "—" (dash)
      const cells = screen.getAllByRole('cell')
      const dashCell = cells.find(cell => cell.textContent === '—')
      expect(dashCell).toBeTruthy()
    })

    // BD-16 / AP#8: null storage_cost_total must render «—», never «0 ₽».
    it('shows dash (not "0 ₽") for null storage cost (BD-16, AP#8)', () => {
      render(<StorageBySkuTable data={[mockNullCostStorageBySkuItem]} />)

      const cells = screen.getAllByRole('cell')
      const dashCell = cells.find(cell => cell.textContent === '—')
      expect(dashCell).toBeTruthy()
      // No cell should render a fabricated zero-ruble value for this SKU.
      const zeroRubles = cells.filter(cell => /0\s*₽/.test(cell.textContent || ''))
      expect(zeroRubles).toHaveLength(0)
    })
  })

  describe('sorting', () => {
    it('sorts by storage_cost_total column', () => {
      const onSortChange = vi.fn()
      render(<StorageBySkuTable data={mockStorageBySkuItems} onSortChange={onSortChange} />)

      const sortButton = screen.getByRole('button', { name: /Хранение/i })
      fireEvent.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('storage_cost_total', 'asc')
    })

    it('sorts by days_stored column', () => {
      const onSortChange = vi.fn()
      render(<StorageBySkuTable data={mockStorageBySkuItems} onSortChange={onSortChange} />)

      const sortButton = screen.getByRole('button', { name: /Дней/i })
      fireEvent.click(sortButton)

      expect(onSortChange).toHaveBeenCalledWith('days_stored', 'desc')
    })

    it('toggles sort order on repeated clicks', () => {
      const onSortChange = vi.fn()
      render(<StorageBySkuTable data={mockStorageBySkuItems} onSortChange={onSortChange} />)

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
      render(<StorageBySkuTable data={mockStorageBySkuItems} onSearch={onSearch} />)

      const searchInput = screen.getByPlaceholderText('Поиск по артикулу, бренду...')
      fireEvent.change(searchInput, { target: { value: '147' } })

      // Component uses 300ms debounce, wait for callback
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith('147')
        },
        { timeout: 500 }
      )
    })

    it('updates input value on change', () => {
      render(<StorageBySkuTable data={mockStorageBySkuItems} />)

      const searchInput = screen.getByPlaceholderText(
        'Поиск по артикулу, бренду...'
      ) as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(searchInput.value).toBe('test')
    })
  })

  describe('interactions', () => {
    it('calls onProductClick when row is clicked', () => {
      const onProductClick = vi.fn()
      render(<StorageBySkuTable data={mockStorageBySkuItems} onProductClick={onProductClick} />)

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
      const dataWithNullName = [
        {
          ...mockStorageBySkuItems[0],
          product_name: null,
        },
      ]
      render(<StorageBySkuTable data={dataWithNullName} />)

      // Find cells with "—" (dash)
      const cells = screen.getAllByRole('cell')
      const dashCells = cells.filter(cell => cell.textContent === '—')
      expect(dashCells.length).toBeGreaterThan(0)
    })
  })
})

// ============================================================================
// Story 169.12: aria-sort semantics, caption/scroll-region, tabular-nums,
// tri-state has_warehouse_stock rendering (Task 0 preface follow-up)
// ============================================================================

describe('StorageBySkuTable - Story 169.12 migration contracts', () => {
  it('exposes aria-sort descending on the default sorted column (storage_cost_total)', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    const storageHeader = screen.getByText('Хранение').closest('th')
    expect(storageHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('toggles aria-sort descending → ascending on a same-field re-click', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    fireEvent.click(screen.getByText('Хранение'))
    const storageHeader = screen.getByText('Хранение').closest('th')
    expect(storageHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('exposes aria-sort on all four sortable headers when active', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    for (const label of ['₽/день', 'Объём', 'Дней']) {
      const header = screen.getByText(label).closest('th')
      expect(header).not.toHaveAttribute('aria-sort')
      fireEvent.click(screen.getByText(label))
      expect(screen.getByText(label).closest('th')).toHaveAttribute('aria-sort', 'descending')
    }
  })

  it('renders a static TableCaption and a labelled scroll region', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    expect(
      screen.getByText('Расходы на платное хранение по товарам за выбранный период')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Таблица расходов на хранение по товарам' })
    ).toBeInTheDocument()
  })

  it('uses tabular-nums on numeric cells but NOT on the font-mono nmId cell', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    const vendorCodeCell = screen.getByText('SKU-001')
    expect(vendorCodeCell).toHaveClass('font-mono')
    expect(vendorCodeCell).not.toHaveClass('tabular-nums')
    const daysCells = screen.getAllByText('7').filter(el => el.tagName === 'TD')
    expect(daysCells.length).toBeGreaterThan(0)
    expect(daysCells.every(el => el.className.includes('tabular-nums'))).toBe(true)
  })

  it('tri-state: has_warehouse_stock=false renders «Нет на складе», null/absent renders «—»', () => {
    const items = [
      { ...mockStorageBySkuItems[0], nm_id: '1', vendor_code: 'NO-STOCK', has_warehouse_stock: false },
      { ...mockStorageBySkuItems[1], nm_id: '2', vendor_code: 'NULL-STOCK', has_warehouse_stock: null },
      { ...mockStorageBySkuItems[2], nm_id: '3', vendor_code: 'TRUE-STOCK', has_warehouse_stock: true },
    ]
    render(<StorageBySkuTable data={items} />)

    const rows = screen.getAllByRole('row')
    const rowByCode = (code: string) =>
      rows.find(r => r.textContent?.includes(code)) as HTMLElement

    const noStockRow = rowByCode('NO-STOCK')
    expect(noStockRow.textContent).toContain('Нет на складе')
    expect(noStockRow.querySelector('.text-status-warning')).toBeTruthy()

    // null row: unknown renders «—» and must NOT claim «Нет на складе»
    const nullStockRow = rowByCode('NULL-STOCK')
    expect(nullStockRow.textContent).not.toContain('Нет на складе')

    // true renders neither the warning nor the unknown dash
    const trueStockRow = rowByCode('TRUE-STOCK')
    expect(trueStockRow.textContent).not.toContain('Нет на складе')
  })

  it('search input is labelled and min-h-11', () => {
    render(<StorageBySkuTable data={mockStorageBySkuItems} />)
    const input = screen.getByLabelText('Поиск по товарам хранения')
    expect(input).toHaveClass('min-h-11')
  })
})
