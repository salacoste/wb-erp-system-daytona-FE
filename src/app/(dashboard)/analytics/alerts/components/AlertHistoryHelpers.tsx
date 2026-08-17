'use client'

/**
 * Alert history helpers — status badge, message parser, constants
 * Extracted from AlertHistoryTable.tsx for file size compliance
 */

import { Badge } from '@/components/ui/badge'

/**
 * Static status tone map (shadcn semantic tokens) — no runtime
 * class interpolation (JIT-invisible defect #14).
 */
export const statusStyles: Record<string, string> = {
  sent: 'bg-status-success/15 text-status-success',
  pending: 'bg-status-warning/15 text-status-warning',
  failed: 'bg-status-error/15 text-status-error',
}

export const statusLabels: Record<string, string> = {
  sent: 'Отправлено',
  pending: 'В очереди',
  failed: 'Ошибка',
}

export const STATUS_OPTIONS = ['sent', 'pending', 'failed'] as const

/** Parsed structure of messageText JSON */
interface ParsedMessage {
  title?: string
  message?: string
  severity?: string
  nmId?: number
  metadata?: Record<string, unknown>
}

export function parseMessage(raw: string): { title: string; message: string } {
  try {
    const parsed: ParsedMessage = JSON.parse(raw)
    return {
      title: parsed.title ?? '',
      message: parsed.message ?? '',
    }
  } catch {
    return { title: raw, message: '' }
  }
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? 'bg-muted text-muted-foreground'
  const label = statusLabels[status] ?? status
  return (
    <Badge className={style} variant="outline">
      {label}
    </Badge>
  )
}
