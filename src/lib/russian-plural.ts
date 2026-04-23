/**
 * Russian count-based pluralization — shared module.
 * Epic 90-FE Story 90.3: extracted from AcquiringSummaryCards (Story 90.2).
 *
 * Rules:
 *   last two digits 11-14 → many (teen exception)
 *   last digit 1           → single
 *   last digit 2-4         → few
 *   otherwise              → many
 *
 * Usage:
 *   pluralize(REPORT_FORMS, 1)  // "отчёт"
 *   pluralize(REPORT_FORMS, 3)  // "отчёта"
 *   pluralize(REPORT_FORMS, 11) // "отчётов"
 */

/**
 * Returns the correct Russian plural form for `count`.
 * @param forms - tuple [single, few, many] e.g. ['отчёт', 'отчёта', 'отчётов']
 * @param count - the count to pluralize for (absolute value used)
 */
export function pluralize(
  forms: readonly [single: string, few: string, many: string],
  count: number
): string {
  // Coerce fractional to integer — decimal pluralization is undefined behaviour.
  const abs = Math.trunc(Math.abs(count))
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2]
  const lastDigit = abs % 10
  if (lastDigit === 1) return forms[0]
  if (lastDigit >= 2 && lastDigit <= 4) return forms[1]
  return forms[2]
}

/** Plural forms for "отчёт" (report). */
export const REPORT_FORMS = ['отчёт', 'отчёта', 'отчётов'] as const

/** Plural forms for "транзакция" (transaction). */
export const TRANSACTION_FORMS = ['транзакция', 'транзакции', 'транзакций'] as const
