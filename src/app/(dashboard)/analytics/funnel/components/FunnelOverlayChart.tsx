'use client'

import { useEffect, useState } from 'react'

import { ChartFrame } from '@/components/product/charts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { ChartLegend } from './FunnelOverlayTooltip'
import { FunnelOverlayEvidence } from './FunnelOverlayEvidence'
import { FunnelOverlayPlot } from './FunnelOverlayPlot'
import { getFunnelOverlayRetainedState } from './funnel-overlay-retained-state'
import { renderFunnelOverlayTerminalFrame } from './funnel-overlay-terminal-frame'
import { OVERLAY_SERIES, type MergedChartDay, type OverlayMetricKey } from './funnel-overlay-config'

interface FunnelOverlayChartProps {
  data: MergedChartDay[]
  isLoading: boolean
  isError?: boolean
  showAdOverlay: boolean
  isAdLoading?: boolean
  isAdError?: boolean
  dailyGranularityAvailable?: boolean
  periodFrom?: string
  periodTo?: string
  selectedProductCount?: number
  onRetry?: () => void
  onRetryAdvertising?: () => void
}

function formatPeriod(data: MergedChartDay[], from?: string, to?: string): string {
  const first = from || data[0]?.date
  const last = to || data[data.length - 1]?.date
  if (!first || !last) return 'Не выбран'
  const format = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU')
  return `${format(first)} — ${format(last)}`
}

export function FunnelOverlayChart({
  data,
  isLoading,
  isError,
  showAdOverlay,
  isAdLoading,
  isAdError,
  dailyGranularityAvailable = true,
  periodFrom,
  periodTo,
  selectedProductCount = 0,
  onRetry,
  onRetryAdvertising,
}: FunnelOverlayChartProps) {
  const funnelKeys: OverlayMetricKey[] = ['openCardCount', 'ordersCount', 'buyoutCount']
  const [visibleSeries, setVisibleSeries] = useState<string[]>(funnelKeys)

  useEffect(() => {
    setVisibleSeries(previous => {
      const hasAdvertising = previous.includes('adSpend')
      if (showAdOverlay && !hasAdvertising) return [...previous, 'adSpend']
      if (!showAdOverlay && hasAdvertising) return previous.filter(key => key !== 'adSpend')
      return previous
    })
  }, [showAdOverlay])

  const activeSeries = OVERLAY_SERIES.filter(series => series.key !== 'adSpend' || showAdOverlay)
  const hiddenLabels = activeSeries
    .filter(series => !visibleSeries.includes(series.key))
    .map(series => series.label)

  const toggleSeries = (key: string) => {
    setVisibleSeries(previous =>
      previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]
    )
  }

  const period = formatPeriod(data, periodFrom, periodTo)
  const description = showAdOverlay
    ? 'Посуточное сопоставление просмотров, заказов, выкупов и рекламных расходов.'
    : 'Посуточное сопоставление просмотров, заказов и выкупов.'
  const units = showAdOverlay ? 'штуки, проценты и рубли' : 'штуки и проценты'
  const annotation =
    selectedProductCount > 0
      ? `Выбрано товаров: ${selectedProductCount}; график показывает общую воронку по кабинету, а фильтр применяется к карточкам и таблице.`
      : undefined
  const identity = {
    title: 'Динамика воронки по дням',
    description,
    period,
    units,
    annotation,
  }
  const terminalFrame = renderFunnelOverlayTerminalFrame({
    identity,
    isLoading,
    isError: isError && data.length === 0,
    dailyGranularityAvailable,
    dataLength: data.length,
    onRetry,
  })
  if (terminalFrame) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">{terminalFrame}</CardContent>
      </Card>
    )
  }

  const availableAdDays = showAdOverlay ? data.filter(day => day.adSpend !== null).length : 0
  const unavailableAdDays = showAdOverlay ? data.length - availableAdDays : 0
  const retainedState = getFunnelOverlayRetainedState({
    isError: Boolean(isError),
    showAdOverlay,
    isAdLoading: Boolean(isAdLoading),
    isAdError: Boolean(isAdError),
    availableAdDays,
    unavailableAdDays,
    totalDays: data.length,
  })

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <ChartFrame
          {...identity}
          state={retainedState}
          activity={
            isAdLoading
              ? { kind: 'updating', message: 'Загружаются расходы на рекламу' }
              : undefined
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ChartLegend series={activeSeries} visible={visibleSeries} onToggle={toggleSeries} />
              {isError ? (
                <Button type="button" variant="outline" onClick={onRetry} className="min-h-11">
                  Повторить загрузку графика
                </Button>
              ) : null}
              {showAdOverlay && isAdError ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRetryAdvertising}
                  className="min-h-11"
                >
                  Повторить загрузку рекламы
                </Button>
              ) : null}
            </div>
          }
          plotLabel={
            showAdOverlay ? 'График этапов воронки с рекламными расходами' : 'График этапов воронки'
          }
          plot={
            <FunnelOverlayPlot
              data={data}
              visibleSeries={visibleSeries}
              showAdOverlay={showAdOverlay}
            />
          }
          evidence={{
            summary: `${data.length} ${data.length === 1 ? 'день' : 'дней'} с точными значениями по этапам воронки.`,
            selection: {
              label:
                hiddenLabels.length > 0
                  ? `Скрытые серии: ${hiddenLabels.join(', ')}`
                  : 'Все выбранные серии видимы',
              effect:
                hiddenLabels.length > 0
                  ? 'Скрытые серии исключены из графика; точные данные остаются в таблице.'
                  : 'Все доступные серии показаны на графике и в таблице.',
            },
            alternativeLabel: 'Точные данные графика воронки',
            dataAlternative: <FunnelOverlayEvidence data={data} showAdOverlay={showAdOverlay} />,
          }}
        />
      </CardContent>
    </Card>
  )
}
