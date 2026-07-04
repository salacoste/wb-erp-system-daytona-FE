'use client'

/**
 * BrandSubjectFilter — reusable brand + subject (category) dropdown filter.
 * S3 (product dictionaries).
 *
 * Renders two `<Select>` dropdowns populated from GET /v1/products/dictionaries:
 * brand (filterable today via GET /v1/products?brand=) and subject (the real WB
 * category axis — `Product.category` is 100% NULL, see contract). Each option
 * shows the value + cabinet-scoped product count. «Все» clears the filter.
 *
 * Reference: docs/request-backend/223-product-dictionaries-backend-contract.md
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DictionaryEntry } from '@/types/product-dictionaries'

interface BrandSubjectFilterProps {
  /** Distinct brand values with counts. */
  brands: DictionaryEntry[]
  /** Distinct subject values with counts (the category axis). */
  subjects: DictionaryEntry[]
  /** Current brand filter, or null when unset. */
  brand: string | null
  /** Current subject filter, or null when unset. */
  subject: string | null
  /** Fires with the new brand (or null when cleared). */
  onBrandChange: (brand: string | null) => void
  /** Fires with the new subject (or null when cleared). */
  onSubjectChange: (subject: string | null) => void
  /** Disable both selects (e.g. while loading). */
  disabled?: boolean
}

/**
 * Sentinel value representing "no filter" inside the Select. Namespaced so it
 * cannot collide with a real brand/subject value (e.g. a literal "all").
 */
const ALL = '__ALL__'

interface DictionarySelectProps {
  label: string
  ariaLabel: string
  entries: DictionaryEntry[]
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  testId: string
}

function DictionarySelect({
  label,
  ariaLabel,
  entries,
  value,
  onChange,
  disabled,
  testId,
}: DictionarySelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Select
        value={value ?? ALL}
        onValueChange={v => onChange(v === ALL ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-52" aria-label={ariaLabel} data-testid={testId}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Все</SelectItem>
          {entries.map(e => (
            <SelectItem key={e.value} value={e.value}>
              {e.value} ({e.count})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Brand + subject (category) filter dropdowns.
 */
export function BrandSubjectFilter({
  brands,
  subjects,
  brand,
  subject,
  onBrandChange,
  onSubjectChange,
  disabled,
}: BrandSubjectFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <DictionarySelect
        label="Бренд"
        ariaLabel="Фильтр по бренду"
        entries={brands}
        value={brand}
        onChange={onBrandChange}
        disabled={disabled}
        testId="brand-filter"
      />
      <DictionarySelect
        label="Категория"
        ariaLabel="Фильтр по категории"
        entries={subjects}
        value={subject}
        onChange={onSubjectChange}
        disabled={disabled}
        testId="subject-filter"
      />
    </div>
  )
}
