'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useExpenses, type ExpenseItem } from '@/hooks/useExpenses'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { EmptyStateIllustration } from './EmptyStateIllustration'

/** Shimmer skeleton component for expense chart loading state */
function ExpenseChartSkeleton(): React.ReactElement {
  // Heights as percentages to simulate varying bar heights
  const barHeights = [0.65, 0.85, 0.45, 0.75, 0.55, 0.9, 0.35]

  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-32" aria-hidden="true" />
        <Skeleton className="h-4 w-48 mt-1" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-[300px] px-4">
          {barHeights.map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ height: `${height * 100}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
        {/* X-axis label skeletons */}
        <div className="flex justify-between mt-4 px-4">
          {barHeights.map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" aria-hidden="true" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Expense breakdown chart component
 * Story 3.3: Expense Breakdown Visualization
 *
 * @param weekOverride - Optional week to display (YYYY-Www format). If not provided, shows latest week.
 */
export function ExpenseChart({ weekOverride }: { weekOverride?: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useExpenses(weekOverride)

  // Track screen size for responsive margins
  // Mobile screens (<640px): No horizontal margins for maximum chart width
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Initial check
    checkMobile()

    // Listen for window resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenses'] })
    refetch()
  }

  // Color palette for expense categories
  // 2025-12-13: Updated to match PnLWaterfall/Dashboard structure + Request #56 WB Services
  // Categories now include WB services breakdown (Продвижение, Джем, etc.)
  // Zero-value categories are filtered out in useExpenses hook
  const COLORS = [
    '#9C27B0', // Purple - Комиссия WB (main commission, largest expense)
    '#2196F3', // Blue - Логистика
    '#4CAF50', // Green - Хранение
    '#FF9800', // Orange - Платная приёмка
    '#E53935', // Red - Штрафы
    '#673AB7', // Deep Purple - Корректировка ВВ
    '#E91E63', // Pink - WB.Продвижение (Request #56)
    '#9575CD', // Light Purple - Джем (Request #56)
    '#78909C', // Blue Grey - Прочие сервисы WB (Request #56)
    '#607D8B', // Grey - Прочие корректировки
    '#00BCD4', // Cyan - Комиссия лояльности
    '#FF5722', // Deep Orange - Удержание баллов
    '#FFC107', // Amber - Эквайринг
  ]

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: ExpenseItem }>
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ExpenseItem
      return (
        <div className="rounded-lg border bg-white p-3 shadow-md">
          <p className="font-semibold text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            Сумма: <span className="font-medium">{formatCurrency(data.amount)}</span>
          </p>
          {data.percentage !== undefined && (
            <p className="text-sm text-gray-600">
              Доля: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return <ExpenseChartSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Разбивка расходов</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные о расходах. Пожалуйста, попробуйте еще раз.</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Разбивка расходов</CardTitle>
          <CardDescription>Визуализация расходов по категориям</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStateIllustration type="expenses" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Разбивка расходов</CardTitle>
        <CardDescription>Визуализация расходов по категориям</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={400}
          aria-label="Диаграмма расходов по категориям"
        >
          <BarChart
            data={data.expenses}
            margin={{
              top: 20,
              right: isMobile ? 0 : 30,
              left: isMobile ? 0 : 20,
              bottom: 100,
            }}
          >
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={value => formatCurrency(value)}
              tick={{ fontSize: 12 }}
              width={isMobile ? 60 : 80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {data.expenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
