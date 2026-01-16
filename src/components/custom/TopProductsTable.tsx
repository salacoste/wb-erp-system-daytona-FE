/**
 * Top Products Table Component
 * Story 6.4-FE: Cabinet Summary Dashboard
 *
 * Displays top 10 products by revenue with click-to-navigate.
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
import type { TopProductItem } from '@/types/analytics'

/**
 * Props for TopProductsTable component
 */
export interface TopProductsTableProps {
  /** List of top products */
  products: TopProductItem[]
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
 * Top Products Table - displays top 10 products by revenue
 *
 * @example
 * <TopProductsTable
 *   products={[{ nm_id: '123', sa_name: 'Product', revenue_net: 50000, ... }]}
 *   isLoading={false}
 * />
 */
export function TopProductsTable({
  products,
  isLoading = false,
  className,
}: TopProductsTableProps) {
  const router = useRouter()

  // Story 6.4-FE: Click to navigate to product detail (COGS page with search)
  const handleProductClick = (nmId: string) => {
    router.push(`/cogs?search=${nmId}`)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Топ-10 товаров</CardTitle>
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
            <span className="text-xl">🏆</span>
            Топ-10 товаров
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Топ-10 товаров по сумме к перечислению (net_for_pay) за период</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>По сумме к перечислению за период</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Нет данных о товарах
            </p>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Товар
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Артикул продавца и nm_id. Кликните для перехода к себестоимости</p>
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
                            <p>Сумма к перечислению (net_for_pay) за товар от WB продавцу</p>
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
                            <p>Валовая прибыль: выручка минус себестоимость товара</p>
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
                            <p>Маржинальность: доля прибыли в выручке товара</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Доля
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Вклад товара в общую выручку: какой % приходится на этот товар</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {products.slice(0, 10).map((product, index) => (
                  <TableRow
                    key={product.nm_id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleProductClick(product.nm_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleProductClick(product.nm_id)
                      }
                    }}
                    aria-label={`Перейти к товару ${product.sa_name}`}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium truncate max-w-[200px]">
                          {product.sa_name || `Артикул ${product.nm_id}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.nm_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue_net)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium',
                        product.profit !== null && product.profit >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {product.profit !== null ? formatCurrency(product.profit) : '—'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium',
                        getMarginColor(product.margin_pct)
                      )}
                    >
                      {formatPercent(product.margin_pct)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatPercent(product.contribution_pct)}
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
