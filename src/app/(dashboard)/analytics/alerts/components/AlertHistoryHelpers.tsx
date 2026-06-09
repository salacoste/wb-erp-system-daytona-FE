'use client'

/**
 * Alert history helpers — status badge, message parser, constants
 * Extracted from AlertHistoryTable.tsx for file size compliance
 */

import { Badge } from '@/components/ui/badge'

export const statusStyles: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
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
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-800'
  const label = statusLabels[status] ?? status
  return (
    <Badge className={style} variant="outline">
      {label}
    </Badge>
  )
}
