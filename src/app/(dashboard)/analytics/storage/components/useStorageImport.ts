'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  usePaidStorageImport,
  useImportStatus,
  useInvalidateStorageQueries,
} from '@/hooks/useStorageAnalytics'
import type { ImportStatusResponse } from '@/types/storage-analytics'
import { getDefaultDates, validateDates } from './storage-import-utils'
import type { ImportState } from './storage-import-utils'

/**
 * Custom hook for storage import state machine, mutation handlers,
 * and polling logic.
 * Story 24.6-FE: Manual Import UI
 * Epic 24: Paid Storage Analytics (Frontend)
 */

interface UseStorageImportReturn {
  dateFrom: string
  dateTo: string
  setDateFrom: (date: string) => void
  setDateTo: (date: string) => void
  importState: ImportState
  showCloseConfirm: boolean
  setShowCloseConfirm: (show: boolean) => void
  validationError: string | null
  statusData: ImportStatusResponse | undefined
  isPending: boolean
  handleStartImport: () => Promise<void>
  handleClose: () => void
  handleConfirmClose: () => void
  handleReset: () => void
}

export function useStorageImport(onOpenChange: (open: boolean) => void): UseStorageImportReturn {
  const defaultDates = getDefaultDates()
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [importState, setImportState] = useState<ImportState>({
    status: 'idle',
  })
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const importMutation = usePaidStorageImport()
  const invalidateQueries = useInvalidateStorageQueries()

  // Poll import status
  const { data: statusData } = useImportStatus(
    importState.status === 'processing' ? importState.importId : null,
    {
      refetchInterval: importState.status === 'processing' ? 2000 : false,
    }
  )

  // Handle terminal polling updates after render. Pending, processing, and the
  // frontend-only unknown sentinel intentionally keep polling.
  useEffect(() => {
    if (importState.status !== 'processing' || !statusData) return

    if (statusData.status === 'completed') {
      setImportState({
        status: 'success',
        rowsImported: statusData.rows_imported,
      })
      invalidateQueries()
    } else if (statusData.status === 'failed') {
      setImportState({
        status: 'error',
        code: statusData.error?.code,
        message: statusData.error?.message || statusData.error_message || 'Ошибка импорта',
      })
    }
  }, [importState.status, invalidateQueries, statusData])

  const validationError = validateDates(dateFrom, dateTo)

  const handleStartImport = useCallback(async () => {
    if (validationError) return

    try {
      const result = await importMutation.mutateAsync({
        dateFrom,
        dateTo,
      })
      setImportState({ status: 'processing', importId: result.import_id })
    } catch (error) {
      setImportState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Ошибка запуска импорта',
      })
    }
  }, [dateFrom, dateTo, validationError, importMutation])

  const handleClose = useCallback(() => {
    if (importState.status === 'processing') {
      setShowCloseConfirm(true)
    } else {
      setImportState({ status: 'idle' })
      onOpenChange(false)
    }
  }, [importState.status, onOpenChange])

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false)
    setImportState({ status: 'idle' })
    onOpenChange(false)
  }, [onOpenChange])

  const handleReset = useCallback(() => {
    setImportState({ status: 'idle' })
  }, [])

  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    importState,
    showCloseConfirm,
    setShowCloseConfirm,
    validationError,
    statusData,
    isPending: importMutation.isPending,
    handleStartImport,
    handleClose,
    handleConfirmClose,
    handleReset,
  }
}
