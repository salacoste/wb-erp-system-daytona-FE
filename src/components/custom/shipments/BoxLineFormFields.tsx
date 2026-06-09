'use client'

/**
 * Box line form fields sub-component
 * Extracted from BoxLineForm.tsx for file-size compliance.
 * Epic 76-FE, Story 76.3
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductCombobox } from '@/components/custom/sku-packaging/ProductCombobox'
import { PreflightWarnings } from './PreflightWarnings'
import type { BoxLineFormErrors } from './box-line-form-helpers'

interface BoxLineFormFieldsProps {
  isEdit: boolean
  nmId: number | null
  boxCount: string
  totalUnits: string
  editingLineNmId: number | null
  errors: BoxLineFormErrors
  onNmIdChange: (value: number | null) => void
  onBoxCountChange: (value: string) => void
  onTotalUnitsChange: (value: string) => void
}

export function BoxLineFormFields({
  isEdit,
  nmId,
  boxCount,
  totalUnits,
  editingLineNmId,
  errors,
  onNmIdChange,
  onBoxCountChange,
  onTotalUnitsChange,
}: BoxLineFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="boxline-nmid">Товар</Label>
        {isEdit ? (
          <Input id="boxline-nmid" value={editingLineNmId ?? ''} disabled />
        ) : (
          <ProductCombobox
            value={nmId}
            onChange={onNmIdChange}
            aria-describedby={errors.nmId ? 'nmid-error' : undefined}
            aria-invalid={!!errors.nmId}
          />
        )}
        {errors.nmId && (
          <p id="nmid-error" className="text-sm text-destructive">
            {errors.nmId}
          </p>
        )}
      </div>

      {!isEdit && <PreflightWarnings nmId={nmId} />}

      <div className="space-y-2">
        <Label htmlFor="boxline-count">Количество коробок</Label>
        <Input
          id="boxline-count"
          type="number"
          min={1}
          step={1}
          value={boxCount}
          onChange={e => onBoxCountChange(e.target.value)}
          aria-describedby={errors.boxCount ? 'count-error' : undefined}
          aria-invalid={!!errors.boxCount}
        />
        {errors.boxCount && (
          <p id="count-error" className="text-sm text-destructive">
            {errors.boxCount}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="boxline-units">
          Всего штук <span className="text-muted-foreground">(необязательно)</span>
        </Label>
        <Input
          id="boxline-units"
          type="number"
          min={1}
          step={1}
          value={totalUnits}
          onChange={e => onTotalUnitsChange(e.target.value)}
          placeholder="По умолчанию = коробок × штук/коробку"
          aria-describedby={errors.totalUnits ? 'units-error' : undefined}
          aria-invalid={!!errors.totalUnits}
        />
        {errors.totalUnits && (
          <p id="units-error" className="text-sm text-destructive">
            {errors.totalUnits}
          </p>
        )}
      </div>

      {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
    </>
  )
}
