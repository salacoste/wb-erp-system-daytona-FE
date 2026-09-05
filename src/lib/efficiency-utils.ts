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
  // P2 wave-5: legacy palette channels → semantic tokens. bgColor/textColor/
  // borderColor have no live production reader (labels/icons only — Story
  // 170.1); mapped with the same solid-vs-soft tier language as the measured
  // efficiency-filter-config: dual-green collapse (excellent solid vs good
  // soft), soft = /15 tint + fg text, orange→warning collapse, gray→muted.
  excellent: {
    label: 'Отлично',
    icon: TrendingUp,
    bgColor: 'bg-status-success',
    textColor: 'text-status-success-foreground',
    borderColor: 'border-status-success',
    iconColor: 'text-status-success',
    description: 'ROAS ≥ 5.0, ROI ≥ 100%',
    recommendation: 'Увеличьте бюджет для масштабирования',
  },
  good: {
    label: 'Хорошо',
    icon: ThumbsUp,
    bgColor: 'bg-status-success/15',
    textColor: 'text-foreground',
    borderColor: 'border-status-success/40',
    iconColor: 'text-status-success',
    description: 'ROAS 3.0–5.0, ROI 50–100%',
    recommendation: 'Оптимизируйте ставки для повышения эффективности',
  },
  moderate: {
    label: 'Умеренно',
    icon: AlertTriangle,
    bgColor: 'bg-status-warning/15',
    textColor: 'text-foreground',
    borderColor: 'border-status-warning/40',
    iconColor: 'text-status-warning',
    description: 'ROAS 2.0–3.0, ROI 20–50%',
    recommendation: 'Проанализируйте ключевые слова и таргетинг',
  },
  poor: {
    label: 'Слабо',
    icon: TrendingDown,
    bgColor: 'bg-status-warning',
    textColor: 'text-status-warning-foreground',
    borderColor: 'border-status-warning',
    iconColor: 'text-status-warning',
    description: 'ROAS 1.0–2.0, ROI 0–20%',
    recommendation: 'Снизьте ставки или пересмотрите стратегию',
  },
  loss: {
    label: 'Убыток',
    icon: XCircle,
    bgColor: 'bg-status-error',
    textColor: 'text-status-error-foreground',
    borderColor: 'border-status-error',
    iconColor: 'text-status-error',
    description: 'ROAS < 1.0, ROI < 0%',
    recommendation: 'Приостановите или полностью пересмотрите кампанию',
  },
  unknown: {
    label: 'Нет данных',
    icon: HelpCircle,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    borderColor: 'border-border',
    iconColor: 'text-muted-foreground',
    description: 'Нет данных о прибыли для расчёта эффективности',
    recommendation: 'Добавьте себестоимость для расчёта маржи',
  },
}

// Accessor helpers extracted for file-size compliance
export {
  getEfficiencyConfig,
  getRoasColorClass,
  getEfficiencyColor,
  getEfficiencyLabel,
  getEfficiencyIcon,
  getEfficiencyRecommendation,
  isAttentionRequired,
  isLossStatus,
} from '@/lib/efficiency-accessors'
