import {
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { fmtCurrency, type MergedChartDay } from './funnel-overlay-config'

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU')
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits })
}

export function FunnelOverlayEvidence({
  data,
  showAdOverlay,
}: {
  data: MergedChartDay[]
  showAdOverlay: boolean
}) {
  return (
    <table className="min-w-[48rem] w-full caption-bottom text-sm">
      <TableCaption>Данные воронки по дням</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          <TableHead className="text-right">Просмотры</TableHead>
          <TableHead className="text-right">Заказы</TableHead>
          <TableHead className="text-right">Выкупы</TableHead>
          <TableHead className="text-right">Конверсия</TableHead>
          {showAdOverlay ? <TableHead className="text-right">Расходы на рекламу</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(day => (
          <TableRow key={day.date}>
            <TableCell>{formatDate(day.date)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(day.openCardCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(day.ordersCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(day.buyoutCount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(day.totalConversion, 2)}%
            </TableCell>
            {showAdOverlay ? (
              <TableCell className="text-right tabular-nums">
                {day.adSpend === null ? 'Недоступно' : fmtCurrency(day.adSpend)}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </table>
  )
}
