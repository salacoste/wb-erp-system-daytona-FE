'use client'

/** Box type dropdown selector — Epic 75-FE, Story 75.3 (AC: #4) */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useBoxTypes } from '@/hooks/use-box-types'
import { parseDecimal } from '@/lib/decimal-utils'
import type { BoxType } from '@/types/shipment-cost'

interface BoxTypeSelectProps {
  id?: string
  value: string
  onChange: (boxTypeId: string) => void
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

function formatBoxTypeLabel(bt: BoxType): string {
  const l = parseDecimal(bt.lengthCm)
  const w = parseDecimal(bt.widthCm)
  const h = parseDecimal(bt.heightCm)
  return `${bt.name} (${l}×${w}×${h} см)`
}

export function BoxTypeSelect({ id, value, onChange, disabled, ...ariaProps }: BoxTypeSelectProps) {
  const { data: boxTypes, isLoading, isError, refetch } = useBoxTypes()

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading || isError}>
        <SelectTrigger
          id={id}
          aria-describedby={ariaProps['aria-describedby']}
          aria-invalid={ariaProps['aria-invalid']}
        >
          <SelectValue
            placeholder={
              isLoading
                ? 'Загрузка...'
                : isError
                  ? 'Типы коробок недоступны'
                  : 'Выберите тип коробки'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {(boxTypes ?? []).map(bt => (
            <SelectItem key={bt.id} value={bt.id}>
              {formatBoxTypeLabel(bt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isError && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span>Не удалось загрузить типы коробок.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      )}
    </div>
  )
}
