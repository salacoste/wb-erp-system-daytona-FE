'use client'

/**
 * Forecast page header with Brain icon, title/subtitle,
 * and optional slot for badge + toggle children.
 * Extracted from ForecastPageContent to stay under 200-line cap.
 * Story 108.2-FE.
 */
import type { ReactNode } from 'react'
import { Brain } from 'lucide-react'

interface ForecastPageHeaderProps {
  children?: ReactNode
}

export function ForecastPageHeader({ children }: ForecastPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">AI Прогноз продаж</h1>
          <p className="text-sm text-muted-foreground">
            Прогноз на основе машинного обучения (MindsDB)
          </p>
        </div>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  )
}
