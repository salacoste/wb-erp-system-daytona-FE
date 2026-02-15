'use client'

/**
 * WidgetSettingsSheet -- Sheet panel for toggling dashboard widget visibility.
 * Users can show/hide individual dashboard metric cards.
 * Minimum 3 widgets must remain visible at all times.
 *
 * Uses native input[role="switch"] for toggle elements to ensure
 * both aria-checked and .checked DOM property are available.
 *
 * @see Story 65.8: Widget Visibility Settings
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md
 */

import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  useDashboardWidgetsStore,
  WIDGET_LABELS,
  type WidgetId,
} from '@/stores/dashboardWidgetsStore'
import { cn } from '@/lib/utils'

/** Widget IDs in display order */
const WIDGET_ORDER: WidgetId[] = [
  'orders',
  'sales',
  'commissions',
  'logistics',
  'payout',
  'storage',
  'cogs',
  'advertising',
  'grossProfit',
  'margin',
  'buyoutRate',
  'averages',
  'roi',
  'returns',
]

const MIN_VISIBLE = 3

/** Custom switch toggle using native checkbox with role="switch" */
function WidgetToggle({
  id,
  checked,
  disabled,
  onChange,
}: {
  id: string
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      role="switch"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className={cn(
        'h-5 w-9 cursor-pointer appearance-none rounded-full border-2',
        'border-transparent shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        checked ? 'bg-primary' : 'bg-input',
        disabled && 'cursor-not-allowed opacity-50'
      )}
      aria-checked={checked}
    />
  )
}

export function WidgetSettingsSheet() {
  const { visibleWidgets, toggleWidget, resetAll } = useDashboardWidgetsStore()
  const visibleCount = Object.values(visibleWidgets).filter(Boolean).length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Настройка виджетов
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Настройка виджетов</SheetTitle>
          <SheetDescription>
            Выберите, какие карточки отображать на дашборде. Минимум {MIN_VISIBLE} виджета должны
            быть включены.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {WIDGET_ORDER.map(id => {
            const isChecked = visibleWidgets[id]
            const isDisabled = isChecked && visibleCount <= MIN_VISIBLE

            return (
              <div key={id} className="flex items-center justify-between py-1">
                <label htmlFor={`widget-toggle-${id}`} className="text-sm font-medium leading-none">
                  {WIDGET_LABELS[id]}
                </label>
                <WidgetToggle
                  id={`widget-toggle-${id}`}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggleWidget(id)}
                />
              </div>
            )
          })}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={resetAll}>
            Сбросить
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
