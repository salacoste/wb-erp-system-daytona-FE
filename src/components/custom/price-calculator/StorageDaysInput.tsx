'use client'

/**
 * StorageDaysInput Component
 * Story 44.14-FE: Storage Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Input for storage duration with preset quick-select buttons
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { STORAGE_DAYS_PRESETS } from '@/lib/storage-cost-utils'

export interface StorageDaysInputProps {
  /** Current storage days value */
  value: number
  /** Value change handler */
  onChange: (days: number) => void
  /** Disable input */
  disabled?: boolean
}

/**
 * Storage days input with preset buttons (7, 14, 30, 60, 90 days)
 */
export function StorageDaysInput({
  value,
  onChange,
  disabled,
}: StorageDaysInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10)
    // Clamp between 1 and 365 days
    const clamped = Math.min(365, Math.max(1, isNaN(parsed) ? 14 : parsed))
    onChange(clamped)
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="storage-days">Срок хранения (дней)</Label>

      {/* Preset chips */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label="Быстрый выбор срока">
        {STORAGE_DAYS_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={value === preset ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(preset)}
            disabled={disabled}
            aria-pressed={value === preset}
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Своё:</span>
        <Input
          id="storage-days"
          type="number"
          min={1}
          max={365}
          step={1}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-24"
          aria-label="Количество дней хранения"
        />
        <span className="text-sm text-muted-foreground">дней</span>
      </div>
    </div>
  )
}
