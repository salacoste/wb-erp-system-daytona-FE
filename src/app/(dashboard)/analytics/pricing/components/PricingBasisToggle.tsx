'use client'

/**
 * Cabinet pricing basis selector (SPP-1.7-FE)
 * Compact select next to the Refresh button. Initial value from usePricingBasis;
 * on change fires the PUT mutation (optimistic UI via local state, reverted on
 * error + toast). Self-contained: page only passes cabinetId.
 *
 * Review fixes: loading/error render a disabled placeholder («—») instead of a
 * fabricated «Продавец» (Defensive Frontend); a hint fires when cached rows
 * are still computed under the previous basis (recompute pending).
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePricingBasis, useUpdatePricingBasis } from '@/hooks/usePricingBasis'
import { isSettablePriceBasis } from '@/lib/api/pricing-basis'
import type { PriceBasis } from '@/types/price-recommendations'

const BASIS_OPTIONS: { value: PriceBasis; label: string }[] = [
  { value: 'SELLER', label: 'Продавец' },
  { value: 'STOREFRONT_ANON', label: 'Витрина' },
]

export function PricingBasisToggle({ cabinetId }: { cabinetId: string | null }) {
  const { data: basis, isSuccess, isError, isPending } = usePricingBasis(cabinetId)
  const mutation = useUpdatePricingBasis(cabinetId)
  const [selected, setSelected] = useState<PriceBasis | null>(null)

  // Server is the source of truth once loaded (and after invalidation refetch).
  useEffect(() => {
    if (isSuccess && basis !== undefined && isSettablePriceBasis(basis)) setSelected(basis)
  }, [isSuccess, basis])

  if (!cabinetId) return null

  const handleChange = (value: string) => {
    const next = value === 'STOREFRONT_ANON' ? 'STOREFRONT_ANON' : 'SELLER'
    const previous = selected
    setSelected(next) // optimistic
    mutation.mutate(next, {
      onError: () => {
        if (previous !== null) setSelected(previous) // revert
        toast.error('Не удалось изменить базис расчёта')
      },
    })
    toast.info('Базис изменён — нажмите «Обновить» для пересчёта рекомендаций')
  }

  // Not loaded (or failed): disabled placeholder — never a fabricated basis.
  const disabled = mutation.isPending || isPending || isError || selected === null

  return (
    <div
      className="flex items-center gap-2"
      title="Базис расчёта рекомендаций. Витрина = цена покупателя (аноним, промо включён)"
    >
      <Label htmlFor="pricing-basis-select" className="text-sm text-muted-foreground">
        Базис:
      </Label>
      <Select value={selected ?? undefined} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger
          id="pricing-basis-select"
          className="h-9 w-36"
          aria-label="Базис расчёта"
          data-state={isError ? 'error' : undefined}
        >
          <SelectValue placeholder={isError ? 'Ошибка загрузки' : '—'} />
        </SelectTrigger>
        <SelectContent>
          {BASIS_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
