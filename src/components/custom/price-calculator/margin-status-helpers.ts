/**
 * Margin status helpers and configuration
 * Shared between MarginSection and related components
 */

/** Margin status configuration for badges */
export const MARGIN_STATUS_CONFIG = {
  excellent: {
    label: 'Отлично',
    // P2 boundary wave-2 (2026-09-03): /15 tint measured 4.19:1 light — WCAG 1.4.3
    // FAIL (the D-4 "both themes" note covered only the solid pairs); house rule → /5.
    // Pass-2 correction (review-pass-2, 2026-09-05): in-situ over the TwoLevelPricingDisplay
    // gradient card (from-background to-muted/30) = 4.68 light / 8.18 dark — PASS
    // (the earlier over-card 4.80 didn't model that layer; same treatment as MarginBadge).
    bgClass: 'bg-financial-positive/5',
    textClass: 'text-financial-positive',
  },
  // D-4 (2026-09-02): good/warning moved from /15 tints to solid pairs (173.12 canon) —
  // WCAG 1.4.3 in both themes. Financial tokens keep tints (no -foreground pairs yet);
  // wave-2 corrected their opacity /15 → /5 after measuring 4.19/4.42 light fails.
  good: {
    label: 'Хорошо',
    bgClass: 'bg-status-success',
    textClass: 'text-status-success-foreground',
  },
  warning: {
    label: 'Низкая',
    bgClass: 'bg-status-warning',
    textClass: 'text-status-warning-foreground',
  },
  critical: {
    label: 'Критично',
    // P2 boundary wave-2 (2026-09-03): /15 → /5 (measured 4.42:1 light fail → 5.20/8.19 PASS).
    bgClass: 'bg-financial-negative/5',
    textClass: 'text-financial-negative',
  },
} as const

/** Get margin status based on percentage */
export function getMarginStatus(pct: number): keyof typeof MARGIN_STATUS_CONFIG {
  if (pct >= 20) return 'excellent'
  if (pct >= 10) return 'good'
  if (pct >= 5) return 'warning'
  return 'critical'
}

/** Get margin health color based on percentage */
export function getMarginColor(marginPct: number): string {
  if (marginPct >= 20) return 'text-financial-positive'
  if (marginPct >= 10) return 'text-status-success'
  if (marginPct >= 5) return 'text-status-warning'
  return 'text-financial-negative'
}
