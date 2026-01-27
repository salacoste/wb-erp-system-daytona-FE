/**
 * Preset Indicator Component
 * Story 44.44-FE: Preset Save/Load
 *
 * Visual badge indicating when a preset has been loaded.
 * Auto-hides after configurable duration.
 *
 * @see docs/stories/epic-44/story-44.44-fe-preset-save-load.md
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

// ============================================================================
// Types
// ============================================================================

export interface PresetIndicatorProps {
  /** Whether indicator should be visible */
  isVisible: boolean
  /** Time in ms before auto-hide (default: 3000) */
  autoHideMs?: number
}

// ============================================================================
// Component
// ============================================================================

/**
 * AC4: Visual indicator for preset loaded state
 *
 * Features:
 * - Shows "💾 Пресет загружен" badge
 * - Green styling with outline variant
 * - Auto-hides after configurable duration (default 3s)
 * - Accessible to screen readers
 *
 * @example
 * ```tsx
 * <PresetIndicator isVisible={isPresetLoaded} />
 * ```
 */
export function PresetIndicator({
  isVisible,
  autoHideMs = 3000,
}: PresetIndicatorProps) {
  const [show, setShow] = useState(isVisible)

  // AC4: Auto-hide after configured duration
  useEffect(() => {
    if (isVisible) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), autoHideMs)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isVisible, autoHideMs])

  if (!show) return null

  return (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200"
      role="status"
      aria-live="polite"
    >
      💾 Пресет загружен
    </Badge>
  )
}
