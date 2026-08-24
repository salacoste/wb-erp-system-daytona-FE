'use client'

import { useState, useCallback } from 'react'
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

  // Handle status updates from polling
  if (importState.status === 'processing' && statusData) {
    if (statusData.status === 'completed') {
      setImportState({
        status: 'success',
        rowsImported: statusData.rows_imported || 0,
      })
      invalidateQueries()
    } else if (statusData.status === 'failed') {
      setImportState({
        status: 'error',
        message: statusData.error_message || 'Ошибка импорта',
      })
    }
    // Story 169.12 Task 0: 'unknown' (unrecognized backend status) and 'pending'
    // intentionally fall through — the poll keeps running, mirroring 'pending'
    // handling. The dialog's close-confirmation is the natural terminal guard;
    // only an explicit 'failed' is an error (Defensive Frontend: indicate, never
    // coerce — previously unknown was coerced to 'failed' at the normalizer,
    // rendering a false import error).
  }

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
    const defaults = getDefaultDates()
    setDateFrom(defaults.from)
    setDateTo(defaults.to)
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
