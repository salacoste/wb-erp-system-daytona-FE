/**
 * Utility functions for Paid Storage Import Dialog
 * Story 24.6-FE: Manual Import UI
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Pure data/config — no 'use client' needed.
 */

/** Import state machine type */
export type ImportState =
  | { status: 'idle' }
  | { status: 'processing'; importId: string }
  | { status: 'success'; rowsImported: number | undefined }
  | { status: 'error'; message: string; code?: string }

/** Format date string for Russian locale display */
export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Get default date range (last 7 days ending yesterday) */
export const getDefaultDates = (): { from: string; to: string } => {
  const today = new Date()
  const to = new Date(today)
  to.setDate(to.getDate() - 1) // Yesterday
  const from = new Date(to)
  from.setDate(from.getDate() - 6) // 7 days range

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

/** Validate date range, returns error message or null */
export const validateDates = (from: string, to: string): string | null => {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (fromDate > toDate) {
    return 'Дата "С" должна быть раньше даты "По"'
  }

  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (diffDays > 8) {
    return `Максимальный период: 8 дней (выбрано: ${diffDays})`
  }

  if (toDate > today) {
    return 'Нельзя импортировать будущие даты'
  }

  return null
}
