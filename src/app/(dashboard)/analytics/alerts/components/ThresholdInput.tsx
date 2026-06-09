'use client'

/**
 * Threshold input field for alert rule creation
 * Extracted from CreateAlertRuleDialog.tsx for file-size compliance.
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ThresholdFieldConfig } from '@/types/alerts'

interface ThresholdInputProps {
  field: ThresholdFieldConfig
  value: number
  onChange: (raw: string) => void
}

export function ThresholdInput({ field, value, onChange }: ThresholdInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={field.key}
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">{field.unit}</span>
      </div>
    </div>
  )
}
