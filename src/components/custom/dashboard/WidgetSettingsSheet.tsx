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
  labelId,
  checked,
  disabled,
  onChange,
}: {
  id: string
  labelId: string
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    // The wrapper renders the visible track + sliding thumb; an invisible native
    // <input> overlays it as the click target so the toggle keeps role="switch",
    // .checked, and onChange (a11y + test compatibility). Sibling spans are used
    // (not ::before/::after) because pseudo-elements aren't reliably supported on
    // native inputs (replaced elements) — a plain-coloured pill with no thumb was
    // the cause of the state being hard to see at a glance.
    <div className="relative inline-block h-5 w-9 shrink-0">
      <input
        type="checkbox"
        role="switch"
        id={id}
        aria-labelledby={labelId}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none opacity-0 focus-visible:outline-none focus-visible:ring-2"
        aria-checked={checked}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 rounded-full border-2 transition-colors',
          checked ? 'border-transparent bg-primary' : 'border-gray-400 bg-gray-300',
          disabled && 'opacity-50'
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform',
          checked && 'translate-x-4'
        )}
      />
    </div>
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
                <label
                  id={`widget-label-${id}`}
                  htmlFor={`widget-toggle-${id}`}
                  className="text-sm font-medium leading-none"
                >
                  {WIDGET_LABELS[id]}
                </label>
                <WidgetToggle
                  id={`widget-toggle-${id}`}
                  labelId={`widget-label-${id}`}
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
