'use client'

// ============================================================================
// Logistics Tiers Editor Component
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Array editor for logistics volume tiers with add/edit/remove
// ============================================================================

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { VolumeTierFormData } from './tariffSettingsSchema'

interface LogisticsTiersEditorProps {
  /** Current tiers array */
  tiers: VolumeTierFormData[]
  /** Callback when tiers change */
  onChange: (tiers: VolumeTierFormData[]) => void
  /** Error message (e.g., "Минимум 1 тарифный уровень") */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Label text */
  label?: string
}

/**
 * Editor for logistics volume tiers array
 *
 * Features:
 * - Table display with От (л), До (л), Тариф (₽) columns
 * - Add new tier button
 * - Delete tier button per row
 * - Inline number inputs for editing
 * - Validation: minimum 1 tier required
 *
 * AC4: logisticsVolumeTiers editor with add/remove/edit functionality
 */
export function LogisticsTiersEditor({
  tiers,
  onChange,
  error,
  disabled = false,
  label = 'Тарифные уровни по объёму',
}: LogisticsTiersEditorProps) {
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
    if (tiers.length <= 1) return // Prevent removing last tier
    const newTiers = tiers.filter((_, i) => i !== index)
    onChange(newTiers)
  }

  const handleUpdateTier = (
    index: number,
    field: keyof VolumeTierFormData,
    value: number
  ) => {
    const newTiers = tiers.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    )
    onChange(newTiers)
  }

  return (
    <div className="space-y-3">
      <Label className={cn('text-sm font-medium', error && 'text-destructive')}>
        {label}
      </Label>

      <div className="rounded-md border">
        <Table>
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
              <TableRow key={index}>
                <TableCell>
                  <Input
                    type="number"
                    step={0.001}
                    min={0.001}
                    value={tier.fromLiters}
                    onChange={(e) =>
                      handleUpdateTier(index, 'fromLiters', Number(e.target.value))
                    }
                    disabled={disabled}
                    className="h-8"
                    aria-label={`От литров для уровня ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step={0.001}
                    min={0.001}
                    value={tier.toLiters}
                    onChange={(e) =>
                      handleUpdateTier(index, 'toLiters', Number(e.target.value))
                    }
                    disabled={disabled}
                    className="h-8"
                    aria-label={`До литров для уровня ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step={0.01}
                    min={0.01}
                    value={tier.rateRub}
                    onChange={(e) =>
                      handleUpdateTier(index, 'rateRub', Number(e.target.value))
                    }
                    disabled={disabled}
                    className="h-8"
                    aria-label={`Тариф для уровня ${index + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTier(index)}
                    disabled={disabled || tiers.length <= 1}
                    aria-label="Удалить"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
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

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
