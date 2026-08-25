/**
 * Cross-Reference page state components (loading, error, empty).
 * Extracted from CrossReferencePageContent.tsx for 200-line compliance.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { logger } from '@/lib/logger'

export function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (error) logger.error('[CrossReference] Load error:', error)
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{'Не удалось загрузить данные. Попробуйте снова.'}</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Нет данных за выбранный период</AlertDescription>
    </Alert>
  )
}

/**
 * Story 170.6-FE (AC-2 one-source coexistence, 169.12 pattern): exactly ONE of the
 * two product-level sources failed — destructive banner names the failed source,
 * keeps the loaded source's data rendered, and states explicitly that cross-channel
 * conclusions are unavailable («no relationship» must NOT be inferred from a failed
 * source). The both-failed path stays on the full ErrorState above (e2e-pinned texts).
 */
export function SourceErrorBanner({
  failedSource,
  okSource,
  onRetry,
  hasRows,
}: {
  failedSource: string
  okSource: string
  onRetry: () => void
  /** Round-2 F1: honest wording — «отображены ниже» only when rows actually render. */
  hasRows: boolean
}) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span data-testid="source-error-banner">
          Не удалось загрузить данные: {failedSource}. Данные источника «{okSource}» загружены
          {hasRows ? 'и отображены ниже' : ', но данных за выбранный период нет'}. Пересечение
          каналов и выводы о связи органики и рекламы недоступны, пока не загрузятся оба источника.
        </span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Story 170.6-FE (validator C2): the THIRD query (search groupBy=query) failed while
 * product-level data works — non-destructive SECTION banner on the overlap card.
 * Both-fail still escalates to the full ErrorState.
 */
export function SectionWarningBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span data-testid="section-warning-banner">
          Не удалось загрузить данные по поисковым запросам — раздел «Пересечение поисковых запросов
          и рекламы» временно недоступен. Остальные разделы работают.
        </span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}
