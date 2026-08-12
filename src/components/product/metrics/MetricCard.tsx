import type { ReactNode } from 'react'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import {
  FinancialValue,
  type CompactFinancialFormat,
  type FinancialFormat,
  type FinancialValueModel,
  type FinancialValueProps,
} from './FinancialValue'
import {
  type ComparisonDirection,
  type ComparisonSentiment,
  type MetricVariant,
  comparisonSentimentClass,
  metricVariantPresentation,
} from './presentation'

type MetricReadyValue =
  | {
      value: Extract<FinancialValueModel, { state: 'value' }>
      format: NumericMetricFormat
    }
  | {
      value: Extract<FinancialValueModel, { state: 'temporal' }>
      format: Extract<FinancialFormat, { kind: 'date' | 'date-time' | 'iso-week' }>
    }
  | {
      value: Exclude<FinancialValueModel, { state: 'value' | 'temporal' }>
      format: FinancialFormat
    }

type NumericMetricFormat = Exclude<FinancialFormat, { kind: 'date' | 'date-time' | 'iso-week' }>

type MetricReadyFull = MetricReadyValue & { valueDisplay?: 'full'; fullValue?: never }
type MetricReadyCompact = {
  value: Extract<FinancialValueModel, { state: 'value' }>
  format: CompactFinancialFormat
  valueDisplay: 'compact'
  fullValue: string
}

export type MetricComparison = {
  label: string
  direction: ComparisonDirection
  sentiment: ComparisonSentiment
} & (
  | {
      delta: Extract<FinancialValueModel, { state: 'value' }>
      format: NumericMetricFormat
    }
  | {
      delta: Extract<FinancialValueModel, { state: 'temporal' }>
      format: Extract<MetricReadyValue, { value: { state: 'temporal' } }>['format']
    }
  | {
      delta: Exclude<FinancialValueModel, { state: 'value' | 'temporal' }>
      format: FinancialFormat
    }
)

export type MetricCardState =
  | { kind: 'loading'; label?: string; value?: never }
  | { kind: 'error'; message: string; recovery?: ReactNode; value?: never }
  | ({
      kind: 'ready'
      comparison?: MetricComparison
      direction?: FinancialValueProps['direction']
    } & (MetricReadyFull | MetricReadyCompact))

export interface MetricCardProps {
  label: string
  state: MetricCardState
  definition?: ReactNode
  period?: ReactNode
  action?: ReactNode
  variant?: MetricVariant
  className?: string
}

const comparisonIcon = {
  increase: ArrowUp,
  decrease: ArrowDown,
  unchanged: ArrowRight,
}

function ReadyValue({
  state,
  variant,
}: {
  state: Extract<MetricCardState, { kind: 'ready' }>
  variant: MetricVariant
}) {
  const shared = {
    direction: state.direction,
    className: metricVariantPresentation[variant].value,
  }
  const display =
    state.valueDisplay === 'compact'
      ? { display: 'compact' as const, fullValue: state.fullValue }
      : { display: 'full' as const }

  const valueProps = {
    model: state.value,
    format: state.format,
    ...display,
    ...shared,
  } as FinancialValueProps
  return <FinancialValue {...valueProps} />
}

function ComparisonValue({ comparison }: { comparison: MetricComparison }) {
  const direction = comparison.sentiment === 'unknown' ? 'neutral' : comparison.sentiment
  const valueProps = {
    model: comparison.delta,
    format: comparison.format,
    direction,
  } as FinancialValueProps
  return <FinancialValue {...valueProps} />
}

function MetricComparisonView({ comparison }: { comparison: MetricComparison }) {
  const Icon = comparisonIcon[comparison.direction]

  return (
    <div
      data-testid="metric-comparison"
      data-direction={comparison.direction}
      data-sentiment={comparison.sentiment}
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-1.5 text-sm',
        comparisonSentimentClass[comparison.sentiment]
      )}
    >
      <Icon data-comparison-icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="font-medium">{comparison.label}</span>
      <span className="inline-flex items-baseline tabular-nums">
        <ComparisonValue comparison={comparison} />
      </span>
    </div>
  )
}

export function MetricCard({
  label,
  state,
  definition,
  period,
  action,
  variant = 'standard',
  className,
}: MetricCardProps) {
  return (
    <Card
      role="article"
      aria-label={label}
      data-state={state.kind}
      data-variant={variant}
      className={cn('min-w-0 overflow-hidden', className)}
    >
      <CardHeader
        className={cn('min-w-0 flex-row flex-wrap', metricVariantPresentation[variant].header)}
      >
        <div className="min-w-0 space-y-1">
          <CardTitle className="break-words text-sm">{label}</CardTitle>
          {period ? (
            <div className="break-words text-xs text-muted-foreground">{period}</div>
          ) : null}
        </div>
        {action ? (
          <div className="min-w-0 max-w-full [&>*]:max-w-full [&>*]:whitespace-normal [&>*]:break-words">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent
        className={cn('flex min-w-0 flex-col pt-0', metricVariantPresentation[variant].content)}
      >
        {state.kind === 'loading' ? (
          <div role="status" className="space-y-2 text-sm text-muted-foreground">
            <span>{state.label ?? 'Загрузка значения'}</span>
            <Skeleton className="h-8 w-2/3 max-w-48" aria-hidden="true" />
          </div>
        ) : null}
        {state.kind === 'error' ? (
          <div role="alert" className="space-y-2 status-error text-status-error">
            <p>{state.message}</p>
            {state.recovery}
          </div>
        ) : null}
        {state.kind === 'ready' ? (
          <>
            <ReadyValue state={state} variant={variant} />
            {state.comparison ? <MetricComparisonView comparison={state.comparison} /> : null}
          </>
        ) : null}
        {definition ? (
          <div className="break-words text-sm text-muted-foreground">{definition}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
