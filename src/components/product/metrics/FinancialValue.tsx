import { formatDuration, formatDurationCompact } from '@/lib/duration-utils'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateTime,
  formatDecimal,
  formatIsoWeek,
  formatNumber,
  formatPercentage,
  formatPercentagePoints,
} from '@/lib/formatters'
import { cn } from '@/lib/utils'

import { DataAvailability } from './DataAvailability'
import { type FinancialDirection, financialDirectionClass } from './presentation'

export type ValueAvailability = 'available' | 'stale' | 'partial' | 'estimated'
export type ValueAvailabilityPresentation = {
  state: ValueAvailability
  label?: string
  description?: string
}
export type NumericValueModel = {
  state: 'value'
  value: number
  availability?: ValueAvailability | ValueAvailabilityPresentation
}
export type TemporalValueModel = {
  state: 'temporal'
  value: string | Date
  availability?: ValueAvailability | ValueAvailabilityPresentation
}
export type EmptyValueModel =
  | { state: 'missing'; value?: never }
  | { state: 'unavailable'; value?: never }
  | { state: 'not-calculated'; value?: never }
  | { state: 'filtered-out'; value?: never }
  | { state: 'restricted'; value?: never }
  | { state: 'unknown'; value?: never }

export type FinancialValueModel = NumericValueModel | TemporalValueModel | EmptyValueModel
export type NumericFinancialFormat =
  | { kind: 'currency'; precision?: number }
  | { kind: 'percent'; precision?: number }
  | { kind: 'percentage-points' }
  | { kind: 'quantity'; unit: string; precision?: number }
  | { kind: 'duration' }
  | { kind: 'decimal'; precision?: number }
  | { kind: 'count' }
export type TemporalFinancialFormat = { kind: 'date' | 'date-time' | 'iso-week' }
export type FinancialFormat = NumericFinancialFormat | TemporalFinancialFormat
export type CompactFinancialFormat = Extract<
  NumericFinancialFormat,
  { kind: 'currency' | 'duration' }
>

type ValueProps =
  | { model: NumericValueModel; format: NumericFinancialFormat }
  | { model: TemporalValueModel; format: TemporalFinancialFormat }
  | { model: EmptyValueModel; format: FinancialFormat }

type FullValueProps = ValueProps & { display?: 'full'; fullValue?: never }
type CompactValueProps = {
  model: NumericValueModel
  format: CompactFinancialFormat
  display: 'compact'
  fullValue: string
}

export type FinancialValueProps = (FullValueProps | CompactValueProps) & {
  direction?: FinancialDirection
  className?: string
}

function quantity(value: number, unit: string, precision = 0): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value)
  return `${formatted} ${unit}`
}

function currency(value: number, precision?: number): string {
  if (precision === undefined) return formatCurrency(value)
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value)
}

function numericText(value: number, format: NumericFinancialFormat, compact: boolean): string {
  switch (format.kind) {
    case 'currency':
      return compact ? formatCurrencyCompact(value) : currency(value, format.precision)
    case 'percent':
      return formatPercentage(value, format.precision)
    case 'percentage-points':
      return formatPercentagePoints(value)
    case 'quantity':
      return quantity(value, format.unit, format.precision)
    case 'duration':
      return compact ? formatDurationCompact(value) : formatDuration(value)
    case 'decimal':
      return formatDecimal(value, format.precision)
    case 'count':
      return formatNumber(value)
  }
}

function temporalText(value: string | Date, format: TemporalFinancialFormat): string {
  switch (format.kind) {
    case 'date':
      return formatDate(value)
    case 'date-time':
      return formatDateTime(value)
    case 'iso-week':
      return formatIsoWeek(value)
  }
}

function UnknownValue() {
  return <DataAvailability state="unknown" label="Неизвестное значение" className="tabular-nums" />
}

export function FinancialValue(props: FinancialValueProps) {
  const { model, direction, className } = props
  if (model.state !== 'value' && model.state !== 'temporal') {
    return <DataAvailability state={model.state} />
  }

  let text: string
  if (model.state === 'temporal') {
    text = temporalText(model.value, props.format as TemporalFinancialFormat)
    if (text === '—') return <UnknownValue />
  } else {
    if (!Number.isFinite(model.value)) return <UnknownValue />
    text = numericText(
      model.value,
      props.format as NumericFinancialFormat,
      props.display === 'compact'
    )
  }

  const semanticDirection = direction ?? 'neutral'

  return (
    <span className="inline-flex min-w-0 flex-col gap-1">
      <span
        data-testid="financial-value"
        data-direction={semanticDirection}
        className={cn(
          'break-words tabular-nums',
          financialDirectionClass[semanticDirection],
          className
        )}
      >
        {text}
      </span>
      {props.display === 'compact' ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Точное значение</summary>
          <span data-testid="financial-value-full" className="mt-1 block break-words tabular-nums">
            {props.fullValue}
          </span>
        </details>
      ) : null}
      {model.availability && model.availability !== 'available' ? (
        <DataAvailability
          {...(typeof model.availability === 'string'
            ? { state: model.availability }
            : model.availability)}
        />
      ) : null}
    </span>
  )
}
