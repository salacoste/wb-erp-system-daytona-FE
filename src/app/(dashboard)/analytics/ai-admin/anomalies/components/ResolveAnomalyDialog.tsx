'use client'

/**
 * ResolveAnomalyDialog — form dialog for resolving a specific anomaly.
 * Story 112.3-FE Task 5.
 * Uses shadcn Dialog (NOT AlertDialog — form, not destructive confirmation).
 * ARIA: inline error uses role="status" + aria-live="polite" per Story 112.1 F-12.
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useResolveAnomaly } from '@/hooks/useResolveAnomaly'
import { ApiError } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { RESOLUTION_CAUSE_LABELS, RESOLUTION_CAUSES } from './anomalies-helpers'
import type { AnomalyEntry, ResolutionCause } from '@/types/ai/system'

interface ResolveAnomalyDialogProps {
  anomaly: AnomalyEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResolveAnomalyDialog({ anomaly, open, onOpenChange }: ResolveAnomalyDialogProps) {
  const [cause, setCause] = useState<ResolutionCause | ''>('')
  const [note, setNote] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mutation = useResolveAnomaly()
  const mutationReset = mutation.reset

  useEffect(() => {
    // Defense-in-depth: reset on close OR identity change (anomaly.id swap while dialog stays open).
    // Prevents prior anomaly's errorMessage bleeding into a new anomaly's dialog.
    setCause('')
    setNote('')
    setErrorMessage(null)
    mutationReset()
  }, [open, anomaly?.id, mutationReset])

  function handleConfirm() {
    if (!anomaly || !cause) return
    setErrorMessage(null)
    mutation.mutate(
      {
        anomalyId: anomaly.id,
        resolutionCause: cause as ResolutionCause,
        resolutionNote: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Аномалия разрешена.')
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 403) {
            setErrorMessage('Нет доступа. Требуется роль Owner или Manager.')
          } else if (err instanceof ApiError && err.status === 409) {
            // Conflict/already-resolved (Story 171.1 gap 5): distinct honest-state message.
            // cause/note state is NOT reset here — input retained per AC-2.
            setErrorMessage('Аномалия уже разрешена. Обновите список.')
          } else {
            setErrorMessage('Не удалось разрешить аномалию. Попробуйте позже.')
          }
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {anomaly ? `Разрешить аномалию #${String(anomaly.id)}` : 'Разрешить аномалию'}
          </DialogTitle>
          <DialogDescription>
            Укажите причину разрешения аномалии. Это поможет AI улучшить точность будущих прогнозов.
          </DialogDescription>
        </DialogHeader>

        {anomaly && (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Артикул: {String(anomaly.nmId)}</p>
            <p>Тип: {anomaly.anomalyType}</p>
            <p>Дата: {formatDate(anomaly.triggeredAt)}</p>
          </div>
        )}

        <div className="space-y-4" aria-busy={mutation.isPending}>
          {/* F-12 polite (Story 171.1 gap 7): submitting announced once, politely, while pending */}
          {mutation.isPending && (
            <p role="status" aria-live="polite" className="sr-only">
              Отправка данных…
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="resolve-cause">Причина разрешения</Label>
            <Select value={cause} onValueChange={v => setCause(v as ResolutionCause)}>
              <SelectTrigger id="resolve-cause">
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_CAUSES.map(c => (
                  <SelectItem key={c} value={c}>
                    {RESOLUTION_CAUSE_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="resolve-note">Примечание (необязательно)</Label>
            <Textarea
              id="resolve-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Дополнительный контекст"
              rows={3}
            />
          </div>

          {errorMessage && (
            // F-12: override shadcn baked-in role="alert" (aria-live="assertive") with
            // role="status" (aria-live="polite") — less intrusive inside an open dialog.
            <Alert variant="destructive" role="status" aria-live="polite" aria-atomic="true">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Отменить
          </Button>
          <Button onClick={handleConfirm} disabled={!cause || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Подтвердить разрешение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
