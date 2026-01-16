'use client'

import { RefreshCw, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LiquidityHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated?: Date
}

/**
 * Liquidity page header with title and refresh button
 * Epic 7: Liquidity Analysis
 */
export function LiquidityHeader({
  onRefresh,
  isRefreshing,
  lastUpdated,
}: LiquidityHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Ликвидность товаров</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Анализ оборачиваемости запасов и замороженного капитала
        </p>
      </div>

      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Обновить
        </Button>
      </div>
    </div>
  )
}
