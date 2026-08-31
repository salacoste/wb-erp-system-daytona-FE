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
    <div className="flex min-w-0 items-center justify-between gap-3 py-3">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="break-words text-xs text-muted-foreground">{description}</p>
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
    <div className="grid min-w-0 grid-cols-1 gap-2 py-2 sm:grid-cols-[minmax(0,180px)_5rem_auto] sm:items-center sm:gap-3">
      <Label className="min-w-0 break-words text-sm">{label}</Label>
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
        className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-20"
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
    <div className="grid min-w-0 grid-cols-1 gap-2 py-2 sm:grid-cols-[minmax(0,180px)_6rem_auto] sm:items-center sm:gap-3">
      <Label className="min-w-0 break-words text-sm">{label}</Label>
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
        className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-24"
        aria-label={label}
      />
      <span className="text-xs text-muted-foreground">мин</span>
    </div>
  )
}
