/**
 * CogsHistoryTable cell components and formatters
 * Extracted from CogsHistoryTable.tsx for file size compliance
 * Story 5.1-fe: View COGS History
 */

'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { CogsHistoryItem, CogsSource } from '@/types/cogs'
// BD-13 DRY: source → {icon,label} lives in ONE place now. Adding a backend source is a
// single edit there (+ the CogsSource union) instead of three synchronized maps.
import { COGS_SOURCE_CONFIG as sourceConfig } from '@/lib/cogs-source-config'

/** Format date to Russian locale (AC: 4) */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Текущий'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/** Format currency to Russian locale (AC: 4) */
export function formatCurrency(value: number): string {
  // The cogs-history normalizer maps an invalid/missing backend cost to NaN as its honest
  // "invalid" sentinel (NOT 0 — anti-pattern #8). Surface that as "—", never "не число ₽".
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Source cell with icon and tooltip (AC: 8). tabIndex={0} so keyboard users can focus the
 * trigger and read the source-provenance tooltip (a11y — Review 2 MEDIUM). */
export function SourceCell({ source }: { source: CogsSource }) {
  const config = sourceConfig[source] || sourceConfig.manual
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-lg" tabIndex={0}>
            {config.icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Actions dropdown (AC: 17, 18, 19). For МойСклад-synced rows the actions are disabled with
 * an explanatory label instead of hidden — keeps the row's affordance shape and explains WHY
 * (BD-13 follow-up, Review 2 MEDIUM): the next sync closes this version + writes a new one
 * (moysklad-sync.service.ts → CogsService.createCogs), so local edit/delete is futile. */
export function ActionsDropdown({
  record,
  onEdit,
  onDelete,
}: {
  record: CogsHistoryItem
  onEdit: (record: CogsHistoryItem) => void
  onDelete: (record: CogsHistoryItem) => void
}) {
  const managedByMoysklad = record.source === 'moysklad'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {managedByMoysklad && (
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Управляется МойСклад — изменение или удаление отменятся следующей синхронизацией
          </DropdownMenuLabel>
        )}
        <DropdownMenuItem onClick={() => onEdit(record)} disabled={managedByMoysklad}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(record)}
          disabled={managedByMoysklad}
          className={managedByMoysklad ? undefined : 'text-destructive focus:text-destructive'}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
