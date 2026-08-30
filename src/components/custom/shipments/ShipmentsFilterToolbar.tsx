'use client'

import { useId } from 'react'

import { FilterToolbar } from '@/components/product/filters'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShipmentStatus } from '@/types/shipment-cost'

import { STATUS_FILTER_OPTIONS, STATUS_LABELS } from './shipments-columns'

interface ShipmentsFilterToolbarProps {
  statusFilter: ShipmentStatus | undefined
  empty: boolean
  busy: boolean
  total: number
  onStatusChange: (status: ShipmentStatus | undefined) => void
}

export function ShipmentsFilterToolbar({
  statusFilter,
  empty,
  busy,
  total,
  onStatusChange,
}: ShipmentsFilterToolbarProps) {
  const filterLabelId = useId()
  const appliedStatusLabel = statusFilter ? STATUS_LABELS[statusFilter] : undefined
  const statusSelect = (
    <div className="w-full min-w-0 space-y-2 sm:w-auto">
      <span id={filterLabelId} className="block text-sm font-medium">
        Статус отправки
      </span>
      <Select
        value={statusFilter ?? 'ALL'}
        onValueChange={value =>
          onStatusChange(value === 'ALL' ? undefined : (value as ShipmentStatus))
        }
      >
        <SelectTrigger
          className="min-h-11 w-full sm:w-[13rem]"
          aria-labelledby={filterLabelId}
          aria-label="Фильтр по статусу"
        >
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTER_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  if (!statusFilter) {
    return (
      <FilterToolbar
        label="Фильтры очереди отправок"
        primaryControls={statusSelect}
        state={busy ? 'updating' : 'default'}
        resultCount={total}
        resultLabel="Найдено отправок"
      />
    )
  }

  if (empty) {
    return (
      <FilterToolbar
        label="Фильтры очереди отправок"
        primaryControls={statusSelect}
        state="empty"
        appliedSummary={`Статус: ${appliedStatusLabel}`}
        resultCount={0}
        resultLabel="Найдено отправок"
        onReset={() => onStatusChange(undefined)}
        resetLabel="Показать все отправки"
        resetScope="Фильтр по статусу"
      />
    )
  }

  return (
    <FilterToolbar
      label="Фильтры очереди отправок"
      primaryControls={statusSelect}
      state="applied"
      appliedSummary={`Статус: ${appliedStatusLabel}`}
      resultCount={total}
      resultLabel="Найдено отправок"
      onReset={() => onStatusChange(undefined)}
      resetLabel="Показать все отправки"
      resetScope="Фильтр по статусу"
    />
  )
}
