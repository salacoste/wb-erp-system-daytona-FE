/**
 * Expenses Boundary Normalizer
 * Coerces raw backend responses into frontend-canonical shapes.
 *
 * Backend serializes `amount`/totals as a Prisma `Decimal` JSON object (`{s,e,d}`),
 * string, or number. Uses `toDecimalNumber` (normalizer-helpers) to handle all three
 * forms — `Number(raw)` on a Decimal object yields NaN (BD-FE-003).
 */

import { toStr, toDecimalNumber, asRecord } from '../normalizer-helpers'
import type { ExpenseItem, ExpenseSummary, ExpenseCategory } from '@/types/expenses'
import { EXPENSE_CATEGORIES } from '@/types/expenses'

/** Coerce unknown to ExpenseCategory with fallback to 'other'. */
function toExpenseCategory(raw: unknown): ExpenseCategory {
  if (typeof raw === 'string' && EXPENSE_CATEGORIES.includes(raw as ExpenseCategory)) {
    return raw as ExpenseCategory
  }
  return 'other'
}

/**
 * Coerce an item amount (Prisma Decimal / string / number) to number.
 * Missing/null → NaN (honest sentinel per AP#8 — a real value is never silently lost).
 */
function toExpenseAmount(raw: unknown): number {
  const n = toDecimalNumber(raw)
  return n == null ? NaN : n
}

/**
 * Coerce a summary money aggregate (Decimal / string / number) to number.
 * Missing/null → 0 (semantic-zero: an empty expense total IS 0 — AP#8 aggregate exception).
 */
function toMoneyAggregate(raw: unknown): number {
  return toDecimalNumber(raw) ?? 0
}

/** Normalize a single expense item from backend. */
export function normalizeExpenseItem(raw: unknown): ExpenseItem {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    cabinetId: toStr(r.cabinetId),
    category: toExpenseCategory(r.category),
    amount: toExpenseAmount(r.amount),
    month: toStr(r.month),
    description: typeof r.description === 'string' ? r.description : null,
    createdAt: toStr(r.createdAt),
    updatedAt: toStr(r.updatedAt),
  }
}

/** Normalize GET /v1/expenses response (array of items). */
export function normalizeExpensesResponse(raw: unknown): ExpenseItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeExpenseItem)
}

/** Normalize GET /v1/expenses/summary response. */
export function normalizeExpenseSummaryResponse(raw: unknown): ExpenseSummary {
  const r = asRecord(raw)

  const byCategory: Record<ExpenseCategory, number> = {
    rent: 0,
    salary: 0,
    packaging: 0,
    transport: 0,
    other: 0,
  }

  const rawByCategory = r.byCategory
  if (rawByCategory && typeof rawByCategory === 'object') {
    const src = rawByCategory as Record<string, unknown>
    for (const cat of EXPENSE_CATEGORIES) {
      if (cat in src) {
        byCategory[cat] = toMoneyAggregate(src[cat])
      }
    }
  }

  const rawByMonth = r.byMonth
  const byMonth = Array.isArray(rawByMonth)
    ? rawByMonth.map((item: unknown) => {
        const m = asRecord(item)
        return { month: toStr(m.month), total: toMoneyAggregate(m.total) }
      })
    : []

  return {
    total: toMoneyAggregate(r.total),
    byCategory,
    byMonth,
  }
}
