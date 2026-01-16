'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { StorageBySkuItem } from '@/types/storage-analytics'
import { WarehouseBadges } from './WarehouseBadges'

/**
 * Storage by SKU Table
 * Story 24.3-FE: Storage by SKU Table
 * Epic 24: Paid Storage Analytics (Frontend)
 */

type SortField = 'storage_cost_total' | 'storage_cost_avg_daily' | 'volume_avg' | 'days_stored'
type SortOrder = 'asc' | 'desc'

interface StorageBySkuTableProps {
  data: StorageBySkuItem[]
  isLoading?: boolean
  onProductClick?: (nmId: string) => void
  onSortChange?: (field: SortField, order: SortOrder) => void
  onSearch?: (query: string) => void
}

// Debounce delay for search input (ms)
const SEARCH_DEBOUNCE_MS = 300

export function StorageBySkuTable({
  data,
  isLoading = false,
  onProductClick,
  onSortChange,
  onSearch,
}: StorageBySkuTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>('storage_cost_total')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      onSearch?.(searchQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  // Create case-insensitive regex for filtering (like SQL LIKE %query%)
  const createSearchRegex = useCallback((query: string): RegExp | null => {
    if (!query.trim()) return null
    try {
      // Escape special regex characters and create case-insensitive pattern
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(escaped, 'i')
    } catch {
      return null
    }
  }, [])

  // Filter and sort data locally
  const filteredAndSortedData = useMemo(() => {
    if (!data || data.length === 0) return data

    let result = [...data]

    // Apply search filter with regex (like SQL LIKE %query%)
    const regex = createSearchRegex(debouncedQuery)
    if (regex) {
      result = result.filter((item) => {
        // Search across multiple fields: vendor_code, nm_id, product_name, brand
        const searchableText = [
          item.vendor_code,
          item.nm_id,
          item.product_name,
          item.brand,
        ]
          .filter(Boolean)
          .join(' ')

        return regex.test(searchableText)
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField] ?? 0
      const bValue = b[sortField] ?? 0

      if (sortOrder === 'asc') {
        return aValue - bValue
      }
      return bValue - aValue
    })

    return result
  }, [data, debouncedQuery, sortField, sortOrder, createSearchRegex])

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format volume
  const formatVolume = (value: number | null): string => {
    if (value === null) return '—'
    return `${value.toFixed(1)} л`
  }

  // Handle sort click
  const handleSort = (field: SortField) => {
    const newOrder = sortField === field && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortOrder(newOrder)
    onSortChange?.(field, newOrder)
  }

  // Handle row click
  const handleRowClick = (nmId: string) => {
    if (onProductClick) {
      onProductClick(nmId)
    } else {
      router.push(`/analytics/sku?nm_id=${nmId}`)
    }
  }

  // Handle search input change (debounce is handled by useEffect)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />
    }
    return sortOrder === 'desc' ? (
      <ArrowDown className="h-4 w-4 ml-1" />
    ) : (
      <ArrowUp className="h-4 w-4 ml-1" />
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(7)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input with result count */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по артикулу, бренду..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        {debouncedQuery && (
          <span className="text-sm text-muted-foreground">
            Найдено: {filteredAndSortedData.length} из {data.length}
          </span>
        )}
      </div>

      {/* Table with horizontal scroll for mobile (UX Decision Q7) */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Артикул</TableHead>
              <TableHead className="w-[150px]">Название</TableHead>
              <TableHead className="w-[120px]">Бренд</TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort('storage_cost_total')}
                >
                  Хранение
                  {getSortIcon('storage_cost_total')}
                </Button>
              </TableHead>
              <TableHead className="w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort('storage_cost_avg_daily')}
                >
                  ₽/день
                  {getSortIcon('storage_cost_avg_daily')}
                </Button>
              </TableHead>
              <TableHead className="w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort('volume_avg')}
                >
                  Объём
                  {getSortIcon('volume_avg')}
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Склады</TableHead>
              <TableHead className="w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto font-medium hover:bg-transparent"
                  onClick={() => handleSort('days_stored')}
                >
                  Дней
                  {getSortIcon('days_stored')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {debouncedQuery ? 'Ничего не найдено' : 'Нет товаров с данными о хранении'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((item) => (
                <TableRow
                  key={item.nm_id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(item.nm_id)}
                >
                  <TableCell className="font-mono text-sm" title={`nmId: ${item.nm_id}`}>
                    {item.vendor_code || item.nm_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.product_name || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{item.brand || '—'}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.storage_cost_total)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatCurrency(item.storage_cost_avg_daily)}
                  </TableCell>
                  <TableCell className="text-sm">{formatVolume(item.volume_avg)}</TableCell>
                  <TableCell>
                    <WarehouseBadges warehouses={item.warehouses} maxVisible={2} />
                  </TableCell>
                  <TableCell className="text-sm">{item.days_stored}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
