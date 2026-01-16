'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  validateCogsAssignment,
  formatCogs,
} from '@/hooks/useSingleCogsAssignment'
import { useSingleCogsAssignmentWithPolling } from '@/hooks/useSingleCogsAssignmentWithPolling'
import { MarginCalculationStatus } from './MarginCalculationStatus'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { getPollingStrategy, isCogsAfterLastCompletedWeek, getLastCompletedWeek } from '@/lib/margin-helpers'
import { useManualMarginRecalculation } from '@/hooks/useManualMarginRecalculation'
import { useAuthStore } from '@/stores/authStore'
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
  nmId: string                 // Product ID to assign COGS to
  productName?: string         // Product name for display
  existingCogs?: CogsRecord    // Existing COGS for pre-filling form (edit mode)
  onSuccess?: () => void       // Callback after successful assignment
  onCancel?: () => void        // Callback for cancel button
}

interface FormData {
  unit_cost_rub: string        // String for input handling
  valid_from: string           // ISO date string (YYYY-MM-DD)
  notes: string                // Optional notes
}

/**
 * Single product COGS assignment form
 * Story 4.1: Single Product COGS Assignment Interface
 *
 * @example
 * <SingleCogsForm
 *   nmId="12345678"
 *   productName="Кроссовки Nike Air Max"
 *   onSuccess={() => console.log('COGS assigned!')}
 * />
 */
