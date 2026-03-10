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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { CogsHistoryItem } from '@/types/cogs'

/** Source icon configuration (UX Decision from Story 5.1-fe) */
const sourceConfig: Record<string, { icon: string; label: string }> = {
  manual: { icon: '\u270F\uFE0F', label: 'Ручной ввод' },
  import: { icon: '\uD83D\uDCE5', label: 'Импорт из файла' },
  system: { icon: '\u2699\uFE0F', label: 'Системный пересчёт' },
}

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
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Source cell with icon and tooltip (AC: 8) */
export function SourceCell({ source }: { source: 'manual' | 'import' | 'system' }) {
  const config = sourceConfig[source] || sourceConfig.manual
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-lg">{config.icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** Actions dropdown (AC: 17, 18, 19) */
export function ActionsDropdown({
  record,
  onEdit,
  onDelete,
}: {
  record: CogsHistoryItem
  onEdit: (record: CogsHistoryItem) => void
  onDelete: (record: CogsHistoryItem) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Открыть меню</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(record)}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(record)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
