'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { CheckCircle2, Edit3 } from 'lucide-react'

/**
 * Props for LocalizationIndexInput component
 * Story 44.32: Missing Price Calculator Fields
 */
export interface LocalizationIndexInputProps {
  /** Current localization index value */
  value?: number
  /** Callback when value changes */
  onChange?: (value: number) => void
  /** Warehouse ID for auto-fill */
  warehouseId?: number | null
  /** Disable the input */
  disabled?: boolean
}

/**
 * Localization ranges configuration
 */
const LOCALIZATION_RANGES = {
  MIN: 0.5,
  MAX: 3.0,
  STEP: 0.1,
  DEFAULT: 1.0,
  ZONES: {
    central: { min: 1.0, max: 1.2, label: 'Центральный ФО' },
    regional: { min: 1.3, max: 1.7, label: 'Регионы' },
    remote: { min: 1.8, max: 2.5, label: 'Дальний Восток / Крайний Север' },
  } as const,
}

/**
 * Get zone label for a given index value
 */
function getZoneLabel(value: number): string {
  if (value < 1.0) return '(близкий регион)'
  if (value <= 1.2) return '(Центральный ФО)'
  if (value <= 1.7) return '(Регионы)'
  return '(Дальний Восток / Крайний Север)'
}

/**
 * Localization Index (KTР) input component
 * Number input with auto-fill from warehouse selection
 *
 * Features:
 * - Number input for localization index (0.5-3.0)
 * - Auto-fill from warehouse delivery coefficient
 * - Badge showing source (auto/manual/modified)
 * - Zone label indicator
 * - Tooltip explaining KTР
 * - Validation with min/max constraints
 *
 * @example
 * <LocalizationIndexInput
 *   value={localizationIndex}
 *   onChange={setLocalizationIndex}
 *   warehouseId={warehouseId}
 *   disabled={disabled}
 * />
 */
export function LocalizationIndexInput({
  value = LOCALIZATION_RANGES.DEFAULT,
  onChange,
  warehouseId,
  disabled = false,
}: LocalizationIndexInputProps) {
  const [originalValue, setOriginalValue] = useState<number | undefined>(
    undefined
  )
  const [isModified, setIsModified] = useState(false)

  // Update original value when warehouse changes
  useEffect(() => {
    if (warehouseId && originalValue === undefined) {
      setOriginalValue(value)
      setIsModified(false)
    }
  }, [warehouseId, value, originalValue])

  // Detect manual modification
  useEffect(() => {
    if (originalValue !== undefined && value !== originalValue) {
      setIsModified(true)
    }
  }, [value, originalValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    if (
      !isNaN(newValue) &&
      newValue >= LOCALIZATION_RANGES.MIN &&
      newValue <= LOCALIZATION_RANGES.MAX
    ) {
      onChange?.(newValue)
    }
  }

  const source = originalValue !== undefined ? 'auto' : 'manual'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="localization-index">Индекс локализации (КТР)</Label>
        <FieldTooltip content="Коэффициент доставки в удалённые регионы: 1.0 = Москва/ЦФО, 1.5-2.5 = Дальний Восток. Автозаполнение из коэффициента склада." />
        {source === 'auto' && !isModified && (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Авто
          </Badge>
        )}
        {source === 'auto' && isModified && (
          <Badge variant="outline" className="text-xs">
            <Edit3 className="w-3 h-3 mr-1" />
            Изменён
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          id="localization-index"
          type="number"
          step={LOCALIZATION_RANGES.STEP}
          min={LOCALIZATION_RANGES.MIN}
          max={LOCALIZATION_RANGES.MAX}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground">
          {getZoneLabel(value)}
        </span>
      </div>

      {value < LOCALIZATION_RANGES.MIN && (
        <p className="text-sm text-destructive">
          Значение должно быть не менее {LOCALIZATION_RANGES.MIN}
        </p>
      )}
      {value > LOCALIZATION_RANGES.MAX && (
        <p className="text-sm text-destructive">
          Значение должно быть не более {LOCALIZATION_RANGES.MAX}
        </p>
      )}
    </div>
  )
}
