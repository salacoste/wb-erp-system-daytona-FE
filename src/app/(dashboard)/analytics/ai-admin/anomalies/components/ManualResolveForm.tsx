'use client'

/**
 * ManualResolveForm — fallback form for resolving anomalies by ID.
 * Shown when STUB_PENDING_BACKEND_167=true (GET /v1/ai/anomalies not yet shipped).
 * Story 112.3-FE — extracted from AnomaliesList to stay under 200-line cap.
 */

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useResolveAnomaly } from '@/hooks/useResolveAnomaly'
import { RESOLUTION_CAUSE_LABELS, RESOLUTION_CAUSES } from './anomalies-helpers'
import type { ResolutionCause } from '@/types/ai/system'

export function ManualResolveForm() {
  const [manualId, setManualId] = useState('')
  const [manualCause, setManualCause] = useState<ResolutionCause | ''>('')
  const [manualNote, setManualNote] = useState('')
  const resolveMutation = useResolveAnomaly()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualId.trim() || !manualCause) return
    // Reset prior error/success state before each submission so stale isError/isSuccess don't persist.
    resolveMutation.reset()
    resolveMutation.mutate(
      {
        anomalyId: manualId.trim(),
        resolutionCause: manualCause as ResolutionCause,
        resolutionNote: manualNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Аномалия разрешена.')
          setManualId('')
          setManualCause('')
          setManualNote('')
          // Clear isSuccess flag so re-submit next time doesn't flash stale state.
          resolveMutation.reset()
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Эндпоинт /v1/ai/anomalies ещё не реализован на бэкенде (запрос #167). Используйте форму
          ниже для разрешения известных аномалий по ID.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
        <h2 className="text-sm font-medium">Разрешить аномалию по ID</h2>

        <div className="space-y-1">
          <Label htmlFor="manual-anomaly-id">ID аномалии</Label>
          <Input
            id="manual-anomaly-id"
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            placeholder="UUID аномалии"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="manual-cause">Причина разрешения</Label>
          <Select value={manualCause} onValueChange={v => setManualCause(v as ResolutionCause)}>
            <SelectTrigger id="manual-cause">
              <SelectValue placeholder="Выберите причину" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_CAUSES.map(cause => (
                <SelectItem key={cause} value={cause}>
                  {RESOLUTION_CAUSE_LABELS[cause]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="manual-note">Примечание (необязательно)</Label>
          <Textarea
            id="manual-note"
            value={manualNote}
            onChange={e => setManualNote(e.target.value)}
            placeholder="Дополнительный контекст"
            rows={2}
          />
        </div>

        <Button
          type="submit"
          disabled={!manualId.trim() || !manualCause || resolveMutation.isPending}
        >
          Разрешить
        </Button>
      </form>
    </div>
  )
}
