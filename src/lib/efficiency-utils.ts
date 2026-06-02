/**
 * Efficiency Status Utilities
 * Story 33.4-FE: Efficiency Status Indicators
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Centralized configuration for efficiency status display.
 * Icons per AC1, colors per AC2, tooltips per AC3.
 */

import {
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  TrendingDown,
  XCircle,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react'
import type { EfficiencyStatus } from '@/types/advertising-analytics'

// Re-export alert state management from extracted module
export {
  ALERT_DISMISS_KEY,
  getAlertDismissState,
  setAlertDismissState,
  clearAlertDismissState,
  shouldShowLossAlert,
} from './efficiency-alert-state'

/**
 * Efficiency status configuration with icons, colors, and descriptions.
 */
export interface EfficiencyConfig {
  /** Russian label for the status */
  label: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Background color class (Tailwind) */
  bgColor: string
  /** Text color class (Tailwind) */
  textColor: string
  /** Border color class for alerts (Tailwind) */
  borderColor: string
  /** Icon color class (Tailwind) */
  iconColor: string
  /** Description of the classification criteria */
  description: string
  /** Actionable recommendation for the user */
  recommendation: string
}

export const efficiencyConfig: Record<EfficiencyStatus, EfficiencyConfig> = {
  excellent: {
    label: 'Отлично',
    icon: TrendingUp,
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    iconColor: 'text-green-600',
    description: 'ROAS ≥ 5.0, ROI ≥ 100%',
    recommendation: 'Увеличьте бюджет для масштабирования',
  },
  good: {
    label: 'Хорошо',
    icon: ThumbsUp,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    iconColor: 'text-emerald-600',
    description: 'ROAS 3.0–5.0, ROI 50–100%',
    recommendation: 'Оптимизируйте ставки для повышения эффективности',
  },
  moderate: {
    label: 'Умеренно',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    iconColor: 'text-yellow-600',
    description: 'ROAS 2.0–3.0, ROI 20–50%',
    recommendation: 'Проанализируйте ключевые слова и таргетинг',
  },
  poor: {
    label: 'Слабо',
    icon: TrendingDown,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    iconColor: 'text-orange-600',
    description: 'ROAS 1.0–2.0, ROI 0–20%',
    recommendation: 'Снизьте ставки или пересмотрите стратегию',
  },
  loss: {
    label: 'Убыток',
    icon: XCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    iconColor: 'text-red-600',
    description: 'ROAS < 1.0, ROI < 0%',
    recommendation: 'Приостановите или полностью пересмотрите кампанию',
  },
  unknown: {
    label: 'Нет данных',
    icon: HelpCircle,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-500',
    description: 'Нет данных о прибыли для расчёта эффективности',
    recommendation: 'Добавьте себестоимость для расчёта маржи',
  },
}

/**
 * Validation F-47: guarded efficiency-config accessor. `efficiency_status` is backend-
 * provided (item.efficiency_status), so an out-of-union value (enum drift — the F-39 crash
 * class, where the backend sent a status the FE union lacked) would make
 * `efficiencyConfig[status]` undefined → a TypeError on `.icon`/`.textColor`/`.label`. Fall
 * back to the 'unknown' config for any unrecognized status. Accepts a plain string so the
 * runtime value (not just the typed union) is guarded.
 */
export function getEfficiencyConfig(status: string): EfficiencyConfig {
  return efficiencyConfig[status as EfficiencyStatus] ?? efficiencyConfig.unknown
}

/** Get efficiency status color class for inline text styling */
export function getEfficiencyColor(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).textColor
}

/** Get efficiency status label */
export function getEfficiencyLabel(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).label
}

/** Get efficiency status icon component */
export function getEfficiencyIcon(status: EfficiencyStatus): LucideIcon {
  return getEfficiencyConfig(status).icon
}

/** Get efficiency status recommendation */
export function getEfficiencyRecommendation(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).recommendation
}

/** Check if status requires attention (poor, loss, or unknown) */
export function isAttentionRequired(status: EfficiencyStatus): boolean {
  return status === 'poor' || status === 'loss' || status === 'unknown'
}

/** Check if status is negative (loss-making) */
export function isLossStatus(status: EfficiencyStatus): boolean {
  return status === 'loss'
}
