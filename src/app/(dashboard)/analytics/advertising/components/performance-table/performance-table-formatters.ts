/** Formatter functions for PerformanceMetricsTable — extracted for 200-line limit */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`
}

// iter-61: `roi` is ALREADY in percent units (live e.g. -136.67 = -136.7%), so the old
// `value * 100` rendered it 100× too large ("-13667.0%") — a real magnitude bug, not just locale.
// Intl `style:'percent'` multiplies by 100, so format `value / 100` to show the percent as-is in
// Russian locale ("-136,7 %"). Only call site is `item.roi` (percent domain).
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

// iter-61: `ctr` / `organic_contribution` are percent units (0-100); magnitude was already
// correct, this only fixes the dot-locale ("11.42%" → "11,42 %"). value/100 because style:'percent' ×100.
export function formatPercentRaw(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
