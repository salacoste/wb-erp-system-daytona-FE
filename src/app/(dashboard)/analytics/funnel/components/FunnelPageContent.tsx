/** Funnel Page orchestrator — Stories 73.3-FE (WoW), 73.4-FE (filter), 73.8-FE (ad overlay) */
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import type { DateRange } from '@/types/date-range'
import type { FunnelDayItem } from '@/types/analytics-funnel'
import { useFunnelTimeSeries, useFunnelSyncStatus } from '@/hooks/use-funnel-analytics'
import { useAdvertisingAnalytics } from '@/hooks/advertising/hooks'
import { BarChart3, TrendingUp } from 'lucide-react'
import { FunnelSummaryCards } from './FunnelSummaryCards'
import { FunnelTable } from './FunnelTable'
import { FunnelOverlayChart } from './FunnelOverlayChart'
import { FunnelProductFilter } from './FunnelProductFilter'
import { mergeFunnelAndAdDaily } from './funnel-overlay-config'
import { SyncStatusBanner } from './SyncStatusBanner'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseNmIds(param: string | null): number[] {
  if (!param) return []
  return param
    .split(',')
    .map(Number)
    .filter(n => !isNaN(n) && n > 0)
}

export function FunnelPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [showChart, setShowChart] = useState(false)
  const [showAdOverlay, setShowAdOverlay] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const compare = searchParams.get('compare') === 'wow'
  const nmIdsParam = searchParams.get('nmIds')
  const nmIds = useMemo(() => parseNmIds(nmIdsParam), [nmIdsParam])

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const { data: syncStatus } = useFunnelSyncStatus()
  const funnelTs = useFunnelTimeSeries(apiFrom, apiTo, showChart)
  const adQuery = useAdvertisingAnalytics(
    { from: apiFrom, to: apiTo, include_daily: true },
    { enabled: showChart && showAdOverlay }
  )

  const funnelItems = funnelTs.data?.items as FunnelDayItem[] | undefined
  const dailyGranularityAvailable = funnelTs.data?.meta?.dailyGranularityAvailable ?? true
  const adDaily = adQuery.data?.daily
  const mergedData = useMemo(
    () => mergeFunnelAndAdDaily(funnelItems ?? [], adDaily),
    [funnelItems, adDaily]
  )

  // AC-3: Toast when toggle on but no ad data (only on toggle-on transition)
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

  function toggleCompare() {
    updateParam('compare', compare ? null : 'wow')
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
          <button
            type="button"
            onClick={toggleCompare}
            className={`flex items-center gap-1 text-sm transition-colors ${compare ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {compare ? 'Скрыть сравнение' : 'Сравнение'}
          </button>
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

      <FunnelProductFilter from={apiFrom} to={apiTo} value={nmIds} onChange={setNmIds} />
      <FunnelSummaryCards from={apiFrom} to={apiTo} compare={compare} nmIds={nmIds} />

      {showChart && (
        <FunnelOverlayChart
          data={mergedData}
          isLoading={funnelTs.isLoading}
          isError={funnelTs.isError}
          showAdOverlay={showAdOverlay}
          isAdLoading={adQuery.isLoading && showAdOverlay}
          dailyGranularityAvailable={dailyGranularityAvailable}
        />
      )}

      <FunnelTable from={apiFrom} to={apiTo} nmIds={nmIds} compare={compare} />
    </div>
  )
}
