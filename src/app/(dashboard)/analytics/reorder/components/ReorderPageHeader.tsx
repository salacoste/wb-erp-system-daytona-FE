/**
 * Reorder Dashboard page header with breadcrumbs and refresh button.
 */

'use client'

import { RefreshCw, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReorderPageHeaderProps {
  isRefreshing: boolean
  onRefresh: () => void
}

export function ReorderPageHeader({ isRefreshing, onRefresh }: ReorderPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Дашборд пополнения
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Рекомендации по пополнению запасов на складах Wildberries
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        Обновить
      </Button>
    </div>
  )
}
