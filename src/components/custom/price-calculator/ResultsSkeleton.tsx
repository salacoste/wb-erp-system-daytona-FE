'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

interface ResultsSkeletonProps {
  /** Estimated calculation duration in ms (default 1500) */
  estimatedDuration?: number
}

/**
 * Skeleton loading state for price calculator results
 * Story 44.25-FE: Loading States & Micro-interactions
 */
export function ResultsSkeleton({ estimatedDuration = 1500 }: ResultsSkeletonProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95 // Don't hit 100 until actual load
        return prev + 100 / (estimatedDuration / 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [estimatedDuration])

  return (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Minimum price skeleton */}
        <div className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>

        {/* Recommended price skeleton (hero) */}
        <div className="p-6 border-2 border-primary/30 rounded-xl space-y-2 bg-primary/5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-3 w-36" />
        </div>

        {/* Gap indicator skeleton */}
        <div className="p-3 rounded-lg bg-muted/50">
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Расчёт...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </CardContent>
    </Card>
  )
}
