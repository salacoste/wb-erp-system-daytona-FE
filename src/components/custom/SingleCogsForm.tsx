'use client'

// ============================================================================
// Single COGS Form - Orchestrator
// Story 4.1: Single Product COGS Assignment Interface
// Epic 74-FE: Refactored for file size compliance (was 431 lines)
// Sub-components: single-cogs/SingleCogsFormFields, FormStatus, FormActions
// ============================================================================

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { validateCogsAssignment, formatCogs } from '@/hooks/useSingleCogsAssignment'
import { useSingleCogsAssignmentWithPolling } from '@/hooks/useSingleCogsAssignmentWithPolling'
import { isCogsAfterLastCompletedWeek, getLastCompletedWeek } from '@/lib/margin-helpers'
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'
import { useAuthStore } from '@/stores/authStore'
import { SingleCogsFormFields } from './single-cogs/SingleCogsFormFields'
import { SingleCogsFormStatus } from './single-cogs/SingleCogsFormStatus'
import { SingleCogsFormActions } from './single-cogs/SingleCogsFormActions'
import { ProductInfoCard } from './single-cogs/ProductInfoCard'
import type { CogsAssignmentRequest } from '@/types/api'
import type { CogsRecord } from '@/types/cogs'

/**
 * Story 23.10: Role-based access control for task enqueue
 * Manager+ (Owner, Manager, Service) can trigger recalculation
 * Analyst cannot - button is hidden
 */
function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}

export interface SingleCogsFormProps {
  nmId: string
  productName?: string
  existingCogs?: CogsRecord
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormData {
  unit_cost_rub: string
  valid_from: string
  notes: string
}

/**
 * Single product COGS assignment form
 * Story 4.1: Single Product COGS Assignment Interface
 */
export function SingleCogsForm({
  nmId,
  productName,
  existingCogs,
  onSuccess,
  onCancel,
}: SingleCogsFormProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { mutate, isPending, isSuccess, error, isPolling, pollingAttempts, pollingTimeout } =
    useSingleCogsAssignmentWithPolling()

  // Manual recalculation hook (Request #17)
  const { mutate: triggerRecalculation, isPending: isRecalculating } =
    useManualMarginRecalculation()

  // Story 23.10: Role-based access control for task enqueue
  const user = useAuthStore(state => state.user)
  const canTriggerRecalc = canEnqueueTasks(user?.role)

  const today = new Date().toISOString().split('T')[0]
  const isEditMode = !!existingCogs

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors: formErrors },
  } = useForm<FormData>({
    defaultValues: {
      unit_cost_rub: existingCogs?.unit_cost_rub || '',
      valid_from: existingCogs?.valid_from?.split('T')[0] || today,
      notes: existingCogs?.notes || '',
    },
  })

  const unitCostValue = watch('unit_cost_rub')
  const parsedCost = parseFloat(unitCostValue)
  const formattedPreview = !isNaN(parsedCost) ? formatCogs(parsedCost) : null

  const validFromValue = watch('valid_from')
  const isFutureDate = validFromValue ? isCogsAfterLastCompletedWeek(validFromValue) : false
  const lastCompletedWeek = getLastCompletedWeek()

  // Reset form when nmId changes (switching between products)
  useEffect(() => {
    reset({
      unit_cost_rub: existingCogs?.unit_cost_rub || '',
      valid_from: existingCogs?.valid_from?.split('T')[0] || today,
      notes: existingCogs?.notes || '',
    })
    setValidationErrors([])
  }, [nmId, existingCogs, reset, today])

  const onSubmit = (data: FormData) => {
    const cogsRequest: CogsAssignmentRequest = {
      unit_cost_rub: parseFloat(data.unit_cost_rub),
      valid_from: data.valid_from,
      source: 'manual',
      notes: data.notes || undefined,
    }

    const errors = validateCogsAssignment(cogsRequest)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])

    mutate(
      { nmId, cogs: cogsRequest },
      {
        onSuccess: response => {
          if (response && typeof response === 'object' && 'cogs' in response && response.cogs) {
            const productResponse = response as {
              cogs?: { unit_cost_rub: string; valid_from: string; notes?: string }
            }
            reset({
              unit_cost_rub: productResponse.cogs?.unit_cost_rub || '',
              valid_from: productResponse.cogs?.valid_from.split('T')[0] || today,
              notes: productResponse.cogs?.notes || '',
            })
          }
          onSuccess?.()
        },
        onError: err => {
          console.error('COGS assignment error:', err)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Info */}
      {productName && (
        <ProductInfoCard productName={productName} nmId={nmId} existingCogs={existingCogs} />
      )}

      <SingleCogsFormFields
        register={register}
        errors={formErrors}
        isDisabled={isPending || isPolling}
        formattedPreview={formattedPreview}
        validFromValue={validFromValue}
        isFutureDate={isFutureDate}
        lastCompletedWeek={lastCompletedWeek}
        canTriggerRecalculation={canTriggerRecalc}
        isRecalculating={isRecalculating}
        onTriggerRecalculation={() => {
          triggerRecalculation({
            weeks: [lastCompletedWeek],
            nm_ids: [nmId],
          })
        }}
      />

      <SingleCogsFormStatus
        validationErrors={validationErrors}
        error={error}
        isSuccess={isSuccess}
        isPolling={isPolling}
        pollingAttempts={pollingAttempts}
        pollingTimeout={pollingTimeout}
        validFrom={validFromValue}
      />

      <SingleCogsFormActions
        isPending={isPending}
        isPolling={isPolling}
        isEditMode={isEditMode}
        onCancel={onCancel}
      />
    </form>
  )
}
