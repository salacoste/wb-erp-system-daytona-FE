'use client'

/**
 * Shared labelled form controls for the installed-rule editor (Story 163.3-FE).
 * Extracted from EditorFields.tsx for the 200-effective-line cap. Accessible:
 * every control has a <Label>, aria-invalid on error, aria-live inline error.
 */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Inline error line (aria-live, always rendered to avoid layout shift). */
export function ErrorLine({ id, error }: { id?: string; error?: string }) {
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="min-h-[1rem] text-xs text-destructive"
      data-testid={id}
    >
      {error ?? ''}
    </p>
  )
}

/** One labelled text input (with optional hint shown when there is no error). */
export function TextField(props: {
  id: string
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  autoComplete?: string
  inputMode?: 'decimal' | 'text'
}) {
  const { id, label, value, error, onChange, placeholder, hint, autoComplete, inputMode } = props
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid={`field-${id}`}
      />
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <ErrorLine id={`${id}-error`} error={error} />
      )}
    </div>
  )
}

/** One labelled select over a stable options list. */
export function SelectField(props: {
  id: string
  label: string
  value: string
  error?: string
  placeholder?: string
  options: readonly { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const { id, label, value, error, placeholder, options, onChange } = props
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} data-testid={`field-${id}`} aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ErrorLine id={`${id}-error`} error={error} />
    </div>
  )
}
