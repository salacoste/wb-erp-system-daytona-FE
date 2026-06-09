'use client'

import { Button } from '@/components/ui/button'
import { GitCompare } from 'lucide-react'

interface AnalyticsPageHeaderProps {
  viewMode: string
  weekCount: number
  onCycleViewMode: () => void
}

/** Analytics hub page header with title and view-mode toggle */
export function AnalyticsPageHeader({
  viewMode,
  weekCount,
  onCycleViewMode,
}: AnalyticsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика</h1>
        <p className="text-muted-foreground mt-1">
          {viewMode === 'multi' && weekCount > 1
            ? `Агрегированные данные за ${weekCount} ${weekCount >= 2 && weekCount <= 4 ? 'недели' : 'недель'}`
            : 'Выберите раздел аналитики или просмотрите финансовую сводку ниже'}
        </p>
      </div>
      <Button
        variant={viewMode !== 'single' ? 'default' : 'outline'}
        size="sm"
        onClick={onCycleViewMode}
        className="gap-2"
      >
        <GitCompare className="h-4 w-4" />
        {viewMode === 'single' && 'Несколько периодов'}
        {viewMode === 'multi' && 'Сравнить периоды'}
        {viewMode === 'comparison' && 'Один период'}
      </Button>
    </div>
  )
}
