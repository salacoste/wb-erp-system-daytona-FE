'use client'

import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Input } from '@/components/ui/input'
import type { DateRange } from '@/types/date-range'

interface ReconciliationControlsProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  nmIdInput: string
  onNmIdInputChange: (value: string) => void
  showNmIdError: boolean
}

/** Date range picker and nmId filter controls for buyout reconciliation */
export function ReconciliationControls({
  dateRange,
  onDateRangeChange,
  nmIdInput,
  onNmIdInputChange,
  showNmIdError,
}: ReconciliationControlsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <DateRangePickerExtended
        value={dateRange}
        onChange={onDateRangeChange}
        maxDays={365}
        placeholder="Выберите период"
        id="buyout-reconciliation-date-range"
      />
      <div className="flex flex-col gap-1">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Артикул WB (опционально)"
          value={nmIdInput}
          onChange={e => onNmIdInputChange(e.target.value)}
          className="w-56"
          aria-label="Фильтр по артикулу WB"
        />
        {showNmIdError && (
          <p className="text-xs text-amber-700">Должно быть положительное целое число</p>
        )}
      </div>
    </div>
  )
}
