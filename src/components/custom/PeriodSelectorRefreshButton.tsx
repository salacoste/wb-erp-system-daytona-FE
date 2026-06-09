'use client'

/**
 * Dashboard Period Selector - Refresh button with relative time
 * Extracted from DashboardPeriodSelector.tsx for file size compliance
 */

import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PeriodRefreshButtonProps {
  disabled: boolean
  isRefreshing: boolean
  relativeTime: string
  onRefresh: () => void
}

export function PeriodRefreshButton({
  disabled,
  isRefreshing,
  relativeTime,
  onRefresh,
}: PeriodRefreshButtonProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={disabled || isRefreshing}
        aria-label="Обновить данные"
        data-testid="refresh-button"
      >
        <RefreshCw
          data-testid={isRefreshing ? 'refresh-spinner' : 'refresh-icon'}
          className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
        />
      </Button>
      <span className="text-sm text-muted-foreground" data-testid="last-updated">
        Обновлено: {relativeTime}
      </span>
    </div>
  )
}
