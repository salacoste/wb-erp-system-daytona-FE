'use client'

/**
 * Dialog showing root cause analysis evidence + remediate button
 */

import { Loader2, AlertTriangle } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { ROOT_CAUSE_LABELS, ROOT_CAUSE_SEVERITY, REMEDIATION_LABELS } from '@/types/financial-gaps'
import type { GapAnalysisResponse } from '@/types/financial-gaps'

interface GapAnalysisDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  analysis: GapAnalysisResponse | null
  isRemediating: boolean
  onRemediate: (missingDate: string, rootCause?: string) => void
  returnFocusRef: RefObject<HTMLElement | null>
  fallbackFocusRef: RefObject<HTMLElement | null>
}

/** Badge chip by severity (169.5 /15-chip idiom) */
const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error border-status-error/30',
  warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  info: 'bg-status-information/15 text-status-information border-status-information/30',
}

export function GapAnalysisDialog({
  isOpen,
  onOpenChange,
  analysis,
  isRemediating,
  onRemediate,
  returnFocusRef,
  fallbackFocusRef,
}: GapAnalysisDialogProps) {
  if (!analysis) return null

  const severity = ROOT_CAUSE_SEVERITY[analysis.root_cause] ?? 'warning'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={event => {
          const returnFocusTarget = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : fallbackFocusRef.current?.isConnected
              ? fallbackFocusRef.current
              : null
          if (!returnFocusTarget) return

          event.preventDefault()
          returnFocusTarget.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Анализ пропуска</DialogTitle>
          <DialogDescription>
            {formatDate(new Date(analysis.missing_date + 'T00:00:00'))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Root cause */}
          <div className="flex flex-wrap items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Причина:</span>
            <Badge
              className={`${SEVERITY_COLORS[severity]} max-w-full whitespace-normal [overflow-wrap:anywhere]`}
            >
              {ROOT_CAUSE_LABELS[analysis.root_cause] ?? analysis.root_cause}
            </Badge>
          </div>

          {/* Remediation action */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Рекомендация:</span>
            <Badge
              variant="outline"
              className="max-w-full whitespace-normal [overflow-wrap:anywhere]"
            >
              {REMEDIATION_LABELS[analysis.remediation] ?? analysis.remediation}
            </Badge>
          </div>

          {/* Evidence: imports */}
          {analysis.evidence.imports.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium">Импорты:</p>
              <div className="min-w-0 space-y-1">
                {analysis.evidence.imports.map((imp, i) => (
                  <div key={i} className="min-w-0 rounded bg-muted p-2 text-sm">
                    <span className="font-medium [overflow-wrap:anywhere]">{imp.status}</span>
                    {imp.error_message && (
                      <p className="text-muted-foreground [overflow-wrap:anywhere]">
                        {imp.error_message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence: queue errors */}
          {analysis.evidence.queue_errors.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium">Ошибки очереди:</p>
              <ul className="min-w-0 list-inside list-disc text-sm text-muted-foreground">
                {analysis.evidence.queue_errors.map((err, i) => (
                  <li key={i} className="[overflow-wrap:anywhere]">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* WB API status */}
          <div className="text-sm">
            <span className="text-muted-foreground">Статус WB API: </span>
            <span className="font-medium [overflow-wrap:anywhere]">
              {analysis.evidence.wb_api_status}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button className="min-h-11" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            className="min-h-11"
            disabled={isRemediating}
            onClick={() => onRemediate(analysis.missing_date, analysis.root_cause)}
          >
            {isRemediating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Исправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
