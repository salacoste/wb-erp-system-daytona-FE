/**
 * Top Products Table Component
 * Story 6.4-FE: Cabinet Summary Dashboard
 * Story 74.6: Refactored - extracted header, row, and utils to sub-modules
 *
 * Displays top 10 products by revenue with click-to-navigate.
 */

'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import type { TopProductItem } from '@/types/analytics'
import { TopProductsTableHeader } from './top-products/TopProductsTableHeader'
import { TopProductsTableRow } from './top-products/TopProductsTableRow'

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
            <p className="text-center text-muted-foreground py-8">Нет данных о товарах</p>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TopProductsTableHeader />
                <TableBody>
                  {products.slice(0, 10).map((product, index) => (
                    <TopProductsTableRow
                      key={product.nm_id}
                      product={product}
                      index={index}
                      onProductClick={handleProductClick}
                    />
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
