/**
 * Top Brands Table Component
 * Story 6.4-FE: Cabinet Summary Dashboard
 *
 * Displays top 5 brands by revenue with click-to-filter.
 */

'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TopBrandItem } from '@/types/analytics'

/**
 * Props for TopBrandsTable component
 */
export interface TopBrandsTableProps {
  /** List of top brands */
  brands: TopBrandItem[]
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format percentage value
 */
function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}%`
}

/**
 * Get margin color class based on value
 */
function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-gray-400'
  if (margin >= 30) return 'text-green-600'
  if (margin >= 15) return 'text-yellow-600'
  if (margin >= 0) return 'text-orange-500'
  return 'text-red-600'
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

/**
 * Top Brands Table - displays top 5 brands by revenue
 *
 * @example
 * <TopBrandsTable
 *   brands={[{ brand: 'Nike', revenue_net: 500000, profit: 150000, margin_pct: 30 }]}
 *   isLoading={false}
 * />
 */
export function TopBrandsTable({
  brands,
  isLoading = false,
  className,
}: TopBrandsTableProps) {
  const router = useRouter()

  // Story 6.4-FE: Click to filter analytics by brand
  const handleBrandClick = (brand: string) => {
    router.push(`/analytics/brand?brand=${encodeURIComponent(brand)}`)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Топ-5 брендов</CardTitle>
          <CardDescription>По выручке за период</CardDescription>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            Топ-5 брендов
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Топ-5 брендов по сумме к перечислению (net_for_pay) за период</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>По сумме к перечислению за период</CardDescription>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет данных о брендах
            </p>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Бренд
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Название бренда из карточки товара WB. Кликните для перехода к аналитике</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Выручка
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Сумма к перечислению (net_for_pay) по всем товарам бренда</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Прибыль
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Валовая прибыль: выручка минус себестоимость товаров бренда</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Маржа
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Маржинальность: доля прибыли в выручке бренда</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.slice(0, 5).map((brand, index) => (
                    <TableRow
                      key={brand.brand}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleBrandClick(brand.brand)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleBrandClick(brand.brand)
                        }
                      }}
                      aria-label={`Фильтровать по бренду ${brand.brand}`}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {brand.brand || 'Без бренда'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(brand.revenue_net)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          brand.profit !== null && brand.profit >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {brand.profit !== null ? formatCurrency(brand.profit) : '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          getMarginColor(brand.margin_pct)
                        )}
                      >
                        {formatPercent(brand.margin_pct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
