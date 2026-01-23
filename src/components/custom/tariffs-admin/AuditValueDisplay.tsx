'use client'

// ============================================================================
// Audit Value Display Component
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Formats audit values based on field type with expandable JSON
// ============================================================================

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AuditValueDisplayProps {
  /** Field name to determine formatting */
  fieldName: string
  /** Value to display (string from API) */
  value: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Check if field contains JSON array (tiers or categories)
 */
function isJsonArrayField(fieldName: string): boolean {
  return (
    fieldName.includes('Tiers') ||
    fieldName.includes('tiers') ||
    fieldName === 'clothingCategories'
  )
}

/**
 * Check if field is a percentage field
 */
function isPercentageField(fieldName: string): boolean {
  return fieldName.includes('Pct') || fieldName.includes('pct')
}

/**
 * Check if field is a days field
 */
function isDaysField(fieldName: string): boolean {
  return fieldName.includes('Days') || fieldName.includes('days')
}

/**
 * Check if field is a currency rate field
 */
function isRateField(fieldName: string): boolean {
  return fieldName.includes('Rate') || fieldName.includes('rate')
}

/**
 * Format value based on field type
 */
function formatValue(fieldName: string, value: string): string {
  // Percentage fields
  if (isPercentageField(fieldName)) {
    return `${value}%`
  }

  // Days fields
  if (isDaysField(fieldName)) {
    return `${value} дней`
  }

  // Currency rate fields
  if (isRateField(fieldName)) {
    return `${value} ₽`
  }

  // Boolean fields
  if (value === 'true') return 'Да'
  if (value === 'false') return 'Нет'

  // Default: return as-is
  return value
}

/**
 * Expandable JSON display for array values
 */
interface JsonExpandableProps {
  value: string
}

function JsonExpandable({ value }: JsonExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    // If not valid JSON, show as text
    return <span className="text-xs">{value}</span>
  }

  const formatted = JSON.stringify(parsed, null, 2)

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Скрыть' : 'Показать'}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Скрыть
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Показать
          </>
        )}
      </Button>

      {isExpanded && (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-w-[200px]">
          {formatted}
        </pre>
      )}
    </div>
  )
}

/**
 * Displays audit value with appropriate formatting
 *
 * Formatting rules:
 * - null → "—"
 * - JSON arrays → Expandable view
 * - Percentages (Pct fields) → "15%"
 * - Days (Days fields) → "60 дней"
 * - Rates (Rate fields) → "10 ₽"
 * - Booleans → "Да" / "Нет"
 *
 * @example
 * ```tsx
 * <AuditValueDisplay fieldName="storageFreeDays" value="60" />
 * // Renders: "60 дней"
 *
 * <AuditValueDisplay fieldName="defaultCommissionFboPct" value="15" />
 * // Renders: "15%"
 *
 * <AuditValueDisplay fieldName="logisticsVolumeTiers" value="[{...}]" />
 * // Renders: Expandable JSON view
 * ```
 */
export function AuditValueDisplay({
  fieldName,
  value,
  className,
}: AuditValueDisplayProps) {
  // Null value
  if (value === null || value === undefined) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }

  // JSON array fields (tiers, categories)
  if (isJsonArrayField(fieldName)) {
    return <JsonExpandable value={value} />
  }

  // Format based on field type
  const formattedValue = formatValue(fieldName, value)

  return <span className={cn('text-sm', className)}>{formattedValue}</span>
}
