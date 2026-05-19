/**
 * Shared CSV utility helpers — pure functions, no side effects.
 * Used by evaluations-csv-export.ts and sku-accuracy-csv-export.ts.
 * Story 110.5-FE Task 3.
 */

/**
 * Escapes a CSV cell value.
 * If the value contains a comma, double-quote, newline, or carriage return,
 * wraps it in double-quotes and doubles any embedded double-quotes per RFC 4180 § 2.6.
 * \r detection catches legacy Mac line endings and accidental backend artifacts.
 */
export function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Prepends the UTF-8 BOM character (U+FEFF) to a CSV string.
 * Required for Excel to detect UTF-8 encoding and render Cyrillic correctly.
 */
export function prefixUtf8Bom(csv: string): string {
  return '﻿' + csv
}
