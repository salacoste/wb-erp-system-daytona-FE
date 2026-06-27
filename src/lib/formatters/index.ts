/**
 * Formatters barrel re-export.
 * All formatters live in domain modules; this file re-exports them for backward compat
 * so `import { formatCurrency } from '@/lib/formatters'` continues to work.
 */

export { formatCurrency, formatCurrencyCompact, formatCogsCost } from './currency-formatters'

export {
  formatPercentage,
  formatPercentageInt,
  formatPercentagePoints,
} from './percentage-formatters'

export {
  formatDate,
  formatDateTime,
  formatIsoWeek,
  formatWeeksAgo,
  formatWeeksAgoShort,
} from './date-formatters'

export { formatNumber, formatDecimal, formatRoas } from './number-formatters'
