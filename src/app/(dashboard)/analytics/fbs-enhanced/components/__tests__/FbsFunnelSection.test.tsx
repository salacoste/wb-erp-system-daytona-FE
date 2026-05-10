/**
 * Tests for FbsFunnelSection — Story 96.13-FE
 *
 * Pattern 2: raw SVG chosen — no recharts mock needed (jsdom renders SVG natively).
 * This testability was the explicit reason raw SVG was selected over recharts
 * for funnel shapes (MonitorBuyoutGauge precedent, Story 92.5-FE).
 *
 * Pattern 3 fixture wiring: emptyFbsFunnelData() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsFunnelData } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsFunnelSection } from '../FbsFunnelSection'

describe('FbsFunnelSection (Story 96.13-FE)', () => {
  it('renders empty state when funnelData is null', () => {
    renderWithProviders(<FbsFunnelSection funnelData={null} />)
    expect(screen.getByText(/Нет данных по воронке/)).toBeInTheDocument()
  })

  it('renders SVG funnel with zero counts — Pattern 3 fixture wiring', () => {
    renderWithProviders(<FbsFunnelSection funnelData={emptyFbsFunnelData()} />)
    // data-testid proves raw SVG mounts without recharts mocks
    expect(screen.getByTestId('fbs-funnel-svg')).toBeInTheDocument()
    // All 4 stage labels are present (L-3 fix: 'В корзину' → 'Добавлено в корзину')
    expect(screen.getByText('Просмотры товара')).toBeInTheDocument()
    expect(screen.getByText('Добавлено в корзину')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Доставлено')).toBeInTheDocument()
    // No inversion on empty/zero data — no AlertTriangle
    expect(screen.queryByTestId('fbs-funnel-inversion-warning')).not.toBeInTheDocument()
  })

  it('renders populated funnel with 4 stage values — no inversion warning', () => {
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          productViews: 10000,
          cartAdds: 2000,
          orders: 100,
          deliveries: 80,
        }}
      />
    )
    expect(screen.getByTestId('fbs-funnel-svg')).toBeInTheDocument()
    // Stage values rendered as formatted counts — regex per CLAUDE.md anti-pattern #6
    expect(screen.getByText(/10[.,]?\d*\s*тыс/)).toBeInTheDocument()
    expect(screen.getByText(/2[.,]?\d*\s*тыс/)).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    // Normal funnel (narrowing) — no inversion warning
    expect(screen.queryByTestId('fbs-funnel-inversion-warning')).not.toBeInTheDocument()
  })

  it('shows AlertTriangle inversion warning when funnel stage widens beyond threshold (H2-2 fix)', () => {
    // productViews: 100, cartAdds: 200 — 100% over threshold (>>5%), definitely anomalous
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          productViews: 100,
          cartAdds: 200,
          orders: 50,
          deliveries: 40,
        }}
      />
    )
    // M-2 + H2-2: Defensive Frontend Principle — anomaly indicated, raw values preserved
    expect(screen.getByTestId('fbs-funnel-inversion-warning')).toBeInTheDocument()
    // Both values still render (raw values preserved)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('does NOT show inversion warning for backend eventually-consistency noise (H2-2 fix)', () => {
    // cartAdds=10001, productViews=10000 — single-unit overshoot (delta=1 < ANOMALY_MIN_UNITS=2)
    // should NOT trigger warning per H2-2 tolerance (prevents false positives)
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          productViews: 10000,
          cartAdds: 10001,
          orders: 5000,
          deliveries: 4000,
        }}
      />
    )
    expect(screen.queryByTestId('fbs-funnel-inversion-warning')).not.toBeInTheDocument()
  })

  it('does NOT show inversion warning for no-em-dash funnel (M2-3 design intent: funnel never renders dashes)', () => {
    // Funnel counts are always numbers (not null/ratio fields) — no '—' expected
    renderWithProviders(<FbsFunnelSection funnelData={emptyFbsFunnelData()} />)
    expect(screen.queryAllByText('—').length).toBe(0) // M2-3: design intent — funnel never renders dashes
  })
})
