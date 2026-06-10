/** Funnel Page orchestrator — Stories 73.3-FE (WoW), 73.4-FE (filter), 73.8-FE (ad overlay) */
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { ComparisonPeriodSelector } from '@/components/custom/ComparisonPeriodSelector'
import type { ComparisonPreset } from '@/components/custom/comparison-period/comparison-period-types'
import type { DateRange } from '@/types/date-range'
import type { FunnelDayItem } from '@/types/analytics-funnel'
import { useFunnelTimeSeries, useFunnelSyncStatus } from '@/hooks/use-funnel-analytics'
import { useAdvertisingAnalytics } from '@/hooks/advertising/hooks'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { TrendingUp } from 'lucide-react'
import { FunnelSummaryCards } from './FunnelSummaryCards'
import { FunnelTable } from './FunnelTable'
import { FunnelOverlayChart } from './FunnelOverlayChart'
import { FunnelProductFilter } from './FunnelProductFilter'
import { mergeFunnelAndAdDaily } from './funnel-overlay-config'
import { useFunnelExportData } from './useFunnelExportData'
import { SyncStatusBanner } from './SyncStatusBanner'
import { calculatePreviousPeriod } from './funnel-comparison-utils'
import { getDefaultRange, formatApi, toIsoWeek, parseNmIds } from './funnel-page-helpers'

export { parseNmIds } from './funnel-page-helpers'

export function FunnelPageContent() {
  // Hydration-safe: initialize dateRange as undefined, set after mount
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [showChart, setShowChart] = useState(false)
  const [showAdOverlay, setShowAdOverlay] = useState(false)
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [compareStart, setCompareStart] = useState('')
  const [compareEnd, setCompareEnd] = useState('')

  useEffect(() => {
    setDateRange(getDefaultRange())
  }, [])

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const nmIdsParam = searchParams.get('nmIds')
  const nmIds = useMemo(() => parseNmIds(nmIdsParam), [nmIdsParam])

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const comparePeriod = useMemo(() => {
    if (!comparisonEnabled || !apiFrom || !apiTo) return null
    return calculatePreviousPeriod(apiFrom, apiTo)
  }, [comparisonEnabled, apiFrom, apiTo])

  const { data: syncStatus } = useFunnelSyncStatus()
  const { exportItems, csvContent, csvFileName } = useFunnelExportData(apiFrom, apiTo, nmIds)
  const funnelTs = useFunnelTimeSeries(apiFrom, apiTo, showChart)
  const adQuery = useAdvertisingAnalytics(
    { from: apiFrom, to: apiTo, include_daily: true },
    { enabled: showChart && showAdOverlay }
  )

  const funnelItems = funnelTs.data?.items as FunnelDayItem[] | undefined
  const adDaily = adQuery.data?.daily
  const mergedData = useMemo(
    () => mergeFunnelAndAdDaily(funnelItems ?? [], adDaily),
    [funnelItems, adDaily]
  )

  // Toast when ad overlay toggled on but no ad data
  const prevOverlay = useRef(false)
  useEffect(() => {
    if (showAdOverlay && !prevOverlay.current) {
      if (!adQuery.isLoading && (!adDaily || adDaily.length === 0)) {
        toast.info('Нет данных о рекламе за выбранный период')
      }
    }
    prevOverlay.current = showAdOverlay
  }, [showAdOverlay, adQuery.isLoading, adDaily])

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }

  function setNmIds(ids: number[]) {
    updateParam('nmIds', ids.length > 0 ? ids.join(',') : null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Воронка продаж</h1>
        <p className="text-muted-foreground mt-1">Просмотры → корзина → заказы → выкупы → отмены</p>
      </div>

      <SyncStatusBanner syncStatus={syncStatus} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="funnel-date-range"
        />
        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvButton
            csvContent={csvContent}
            fileName={csvFileName}
            label="Скачать CSV"
            disabled={exportItems.length === 0}
          />
          <button
            type="button"
            onClick={() => setShowChart(v => !v)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showChart ? 'Скрыть график' : 'Показать график'}
          </button>
          {showChart && (
            <button
              type="button"
              onClick={() => setShowAdOverlay(v => !v)}
              className={`flex items-center gap-1 text-sm transition-colors ${showAdOverlay ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              aria-pressed={showAdOverlay}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showAdOverlay ? 'Скрыть рекламу' : 'Показать рекламу'}
            </button>
          )}
        </div>
      </div>

      <ComparisonPeriodSelector
        enabled={comparisonEnabled}
        onEnabledChange={setComparisonEnabled}
        preset={comparisonPreset}
        onPresetChange={setComparisonPreset}
        compareStart={compareStart}
        compareEnd={compareEnd}
        onCompareRangeChange={(start, end) => {
          setCompareStart(start)
          setCompareEnd(end)
        }}
        currentPeriodStart={dateRange ? toIsoWeek(dateRange.from) : ''}
        currentPeriodEnd={dateRange ? toIsoWeek(dateRange.to) : ''}
      />

      <FunnelProductFilter from={apiFrom} to={apiTo} value={nmIds} onChange={setNmIds} />
      <FunnelSummaryCards
        from={apiFrom}
        to={apiTo}
        compareEnabled={comparisonEnabled}
        compareFrom={comparePeriod?.prevFrom ?? ''}
        compareTo={comparePeriod?.prevTo ?? ''}
        nmIds={nmIds}
      />

      {showChart && (
        <FunnelOverlayChart
          data={mergedData}
          isLoading={funnelTs.isLoading}
          isError={funnelTs.isError}
          showAdOverlay={showAdOverlay}
          isAdLoading={adQuery.isLoading && showAdOverlay}
          dailyGranularityAvailable={funnelTs.data?.meta?.dailyGranularityAvailable ?? true}
        />
      )}

      <FunnelTable
        from={apiFrom}
        to={apiTo}
        nmIds={nmIds}
        compareEnabled={comparisonEnabled}
        compareFrom={comparePeriod?.prevFrom ?? ''}
        compareTo={comparePeriod?.prevTo ?? ''}
      />
    </div>
  )
}
