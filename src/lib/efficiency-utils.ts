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

/**
 * Efficiency status configuration with icons, colors, and descriptions.
 * Classification rules from backend:
 * - excellent: ROAS >= 5.0, ROI >= 1.0
 * - good: ROAS 3.0-5.0, ROI 0.5-1.0
 * - moderate: ROAS 2.0-3.0, ROI 0.2-0.5
 * - poor: ROAS 1.0-2.0, ROI 0-0.2
 * - loss: ROAS < 1.0, ROI < 0
 * - unknown: No profit data available
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
 * Get efficiency status color class for inline text styling
 */
export function getEfficiencyColor(status: EfficiencyStatus): string {
  return efficiencyConfig[status].textColor
}

/**
 * Get efficiency status label
 */
export function getEfficiencyLabel(status: EfficiencyStatus): string {
  return efficiencyConfig[status].label
}

/**
 * Get efficiency status icon component
 */
export function getEfficiencyIcon(status: EfficiencyStatus): LucideIcon {
  return efficiencyConfig[status].icon
}

/**
 * Get efficiency status recommendation
 */
export function getEfficiencyRecommendation(status: EfficiencyStatus): string {
  return efficiencyConfig[status].recommendation
}

/**
 * Check if status requires attention (poor, loss, or unknown)
 */
export function isAttentionRequired(status: EfficiencyStatus): boolean {
  return status === 'poor' || status === 'loss' || status === 'unknown'
}

/**
 * Check if status is negative (loss-making)
 */
export function isLossStatus(status: EfficiencyStatus): boolean {
  return status === 'loss'
}

/**
 * Session storage key for dismissed alert banner
 */
export const ALERT_DISMISS_KEY = 'advertising_loss_alert_dismissed'

/**
 * Get stored dismiss state from sessionStorage
 * Returns { dismissed: boolean, lossCount: number | null }
 */
export function getAlertDismissState(): { dismissed: boolean; lossCount: number | null } {
  if (typeof window === 'undefined') {
    return { dismissed: false, lossCount: null }
  }

  try {
    const stored = sessionStorage.getItem(ALERT_DISMISS_KEY)
    if (!stored) {
      return { dismissed: false, lossCount: null }
    }
    const parsed = JSON.parse(stored)
    return {
      dismissed: parsed.dismissed ?? false,
      lossCount: parsed.lossCount ?? null,
    }
  } catch {
    return { dismissed: false, lossCount: null }
  }
}

/**
 * Set dismiss state in sessionStorage
 * Stores both dismissed flag and the loss count at time of dismissal
 */
export function setAlertDismissState(lossCount: number): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(
      ALERT_DISMISS_KEY,
      JSON.stringify({ dismissed: true, lossCount })
    )
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear dismiss state from sessionStorage
 */
export function clearAlertDismissState(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(ALERT_DISMISS_KEY)
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if alert should be shown based on current loss count
 * Alert reappears if loss count increases (AC4)
 */
export function shouldShowLossAlert(currentLossCount: number): boolean {
  if (currentLossCount === 0) return false

  const { dismissed, lossCount: storedCount } = getAlertDismissState()

  // Show if never dismissed
  if (!dismissed) return true

  // Show if loss count increased since dismissal
  if (storedCount !== null && currentLossCount > storedCount) return true

  return false
}
