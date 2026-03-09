'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, CheckSquare, AlertCircle } from 'lucide-react'

interface BulkCogsSearchProps {
  search: string
  onSearchChange: (value: string) => void
}

/**
 * Search bar for bulk COGS product filtering
 * Story 4.2: Bulk COGS Assignment Capability
 */
export function BulkCogsSearch({ search, onSearchChange }: BulkCogsSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Поиск по артикулу или названию..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}

/** Loading skeleton for bulk COGS form */
export function BulkCogsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

interface BulkCogsErrorStateProps {
  error: unknown
  onRetry: () => void
}

/** Error state with retry button */
export function BulkCogsErrorState({ error, onRetry }: BulkCogsErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{error instanceof Error ? error.message : 'Ошибка загрузки товаров'}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface BulkCogsEmptyStateProps {
  search: string
  onSearchChange: (value: string) => void
}

/** Empty state when no products found (search or all have COGS) */
export function BulkCogsEmptyState({ search, onSearchChange }: BulkCogsEmptyStateProps) {
  return (
    <div className="space-y-4">
      <BulkCogsSearch search={search} onSearchChange={onSearchChange} />

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <CheckSquare className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Товары не найдены</h3>
        <p className="text-sm text-gray-500">
          {search ? 'Попробуйте изменить условия поиска' : 'Все товары уже имеют себестоимость'}
        </p>
      </div>
    </div>
  )
}
