/**
 * Top Brands Table Component
 * Story 6.4-FE: Cabinet Summary Dashboard
 * Story 74.6: Refactored - extracted header, row, and utils to sub-modules
 *
 * Displays top 5 brands by revenue with click-to-filter.
 */

'use client'

import { useRouter } from 'next/navigation'
import { Table, TableBody } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import type { TopBrandItem } from '@/types/analytics'
import { TopBrandsTableHeader } from './top-brands/TopBrandsTableHeader'
import { TopBrandsTableRow } from './top-brands/TopBrandsTableRow'

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
export function TopBrandsTable({ brands, isLoading = false, className }: TopBrandsTableProps) {
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
            <p className="text-center text-muted-foreground py-8">Нет данных о брендах</p>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TopBrandsTableHeader />
                <TableBody>
                  {brands.slice(0, 5).map((brand, index) => (
                    <TopBrandsTableRow
                      key={brand.brand}
                      brand={brand}
                      index={index}
                      onBrandClick={handleBrandClick}
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
