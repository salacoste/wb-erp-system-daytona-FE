'use client'

import { useState, useCallback } from 'react'
import { validateBulkCogsAssignment, createBulkCogsItems } from '@/hooks/useBulkCogsAssignment'
import { useBulkCogsAssignmentWithPolling } from '@/hooks/useBulkCogsAssignmentWithPolling'
import { toast } from 'sonner'
import type { BulkCogsFormData } from './bulk-cogs.types'

interface UseBulkCogsSubmitOptions {
  selectedProducts: Set<string>
  onPreviewClose: () => void
  onShowResults: () => void
  onResetForm: () => void
  onClearSelection: () => void
  onSetSelection: (nmIds: string[]) => void
  onSuccess?: () => void
}

/**
 * Custom hook for bulk COGS submission logic
 * Story 4.2: Extracts mutate/retry/validation from main orchestrator
 */
export function useBulkCogsSubmit({
  selectedProducts,
  onPreviewClose,
  onShowResults,
  onResetForm,
  onClearSelection,
  onSetSelection,
  onSuccess,
}: UseBulkCogsSubmitOptions) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const {
    mutate,
    isPending,
    data: resultData,
    isPolling,
    pollingAttempts,
    pollingTimeout,
    pollingStrategy,
  } = useBulkCogsAssignmentWithPolling()

  const handleSubmit = useCallback(
    (formData: BulkCogsFormData) => {
      const items = createBulkCogsItems(
        Array.from(selectedProducts),
        parseFloat(formData.unit_cost_rub),
        formData.valid_from,
        { source: 'manual', notes: formData.notes || undefined }
      )

      const errs = validateBulkCogsAssignment(items)
      if (errs.length > 0) {
        setValidationErrors(errs)
        onPreviewClose()
        return
      }

      setValidationErrors([])

      mutate(
        { items },
        {
          onSuccess: response => {
            // F-34: response is the normalized BulkCogsResultSummary (fields top-level,
            // not under `.data`).
            if (!response || typeof response !== 'object' || !('succeeded' in response)) return
            const { succeeded, failed } = response as { succeeded: number; failed: number }

            onPreviewClose()
            onShowResults()

            if (failed === 0) {
              toast.success('Себестоимость назначена успешно', {
                description: `Обновлено: ${succeeded} товаров`,
              })
              onResetForm()
              onClearSelection()
              if (onSuccess) setTimeout(onSuccess, 2000)
            } else {
              toast.warning('Частичный успех', {
                description: `Успешно: ${succeeded}, Ошибок: ${failed}`,
              })
            }
          },
          onError: err => {
            onPreviewClose()
            toast.error('Ошибка при назначении себестоимости', {
              description: err instanceof Error ? err.message : 'Неизвестная ошибка',
            })
          },
        }
      )
    },
    [
      selectedProducts,
      mutate,
      onPreviewClose,
      onShowResults,
      onResetForm,
      onClearSelection,
      onSuccess,
    ]
  )

  const handleRetry = useCallback(() => {
    if (!resultData) return
    const failedNmIds = resultData.results.filter(r => !r.success).map(r => r.nm_id)
    onSetSelection(failedNmIds)
    toast.info('Выбраны только неудачные товары', {
      description: `Повторная попытка для ${failedNmIds.length} товаров`,
    })
  }, [resultData, onSetSelection])

  return {
    validationErrors,
    isPending,
    isPolling,
    resultData,
    pollingAttempts,
    pollingTimeout,
    pollingStrategy,
    handleSubmit,
    handleRetry,
  }
}
