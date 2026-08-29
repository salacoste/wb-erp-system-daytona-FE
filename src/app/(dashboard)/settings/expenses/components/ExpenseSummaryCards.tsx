'use client'

/**
 * Expense Summary Cards
 * Displays total expenses and category breakdown for a selected month
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { useExpensesSummary } from '@/hooks/useExpensesCRUD'
import { EXPENSE_CATEGORY_CONFIG } from '@/types/expenses'

interface ExpenseSummaryCardsProps {
  month: string
}

export function ExpenseSummaryCards({ month }: ExpenseSummaryCardsProps) {
  const { data: summary, isLoading, isError, refetch } = useExpensesSummary(month, month)

  if (isLoading) {
    return (
      <div
        className="grid gap-4 md:grid-cols-3"
        role="status"
        aria-label="Загружаем сводку расходов"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <PageState
        state="error"
        title="Не удалось загрузить сводку расходов"
        explanation="Сервер не вернул итоговые суммы за выбранный месяц."
        trust="Сводка скрыта, чтобы ошибка не выглядела как нулевые расходы."
        recovery={<Button onClick={() => void refetch()}>Повторить загрузку сводки</Button>}
      />
    )
  }

  if (!summary || !Number.isFinite(summary.total)) {
    return (
      <PageState
        state="error"
        title="Сводка расходов пока недоступна"
        explanation="Сервер ещё не подтвердил итоговые суммы за выбранный месяц."
        trust="Неизвестные суммы не показываются как нулевые расходы."
        recovery={<Button onClick={() => void refetch()}>Повторить загрузку сводки</Button>}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Итого за месяц
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(summary.total)}</p>
        </CardContent>
      </Card>

      {EXPENSE_CATEGORY_CONFIG.slice(0, 2).map(cat => {
        const amount = summary?.byCategory[cat.value] ?? 0
        return (
          <Card key={cat.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {cat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
            </CardContent>
          </Card>
        )
      })}

      <CategoryBreakdownCard summary={summary} />
    </div>
  )
}

function CategoryBreakdownCard({ summary }: { summary: { byCategory: Record<string, number> } }) {
  return (
    <Card className="md:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Разбивка по категориям
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {EXPENSE_CATEGORY_CONFIG.map(cat => {
            const amount = summary?.byCategory[cat.value] ?? 0
            return (
              <div key={cat.value} className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{cat.label}</p>
                <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
