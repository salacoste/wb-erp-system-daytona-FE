import { AlertCircle, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { DashboardSearchAnalytics } from '../types/monitoring'

const STATUS_LABELS: Record<DashboardSearchAnalytics['status'], string> = {
  complete: 'Полные данные',
  no_data: 'Нет строк — период покрыт полностью',
  partial: 'Частичные данные',
  uncovered: 'Период не покрыт',
  unknown: 'Полнота неизвестна',
  error: 'Ошибка получения',
}

export function SearchAnalyticsStatusCard({ data }: { data?: DashboardSearchAnalytics | null }) {
  const status = data?.status ?? 'unknown'
  const authoritativeLevels = status === 'complete' || status === 'no_data' || status === 'partial'

  return (
    <Card data-testid="dashboard-search-analytics-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" /> Поисковая аналитика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p data-testid="dashboard-search-status" className="text-sm font-medium">
          {STATUS_LABELS[status]}
        </p>
        {authoritativeLevels && data ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p>
              Запросов: <strong>{formatNumber(data.totalQueries)}</strong>
            </p>
            <p>
              Открытий: <strong>{formatNumber(data.totalSearchImpressions)}</strong>
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Метрики скрыты до подтверждения покрытия.</p>
        )}
        {/* Pass-1 M1: counts only where they are real measurements (partial/uncovered).
            unknown/error must not present placeholder 0/0 as data — they already say
            so in the status line above. */}
        {data && (status === 'partial' || status === 'uncovered') ? (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Покрыто {data.coverage.coveredDayCount}/{data.coverage.requestedDayCount} дней. Статус
              покрытия не равен полному.
            </AlertDescription>
          </Alert>
        ) : null}
        {data && status === 'error' ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Не удалось получить реестр покрытия поисковой аналитики.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
