/**
 * Export Dialog State Hook
 * Story 6.5-FE: Export Analytics UI
 *
 * Manages form state, effects, and handlers for ExportDialog.
 */

import { useState, useEffect } from 'react'
import { useExportAnalytics } from '@/hooks/useExportAnalytics'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import type { ExportType, ExportFormat } from '@/types/analytics'

interface UseExportDialogStateParams {
  open: boolean
  defaultType: ExportType
  defaultWeekStart?: string
  defaultWeekEnd?: string
  onOpenChange: (open: boolean) => void
}

export function useExportDialogState({
  open,
  defaultType,
  defaultWeekStart,
  defaultWeekEnd,
  onOpenChange,
}: UseExportDialogStateParams) {
  const lastCompletedWeek = getLastCompletedWeek()

  // Form state
  const [type, setType] = useState<ExportType>(defaultType)
  const [weekStart, setWeekStart] = useState(defaultWeekStart ?? lastCompletedWeek)
  const [weekEnd, setWeekEnd] = useState(defaultWeekEnd ?? lastCompletedWeek)
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [includeCogs, setIncludeCogs] = useState(true)

  // Export hook
  const { createExport, isCreating, status, reset, createError } = useExportAnalytics()

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      setType(defaultType)
      setWeekStart(defaultWeekStart ?? lastCompletedWeek)
      setWeekEnd(defaultWeekEnd ?? lastCompletedWeek)
      setFormat('xlsx')
      setIncludeCogs(true)
    }
  }, [open, defaultType, defaultWeekStart, defaultWeekEnd, lastCompletedWeek])

  // Auto-download when export completes
  useEffect(() => {
    if (status?.status === 'completed' && status.download_url) {
      const link = document.createElement('a')
      link.href = status.download_url
      link.download = ''
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [status])

  // Handle export submit
  const handleExport = () => {
    createExport({ type, weekStart, weekEnd, format, includeCogs })
  }

  // Handle dialog close
  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  // Handle retry
  const handleRetry = () => {
    reset()
  }

  // Handle date range change
  const handleRangeChange = (newStart: string, newEnd: string) => {
    setWeekStart(newStart)
    setWeekEnd(newEnd)
  }

  // Derived state
  const showForm = !status
  const showStatus = !!status
  const isCompleted = status?.status === 'completed'
  const isFailed = status?.status === 'failed'

  return {
    type,
    setType,
    weekStart,
    weekEnd,
    format,
    setFormat,
    includeCogs,
    setIncludeCogs,
    isCreating,
    status,
    createError,
    handleExport,
    handleClose,
    handleRetry,
    handleRangeChange,
    showForm,
    showStatus,
    isCompleted,
    isFailed,
  }
}
