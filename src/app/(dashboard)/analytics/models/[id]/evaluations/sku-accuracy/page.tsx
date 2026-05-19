'use client'

/**
 * SKU Accuracy page — /analytics/models/[id]/evaluations/sku-accuracy
 * Story 110.3-FE Task 5: routing on ?nmId= param, breadcrumb, dual-view dispatch.
 * If nmId present → <SkuAccuracyDetail>; else → <SkuAccuracyOverview>.
 */

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { buildModelEvaluationsRoute } from '@/lib/routes'
import { useAiSkuAccuracy } from '@/hooks/useAiSkuAccuracy'
import { SkuAccuracyOverview } from './components/SkuAccuracyOverview'
import { SkuAccuracyDetail } from './components/SkuAccuracyDetail'

export default function SkuAccuracyPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const modelId = params.id
  const nmIdParam = searchParams.get('nmId')
  // F-1: tightened NaN guard — must be a safe positive integer.
  // Number.isSafeInteger rejects NaN, Infinity, floats (1.5), and values > 2^53-1.
  // > 0 rejects 0 and negatives. Together these cover all malformed ?nmId= inputs.
  // Note: '999999999999999999999' parses to 1e+21 (not Infinity) — isSafeInteger rejects it.
  const parsedNmId = nmIdParam !== null ? Number(nmIdParam) : null
  const nmId =
    parsedNmId !== null && Number.isSafeInteger(parsedNmId) && parsedNmId > 0 ? parsedNmId : null

  // Pre-fetch data needed by SkuAccuracyDetail (required to look up the entry).
  // SkuAccuracyOverview has its own hook call for the overview table.
  // F-4: SkuAccuracyDetail receives data via props; do NOT call useAiSkuAccuracy(modelId, nmId) inside
  // SkuAccuracyDetail — that would create a separate queryKey + double-fetch when backend #166 lands.
  const { data, isLoading, isError } = useAiSkuAccuracy(modelId)

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 px-6 pt-6 text-sm text-muted-foreground">
        <Link
          href={buildModelEvaluationsRoute(modelId)}
          className="hover:text-foreground underline"
        >
          Оценки точности
        </Link>
        <span>/</span>
        <span className="text-foreground">Точность по SKU</span>
      </nav>

      <h1 className="px-6 text-2xl font-semibold">Точность по SKU</h1>

      {nmId !== null ? (
        <SkuAccuracyDetail
          nmId={nmId}
          modelId={modelId}
          skuAccuracies={data?.skuAccuracies}
          isLoading={isLoading}
          isError={isError}
        />
      ) : (
        <SkuAccuracyOverview modelId={modelId} />
      )}
    </div>
  )
}
