/**
 * Rank Indicator Component
 * Story 63.5-FE: Storage Top Consumers Widget (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Displays rank with icons:
 * - Rank 1: Trophy icon (gold)
 * - Rank 2: Medal icon (silver)
 * - Rank 3: Medal icon (bronze)
 * - Rank 4+: Numeric display
 *
 * @see docs/stories/epic-63/story-63.5-fe-storage-top-consumers.md
 */

'use client'

import { Trophy, Medal } from 'lucide-react'

export interface RankIndicatorProps {
  /** Rank position (1-based) */
  rank: number
}

export function RankIndicator({ rank }: RankIndicatorProps) {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" aria-label="1 место" />
          <span className="text-sm font-medium">1</span>
        </div>
      )
    case 2:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" aria-label="2 место" />
          <span className="text-sm font-medium">2</span>
        </div>
      )
    case 3:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" aria-label="3 место" />
          <span className="text-sm font-medium">3</span>
        </div>
      )
    default:
      return <span className="text-sm text-muted-foreground ml-5">{rank}</span>
  }
}
