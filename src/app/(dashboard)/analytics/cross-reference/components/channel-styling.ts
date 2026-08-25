/**
 * Channel styling — Story 170.6-FE single source of truth for the organic/ad/both
 * channel color mapping (previously duplicated as hex/triplet records in
 * CrossReferenceTable, OverlapSummaryCards and OrganicVsAdScatter).
 *
 * Decision (documented per story): semantic STATUS tokens for chips/tiles —
 * organic = status-success (healthy organic presence), ad = status-information
 * (informational, no valence), both = NEUTRAL muted (presence in both channels
 * carries neither positive nor negative valence). Scatter series instead use
 * CATEGORICAL chart-N tokens (170.1 canon) — chart-1 ≈ the legacy #3B82F6 blue,
 * so ad keeps its historical hue; organic/both take chart-2/chart-3.
 */

import type { Channel } from '../utils/cross-reference-utils'

export interface ChannelStyle {
  /** Table Badge label (short form; summaries/legend use their own long labels). */
  label: string
  /** Status-tint chip classes (169.5 /15+/30 canon). */
  badgeClassName: string
  /** Summary-card icon tile classes. */
  tileClassName: string
  /** Categorical recharts fill for scatter series. */
  chartFill: string
}

export const CHANNEL_STYLES: Record<Channel, ChannelStyle> = {
  organic: {
    label: 'Органика',
    badgeClassName: 'bg-status-success/15 text-status-success border-status-success/30',
    tileClassName: 'bg-status-success/15 text-status-success',
    chartFill: 'var(--color-chart-2)',
  },
  ad: {
    label: 'Реклама',
    badgeClassName: 'bg-status-information/15 text-status-information border-status-information/30',
    tileClassName: 'bg-status-information/15 text-status-information',
    chartFill: 'var(--color-chart-1)',
  },
  both: {
    label: 'Оба',
    badgeClassName: 'bg-muted text-foreground border-border',
    tileClassName: 'bg-muted text-foreground',
    chartFill: 'var(--color-chart-3)',
  },
}
