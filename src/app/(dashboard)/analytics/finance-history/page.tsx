'use client'

/**
 * Finance History page — multi-week P&L grid (competitor-parity).
 * `/analytics/finance-history`: rows = financial metrics, columns = last N
 * completed weeks, each cell showing the value + WoW delta.
 *
 * Data flow (respects the available-weeks guard — memory: future/incomplete
 * weeks 404 on finance-summary): available-weeks → filter ≤ last completed →
 * take last N → per-week finance-summary series → table.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Info } from 'lucide-react'
import { useAvailableWeeks, useWeeklyFinancialSeries } from '@/hooks/financial'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { ROUTES } from '@/lib/routes'
import { FinanceHistoryTable } from '@/components/custom/finance-history/FinanceHistoryTable'

const PERIODS = [
  { value: '4', label: '4 недели' },
  { value: '8', label: '8 недель' },
  { value: '12', label: '12 недель' },
  { value: '26', label: '26 недель' },
] as const

export default function FinanceHistoryPage(): React.ReactElement {
  const [count, setCount] = useState<number>(8)
  const { data: availableWeeks, isLoading: weeksLoading } = useAvailableWeeks()

  // Only fetch weeks that actually exist in available-weeks AND are ≤ last completed.
  const weeks = useMemo<string[]>(() => {
    if (weeksLoading || !availableWeeks) return []
    const completed = getLastCompletedWeek()
    return availableWeeks
      .map(w => w.week)
      .filter(week => week <= completed)
      .sort()
      .slice(-count)
  }, [availableWeeks, count, weeksLoading])

  const series = useWeeklyFinancialSeries(weeks)
  const showSkeleton = weeksLoading || (weeks.length > 0 && series.isLoading)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href={ROUTES.ANALYTICS.ROOT}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Аналитика
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Финансовый отчёт: история
        </h1>
        <p className="text-sm text-muted-foreground">
          Динамика прибыли, маржинальности и структуры расходов по неделям
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Label htmlFor="fh-period" className="whitespace-nowrap">
            Период:
          </Label>
          <Select value={String(count)} onValueChange={v => setCount(Number(v))}>
            <SelectTrigger id="fh-period" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Последние завершённые недели (до {getLastCompletedWeek()})
          </span>
        </CardContent>
      </Card>

      {showSkeleton ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : (
        <FinanceHistoryTable points={series.data} />
      )}

      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Источник: еженедельные финансовые отчёты WB (finance-summary). Чистая прибыль
          рассчитывается через налоговый каскад и соответствует карточке на дашборде. Доли расходов
          вычисляются от выручки (нетто). Недели без данных COGS показывают «—».
        </AlertDescription>
      </Alert>
    </div>
  )
}
