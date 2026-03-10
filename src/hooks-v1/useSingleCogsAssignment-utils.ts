/**
 * Single COGS Assignment - Validation & Formatting Helpers
 * Extracted from useSingleCogsAssignment.ts for file size compliance (Epic 74)
 */

import type { CogsAssignmentRequest, MissingDataReason } from '@/types/api'

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation helper for COGS assignment
 * Frontend validation before API call
 */
export function validateCogsAssignment(cogs: CogsAssignmentRequest): string[] {
  const errors: string[] = []

  if (cogs.unit_cost_rub === undefined || cogs.unit_cost_rub === null) {
    errors.push('Себестоимость обязательна для заполнения')
  } else if (cogs.unit_cost_rub < 0) {
    errors.push('Себестоимость не может быть отрицательной')
  } else if (!Number.isFinite(cogs.unit_cost_rub)) {
    errors.push('Себестоимость должна быть числом')
  }

  if (!cogs.valid_from) {
    errors.push('Дата начала действия обязательна для заполнения')
  } else {
    const validFrom = new Date(cogs.valid_from + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    oneYearAgo.setHours(0, 0, 0, 0)

    if (isNaN(validFrom.getTime())) {
      errors.push('Неверный формат даты')
    } else if (validFrom > today) {
      errors.push('Дата начала действия не может быть в будущем')
    } else if (validFrom < oneYearAgo) {
      errors.push('Дата начала действия не может быть более года назад')
    }
  }

  if (cogs.currency) {
    const validCurrencies = ['RUB', 'USD', 'EUR', 'CNY']
    if (!validCurrencies.includes(cogs.currency)) {
      errors.push(`Валюта должна быть одной из: ${validCurrencies.join(', ')}`)
    }
  }

  return errors
}

// ============================================================================
// Formatters
// ============================================================================

/** Format COGS value for display: formatCogs(1250.50) => "1 250,50 ₽" */
export function formatCogs(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) {
    return '—'
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

/**
 * Get user-friendly message for missing_data_reason
 * Backend uses UPPER_CASE values (Request #15)
 */
export function getMissingDataReasonMessage(reason: MissingDataReason): string | null {
  switch (reason) {
    case 'COGS_NOT_ASSIGNED':
      return 'Назначьте себестоимость для расчёта маржи'
    case 'NO_SALES_IN_PERIOD':
      return 'Нет продаж на прошлой неделе'
    case 'NO_SALES_DATA':
      return 'Нет продаж'
    case 'ANALYTICS_UNAVAILABLE':
      return 'Данные недоступны'
    case null:
      return null
    default:
      return 'Данные недоступны'
  }
}
