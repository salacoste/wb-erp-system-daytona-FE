'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Lazy-loaded chart components for the main dashboard.
 * Recharts heavyweight components loaded below-the-fold.
 * Extracted from DashboardContent.tsx for file size compliance.
 */

export const ExpenseChart = dynamic(
  () => import('@/components/custom/ExpenseChart').then(m => ({ default: m.ExpenseChart })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

export const ExpenseStructurePieChart = dynamic(
  () =>
    import('@/components/custom/dashboard/ExpenseStructurePieChart').then(m => ({
      default: m.ExpenseStructurePieChart,
    })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

export const TrendGraph = dynamic(
  () => import('@/components/custom/TrendGraph').then(m => ({ default: m.TrendGraph })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

export const OrdersSeasonalPatterns = dynamic(
  () =>
    import('@/components/custom/dashboard/OrdersSeasonalPatterns').then(m => ({
      default: m.OrdersSeasonalPatterns,
    })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

export const HistoricalTrendsSection = dynamic(
  () =>
    import('@/components/custom/dashboard/HistoricalTrendsSection').then(m => ({
      default: m.HistoricalTrendsSection,
    })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)
