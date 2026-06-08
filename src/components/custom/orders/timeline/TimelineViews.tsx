/**
 * WB Timeline grouped/flat views + skeleton
 * Extracted from WbTimelineEntry.tsx for file size compliance
 */

'use client'

import {
  Plus,
  Package,
  Warehouse,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  HelpCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WbHistoryEntry } from '@/types/orders-history'
import type { WbStatusCategory } from '@/lib/wb-status-mapping'
import { WB_STATUS_CATEGORY_LABELS } from '@/lib/wb-status-mapping'
import { WbTimelineEntry } from './WbTimelineEntry'
import { groupWbEntriesByCategory } from './timeline-utils'

const CATEGORY_ICONS: Record<WbStatusCategory, React.ComponentType<{ className?: string }>> = {
  creation: Plus,
  seller_processing: Package,
  warehouse: Warehouse,
  logistics: Truck,
  delivery: CheckCircle,
  cancellation: XCircle,
  return: RotateCcw,
  other: HelpCircle,
}

export function CategorySection({
  category,
  compact,
  children,
}: {
  category: WbStatusCategory
  compact: boolean
  children: React.ReactNode
}) {
  const Icon = CATEGORY_ICONS[category]
  const label = WB_STATUS_CATEGORY_LABELS[category]

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 text-muted-foreground mb-2',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium">{label}</span>
      </div>
      <ol role="list" aria-label={label} className="ml-4 space-y-1">
        {children}
      </ol>
    </div>
  )
}

export function GroupedTimeline({
  entries,
  compact,
}: {
  entries: WbHistoryEntry[]
  compact: boolean
}) {
  const groups = groupWbEntriesByCategory(entries)

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <CategorySection key={group.category} category={group.category} compact={compact}>
          {group.entries.map((entry, idx) => (
            <WbTimelineEntry
              key={entry.id}
              entry={entry}
              isLast={idx === group.entries.length - 1}
              compact={compact}
            />
          ))}
        </CategorySection>
      ))}
    </div>
  )
}

export function FlatTimeline({
  entries,
  compact,
}: {
  entries: WbHistoryEntry[]
  compact: boolean
}) {
  return (
    <ol role="list" aria-label="WB история статусов" className="ml-4 space-y-1">
      {entries.map((entry, idx) => (
        <WbTimelineEntry
          key={entry.id}
          entry={entry}
          isLast={idx === entries.length - 1}
          compact={compact}
        />
      ))}
    </ol>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-md" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
