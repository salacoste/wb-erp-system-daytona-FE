/**
 * FR-7 (#221) Phase 2: variant (color/size) table section for the SKU page.
 *
 * Calls useMarginAnalyticsByVariant (single-week only) and renders VariantTable.
 * The section is the variant-mode counterpart of SkuTableSection: it owns loading /
 * error / empty branches so page.tsx stays a thin orchestrator under the 200-line cap.
 */

import { useMarginAnalyticsByVariant } from '@/hooks/useMarginAnalyticsByVariant'
import { VariantTable } from '@/components/custom/VariantTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface SkuVariantSectionProps {
  /** ISO week, e.g. "2026-W26". Must be a single week (caller enforces). */
  week: string
}

export function SkuVariantSection({ week }: SkuVariantSectionProps) {
  const { data, isLoading, isError, error } = useMarginAnalyticsByVariant({ week })

  return (
    <Card>
      <CardHeader>
        <h2 className="sr-only">Детализация по цветомоделям</h2>
        <CardTitle>Маржинальность по цветомоделям</CardTitle>
        <CardDescription>Варианты FBS. Прибыль и маржа — приблизительные (см. ⚠️).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Не удалось загрузить варианты.</span>{' '}
              {error instanceof Error ? error.message : 'Повторите попытку позже.'}
            </AlertDescription>
          </Alert>
        ) : (
          <VariantTable data={data?.data ?? []} isLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  )
}
