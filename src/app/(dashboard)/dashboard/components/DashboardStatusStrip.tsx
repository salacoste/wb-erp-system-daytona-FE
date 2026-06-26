'use client'

/**
 * DashboardStatusStrip — consolidates the 8 conditional dashboard banners into
 * ONE slim, expandable status line (TZ-1).
 *
 * Collapsed: a single line — highest-severity icon + "N элементов требуют внимания"
 * + expand toggle. Expanded: the real banner components (passed as children) render
 * in place, so every message, CTA, and dismiss affordance is preserved exactly.
 *
 * The children stay mounted (toggled via the `hidden` attribute, not unmounted) so
 * banner component state and any DOM-based test assertions are preserved.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-1)
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, AlertCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusSeverity } from './dashboard-status'

interface SeverityMeta {
  icon: LucideIcon
  /** border + bg + text tone classes for the strip container. */
  tone: string
}

const SEVERITY_META: Record<StatusSeverity, SeverityMeta> = {
  failed: { icon: AlertCircle, tone: 'border-red-200 bg-red-50 text-red-900' },
  error: { icon: AlertCircle, tone: 'border-red-200 bg-red-50 text-red-900' },
  processing: { icon: RefreshCw, tone: 'border-blue-200 bg-blue-50 text-blue-900' },
  dataGaps: { icon: AlertTriangle, tone: 'border-yellow-200 bg-yellow-50 text-yellow-900' },
  missingCogs: { icon: AlertTriangle, tone: 'border-yellow-200 bg-yellow-50 text-yellow-900' },
  tax: { icon: AlertTriangle, tone: 'border-yellow-200 bg-yellow-50 text-yellow-900' },
  incompleteWeek: { icon: Clock, tone: 'border-blue-200 bg-blue-50 text-blue-900' },
  reportPending: { icon: Clock, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
}

/** Russian pluralization: "N элемент(а/ов) требу(ет/ют) внимания". */
export function formatAttentionCount(count: number): string {
  const abs = Math.abs(count) % 100
  const lastDigit = abs % 10
  const noun =
    abs >= 11 && abs <= 14
      ? 'элементов'
      : lastDigit === 1
        ? 'элемент'
        : lastDigit >= 2 && lastDigit <= 4
          ? 'элемента'
          : 'элементов'
  // Verb agreement: plural "требуют", except singular "требует" only for lastDigit===1
  // that is NOT in the 11-14 exception group (e.g. 1, 21, 31 → "требует"; 11 → "требуют").
  const verb = (abs >= 11 && abs <= 14) || lastDigit !== 1 ? 'требуют' : 'требует'
  return `${count} ${noun} ${verb} внимания`
}

export interface DashboardStatusStripProps {
  /** Number of active alerts (collapsed summary count). */
  count: number
  /** Highest active severity — drives the icon + tone. */
  severity: StatusSeverity
  /** The real banner components, rendered inside the expanded region. */
  children: ReactNode
  className?: string
}

export function DashboardStatusStrip({
  count,
  severity,
  children,
  className,
}: DashboardStatusStripProps): React.ReactElement | null {
  // Urgent failed/error states default OPEN so their inner `role="alert"` banners are
  // visible and announced on first paint (the detail region is only NOT `hidden` when
  // open). Non-urgent severities collapse by default — the density win. (TZ-1 a11y review.)
  const [open, setOpen] = useState(severity === 'failed' || severity === 'error')

  if (count <= 0) return null

  const meta = SEVERITY_META[severity]
  const Icon = meta.icon

  return (
    <section className={cn('rounded-lg border', meta.tone, className)} aria-label="Статус данных">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-controls="dashboard-status-detail"
        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium"
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{formatAttentionCount(count)}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      <div id="dashboard-status-detail" hidden={!open} className="space-y-2 px-4 pb-3 pt-1">
        {children}
      </div>
    </section>
  )
}
