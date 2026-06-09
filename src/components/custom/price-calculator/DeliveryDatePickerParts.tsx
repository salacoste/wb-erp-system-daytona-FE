'use client'

/**
 * Sub-components for DeliveryDatePicker
 * Story 44.26a-FE: Delivery Date Selection
 * Epic 74: File Size Compliance - extracted from DeliveryDatePicker.tsx
 */

import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BOX_TYPE_ICONS } from './delivery-date-picker-constants'
import type { BoxTypeCoefficients, BoxType } from '@/hooks/useAcceptanceCoefficients'

/** Tabs for selecting box type */
export function BoxTypeTabs({
  boxTypes,
  selectedBoxType,
  onBoxTypeChange,
}: {
  boxTypes: BoxTypeCoefficients[]
  selectedBoxType: BoxType
  onBoxTypeChange: (boxType: BoxType) => void
}) {
  return (
    <Tabs value={selectedBoxType} onValueChange={v => onBoxTypeChange(v as BoxType)}>
      <TabsList className="w-full grid grid-cols-3 h-8">
        {boxTypes.map(bt => {
          const Icon = BOX_TYPE_ICONS[bt.boxType]
          const availableDays = bt.dailyCoefficients.filter(c => c.isAvailable).length
          return (
            <TabsTrigger key={bt.boxType} value={bt.boxType} className="text-xs gap-1 px-2">
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{bt.label}</span>
              <span className="sm:hidden">
                {bt.boxType === 'boxes' ? 'Кор' : bt.boxType === 'pallets' ? 'Пал' : 'Сейф'}
              </span>
              <span className="text-muted-foreground">({availableDays})</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
      {/* TabsContent not needed - we render calendar below */}
    </Tabs>
  )
}

export function DeliveryDatePickerSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="h-10 rounded-md bg-muted animate-pulse" />
    </div>
  )
}

export function DeliveryDatePickerError({ message, label }: { message: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="px-3 py-2 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
        {message}
      </div>
    </div>
  )
}

/** Help popover with detailed explanation */
export function DeliveryDateHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Справка по дате сдачи</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" side="right" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">Дата сдачи товара</h4>
            <p className="text-muted-foreground">
              Выберите дату, когда планируете сдать товар на склад WB. От даты зависит коэффициент
              логистики.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Типы поставки</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>
                <strong>Коробы</strong> — стандартная поставка в коробках
              </li>
              <li>
                <strong>Монопалеты</strong> — поставка на палетах
              </li>
              <li>
                <strong>Суперсейф</strong> — безопасная упаковка
              </li>
            </ul>
            <p className="text-muted-foreground mt-1">
              Число в скобках — количество доступных дней.
            </p>
          </div>

          <CoefficientColorLegend />

          <div className="pt-2 border-t text-xs text-muted-foreground">
            Коэффициент приёмки умножается на базовый тариф приёмки товара на склад. Например, ×1,5
            означает +50% к стоимости приёмки.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Color legend for coefficient statuses */
function CoefficientColorLegend() {
  return (
    <div>
      <h4 className="font-semibold mb-1">Цвета коэффициентов приёмки</h4>
      <ul className="text-muted-foreground space-y-0.5">
        <li>
          <span className="inline-block w-3 h-3 rounded bg-green-200 mr-1" />
          ≤1.0 — базовый тариф
        </li>
        <li>
          <span className="inline-block w-3 h-3 rounded bg-yellow-200 mr-1" />
          1.0-1.5 — повышенный
        </li>
        <li>
          <span className="inline-block w-3 h-3 rounded bg-orange-200 mr-1" />
          1.5-2.0 — высокий
        </li>
        <li>
          <span className="inline-block w-3 h-3 rounded bg-red-200 mr-1" />
          &gt;2.0 — пиковый
        </li>
        <li>
          <span className="inline-block w-3 h-3 rounded bg-muted mr-1" />
          н/д — недоступно
        </li>
      </ul>
    </div>
  )
}
