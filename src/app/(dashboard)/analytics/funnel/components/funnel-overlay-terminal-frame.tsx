import type { ReactElement } from 'react'

import { ChartFrame } from '@/components/product/charts'
import { Button } from '@/components/ui/button'

export interface FunnelChartIdentity {
  title: string
  description: string
  period: string
  units: string
  annotation?: string
}

interface FunnelOverlayTerminalFrameOptions {
  identity: FunnelChartIdentity
  isLoading: boolean
  isError?: boolean
  dailyGranularityAvailable: boolean
  dataLength: number
  onRetry?: () => void
}

export function renderFunnelOverlayTerminalFrame({
  identity,
  isLoading,
  isError,
  dailyGranularityAvailable,
  dataLength,
  onRetry,
}: FunnelOverlayTerminalFrameOptions): ReactElement | null {
  if (isLoading) {
    return <ChartFrame {...identity} state={{ kind: 'loading', message: 'График загружается' }} />
  }
  if (isError) {
    return (
      <ChartFrame
        {...identity}
        state={{
          kind: 'error',
          message: 'Не удалось загрузить график',
          recovery: (
            <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>
              Повторить загрузку графика
            </Button>
          ),
        }}
      />
    )
  }
  if (!dailyGranularityAvailable) {
    return (
      <ChartFrame
        {...identity}
        state={{
          kind: 'unavailable',
          message:
            'Посуточная разбивка воронки недоступна — WB API возвращает агрегат за период, а не данные по дням. Итоговые метрики воронки доступны в таблице и карточках ниже.',
        }}
      />
    )
  }
  if (dataLength === 0) {
    return (
      <ChartFrame
        {...identity}
        state={{ kind: 'empty', message: 'Нет данных для графика за выбранный период' }}
      />
    )
  }
  return null
}
