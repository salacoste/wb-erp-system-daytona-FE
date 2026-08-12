import type { ReactElement, ReactNode } from 'react'

export type TerminalChartState =
  | { kind: 'loading' | 'empty' | 'unavailable'; message: string }
  | { kind: 'error'; message: string; recovery: ReactNode }

export type RetainedChartState =
  { kind: 'rendered' } | { kind: 'partial' | 'stale'; message: string }

export type ChartDataState = TerminalChartState | RetainedChartState

export type ChartActivity = { kind: 'updating'; message: string }

export type ChartSeriesRole =
  | 'categorical'
  | 'positive'
  | 'negative'
  | 'reference'
  | 'target'
  | 'forecast'
  | 'confidence'
  | 'selection'

export type ChartSeriesMarker = 'solid' | 'dashed' | 'dotted' | 'point' | 'bar' | 'area' | 'band'

export const chartSeriesRoleLabel = {
  categorical: 'Категория',
  positive: 'Положительное значение',
  negative: 'Отрицательное значение',
  reference: 'Справочное значение',
  target: 'Целевое значение',
  forecast: 'Прогноз',
  confidence: 'Доверительный интервал',
  selection: 'Выбранная серия',
} satisfies Record<ChartSeriesRole, string>

export const chartSeriesMarkerLabel = {
  solid: 'Сплошная линия',
  dashed: 'Пунктирная линия',
  dotted: 'Точечная линия',
  point: 'Точечный маркер',
  bar: 'Столбец',
  area: 'Область',
  band: 'Полоса',
} satisfies Record<ChartSeriesMarker, string>

export type ChartSeriesVisibility = 'visible' | 'hidden'

export type ChartSeriesEvidence = {
  id: string
  label: string
  role: ChartSeriesRole
  marker: ChartSeriesMarker
  visibility?: ChartSeriesVisibility
  action?: ReactNode
}

export type ChartSelectionEvidence = {
  label: string
  effect: string
}

export type ChartEvidenceProps = {
  summary: string | number | ReactElement
  alternativeLabel: string
  dataAlternative: ReactElement
  selection?: ChartSelectionEvidence
  actions?: ReactNode
  className?: string
}

export type ChartTooltipEntry = {
  id: string
  label: string
  formattedValue: string
  unit?: string
  role: ChartSeriesRole
  marker: ChartSeriesMarker
  detail?: string
}

type ChartFrameIdentityProps = {
  title: string
  description?: ReactNode
  period: ReactNode
  units: ReactNode
  freshness?: ReactNode
  comparison?: ReactNode
  annotation?: ReactNode
  actions?: ReactNode
  activity?: ChartActivity
  className?: string
}

export type TerminalChartFrameProps = ChartFrameIdentityProps & {
  state: TerminalChartState
  plotLabel?: never
  plot?: never
  evidence?: never
}

export type RetainedChartFrameProps = ChartFrameIdentityProps & {
  state: RetainedChartState
  plotLabel: string
  plot: ReactElement
  evidence: ChartEvidenceProps
}

export type ChartFrameProps = TerminalChartFrameProps | RetainedChartFrameProps
