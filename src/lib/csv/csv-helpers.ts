/**
 * Shared CSV utility helpers — pure functions, no side effects.
 * Used by evaluations-csv-export.ts and sku-accuracy-csv-export.ts.
 * Story 110.5-FE Task 3.
 */

/**
 * Escapes a CSV cell value with OWASP CSV-injection defanging.
 *
 * 1. Formula injection: cells starting with =, +, -, @, TAB, CR, LF are
 *    prefixed with a single-quote so hostile product names like
 *    `=HYPERLINK(...)` cannot execute when opened in Excel.
 *    (Ported from preserved WIP snapshot 643c65b4; OWASP CSV Injection.)
 * 2. RFC 4180 § 2.6: if the value contains a comma, double-quote, newline,
 *    or carriage return, wraps it in double-quotes and doubles any embedded
 *    double-quotes. \r detection catches legacy Mac line endings and
 *    accidental backend artifacts.
 */
export function escapeCsvCell(value: string): string {
  let s = value
  if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Prepends the UTF-8 BOM character (U+FEFF) to a CSV string.
 * Required for Excel to detect UTF-8 encoding and render Cyrillic correctly.
 */
export function prefixUtf8Bom(csv: string): string {
  return '﻿' + csv
}
