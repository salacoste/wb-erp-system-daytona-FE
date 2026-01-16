'use client'

import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TopConsumerItem } from '@/types/storage-analytics'

/**
 * Storage Alert Banner Component
 * Story 24.8-FE: High Storage Ratio Alert
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Shows warning when products have high storage-to-revenue ratio (>20%)
 */

interface StorageAlertBannerProps {
  topConsumers: TopConsumerItem[]
  threshold?: number
}

// Threshold per PO decision
const DEFAULT_THRESHOLD = 20

// Pluralize helper for Russian
function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export function StorageAlertBanner({
  topConsumers,
  threshold = DEFAULT_THRESHOLD,
}: StorageAlertBannerProps) {
  // Count products with ratio > threshold
  const highRatioCount = topConsumers.filter(
    (item) => (item.storage_to_revenue_ratio ?? 0) > threshold
  ).length

  if (highRatioCount === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Alert className="bg-red-50 border-red-200 cursor-help">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {highRatioCount} {pluralize(highRatioCount, 'товар', 'товара', 'товаров')} с
              соотношением хранение/выручка &gt; {threshold}%
            </AlertDescription>
          </Alert>
        </TooltipTrigger>
        <TooltipContent className="max-w-[320px]">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Соотношение хранение/выручка</p>
            <p className="text-muted-foreground">
              Показывает какую долю от выручки занимают расходы на хранение товара.
            </p>
            <div className="space-y-1">
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                &lt; 10% — отлично
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                10-20% — обратите внимание
              </p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                &gt; 20% — требует оптимизации
              </p>
            </div>
            <div className="pt-2 border-t text-muted-foreground">
              <p className="font-medium text-foreground">Рекомендации:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Уменьшить запасы на складе</li>
                <li>Повысить оборачиваемость</li>
                <li>Рассмотреть вывод товара</li>
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
