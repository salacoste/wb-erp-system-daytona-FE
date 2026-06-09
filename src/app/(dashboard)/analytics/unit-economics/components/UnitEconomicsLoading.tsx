'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Unit Economics Loading State
 * Story 5.2: Unit Economics Page Structure
 *
 * Skeleton loaders for summary cards and data table
 * while data is being fetched.
 */

function MetricCardSkeleton() {
  return (
    <Card className="min-h-[120px]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="p-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </td>
      <td className="p-4 text-right">
        <Skeleton className="h-4 w-14 ml-auto" />
      </td>
      <td className="p-4 text-center">
        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
      </td>
    </tr>
  )
}

export function UnitEconomicsLoading() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-14 ml-auto" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </th>
              <th className="p-4 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
              <th className="p-4 text-center">
                <Skeleton className="h-4 w-14 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>

        {/* Footer Skeleton */}
        <div className="border-t bg-gray-50 px-4 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
}
