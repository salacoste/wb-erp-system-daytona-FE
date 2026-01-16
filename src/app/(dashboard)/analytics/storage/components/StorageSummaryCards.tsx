'use client'

import { Wallet, Package, Calculator, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { StorageSummary, StoragePeriod } from '@/types/storage-analytics'

/**
 * Storage Summary Cards
 * Story 24.2-FE: Storage Analytics Page Layout
 *
 * Displays 4 summary metrics:
 * - Total storage cost (₽)
 * - Products count
 * - Average cost per product
 * - Period days count
 */
interface StorageSummaryCardsProps {
  summary?: StorageSummary
  period?: StoragePeriod
  isLoading?: boolean
}

export function StorageSummaryCards({
  summary,
  period,
  isLoading = false,
}: StorageSummaryCardsProps) {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Format number with thousand separators
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Всего расходы',
      value: summary ? formatCurrency(summary.total_storage_cost) : '—',
      icon: Wallet,
      description: 'на хранение',
    },
    {
      title: 'Товаров',
      value: summary ? formatNumber(summary.products_count) : '—',
      icon: Package,
      description: 'с данными о хранении',
    },
    {
      title: 'Среднее на товар',
      value: summary ? formatCurrency(summary.avg_cost_per_product) : '—',
      icon: Calculator,
      description: 'за период',
    },
    {
      title: 'Период',
      value: period ? `${period.days_count} дней` : '—',
      icon: Calendar,
      description: period ? `${period.from} — ${period.to}` : '',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span>{card.title}</span>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.description && (
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
