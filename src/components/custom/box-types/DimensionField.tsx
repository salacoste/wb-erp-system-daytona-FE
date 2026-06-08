'use client'

/** Reusable dimension form field — Epic 75-FE, extracted from BoxTypeFormDialog */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DimensionFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  errorId: string
}

export function DimensionField({
  id,
  label,
  value,
  onChange,
  error,
  errorId,
}: DimensionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
