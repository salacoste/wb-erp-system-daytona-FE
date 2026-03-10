/**
 * DailyBreakdownChart configuration
 * Extracted from DailyBreakdownChart.tsx for file size compliance
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

export const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 4, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 6, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out' as const,
}
