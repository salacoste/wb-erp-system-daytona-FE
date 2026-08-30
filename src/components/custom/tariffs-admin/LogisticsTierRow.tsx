'use client'

/**
 * Single tier row for LogisticsTiersEditor
 * Extracted for file-size compliance.
 * Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
 */

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import type { VolumeTierFormData } from './tariffSettingsSchema'

interface LogisticsTierRowProps {
  tier: VolumeTierFormData
  index: number
  disabled: boolean
  canRemove: boolean
  onUpdate: (index: number, field: keyof VolumeTierFormData, value: number) => void
  onRemove: (index: number) => void
  errors?: Partial<Record<keyof VolumeTierFormData, string>>
  errorIdPrefix: string
}

export function LogisticsTierRow({
  tier,
  index,
  disabled,
  canRemove,
  onUpdate,
  onRemove,
  errors,
  errorIdPrefix,
}: LogisticsTierRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Input
          type="number"
          step={0.001}
          min={0.001}
          value={tier.fromLiters}
          onChange={e => onUpdate(index, 'fromLiters', Number(e.target.value))}
          disabled={disabled}
          className="h-8"
          aria-label={`От литров для уровня ${index + 1}`}
          aria-invalid={!!errors?.fromLiters}
          aria-describedby={errors?.fromLiters ? `${errorIdPrefix}-fromLiters` : undefined}
        />
        {errors?.fromLiters && (
          <span id={`${errorIdPrefix}-fromLiters`} className="sr-only">
            {errors.fromLiters}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step={0.001}
          min={0.001}
          value={tier.toLiters}
          onChange={e => onUpdate(index, 'toLiters', Number(e.target.value))}
          disabled={disabled}
          className="h-8"
          aria-label={`До литров для уровня ${index + 1}`}
          aria-invalid={!!errors?.toLiters}
          aria-describedby={errors?.toLiters ? `${errorIdPrefix}-toLiters` : undefined}
        />
        {errors?.toLiters && (
          <span id={`${errorIdPrefix}-toLiters`} className="sr-only">
            {errors.toLiters}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step={0.01}
          min={0.01}
          value={tier.rateRub}
          onChange={e => onUpdate(index, 'rateRub', Number(e.target.value))}
          disabled={disabled}
          className="h-8"
          aria-label={`Тариф для уровня ${index + 1}`}
          aria-invalid={!!errors?.rateRub}
          aria-describedby={errors?.rateRub ? `${errorIdPrefix}-rateRub` : undefined}
        />
        {errors?.rateRub && (
          <span id={`${errorIdPrefix}-rateRub`} className="sr-only">
            {errors.rateRub}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          disabled={disabled || !canRemove}
          aria-label="Удалить"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
