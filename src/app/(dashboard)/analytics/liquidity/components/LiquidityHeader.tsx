'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/product/PageHeader'
import { cn } from '@/lib/utils'

interface LiquidityHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated?: Date
}

/**
 * Liquidity page header with title and refresh control
 * Epic 7: Liquidity Analysis
 *
 * Story 169.10: migrated to the shared PageHeader composition (title /
 * description / actions). The decorative Droplets icon was dropped — PageHeader
 * has no icon slot (169.9 precedent), the route keeps a single text h1.
 */
export function LiquidityHeader({ onRefresh, isRefreshing, lastUpdated }: LiquidityHeaderProps) {
  return (
    <PageHeader
      title="Ликвидность товаров"
      description="Анализ оборачиваемости запасов и замороженного капитала"
      actions={
        <>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Обновлено:{' '}
              {lastUpdated.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Обновить
          </Button>
        </>
      }
    />
  )
}
