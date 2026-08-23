/**
 * PipelineStatusGrid — Grid of 11 pipeline cards grouped by category
 * Epic 68-FE (Story 68.2)
 * Pattern: Categorized grid with status badges, accessible text+icon labels
 * @see Story 93.1-FE — STATUS_COLORS/STATUS_LABELS extracted to @/lib/monitoring-constants
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle } from 'lucide-react'
import { cn, formatPercentageInt } from '@/lib/utils'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'
import type { DashboardPipeline, PipelineCategory } from '../types/monitoring'

interface PipelineStatusGridProps {
  pipelines: DashboardPipeline[] | undefined
  isLoading: boolean
}

const STATUS_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  stale: 2,
  healthy: 3,
  no_data: 4,
}

const CATEGORY_TITLES: Record<PipelineCategory, string> = {
  high_frequency: 'Высокочастотные',
  daily: 'Ежедневные',
  weekly: 'Еженедельные',
}

const CATEGORY_ORDER: PipelineCategory[] = ['high_frequency', 'daily', 'weekly']

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return '—'
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч назад`
  return `${Math.floor(diffHours / 24)} дн назад`
}

function sortPipelines(items: DashboardPipeline[]): DashboardPipeline[] {
  return [...items].sort((a, b) => (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4))
}

export function PipelineStatusGrid({ pipelines, isLoading }: PipelineStatusGridProps) {
  if (isLoading) return <PipelineStatusGridSkeleton />
  if (!pipelines?.length) return null

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    title: CATEGORY_TITLES[cat],
    items: sortPipelines(pipelines.filter(p => p.category === cat)),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-6" role="region" aria-label="Статус пайплайнов">
      {grouped.map(group => (
        <section key={group.category} aria-label={group.title}>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{group.title}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map(p => (
              <PipelineCard key={p.pipelineId} pipeline={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function PipelineCard({ pipeline }: { pipeline: DashboardPipeline }) {
  const {
    displayName,
    status,
    lastSuccessAt,
    dataLagDisplay,
    successRate24h,
    errorRate,
    tasksWithErrors,
    totalResultErrors,
  } = pipeline
  const label = STATUS_LABELS[status]
  const colorClass = STATUS_COLORS[status]
  const rate = Math.round(successRate24h * 100)
  const ratePct = formatPercentageInt(rate)
  // Gate on >= 1% to avoid showing "0%" badge for tiny error rates (e.g., 0.004 → rounds to 0).
  // @see Story 91.3-FE — errorRate threshold origin (review-time cutoff for tiny fractional rates).
  // iter-89: errorRate is OPTIONAL — the live /dashboard endpoint omits it (only the grid endpoint
  // sends it; request #201). `?? 0` keeps the badge hidden (not `undefined >= 0.01`) until it lands.
  const hasErrors = (errorRate ?? 0) >= 0.01

  return (
    <Card className="p-3" role="article" aria-label={`${displayName}: ${label}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{displayName}</span>
        <div className="flex items-center gap-1.5">
          {/* Story 91.3-FE: amber error-rate indicator when errorRate >= 1% (sub-1% gated out) */}
          {hasErrors && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-500 text-amber-700 text-xs px-1.5"
                >
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {Math.round((errorRate ?? 0) * 100)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent size="sm">
                <p>
                  {tasksWithErrors ?? 0} задач с ошибками ({totalResultErrors ?? 0} ошибок всего)
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn('shrink-0 whitespace-nowrap', colorClass)}>{label}</Badge>
            </TooltipTrigger>
            <TooltipContent size="sm">
              <p>Статус: {label}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{dataLagDisplay ?? formatRelativeTime(lastSuccessAt)}</span>
        <span aria-label={`Успешность за 24ч: ${ratePct}`}>{ratePct}</span>
      </div>

      {/* Mini progress bar for successRate24h */}
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Успешность выполнения: ${ratePct}`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
    </Card>
  )
}

function PipelineStatusGridSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      {CATEGORY_ORDER.map(cat => (
        <div key={cat}>
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: cat === 'daily' ? 5 : 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
