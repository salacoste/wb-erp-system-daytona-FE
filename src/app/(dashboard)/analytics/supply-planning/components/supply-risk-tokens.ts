/**
 * Supply risk tier → design-system token map (Story 169.13)
 *
 * SINGLE SOURCE for the route's risk-tier colors, reconciling the 4 previously
 * divergent sites (risk-card-styles, row-constants, detail header ternary,
 * risk-card inline ring hex) — 169.4 tier-reconcile canon.
 *
 * lib (supply-planning-config) owns classification/labels/priority only; its
 * legacy hex/bgClass/textClass channels are NOT consumed here (169.10
 * liquidity pattern). unknown is MUTED — never styled as healthy green.
 *
 * Channel assignment (6 distinct, tier-collapse guarded):
 *   out_of_stock → destructive (strongest; keeps "darker than critical" intent)
 *   critical     → status-error (solid chip)
 *   warning      → status-warning (solid chip)
 *   low          → status-warning soft (/15 tint + /30 border, 169.5 pair)
 *   healthy      → status-success soft
 *   unknown      → muted (visible-unknown, preface #218/#226)
 */

import type { StockoutRisk } from '@/types/supply-planning'

export interface RiskTokenSet {
  /** Status pill in table rows / detail header (169.9 solid-chip canon). */
  chip: string
  /** Icon color on default (non-solid) surfaces. */
  icon: string
  /** Emphasis text (detail header accent, metrics). */
  accentText: string
  /** Risk-card surface, inactive. */
  card: string
  /** Risk-card surface, active — includes ring (replaces inline ring hex). */
  cardActive: string
  /** Row tint — /15 matched pair with rowBorder /30 (169.5 canon). */
  rowBg: string
  /** Row left border marker — non-color cue paired with icon + sr-only label. */
  rowBorder: string
}

export const SUPPLY_RISK_TOKENS: Record<StockoutRisk, RiskTokenSet> = {
  out_of_stock: {
    chip: 'bg-destructive text-destructive-foreground',
    icon: 'text-destructive',
    accentText: 'text-destructive',
    card: 'bg-destructive/10 border-destructive/30',
    cardActive: 'bg-destructive/20 border-destructive ring-2 ring-destructive',
    rowBg: 'bg-destructive/15',
    rowBorder: 'border-l-4 border-l-destructive/30',
  },
  critical: {
    chip: 'bg-status-error text-status-error-foreground',
    icon: 'text-status-error',
    accentText: 'text-status-error',
    card: 'bg-status-error/15 border-status-error/30',
    cardActive: 'bg-status-error/25 border-status-error ring-2 ring-status-error',
    rowBg: 'bg-status-error/15',
    rowBorder: 'border-l-4 border-l-status-error/30',
  },
  warning: {
    chip: 'bg-status-warning text-status-warning-foreground',
    icon: 'text-status-warning',
    accentText: 'text-status-warning',
    card: 'bg-status-warning/15 border-status-warning/30',
    cardActive: 'bg-status-warning/25 border-status-warning ring-2 ring-status-warning',
    rowBg: 'bg-status-warning/15',
    rowBorder: 'border-l-4 border-l-status-warning/30',
  },
  low: {
    chip: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
    icon: 'text-status-warning',
    accentText: 'text-status-warning',
    card: 'bg-status-warning/10 border-status-warning/20',
    cardActive: 'bg-status-warning/20 border-status-warning ring-2 ring-status-warning',
    rowBg: 'bg-status-warning/10',
    rowBorder: 'border-l-4 border-l-status-warning/20',
  },
  healthy: {
    chip: 'bg-status-success/15 text-status-success border border-status-success/30',
    icon: 'text-status-success',
    accentText: 'text-status-success',
    card: 'bg-status-success/10 border-status-success/25',
    cardActive: 'bg-status-success/20 border-status-success ring-2 ring-status-success',
    // Healthy rows stay untinted (was bg-white / no border) — tint is a risk signal.
    rowBg: 'bg-transparent',
    rowBorder: '',
  },
  unknown: {
    // Story 169.13: muted visible-unknown — never healthy green (preface #218/#226).
    chip: 'bg-muted text-muted-foreground border border-border',
    icon: 'text-muted-foreground',
    accentText: 'text-muted-foreground',
    card: 'bg-muted/50 border-border',
    cardActive: 'bg-muted border-border ring-2 ring-muted-foreground',
    rowBg: 'bg-muted/40',
    rowBorder: 'border-l-4 border-l-border',
  },
}

/** Velocity trend → token classes (kills lib VELOCITY_TREND_CONFIG.textClass
 *  consumption and the `.replace('text-','bg-')` hack). */
export const TREND_TEXT_TOKENS = {
  growing: 'text-status-success',
  stable: 'text-muted-foreground',
  declining: 'text-status-error',
} as const

/** Sparkline bar fills — explicit bg tokens (was textClass.replace hack). */
export const TREND_BG_TOKENS = {
  growing: 'bg-status-success',
  stable: 'bg-muted-foreground',
  declining: 'bg-status-error',
} as const
