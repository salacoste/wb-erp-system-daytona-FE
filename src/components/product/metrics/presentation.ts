import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  type LucideIcon,
} from 'lucide-react'

export type AvailabilityState =
  | 'loading'
  | 'available'
  | 'missing'
  | 'unavailable'
  | 'not-calculated'
  | 'filtered-out'
  | 'stale'
  | 'partial'
  | 'estimated'
  | 'restricted'
  | 'unknown'

export type FinancialDirection = 'positive' | 'negative' | 'neutral'
export type ComparisonDirection = 'increase' | 'decrease' | 'unchanged'
export type ComparisonSentiment = FinancialDirection | 'unknown'
export type MetricVariant = 'hero' | 'standard' | 'compact' | 'dense'
export type OperationalStatus =
  'success' | 'warning' | 'error' | 'information' | 'pending' | 'neutral' | 'unknown'

export const availabilityPresentation: Record<
  AvailabilityState,
  { label: string; className: string }
> = {
  loading: { label: 'Данные загружаются', className: 'status-pending text-status-pending' },
  available: {
    label: 'Данные доступны',
    className: 'availability-available text-availability-available',
  },
  missing: { label: 'Нет данных', className: 'availability-unknown text-availability-unknown' },
  unavailable: {
    label: 'Данные недоступны',
    className: 'availability-unavailable text-availability-unavailable',
  },
  'not-calculated': {
    label: 'Не рассчитано',
    className: 'availability-unknown text-availability-unknown',
  },
  'filtered-out': {
    label: 'Исключено фильтрами',
    className: 'availability-unknown text-availability-unknown',
  },
  stale: { label: 'Данные устарели', className: 'availability-stale text-availability-stale' },
  partial: {
    label: 'Данные неполные',
    className: 'availability-partial text-availability-partial',
  },
  estimated: {
    label: 'Оценочное значение',
    className: 'availability-unknown text-availability-unknown',
  },
  restricted: {
    label: 'Доступ ограничен',
    className: 'availability-restricted text-availability-restricted',
  },
  unknown: {
    label: 'Состояние данных неизвестно',
    className: 'availability-unknown text-availability-unknown',
  },
}

export const financialDirectionClass: Record<FinancialDirection, string> = {
  positive: 'financial-positive text-financial-positive',
  negative: 'financial-negative text-financial-negative',
  neutral: 'financial-neutral text-financial-neutral',
}

export const comparisonSentimentClass: Record<ComparisonSentiment, string> = {
  ...financialDirectionClass,
  unknown: 'availability-unknown text-availability-unknown',
}

export const statusPresentation: Record<
  OperationalStatus,
  { label: string; className: string; Icon: LucideIcon }
> = {
  success: {
    label: 'Успешно',
    className: 'status-success border-status-success/30 text-status-success',
    Icon: CheckCircle2,
  },
  warning: {
    label: 'Требуется внимание',
    className: 'status-warning border-status-warning/30 text-status-warning',
    Icon: AlertTriangle,
  },
  error: {
    label: 'Ошибка',
    className: 'status-error border-status-error/30 text-status-error',
    Icon: AlertCircle,
  },
  information: {
    label: 'Информация',
    className: 'status-information border-status-information/30 text-status-information',
    Icon: Info,
  },
  pending: {
    label: 'Ожидает выполнения',
    className: 'status-pending border-status-pending/30 text-status-pending',
    Icon: Clock3,
  },
  neutral: {
    label: 'Без изменений',
    className: 'status-neutral border-border text-muted-foreground',
    Icon: Circle,
  },
  unknown: {
    label: 'Статус неизвестен',
    className: 'availability-unknown border-availability-unknown/30 text-availability-unknown',
    Icon: Circle,
  },
}

export const metricVariantPresentation: Record<
  MetricVariant,
  { header: string; content: string; value: string }
> = {
  hero: {
    header: 'gap-4 px-6 py-6 sm:px-8 sm:py-8',
    content: 'gap-4 px-6 pb-6 sm:px-8 sm:pb-8',
    value: 'text-3xl font-semibold sm:text-4xl',
  },
  standard: {
    header: 'gap-3 px-5 py-5 sm:px-6 sm:py-6',
    content: 'gap-3 px-5 pb-5 sm:px-6 sm:pb-6',
    value: 'text-2xl font-semibold',
  },
  compact: {
    header: 'gap-2 px-4 py-4',
    content: 'gap-2 px-4 pb-4',
    value: 'text-xl font-semibold',
  },
  dense: {
    header: 'gap-1.5 px-3 py-3',
    content: 'gap-1.5 px-3 pb-3',
    value: 'text-lg font-semibold',
  },
}
