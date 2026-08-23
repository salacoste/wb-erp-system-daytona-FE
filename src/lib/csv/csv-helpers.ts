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
 *    KNOWN TRADE-OFF (round-1 review, deliberate): formatted negative values
 *    ("-1 234,56 ₽") also match the leading `-` and gain a literal `'` when
 *    the CSV is opened in Excel. Accepted because (a) exempting /^-\d/ would
 *    reopen the classic `-1+1|cmd` injection payload, and (b) these cells are
 *    pre-formatted ru-RU strings (NBSP + ₽) — Excel never treated them as
 *    numeric-aggregatable anyway. Do NOT "fix" by numeric exemption.
 * 2. RFC 4180 § 2.6: if the value contains a comma, double-quote, newline,
 *    or carriage return, wraps it in double-quotes and doubles any embedded
 *    double-quotes. \r detection catches legacy Mac line endings and
 *    accidental backend artifacts.
 * Anchor scope: defanging checks the CELL-VALUE START only — Excel formulas
 * trigger at cell start, so an embedded "safe\n=CMD()" needs no second-line
 * prefix (pinned by test to prevent well-meaning double-prefix "fixes").
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
