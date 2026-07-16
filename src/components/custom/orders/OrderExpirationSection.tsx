'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AlertTriangle, PackageCheck, RefreshCcw } from 'lucide-react'
import {
  useAutoFillOrderExpiration,
  useReconcileOrderExpiration,
  useUpdateOrderExpiration,
} from '@/hooks/useOrders'
import { extractExpirationMinimumDate } from '@/lib/api/order-expiration-error'
import { isIsoCalendarDate } from '@/lib/order-expiration-date'
import type { ExpirationMeta } from '@/types/orders'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface OrderExpirationSectionProps {
  orderUuid: string
  wbOrderId: string
  expirationMeta: ExpirationMeta
}

export function OrderExpirationSection({
  orderUuid,
  wbOrderId,
  expirationMeta,
}: OrderExpirationSectionProps) {
  const [draft, setDraft] = useState(expirationMeta.value ?? '')
  const [committedValue, setCommittedValue] = useState(expirationMeta.value ?? '')
  const [minimumDate, setMinimumDate] = useState(expirationMeta.minimumDate)
  const [showAuthoritativeMinimum, setShowAuthoritativeMinimum] = useState(false)
  const mutation = useUpdateOrderExpiration()
  const autoFillMutation = useAutoFillOrderExpiration()
  const reconcileMutation = useReconcileOrderExpiration()

  useEffect(() => {
    setDraft(expirationMeta.value ?? '')
    setCommittedValue(expirationMeta.value ?? '')
  }, [expirationMeta.value, orderUuid])

  useEffect(() => {
    setMinimumDate(expirationMeta.minimumDate)
    setShowAuthoritativeMinimum(false)
  }, [expirationMeta.minimumDate, orderUuid])

  const validDate = isIsoCalendarDate(draft)
  const unchanged = draft === committedValue
  const tooEarly = validDate && draft < minimumDate
  const saveDisabled =
    !expirationMeta.manualEditable ||
    mutation.isPending ||
    autoFillMutation.isPending ||
    reconcileMutation.isPending ||
    !draft ||
    !validDate ||
    tooEarly ||
    unchanged

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveDisabled) return
    try {
      const result = await mutation.mutateAsync({ orderUuid, wbOrderId, expirationDate: draft })
      setDraft(result.expirationDate)
      setCommittedValue(result.expirationDate)
      setShowAuthoritativeMinimum(false)
    } catch (error) {
      const authoritativeMinimum = extractExpirationMinimumDate(error)
      if (authoritativeMinimum) {
        setMinimumDate(authoritativeMinimum)
        setShowAuthoritativeMinimum(true)
      }
    }
  }

  async function handleAutoFill() {
    if (
      !expirationMeta.fefoAvailable ||
      mutation.isPending ||
      autoFillMutation.isPending ||
      reconcileMutation.isPending
    )
      return
    try {
      const result = await autoFillMutation.mutateAsync({ orderUuid, wbOrderId })
      setDraft(result.expirationDate)
      setCommittedValue(result.expirationDate)
      setShowAuthoritativeMinimum(false)
    } catch {
      // The mutation hook owns the user-facing error toast.
    }
  }

  async function handleReconcile() {
    if (reconcileMutation.isPending) return
    try {
      await reconcileMutation.mutateAsync({ orderUuid, wbOrderId })
    } catch {
      // The mutation hook owns the user-facing error toast.
    }
  }

  return (
    <section className="my-4 rounded-lg border p-4" aria-labelledby="order-expiration-heading">
      <div className="mb-3 flex items-center gap-2">
        <h3 id="order-expiration-heading" className="text-sm font-semibold">
          Годен до
        </h3>
        <Badge variant={expirationMeta.requirement === 'required' ? 'default' : 'secondary'}>
          {expirationMeta.requirement === 'required' ? 'Обязательно' : 'Опционально'}
        </Badge>
      </div>

      <div className="mb-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <span>Текущее значение: {expirationMeta.value ?? 'не указано'}</span>
        <span>Решение WB: {expirationMeta.decision}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`expiration-${orderUuid}`}>Дата срока годности</Label>
            <Input
              id={`expiration-${orderUuid}`}
              type="date"
              min={minimumDate}
              value={draft}
              disabled={
                !expirationMeta.manualEditable ||
                mutation.isPending ||
                autoFillMutation.isPending ||
                reconcileMutation.isPending
              }
              aria-describedby={`expiration-warning-${orderUuid}`}
              onChange={event => setDraft(event.target.value)}
            />
            {showAuthoritativeMinimum && (
              <p className="text-xs text-destructive">Минимальная дата: {minimumDate}</p>
            )}
          </div>
          <Button type="submit" disabled={saveDisabled}>
            {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              !expirationMeta.fefoAvailable ||
              mutation.isPending ||
              autoFillMutation.isPending ||
              reconcileMutation.isPending
            }
            onClick={handleAutoFill}
          >
            <PackageCheck className="mr-1 h-4 w-4" />
            {autoFillMutation.isPending ? 'Подбор партии…' : 'Заполнить по FEFO'}
          </Button>
        </div>
      </form>

      {expirationMeta.reconciliationRequired && (
        <Alert className="mt-3" variant="destructive">
          <RefreshCcw className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Предыдущая запись не получила окончательного read-back. Новая запись заблокирована до
              проверки.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={reconcileMutation.isPending}
              onClick={handleReconcile}
            >
              <RefreshCcw className="mr-1 h-4 w-4" />
              {reconcileMutation.isPending ? 'Проверка…' : 'Проверить в WB'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!expirationMeta.reconciliationRequired &&
        !expirationMeta.manualEditable &&
        !expirationMeta.fefoAvailable && (
          <p className="mt-3 text-xs text-muted-foreground">
            Запись недоступна для текущего статуса заказа или состояния партии.
          </p>
        )}

      <Alert className="mt-3">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription id={`expiration-warning-${orderUuid}`}>
          Дату можно заменить, но после записи в WB её нельзя удалить.
        </AlertDescription>
      </Alert>
    </section>
  )
}
