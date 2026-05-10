'use client'

/**
 * SourceBadge — reusable source-attribution badge for buyout/returns rows.
 * Story 96.15-FE — distinguishes SDK-reconciled rows from heuristic-derived rows.
 *
 * Used by Epic 71-73 buyout/returns surfaces (BuyoutSummaryWidget, ReconciliationTable).
 * Placed in src/components/custom/badges/ (new subfolder) for future cross-feature reuse.
 *
 * A11y per Story 96.10 M2-1 + 96.14 M2-2 lessons:
 * - NO `role="button"` on tooltip trigger (no click handler — focus-based disclosure).
 * - `tabIndex={0}` + `aria-label` for keyboard + screen-reader accessibility.
 *
 * 1st-pass review fixes (H-1, L-1, M-3):
 * - H-1: 'blended' label unified to "Комбинированный" (matches BuyoutPageContent dropdown).
 * - L-1: data-testid suffixed with source value to prevent multi-row collision.
 * - M-3: 'unknown' variant added for Story 96.14 parity; renders AlertTriangle indicator.
 *
 * @see src/types/analytics-buyout.ts — BuyoutSource enum
 * @see src/app/(dashboard)/analytics/buyout-reconciliation/components/AnomalyIndicator.tsx
 *   (canonical a11y precedent for focus-based tooltip disclosure)
 * @see CLAUDE.md § Defensive Frontend Principle
 */

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { BuyoutSource } from '@/types/analytics-buyout'

// ---------------------------------------------------------------------------
// Source config map
// ---------------------------------------------------------------------------

const SOURCE_CONFIG: Record<BuyoutSource, { label: string; className: string; tooltip: string }> = {
  sdk_reconciliation: {
    label: 'SDK',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    tooltip: 'Источник: SDK-сверка (наивысшая точность)',
  },
  weekly: {
    label: 'Недельный',
    className: 'bg-gray-100 text-gray-700 border-gray-300',
    tooltip: 'Источник: недельный отчёт WB',
  },
  realtime: {
    label: 'Realtime',
    className: 'bg-green-100 text-green-700 border-green-300',
    tooltip: 'Источник: данные в реальном времени',
  },
  // H-1 fix: unified label "Комбинированный" matches BuyoutPageContent.tsx dropdown (line 37).
  // Previously "Сводный" — inconsistent with the selector the user sees.
  blended: {
    label: 'Комбинированный',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
    tooltip: 'Источник: комбинированный (смешанный)',
  },
  // M-3 fix: 'unknown' fallback for Story 96.14 parity with BuyoutReconciliationSource.
  // Backend may return an unrecognized source variant — treat as anomaly per Defensive Frontend
  // Principle. AlertTriangle rendered inline when source === 'unknown'.
  unknown: {
    label: 'Неизвестен',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
    tooltip: 'Источник не распознан',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SourceBadgeProps {
  source: BuyoutSource
}

export const SourceBadge = memo(function SourceBadge({ source }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source]

  // M2-2 fix: TooltipProvider dropped from per-badge render — relies on app-root TooltipProvider
  // (verified present per Story 96.13). N badges in a table = N fewer providers.
  // Tests use renderWithProviders() which wraps with TooltipProvider per test-utils convention.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* focus-based tooltip disclosure (NOT click): tabIndex={0} + aria-label.
            Story 96.10 M2-1 + Story 96.14 M2-2 lesson: no role="button" on non-interactive span. */}
        {/* L-1 fix: data-testid suffixed with source value — no multi-row collision in tables. */}
        <span
          tabIndex={0}
          aria-label={config.tooltip}
          className={cn(
            'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
            config.className
          )}
          data-testid={`source-badge-${source}`}
        >
          {/* M-3: AlertTriangle indicator for 'unknown' source (Defensive Frontend Principle). */}
          {source === 'unknown' && (
            <AlertTriangle className="h-3 w-3 text-gray-500" aria-hidden="true" />
          )}
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})
