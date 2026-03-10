// ============================================================================
// COGS History shared utilities
// Extracted from cogs/history/page.tsx (Story 5.1-fe)
// ============================================================================

/**
 * Helper for Russian plural forms
 */
export function getPluralForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100

  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}
