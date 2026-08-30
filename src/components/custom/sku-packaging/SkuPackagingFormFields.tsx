import type { RefObject } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BoxTypeSelect } from './BoxTypeSelect'
import { SkuPackagingProductCombobox } from './SkuPackagingProductCombobox'

export interface SkuPackagingFormErrors {
  nmId?: string
  boxTypeId?: string
  unitsPerBox?: string
  api?: string
}

interface Props {
  isEdit: boolean
  nmId: number | null
  boxTypeId: string
  unitsPerBox: string
  errors: SkuPackagingFormErrors
  productRef: RefObject<HTMLDivElement | null>
  boxRef: RefObject<HTMLDivElement | null>
  unitsRef: RefObject<HTMLInputElement | null>
  onNmIdChange: (value: number | null) => void
  onBoxTypeIdChange: (value: string) => void
  onUnitsPerBoxChange: (value: string) => void
}

export function SkuPackagingFormFields({
  isEdit,
  nmId,
  boxTypeId,
  unitsPerBox,
  errors,
  productRef,
  boxRef,
  unitsRef,
  onNmIdChange,
  onBoxTypeIdChange,
  onUnitsPerBoxChange,
}: Props) {
  return (
    <>
      <div ref={productRef} className="space-y-2">
        <Label htmlFor="sp-product">Товар (nmId)</Label>
        {isEdit ? (
          <Input id="sp-product" value={String(nmId ?? '')} disabled />
        ) : (
          <SkuPackagingProductCombobox
            id="sp-product"
            value={nmId}
            onChange={onNmIdChange}
            aria-describedby={errors.nmId ? 'sp-nmid-error' : undefined}
            aria-invalid={!!errors.nmId}
          />
        )}
        {errors.nmId && (
          <p id="sp-nmid-error" className="text-sm text-destructive">
            {errors.nmId}
          </p>
        )}
      </div>
      <div ref={boxRef} className="space-y-2">
        <Label htmlFor="sp-box-type">Тип коробки</Label>
        <BoxTypeSelect
          id="sp-box-type"
          value={boxTypeId}
          onChange={onBoxTypeIdChange}
          aria-describedby={errors.boxTypeId ? 'sp-boxtype-error' : undefined}
          aria-invalid={!!errors.boxTypeId}
        />
        {errors.boxTypeId && (
          <p id="sp-boxtype-error" className="text-sm text-destructive">
            {errors.boxTypeId}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sp-units">Штук в коробке</Label>
        <Input
          ref={unitsRef}
          id="sp-units"
          type="number"
          min="1"
          step="1"
          value={unitsPerBox}
          onChange={event => onUnitsPerBoxChange(event.target.value)}
          aria-describedby={errors.unitsPerBox ? 'sp-units-help sp-units-error' : 'sp-units-help'}
          aria-invalid={!!errors.unitsPerBox}
        />
        <p id="sp-units-help" className="text-xs text-muted-foreground">
          Введите целое количество, шт.
        </p>
        {errors.unitsPerBox && (
          <p id="sp-units-error" className="text-sm text-destructive">
            {errors.unitsPerBox}
          </p>
        )}
      </div>
    </>
  )
}
