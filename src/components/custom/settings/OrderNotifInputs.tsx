'use client'

// ============================================================================
// Reusable input components for Order Notification Settings
// Epic 132-FE: Story 132.3 — extracted for 200-line cap compliance
// ============================================================================

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

/** Toggle switch row with label and description */
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

/** Hour input (0-23) */
export function HourInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Label className="text-sm min-w-[180px]">{label}</Label>
      <input
        type="number"
        min={0}
        max={23}
        value={value}
        onChange={e => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(Math.max(0, Math.min(23, n)))
        }}
        disabled={disabled}
        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]"
        aria-label={label}
      />
      <span className="text-xs text-muted-foreground">ч (0–23)</span>
    </div>
  )
}

/** SLA minutes input */
export function SlaInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Label className="text-sm min-w-[180px]">{label}</Label>
      <input
        type="number"
        min={1}
        max={1440}
        value={value}
        onChange={e => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(Math.max(1, Math.min(1440, n)))
        }}
        disabled={disabled}
        className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#E53935]"
        aria-label={label}
      />
      <span className="text-xs text-muted-foreground">мин</span>
    </div>
  )
}
