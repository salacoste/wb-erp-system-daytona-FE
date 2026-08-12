import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { ChartEvidence } from './ChartEvidence'
import { ChartActivityStatus, ChartState } from './ChartState'
import type { ChartFrameProps, RetainedChartFrameProps } from './contracts'

function isPresent(value: ReactNode): boolean {
  return value !== null && value !== undefined
}

function isRetainedFrame(props: ChartFrameProps): props is RetainedChartFrameProps {
  return ['rendered', 'partial', 'stale'].includes(props.state.kind)
}

function ContextItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 break-words text-sm">
      <span className="font-medium">{label}: </span>
      {children}
    </div>
  )
}

export function ChartFrame(props: ChartFrameProps) {
  const generatedId = useId()
  const baseId = `chart-${generatedId.replace(/:/g, '')}`
  const titleId = `${baseId}-title`
  const descriptionId = isPresent(props.description) ? `${baseId}-description` : undefined
  const retained = isRetainedFrame(props)

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-chart-frame
      data-state={props.state.kind}
      className={cn('min-w-0 space-y-4 overflow-hidden', props.className)}
    >
      <div data-chart-order="identity" className="min-w-0 space-y-1">
        <h3 id={titleId} className="break-words text-base font-semibold text-foreground">
          {props.title}
        </h3>
        {isPresent(props.description) ? (
          <div id={descriptionId} className="break-words text-sm text-muted-foreground">
            {props.description}
          </div>
        ) : null}
      </div>

      <div data-chart-order="context" className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <ContextItem label="Период">{props.period}</ContextItem>
          <ContextItem label="Единицы">{props.units}</ContextItem>
          {isPresent(props.freshness) ? (
            <ContextItem label="Актуальность">{props.freshness}</ContextItem>
          ) : null}
          {isPresent(props.comparison) ? (
            <ContextItem label="Сравнение">{props.comparison}</ContextItem>
          ) : null}
        </div>
        {isPresent(props.annotation) ? (
          <div className="min-w-0 break-words text-sm text-muted-foreground">
            {props.annotation}
          </div>
        ) : null}
        {isPresent(props.actions) ? (
          <div className="flex min-w-0 flex-wrap gap-2 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:justify-center [&_button]:min-h-11 [&_button]:min-w-11 [&_[role=button]]:inline-flex [&_[role=button]]:min-h-11 [&_[role=button]]:min-w-11 [&_[role=button]]:items-center [&_[role=button]]:justify-center">
            {props.actions}
          </div>
        ) : null}
        <ChartActivityStatus activity={props.activity} />
      </div>

      {retained ? (
        <div
          role="group"
          aria-label={props.plotLabel}
          data-chart-order="plot"
          data-chart-plot
          className="min-h-[240px] min-w-0 overflow-hidden"
        >
          {props.plot}
        </div>
      ) : (
        <div data-chart-order="plot">
          <ChartState state={props.state} />
        </div>
      )}

      {retained ? (
        <div data-chart-order="evidence" className="min-w-0">
          <ChartState state={props.state} />
          <ChartEvidence {...props.evidence} />
        </div>
      ) : null}
    </figure>
  )
}
