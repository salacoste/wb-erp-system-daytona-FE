'use client'

/**
 * Ad Cost Discrepancy Card — Story 73.9-FE
 * Three-column layout showing Layer 1 (platform) | Layer 2 (TBD) | Layer 3 (actual WB deduction).
 * Delta row between Layer 1↔3 with severity-colored badge. Collapsible info section (AC-4).
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Info, ChevronDown } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import {
  AD_COST_LAYERS,
  calculateDiscrepancy,
  SEVERITY_COLORS,
  SEVERITY_BG,
  type DiscrepancyResult,
} from './ad-cost-discrepancy-config'

interface AdCostDiscrepancyCardProps {
  platformSpend: number | null
  actualDeduction: number | null
  isLoading: boolean
  weekLabel?: string
}

export function AdCostDiscrepancyCard({
  platformSpend,
  actualDeduction,
  isLoading,
  weekLabel,
}: AdCostDiscrepancyCardProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const discrepancy = calculateDiscrepancy(actualDeduction, platformSpend)

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (platformSpend == null && actualDeduction == null) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Расхождение рекламных расходов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          {AD_COST_LAYERS.map(layer => (
            <LayerColumn
              key={layer.key}
              label={layer.label}
              description={layer.description}
              value={
                layer.key === 'platform'
                  ? platformSpend
                  : layer.key === 'actual'
                    ? actualDeduction
                    : null
              }
              color={layer.color}
              available={layer.available}
              weekLabel={layer.key === 'actual' ? weekLabel : undefined}
            />
          ))}
        </div>
        {discrepancy && <DeltaRow discrepancy={discrepancy} />}
        <InfoSection open={infoOpen} onOpenChange={setInfoOpen} />
      </CardContent>
    </Card>
  )
}

function LayerColumn({
  label,
  description,
  value,
  color,
  available,
  weekLabel,
}: {
  label: string
  description: string
  value: number | null
  color: string
  available: boolean
  weekLabel?: string
}) {
  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {available ? (
        <p className="text-xl font-bold">{value != null ? formatCurrency(value) : '—'}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Скоро</p>
      )}
      <p className="text-xs text-muted-foreground">
        {description}
        {weekLabel && <span className="block">({weekLabel})</span>}
      </p>
    </div>
  )
}

function DeltaRow({ discrepancy }: { discrepancy: DiscrepancyResult }) {
  const { comparison, severity } = discrepancy
  return (
    <div
      className={cn('rounded-md px-3 py-2 text-center text-sm', SEVERITY_BG[severity])}
      role="status"
      aria-label={`Расхождение: ${comparison.formattedDifference} (${comparison.formattedPercentage})`}
    >
      <span className={cn('font-medium', SEVERITY_COLORS[severity])}>
        Платформа → Факт: {comparison.formattedDifference} ({comparison.formattedPercentage})
      </span>
    </div>
  )
}

function InfoSection({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Info className="h-3.5 w-3.5" />
        <span>Почему суммы различаются?</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Округление</strong> — данные округляются на разных уровнях агрегации
          </p>
          <p>
            <strong>Таймлаг</strong> — рекламный кабинет обновляется ежедневно, отчёт — еженедельно
          </p>
          <p>
            <strong>Корректировки</strong> — WB вносит поправки при закрытии отчётного периода
          </p>
          <p className="text-xs opacity-70">Расхождение до 5% считается нормальным</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
