'use client'

/**
 * VariantsTab — FR-7 Phase 3 (#221): color/size variant breakdown for ONE product.
 *
 * Renders the Phase-1 VariantTable, scoped to this product's nmId. The by-variant
 * endpoint is single-week only (?week=YYYY-Www; range → 400) and has no nm_id
 * server filter (it 400s), so we (a) use getLastCompletedWeek() — the project's
 * margin-analytics week convention — instead of the page's date-range picker, and
 * (b) filter client-side by nm_id. A note explains the single-week scope.
 */

import { Card, CardContent } from '@/components/ui/card'
import { VariantTable } from '@/components/custom/VariantTable'
import { useMarginAnalyticsByVariant } from '@/hooks/useMarginAnalyticsByVariant'
import { formatWeekDisplay } from '@/hooks/margin-analytics-query-keys'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

interface VariantsTabProps {
  nmId: string
}

export function VariantsTab({ nmId }: VariantsTabProps) {
  // Stable per mount — getLastCompletedWeek owns the Moscow-TZ ISO-week logic;
  // do NOT call new Date()/Date.now() here (CLAUDE.md single-week constraint).
  const week = getLastCompletedWeek()
  const { data, isLoading, isError } = useMarginAnalyticsByVariant({ week })

  // Client-side filter — by-variant has no nm_id server param (it 400s).
  const targetNmId = Number(nmId)
  // Guard: a malformed route param (NaN) would otherwise filter everything out and
  // render a misleading «no variants» empty state. Surface it explicitly instead
  // (Defensive Frontend Principle — indicate, don't silently degrade).
  if (!Number.isFinite(targetNmId) || targetNmId <= 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Некорректный ID товара
        </CardContent>
      </Card>
    )
  }
  const rows = data?.data?.filter(v => v.nm_id === targetNmId) ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Данные по вариантам — за последнюю завершённую неделю ({formatWeekDisplay(week)}); разбиение
        по вариантам доступно только по одной неделе.
      </p>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Загрузка…</CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Не удалось загрузить варианты
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && <VariantTable data={rows} />}
    </div>
  )
}
