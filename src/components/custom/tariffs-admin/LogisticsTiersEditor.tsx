'use client'

// ============================================================================
// Logistics Tiers Editor Component
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Array editor for logistics volume tiers with add/edit/remove
// ============================================================================

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useId } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { LogisticsTierRow } from './LogisticsTierRow'
import { getFirstTariffErrorMessage, type VolumeTierFormData } from './tariffSettingsSchema'

interface LogisticsTiersEditorProps {
  /** Current tiers array */
  tiers: VolumeTierFormData[]
  /** Callback when tiers change */
  onChange: (tiers: VolumeTierFormData[]) => void
  /** Error message (e.g., "Минимум 1 тарифный уровень") */
  error?: string
  /** React Hook Form errors for individual tier cells. */
  fieldErrors?: unknown
  /** Disabled state */
  disabled?: boolean
  /** Label text */
  label?: string
}

/**
 * Editor for logistics volume tiers array
 * AC4: logisticsVolumeTiers editor with add/remove/edit functionality
 */
export function LogisticsTiersEditor({
  tiers,
  onChange,
  error,
  fieldErrors,
  disabled = false,
  label = 'Тарифные уровни по объёму',
}: LogisticsTiersEditorProps) {
  const id = useId()
  const resolvedError = error ?? getFirstTariffErrorMessage(fieldErrors)

  const getRowErrors = (index: number): Partial<Record<keyof VolumeTierFormData, string>> => {
    if (!Array.isArray(fieldErrors)) return {}
    const row = fieldErrors[index]
    if (!row || typeof row !== 'object') return {}
    return {
      fromLiters: getFirstTariffErrorMessage((row as Record<string, unknown>).fromLiters),
      toLiters: getFirstTariffErrorMessage((row as Record<string, unknown>).toLiters),
      rateRub: getFirstTariffErrorMessage((row as Record<string, unknown>).rateRub),
    }
  }
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newTier: VolumeTierFormData = {
      fromLiters: lastTier ? lastTier.toLiters + 0.001 : 0.001,
      toLiters: lastTier ? lastTier.toLiters + 0.2 : 0.2,
      rateRub: lastTier ? lastTier.rateRub : 24,
    }
    onChange([...tiers, newTier])
  }

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) return
    const newTiers = tiers.filter((_, i) => i !== index)
    onChange(newTiers)
  }

  const handleUpdateTier = (index: number, field: keyof VolumeTierFormData, value: number) => {
    const newTiers = tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    onChange(newTiers)
  }

  return (
    <div className="space-y-3">
      <Label className={cn('text-sm font-medium', resolvedError && 'text-destructive')}>
        {label}
      </Label>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableCaption className="sr-only">{label}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">От (л)</TableHead>
              <TableHead className="w-[120px]">До (л)</TableHead>
              <TableHead className="w-[120px]">Тариф (₽)</TableHead>
              <TableHead className="w-[80px]">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiers.map((tier, index) => (
              <LogisticsTierRow
                key={index}
                tier={tier}
                index={index}
                disabled={disabled}
                canRemove={tiers.length > 1}
                onUpdate={handleUpdateTier}
                onRemove={handleRemoveTier}
                errors={getRowErrors(index)}
                errorIdPrefix={`tariff-tier-${id}-${index}`}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddTier}
        disabled={disabled}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Добавить уровень
      </Button>

      {resolvedError && (
        <p className="text-sm text-destructive" role="alert">
          {resolvedError}
        </p>
      )}
    </div>
  )
}
