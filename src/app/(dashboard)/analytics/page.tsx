/**
 * Financial Summary View (Analytics Hub)
 * Story 3.5: Financial Summary View
 * Updated: 2025-12-13 - Improved navigation UX
 *
 * Features:
 * - Quick navigation to all analytics pages (top of page)
 * - Week selector with available weeks
 * - Complete financial summary (all metrics)
 * - Period comparison (two weeks side-by-side)
 * - Responsive design with accessibility
 *
 * UX Improvements (Sally - UX Expert):
 * - Navigation cards moved to top for immediate access
 * - Visual hierarchy: primary actions prominent
 * - Grouped by purpose: Financial / Operational / Strategic
 * - Hover states and visual feedback
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  useFinancialSummary,
  useFinancialSummaryComparison,
  useMultiWeekFinancialSummary,
  useAvailableWeeks,
  formatWeekDisplay,
} from '@/hooks/useFinancialSummary'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { WeekSelector, WeekComparisonSelector } from '@/components/custom/WeekSelector'
import { MultiWeekSelector } from '@/components/custom/MultiWeekSelector'
import { FinancialSummaryTable } from '@/components/custom/FinancialSummaryTable'
import { ExpenseChart } from '@/components/custom/ExpenseChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import {
  Package,
  Tags,
  Calendar,
  AlertCircle,
  BarChart3,
  RefreshCw,
  GitCompare,
  Warehouse,
  PackageSearch,
  Calculator,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import { RequireWbToken } from '@/components/custom/RequireWbToken'

/**
 * Analytics navigation configuration
 * UX: Grouped by user intent - what question are they trying to answer?
 */
const analyticsNavigation = {
  financial: {
    title: 'Финансовый анализ',
    description: 'Доходы, расходы и маржинальность',
    items: [
      {
        href: ROUTES.ANALYTICS.SKU,
        icon: Package,
        title: 'По товарам',
        description: 'Прибыль и маржа каждого SKU',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        hoverBg: 'hover:bg-blue-100',
        borderColor: 'border-blue-200',
      },
      {
        href: ROUTES.ANALYTICS.BRAND,
        icon: Tags,
        title: 'По брендам',
        description: 'Эффективность брендов',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        hoverBg: 'hover:bg-emerald-100',
        borderColor: 'border-emerald-200',
      },
      {
        href: ROUTES.ANALYTICS.CATEGORY,
        icon: BarChart3,
        title: 'По категориям',
        description: 'Сравнение категорий',
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        hoverBg: 'hover:bg-violet-100',
        borderColor: 'border-violet-200',
      },
      {
        href: ROUTES.ANALYTICS.TIME_PERIOD,
        icon: Calendar,
        title: 'По времени',
        description: 'Динамика по неделям',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        hoverBg: 'hover:bg-amber-100',
        borderColor: 'border-amber-200',
      },
    ],
  },
  operational: {
    title: 'Операционная аналитика',
    description: 'Склад, поставки и затраты',
    items: [
      {
        href: ROUTES.ANALYTICS.STORAGE,
        icon: Warehouse,
        title: 'Хранение',
        description: 'Затраты на хранение по SKU',
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        hoverBg: 'hover:bg-slate-100',
        borderColor: 'border-slate-200',
      },
      {
        href: ROUTES.ANALYTICS.SUPPLY_PLANNING,
        icon: PackageSearch,
        title: 'Планирование',
        description: 'Прогноз стокаутов',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        hoverBg: 'hover:bg-rose-100',
        borderColor: 'border-rose-200',
        badge: 'Важно',
      },
      {
        href: ROUTES.ANALYTICS.ORDERS,
        icon: ClipboardList,
        title: 'Заказы FBS',
        description: 'Анализ заказов FBS за 365 дней',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        hoverBg: 'hover:bg-orange-100',
        borderColor: 'border-orange-200',
        badge: 'Новое',
      },
    ],
  },
  strategic: {
    title: 'Стратегический анализ',
    description: 'Юнит-экономика и рентабельность',
    items: [
      {
        href: ROUTES.ANALYTICS.UNIT_ECONOMICS,
        icon: Calculator,
        title: 'Юнит-экономика',
        description: 'Структура затрат на единицу',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        hoverBg: 'hover:bg-indigo-100',
        borderColor: 'border-indigo-200',
        badge: 'Новое',
      },
    ],
  },
}

