'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '@/hooks/useProducts'
import { validateBulkCogsAssignment, createBulkCogsItems } from '@/hooks/useBulkCogsAssignment'
import { useBulkCogsAssignmentWithPolling } from '@/hooks/useBulkCogsAssignmentWithPolling'
import { MarginCalculationStatus } from './MarginCalculationStatus'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, CheckSquare, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Translate margin recalculation status to Russian
 * Request #118/119 - Backend fix for automatic margin recalculation
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'В очереди',
    in_progress: 'Выполняется',
    completed: 'Завершено',
  }
  return statusMap[status] || status
}

interface FormData {
  unit_cost_rub: string
  valid_from: string
  notes: string
}

/**
 * Bulk COGS assignment form with product selection
 * Story 4.2: Bulk COGS Assignment Capability
 *
 * Features:
 * - Product list with checkboxes
 * - Select all functionality
 * - Search and filter
 * - Bulk COGS input with validation
 * - Preview before submission
 * - Partial success handling
 * - Results display
 *
 * @example
 * <BulkCogsForm onSuccess={() => router.push('/cogs')} />
 */
export function BulkCogsForm({ onSuccess }: { onSuccess?: () => void }) {
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [prevCursors, setPrevCursors] = useState<string[]>([]) // Stack for back navigation
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const limit = 50

  // Fetch products without COGS (cursor-based pagination)
  const { data, isLoading, isError, error, refetch } = useProducts({
    search: search || undefined,
    has_cogs: false,
    cursor,
    limit,
  })

  // Bulk assignment mutation with polling
  const {
    mutate,
    isPending,
    data: resultData,
    isPolling,
    pollingAttempts,
    pollingTimeout,
    pollingStrategy,
  } = useBulkCogsAssignmentWithPolling()

  // Initialize form with today's date
  const today = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset: resetForm,
  } = useForm<FormData>({
    defaultValues: {
      unit_cost_rub: '',
      valid_from: today,
      notes: '',
    },
  })

  // Watch unit_cost_rub for preview
  const unitCostValue = watch('unit_cost_rub')
  const parsedCost = parseFloat(unitCostValue)
  const formattedPreview = !isNaN(parsedCost) ? formatCogs(parsedCost) : null

  // Get selected product details
  const selectedProductDetails = useMemo(() => {
    if (!data?.products) return []
    return data.products.filter(p => selectedProducts.has(p.nm_id))
  }, [data, selectedProducts])

  // Check if all visible products are selected
  const allVisibleSelected = useMemo(() => {
    if (!data?.products || data.products.length === 0) return false
    return data.products.every(p => selectedProducts.has(p.nm_id))
  }, [data, selectedProducts])

  // Handle individual product selection
  const handleProductSelect = (nmId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(nmId)
    } else {
      newSelected.delete(nmId)
    }
    setSelectedProducts(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (!data?.products) return

    if (allVisibleSelected) {
      // Deselect all visible
      const newSelected = new Set(selectedProducts)
      data.products.forEach(p => newSelected.delete(p.nm_id))
      setSelectedProducts(newSelected)
    } else {
      // Select all visible
      const newSelected = new Set(selectedProducts)
      data.products.forEach(p => newSelected.add(p.nm_id))
      setSelectedProducts(newSelected)
    }
  }

  // Handle preview
  const handlePreview = () => {
    if (selectedProducts.size === 0) {
      toast.error('Выберите хотя бы один товар')
      return
    }
    setShowPreview(true)
  }

  // Handle form submission
  const onSubmit = (formData: FormData) => {
    // Create bulk COGS items
    const items = createBulkCogsItems(
      Array.from(selectedProducts),
      parseFloat(formData.unit_cost_rub),
      formData.valid_from,
      {
        source: 'manual',
        notes: formData.notes || undefined,
      }
    )

    // Frontend validation
    const errors = validateBulkCogsAssignment(items)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowPreview(false)
      return
    }

    // Clear validation errors
    setValidationErrors([])

    // Submit to backend
    mutate(
      { items },
      {
        onSuccess: response => {
          if (!response || typeof response !== 'object' || !('data' in response)) {
            return
          }
          const bulkResponse = response as {
            data: { succeeded: number; failed: number }
          }
          const { succeeded, failed } = bulkResponse.data

          // Close preview
          setShowPreview(false)

          // Show results
          setShowResults(true)

          // Show toast
          if (failed === 0) {
            toast.success('Себестоимость назначена успешно', {
              description: `Обновлено: ${succeeded} товаров`,
            })
          } else {
            toast.warning('Частичный успех', {
              description: `Успешно: ${succeeded}, Ошибок: ${failed}`,
            })
          }

          // Clear form if full success
          if (failed === 0) {
            resetForm()
            setSelectedProducts(new Set())
          }

          // Call success callback
          if (failed === 0 && onSuccess) {
            setTimeout(onSuccess, 2000) // Delay for user to see results
          }
        },
        onError: err => {
          setShowPreview(false)
          toast.error('Ошибка при назначении себестоимости', {
            description: err instanceof Error ? err.message : 'Неизвестная ошибка',
          })
        },
      }
    )
  }

  // Handle retry for failed items
  const handleRetry = () => {
    if (!resultData) return

    const failedNmIds = resultData.data.results.filter(r => !r.success).map(r => r.nm_id)

    // Update selection to only failed items
    setSelectedProducts(new Set(failedNmIds))

    // Close results and show preview again
    setShowResults(false)
    setShowPreview(true)

    toast.info('Выбраны только неудачные товары', {
      description: `Повторная попытка для ${failedNmIds.length} товаров`,
    })
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки товаров'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (!data || !data.products || data.products.length === 0) {
    return (
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по артикулу или названию..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setCursor(undefined)
              setPrevCursors([])
            }}
            className="pl-10"
          />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <CheckSquare className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Товары не найдены</h3>
          <p className="text-sm text-gray-500">
            {search ? 'Попробуйте изменить условия поиска' : 'Все товары уже имеют себестоимость'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handlePreview)} className="space-y-6">
      {/* Search and Selection Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по артикулу или названию..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setCursor(undefined)
              setPrevCursors([])
            }}
            className="pl-10"
          />
        </div>
        <div className="text-sm font-medium text-gray-700">
          Выбрано: {selectedProducts.size} товаров
        </div>
      </div>

      {/* Product List with Checkboxes */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Выбрать все"
                />
              </TableHead>
              <TableHead className="w-[120px]">Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-[140px]">Бренд</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.products.map(product => (
              <TableRow
                key={product.nm_id}
                className={selectedProducts.has(product.nm_id) ? 'bg-blue-50' : ''}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.nm_id)}
                    onCheckedChange={checked =>
                      handleProductSelect(product.nm_id, checked as boolean)
                    }
                    aria-label={`Выбрать ${product.nm_id}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{product.nm_id}</TableCell>
                <TableCell className="font-medium">{product.sa_name}</TableCell>
                <TableCell className="text-sm text-gray-600">{product.brand || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Показано {data.products?.length || 0} из {data.pagination?.total || 0} товаров
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Go back to previous cursor
              if (prevCursors.length > 0) {
                const newPrevCursors = [...prevCursors]
                const previousCursor = newPrevCursors.pop()
                setPrevCursors(newPrevCursors)
                setCursor(previousCursor)
              }
            }}
            disabled={prevCursors.length === 0 && cursor === undefined}
            type="button"
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Go to next page using next_cursor
              if (data?.pagination?.next_cursor) {
                setPrevCursors([...prevCursors, cursor!])
                setCursor(data.pagination.next_cursor)
              }
            }}
            disabled={!data?.pagination?.next_cursor}
            type="button"
          >
            Вперёд
          </Button>
        </div>
      </div>

      {/* Bulk COGS Input */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-blue-900">
          Назначить себестоимость для выбранных товаров
        </h3>

        <div className="space-y-4">
          {/* Unit Cost */}
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
                required: 'Себестоимость обязательна',
                min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
                validate: value => {
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
              <p className="text-sm text-gray-600">Предпросмотр: {formattedPreview}</p>
            )}
          </div>

          {/* Valid From */}
          <div className="space-y-2">
            <Label htmlFor="valid_from">
              Дата начала действия <span className="text-red-500">*</span>
            </Label>
            <Input
              id="valid_from"
              type="date"
              {...register('valid_from', {
                required: 'Дата обязательна',
              })}
              disabled={isPending || isPolling}
              className={errors.valid_from ? 'border-red-500' : ''}
            />
            {errors.valid_from && (
              <p className="text-sm text-red-500">{errors.valid_from.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания (необязательно)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Например: Массовое обновление цен"
              {...register('notes')}
              disabled={isPending || isPolling}
            />
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.slice(0, 10).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {validationErrors.length > 10 && (
                <li>...и ещё {validationErrors.length - 10} ошибок</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isPending || isPolling || selectedProducts.size === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Обработка...
            </>
          ) : (
            `Просмотреть (${selectedProducts.size} товаров)`
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Подтверждение массового назначения</DialogTitle>
            <DialogDescription>
              Вы собираетесь назначить себестоимость для {selectedProducts.size} товаров
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-600">Себестоимость</div>
              <div className="text-2xl font-bold text-gray-900">{formattedPreview || '—'}</div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-gray-600">
                Выбранные товары ({selectedProductDetails.length}):
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                <Table>
                  <TableBody>
                    {selectedProductDetails.slice(0, 50).map(product => (
                      <TableRow key={product.nm_id}>
                        <TableCell className="font-mono text-sm">{product.nm_id}</TableCell>
                        <TableCell>{product.sa_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {selectedProductDetails.length > 50 && (
                  <div className="p-2 text-center text-sm text-gray-500">
                    ...и ещё {selectedProductDetails.length - 50} товаров
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isPending || isPolling}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isPending || isPolling}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Назначение...
                </>
              ) : isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ожидание расчёта маржи...
                </>
              ) : (
                'Подтвердить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Результаты массового назначения</DialogTitle>
          </DialogHeader>

          {resultData && (
            <div className="space-y-4">
              {/* Margin Recalculation Status (Request #118/119) */}
              {resultData.data.marginRecalculation && (
                <Alert variant="default" className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <div className="font-medium mb-1">Пересчёт маржи запущен автоматически</div>
                    <div className="text-sm space-y-1">
                      <div>
                        Статус:{' '}
                        <span className="font-medium">
                          {getStatusText(resultData.data.marginRecalculation.status)}
                        </span>
                      </div>
                      {resultData.data.marginRecalculation.weeks.length > 0 && (
                        <div>Недели: {resultData.data.marginRecalculation.weeks.join(', ')}</div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* No Margin Recalculation Warning */}
              {resultData.data.succeeded > 0 && !resultData.data.marginRecalculation && (
                <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    <div className="font-medium mb-1">Пересчёт маржи не требуется</div>
                    <div className="text-sm">
                      Для загруженных недель нет данных о продажах. Маржа будет рассчитана
                      автоматически после импорта финансовых отчетов.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Margin Calculation Status */}
              {isPolling && resultData.data.succeeded > 0 && (
                <MarginCalculationStatus
                  isPolling={isPolling}
                  attempts={pollingAttempts}
                  maxAttempts={pollingStrategy.maxAttempts}
                  estimatedTime={pollingStrategy.estimatedTime}
                  isBulk={true}
                  bulkCount={resultData.data.succeeded}
                />
              )}

              {/* Timeout Warning */}
              {pollingTimeout && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Расчёт маржи занимает больше времени. Обновите страницу через минуту.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="text-sm font-medium text-green-900">Успешно</div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-900">
                    {resultData.data.succeeded}
                  </div>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div className="text-sm font-medium text-red-900">Ошибок</div>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-red-900">
                    {resultData.data.failed}
                  </div>
                </div>
              </div>

              {/* Failed Items */}
              {resultData.data.failed > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-900">Не удалось обновить:</div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableBody>
                        {resultData.data.results
                          .filter(r => !r.success)
                          .map(result => (
                            <TableRow key={result.nm_id}>
                              <TableCell className="font-mono text-sm">{result.nm_id}</TableCell>
                              <TableCell className="text-sm text-red-600">
                                {result.error_message || result.error_code}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {resultData && resultData.data.failed > 0 && (
              <Button variant="outline" onClick={handleRetry}>
                Повторить для неудачных
              </Button>
            )}
            <Button
              onClick={() => {
                setShowResults(false)
              }}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
