/**
 * SKU Page Alerts & Info Banners
 * Extracted from page.tsx: operating profit formula info,
 * nm_id filter alert, and period label.
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, X, CalendarRange } from 'lucide-react'
import { formatPeriodLabel } from '@/components/custom/DateRangePicker'

/** Operating profit formula explanation banner */
export function OperatingProfitInfoBanner() {
  return (
    // 168.9: info banners blue → status-information; hint text → muted-foreground (tertiary).
    <Alert className="border-status-information/30 bg-status-information/10">
      <Info className="h-4 w-4 text-status-information" />
      <AlertDescription className="space-y-2">
        <div>
          <strong className="text-foreground">ℹ️ Расчёт операционной прибыли</strong>
        </div>
        <div className="text-foreground text-sm">
          <strong>Прибыль</strong> = Выручка − COGS − Все расходы (логистика, хранение, комиссия WB,
          эквайринг, штрафы и др.)
        </div>
        <div className="text-muted-foreground text-xs">
          💡 Наведите на колонку «Прибыль» для деталей. См.
          docs/request-backend/63-operating-profit-formula-clarification.md
        </div>
      </AlertDescription>
    </Alert>
  )
}

/** Story 4.9: Filter alert when nm_id filter is active */
export function NmIdFilterAlert({
  nmIdFilter,
  filteredProductName,
  onClear,
}: {
  nmIdFilter: string
  filteredProductName: string | false | null
  onClear: () => void
}) {
  return (
    <Alert className="border-status-information/30 bg-status-information/10" role="alert">
      <Info className="h-4 w-4 text-status-information" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm text-foreground">
          <strong>Фильтр по товару:</strong> {nmIdFilter}
          {filteredProductName && ` (${filteredProductName})`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-status-information hover:text-status-information hover:bg-status-information/10"
        >
          <X className="h-4 w-4 mr-1" />
          Показать все
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/** Period label shown in multi-week mode */
export function PeriodLabel({ weekStart, weekEnd }: { weekStart: string; weekEnd: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-status-information/10 px-4 py-2 rounded-lg">
      <CalendarRange className="h-4 w-4 text-status-information" />
      <span>
        Период: <strong>{formatPeriodLabel(weekStart, weekEnd)}</strong>
      </span>
    </div>
  )
}
