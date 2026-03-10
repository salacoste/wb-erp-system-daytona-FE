'use client'

import { Megaphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ============================================================================
// Widget Skeleton Component
// ============================================================================

export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('p-4', className)} data-testid="advertising-skeleton">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t">
        <Skeleton className="h-4 w-32" />
      </div>
    </Card>
  )
}

// ============================================================================
// Widget Error State
// ============================================================================

interface WidgetErrorProps {
  className?: string
  onRetry: () => void
}

export function WidgetError({ className, onRetry }: WidgetErrorProps) {
  return (
    <Card className={cn('p-4', className)} data-testid="advertising-widget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Реклама</h3>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ошибка загрузки данных</span>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    </Card>
  )
}