export function SingleCogsForm({
  nmId,
  productName,
  existingCogs,
  onSuccess,
  onCancel,
}: SingleCogsFormProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const {
    mutate,
    isPending,
    isSuccess,
    error,
    isPolling,
    pollingAttempts,
    pollingTimeout,
  } = useSingleCogsAssignmentWithPolling()
  
  // Manual recalculation hook (Request #17)
  const { mutate: triggerRecalculation, isPending: isRecalculating } = useManualMarginRecalculation()

  // Story 23.10: Role-based access control for task enqueue
  const user = useAuthStore((state) => state.user)
  const canTriggerRecalculation = canEnqueueTasks(user?.role)

  // Initialize form with today's date or existing COGS date
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const isEditMode = !!existingCogs // True if editing existing COGS

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      unit_cost_rub: existingCogs?.unit_cost_rub || '',
      valid_from: existingCogs?.valid_from?.split('T')[0] || today,
      notes: existingCogs?.notes || '',
    },
  })

  // Watch unit_cost_rub for preview
  const unitCostValue = watch('unit_cost_rub')
  const parsedCost = parseFloat(unitCostValue)
  const formattedPreview = !isNaN(parsedCost) ? formatCogs(parsedCost) : null
  
  // Watch valid_from to check if it's after last completed week (Request #17)
  const validFromValue = watch('valid_from')
  const isFutureDate = validFromValue ? isCogsAfterLastCompletedWeek(validFromValue) : false
  const lastCompletedWeek = getLastCompletedWeek()

  // Reset form when nmId changes (switching between products)
  // This fixes the bug where input retains old values when navigating between products
  useEffect(() => {
    reset({
      unit_cost_rub: existingCogs?.unit_cost_rub || '',
      valid_from: existingCogs?.valid_from?.split('T')[0] || today,
      notes: existingCogs?.notes || '',
    })
    setValidationErrors([]) // Clear validation errors when switching products
  }, [nmId, existingCogs, reset, today])

  const onSubmit = (data: FormData) => {
    // Convert form data to API request format
    const cogsRequest: CogsAssignmentRequest = {
      unit_cost_rub: parseFloat(data.unit_cost_rub),
      valid_from: data.valid_from,
      source: 'manual',
      notes: data.notes || undefined,
    }

    // Frontend validation
    const errors = validateCogsAssignment(cogsRequest)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // Clear validation errors
    setValidationErrors([])

    // Submit to backend (polling is handled automatically by hook)
    mutate(
      { nmId, cogs: cogsRequest },
      {
        onSuccess: (response) => {
          // Reset form with UPDATED values from backend response
          // This ensures the form shows the newly assigned COGS instead of old values
          if (
            response &&
            typeof response === 'object' &&
            'cogs' in response &&
            response.cogs
          ) {
            const productResponse = response as {
              cogs?: { unit_cost_rub: string; valid_from: string; notes?: string }
            }
            reset({
              unit_cost_rub: productResponse.cogs?.unit_cost_rub || '',
              valid_from: productResponse.cogs?.valid_from.split('T')[0] || today,
              notes: productResponse.cogs?.notes || '',
            })
          }

          // Call success callback
          onSuccess?.()
        },
        onError: (err) => {
          // Error toast is shown by hook
          console.error('COGS assignment error:', err)
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Info */}
      {productName && (
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-600">Товар</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{productName}</div>
          <div className="text-sm text-gray-500">Артикул: {nmId}</div>

          {/* Show existing COGS info if in edit mode */}
          {existingCogs && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="text-sm font-medium text-gray-600">Текущая себестоимость</div>
              <div className="mt-1 text-base font-semibold text-blue-600">
                {formatCogs(parseFloat(existingCogs.unit_cost_rub))}
              </div>
              <div className="text-xs text-gray-500">
                с {new Date(existingCogs.valid_from).toLocaleDateString('ru-RU')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unit Cost Input */}
      <div className="space-y-2">
        <Label htmlFor="unit_cost_rub">
          Себестоимость (₽) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="unit_cost_rub"
          type="number"
          step="0.01"
          min="0"
          placeholder="1250.50"
          {...register('unit_cost_rub', {
            required: 'Себестоимость обязательна для заполнения',
            min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
            validate: (value) => {
              const num = parseFloat(value)
              if (isNaN(num)) return 'Введите корректное число'
              if (!Number.isFinite(num)) return 'Введите корректное число'
              return true
            },
          })}
          disabled={isPending || isPolling}
          className={errors.unit_cost_rub ? 'border-red-500' : ''}
        />
        {errors.unit_cost_rub && (
          <p className="text-sm text-red-500">{errors.unit_cost_rub.message}</p>
        )}
        {formattedPreview && !errors.unit_cost_rub && (
          <p className="text-sm text-gray-500">Предпросмотр: {formattedPreview}</p>
        )}
      </div>

      {/* Valid From Date */}
      <div className="space-y-2">
        <Label htmlFor="valid_from">
          Дата начала действия <span className="text-red-500">*</span>
        </Label>
        <Input
          id="valid_from"
          type="date"
          {...register('valid_from', {
            required: 'Дата обязательна для заполнения',
            validate: (value) => {
              // Parse date string (YYYY-MM-DD format from input[type="date"])
              const inputDate = new Date(value + 'T00:00:00') // Add time to avoid timezone issues

              // Get today's date at midnight (ignore time)
              const today = new Date()
              today.setHours(0, 0, 0, 0)

              // Get one year ago at midnight
              const oneYearAgo = new Date()
              oneYearAgo.setFullYear(today.getFullYear() - 1)
              oneYearAgo.setHours(0, 0, 0, 0)

              if (isNaN(inputDate.getTime())) return 'Неверный формат даты'
              if (inputDate > today) return 'Дата не может быть в будущем'
              if (inputDate < oneYearAgo) return 'Дата не может быть более года назад'
              return true
            },
          })}
          disabled={isPending || isPolling}
          className={errors.valid_from ? 'border-red-500' : ''}
        />
        {errors.valid_from && (
          <p className="text-sm text-red-500">{errors.valid_from.message}</p>
        )}
        <p className="text-xs text-gray-500">
          С какой даты применяется эта себестоимость (обычно сегодня)
        </p>
        
        {/* Request #17: Warning if COGS assigned after last completed week */}
        {validFromValue && isFutureDate && (
          <Alert variant="warning" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  COGS назначен с даты после последней завершенной недели ({lastCompletedWeek})
                </p>
                <p className="text-sm">
                  Автоматический пересчет маржи для прошлых недель не запустится.
                  Если нужна маржа для {lastCompletedWeek}, назначьте COGS с датой до или во время этой недели.
                </p>
                {/* Story 23.10: Only show recalculation button for Manager+ roles */}
                {canTriggerRecalculation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      triggerRecalculation({
                        weeks: [lastCompletedWeek],
                        nm_ids: [nmId],
                      })
                    }}
                    disabled={isRecalculating}
                    className="mt-2"
                  >
                    {isRecalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Запуск пересчета...
                      </>
                    ) : (
                      `Пересчитать маржу для ${lastCompletedWeek}`
                    )}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes">Примечания (необязательно)</Label>
        <Input
          id="notes"
          type="text"
          placeholder="Например: Первоначальная себестоимость"
          {...register('notes')}
          disabled={isPending || isPolling}
        />
        <p className="text-xs text-gray-500">
          Дополнительная информация о себестоимости
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* API Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Ошибка при сохранении'}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {isSuccess && !isPolling && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Себестоимость успешно назначена!
          </AlertDescription>
        </Alert>
      )}

      {/* Margin Calculation Status */}
      {isPolling && (() => {
        const validFrom = watch('valid_from')
        const strategy = getPollingStrategy(validFrom, false)
        return (
          <MarginCalculationStatus
            isPolling={isPolling}
            attempts={pollingAttempts}
            maxAttempts={strategy.maxAttempts}
            estimatedTime={strategy.estimatedTime}
          />
        )
      })()}

      {/* Timeout Warning */}
      {pollingTimeout && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Расчёт маржи занимает больше времени. Обновите страницу через минуту.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending || isPolling}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : isPolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ожидание расчёта маржи...
            </>
          ) : isEditMode ? (
            'Обновить себестоимость'
          ) : (
            'Назначить себестоимость'
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending || isPolling}
          >
            Отмена
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Совет:</strong> {isEditMode
          ? 'При обновлении себестоимости будет создана новая версия. Старая версия сохранится в истории.'
          : 'После назначения себестоимости маржа будет рассчитана автоматически на основе данных продаж за последнюю завершённую неделю.'
        }
      </div>
    </form>
  )
}
