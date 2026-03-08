/** Over-Attribution Banner — Story 73.6-FE: count badge + filter toggle */
'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface OverAttributionBannerProps {
  count: number
  filterActive: boolean
  onFilterChange: (active: boolean) => void
}

function pluralizeTovar(count: number): string {
  const lastTwo = Math.abs(count) % 100
  const lastOne = Math.abs(count) % 10
  if (lastTwo >= 11 && lastTwo <= 19) return 'товаров'
  if (lastOne === 1) return 'товар'
  if (lastOne >= 2 && lastOne <= 4) return 'товара'
  return 'товаров'
}

export function OverAttributionBanner({
  count,
  filterActive,
  onFilterChange,
}: OverAttributionBannerProps) {
  if (count === 0) return null

  return (
    <Alert variant="default" className="border-amber-300 bg-amber-50" aria-live="polite">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm text-amber-800">
          ⚠️ {count} {pluralizeTovar(count)} с over-attribution (переатрибуция рекламы)
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            id="hide-over-attribution"
            checked={filterActive}
            onCheckedChange={onFilterChange}
            className="data-[state=checked]:bg-amber-600"
          />
          <Label
            htmlFor="hide-over-attribution"
            className="text-xs text-amber-700 cursor-pointer whitespace-nowrap"
          >
            Скрыть
          </Label>
        </div>
      </AlertDescription>
    </Alert>
  )
}
