import type { TaxPreset } from '@/types/price-calculator'

/**
 * Tax presets for common Russian tax regimes
 * Story 44.17-FE: Tax Configuration
 *
 * Used by TaxConfigurationSection for quick preset selection
 */
export const TAX_PRESETS: TaxPreset[] = [
  {
    id: 'usn-income',
    name: 'УСН Доходы',
    rate: 6,
    type: 'income',
    description: 'Упрощённая система, налог с выручки',
  },
  {
    id: 'usn-profit',
    name: 'УСН Доходы-Расходы',
    rate: 15,
    type: 'profit',
    description: 'Упрощённая система, налог с прибыли',
  },
  {
    id: 'self-employed',
    name: 'Самозанятый',
    rate: 6,
    type: 'income',
    description: 'Налог на профессиональный доход',
  },
  {
    id: 'ip-osn',
    name: 'ИП на ОСН',
    rate: 13,
    type: 'profit',
    description: 'НДФЛ для индивидуальных предпринимателей',
  },
  {
    id: 'ooo-osn',
    name: 'ООО на ОСН',
    rate: 20,
    type: 'profit',
    description: 'Налог на прибыль для организаций',
  },
]

/**
 * Quick rate presets for tax rate buttons
 */
export const QUICK_TAX_RATES = [6, 13, 15, 20] as const