/**
 * Navigation Card Component
 * UX: Large click targets, clear visual feedback, accessible
 */
function NavigationCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  bgColor,
  hoverBg,
  borderColor,
  badge,
  className,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  hoverBg: string
  borderColor: string
  badge?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col p-4 rounded-xl border-2 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        borderColor,
        bgColor,
        hoverBg,
        'hover:shadow-md hover:scale-[1.02]',
        className
      )}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bgColor)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        {title}
        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-gray-400" />
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
    </Link>
  )
}

/**
 * Navigation item type
 */
interface NavigationItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  bgColor: string
  hoverBg: string
  borderColor: string
  badge?: string
}

/**
 * Navigation Section Component
 */
function NavigationSection({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: NavigationItem[]
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div
        className={cn('grid gap-3 flex-1', items.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2')}
      >
        {items.map(item => (
          <NavigationCard
            key={item.href}
            {...item}
            className={items.length === 1 ? 'h-full' : ''}
          />
        ))}
      </div>
    </div>
  )
}

type ViewMode = 'single' | 'multi' | 'comparison'

export default function AnalyticsSummaryPage() {
  const { data: availableWeeks, isLoading: isLoadingWeeks } = useAvailableWeeks()

  // Get latest week or last completed week as default (Epic 19: only completed weeks have data)
  const defaultWeek = availableWeeks?.[0]?.week || getLastCompletedWeek()

  // State for week selection (default: multi-week mode)
  const [viewMode, setViewMode] = useState<ViewMode>('multi')
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek)
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([defaultWeek])
  const [comparisonWeek, setComparisonWeek] = useState(
    availableWeeks?.[1]?.week || getLastCompletedWeek()
  )

  // Update selected week when availableWeeks loads for the first time
  // This ensures we use a week that actually has data (Epic 19: completed weeks only)
  useEffect(() => {
    if (availableWeeks && availableWeeks.length > 0) {
      const firstAvailableWeek = availableWeeks[0].week
      // Only update if selectedWeek is not in the available weeks list
      const isSelectedWeekAvailable = availableWeeks.some(w => w.week === selectedWeek)
      if (!isSelectedWeekAvailable) {
        setSelectedWeek(firstAvailableWeek)
        setSelectedWeeks([firstAvailableWeek])
      }
      // Also update comparison week if needed
      const isComparisonWeekAvailable = availableWeeks.some(w => w.week === comparisonWeek)
      if (!isComparisonWeekAvailable && availableWeeks.length > 1) {
        setComparisonWeek(availableWeeks[1].week)
      }
    }
  }, [availableWeeks, selectedWeek, comparisonWeek])

  // Check if selectedWeek is in availableWeeks (to avoid 404 errors for non-existent weeks)
  const isWeekAvailable = availableWeeks?.some(w => w.week === selectedWeek) ?? false

  // Check if comparison week is available
  const isComparisonWeekAvailable = availableWeeks?.some(w => w.week === comparisonWeek) ?? false

  // Filter selectedWeeks to only include available weeks
  const availableSelectedWeeks = selectedWeeks.filter(
    w => availableWeeks?.some(aw => aw.week === w) ?? false
  )

  // Fetch data based on mode - only when weeks are confirmed available
  const singleWeekQuery = useFinancialSummary(isWeekAvailable ? selectedWeek : '')
  const multiWeekQuery = useMultiWeekFinancialSummary(
    availableSelectedWeeks.length > 0 ? availableSelectedWeeks : []
  )
  const comparisonQuery = useFinancialSummaryComparison(
    isWeekAvailable ? selectedWeek : '',
    isComparisonWeekAvailable ? comparisonWeek : ''
  )

  // Determine loading/error states based on mode
  // Include isLoadingWeeks to prevent 404 errors when availableWeeks hasn't loaded yet
  const isLoading =
    isLoadingWeeks ||
    (viewMode === 'multi'
      ? multiWeekQuery.isLoading
      : viewMode === 'comparison'
        ? comparisonQuery.isLoading
        : singleWeekQuery.isLoading)

  const isError =
    viewMode === 'multi'
      ? multiWeekQuery.isError
      : viewMode === 'comparison'
        ? comparisonQuery.isError
        : singleWeekQuery.isError

  const error =
    viewMode === 'multi'
      ? multiWeekQuery.error
      : viewMode === 'comparison'
        ? comparisonQuery.error
        : singleWeekQuery.error

  // Get summary data based on mode
  const primarySummary =
    viewMode === 'multi'
      ? multiWeekQuery.data || undefined
      : viewMode === 'comparison'
        ? comparisonQuery.week1.data?.summary_total ||
          comparisonQuery.week1.data?.summary_rus ||
          undefined
        : singleWeekQuery.data?.summary_total || singleWeekQuery.data?.summary_rus || undefined

  const secondarySummary =
    viewMode === 'comparison'
      ? comparisonQuery.week2.data?.summary_total ||
        comparisonQuery.week2.data?.summary_rus ||
        undefined
      : undefined

  const handleRetry = () => {
    if (viewMode === 'multi') {
      multiWeekQuery.refetch()
    } else if (viewMode === 'comparison') {
      comparisonQuery.week1.refetch()
      comparisonQuery.week2.refetch()
    } else {
      singleWeekQuery.refetch()
    }
  }

  const cycleViewMode = () => {
    if (viewMode === 'single') {
      setViewMode('multi')
      // Initialize multi-select with current single week
      setSelectedWeeks([selectedWeek])
    } else if (viewMode === 'multi') {
      setViewMode('comparison')
    } else {
      setViewMode('single')
    }
  }

  return (
    <RequireWbToken>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Аналитика</h1>
            <p className="text-muted-foreground mt-1">
              {viewMode === 'multi' && selectedWeeks.length > 1
                ? `Агрегированные данные за ${selectedWeeks.length} ${selectedWeeks.length >= 2 && selectedWeeks.length <= 4 ? 'недели' : 'недель'}`
                : 'Выберите раздел аналитики или просмотрите финансовую сводку ниже'}
            </p>
          </div>
          <Button
            variant={viewMode !== 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={cycleViewMode}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            {viewMode === 'single' && 'Несколько периодов'}
            {viewMode === 'multi' && 'Сравнить периоды'}
            {viewMode === 'comparison' && 'Один период'}
          </Button>
        </div>

        {/* Quick Navigation - UX: Primary action area at top */}
        <Card className="border-none shadow-none bg-gray-50/50">
          <CardContent className="p-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <NavigationSection {...analyticsNavigation.financial} />
              <NavigationSection {...analyticsNavigation.operational} />
              <NavigationSection {...analyticsNavigation.strategic} />
            </div>
          </CardContent>
        </Card>

        {/* Divider with title */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-muted-foreground font-medium">
              Финансовая сводка за период
            </span>
          </div>
        </div>

        {/* Week Selector - different UI based on view mode */}
        {viewMode === 'single' && (
          <WeekSelector value={selectedWeek} onChange={setSelectedWeek} label="Выберите период" />
        )}
        {viewMode === 'multi' && (
          <MultiWeekSelector
            value={selectedWeeks}
            onChange={setSelectedWeeks}
            label="Выберите периоды для агрегации"
            maxSelection={12}
          />
        )}
        {viewMode === 'comparison' && (
          <WeekComparisonSelector
            week1={selectedWeek}
            week2={comparisonWeek}
            onWeek1Change={setSelectedWeek}
            onWeek2Change={setComparisonWeek}
          />
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {error instanceof Error
                  ? error.message
                  : 'Не удалось загрузить финансовые данные. Пожалуйста, попробуйте еще раз.'}
              </span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && primarySummary && (
          <>
            {/* Financial Summary Table */}
            <FinancialSummaryTable summary={primarySummary} comparisonSummary={secondarySummary} />

            {/* Expense Chart - only for single week mode */}
            {viewMode === 'single' && (
              <Card>
                <CardHeader>
                  <CardTitle>Разбивка расходов</CardTitle>
                  <CardDescription>
                    Визуализация структуры расходов за {formatWeekDisplay(selectedWeek)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseChart weekOverride={selectedWeek} />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !primarySummary && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Нет данных для отображения. Пожалуйста, загрузите финансовые отчеты или выберите
              другой период.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </RequireWbToken>
  )
}
