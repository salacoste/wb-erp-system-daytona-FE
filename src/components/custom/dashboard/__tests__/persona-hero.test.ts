/**
 * Unit tests for persona-hero (TZ-5): hero KPI set shape + value resolution.
 */

import { describe, it, expect } from 'vitest'
import {
  PERSONA_HERO_KPIS,
  getPersonaHeroKpis,
  resolveHeroKpiLabel,
  resolveHeroKpiValue,
  type HeroKpiId,
} from '../persona-hero'
import type { Persona } from '@/stores/persona-presets'
import type { DashboardMetricsGridProps } from '../DashboardMetricsGridTypes'

const PERSONAS: Persona[] = ['Owner', 'Ops', 'CFO']

function createProps(
  overrides: Partial<DashboardMetricsGridProps> = {}
): DashboardMetricsGridProps {
  return {
    totalOrders: 340,
    ordersRevenue: 120000,
    ordersRevenueDiscounted: 45600,
    saleGross: 50000,
    wbSalesGross: 45000,
    wbReturnsGross: 5000,
    salesCount: 300,
    returnsCount: 40,
    commissionSales: 3000,
    acquiringFee: 500,
    loyaltyFee: 200,
    penaltiesTotal: 100,
    wbCommissionAdj: 50,
    logisticsCost: 8000,
    payoutTotal: 40000,
    storageCost: 2000,
    paidAcceptanceCost: 500,
    cogsTotal: 15000,
    cogsCoverage: 87,
    productsWithCogs: 17,
    totalProducts: 20,
    advertisingSpend: 5000,
    advertisingRoas: 3.5,
    grossProfit: 20000,
    marginPct: 25,
    operatingProfitAnalytical: 18000,
    operatingMarginPct: 36,
    grossMarginPct: 40,
    taxMetrics: null,
    previousPeriodData: undefined,
    isLoading: false,
    error: null,
    ...overrides,
  }
}

describe('persona-hero (TZ-5)', () => {
  describe('PERSONA_HERO_KPIS shape', () => {
    it('every persona has 1–6 hero KPIs', () => {
      for (const persona of PERSONAS) {
        const n = PERSONA_HERO_KPIS[persona].length
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(6)
      }
    })

    it('has exactly one lead per persona, and it is the first entry', () => {
      for (const persona of PERSONAS) {
        const leads = PERSONA_HERO_KPIS[persona].filter(k => k.lead)
        expect(leads.length).toBe(1)
        expect(PERSONA_HERO_KPIS[persona][0].lead).toBe(true)
      }
    })
  })

  describe('resolveHeroKpiValue', () => {
    it('maps scalar fields correctly', () => {
      const p = createProps()
      expect(resolveHeroKpiValue('orders', p)).toBe(340)
      expect(resolveHeroKpiValue('revenue', p)).toBe(50000)
      expect(resolveHeroKpiValue('wbRevenue', p)).toBe(45000)
      expect(resolveHeroKpiValue('returns', p)).toBe(5000)
      expect(resolveHeroKpiValue('storage', p)).toBe(2000)
      expect(resolveHeroKpiValue('operating', p)).toBe(18000)
      expect(resolveHeroKpiValue('grossMargin', p)).toBe(40)
      expect(resolveHeroKpiValue('payout', p)).toBe(40000)
    })

    it('margin prefers operatingMarginPct over marginPct', () => {
      expect(
        resolveHeroKpiValue('margin', createProps({ operatingMarginPct: 36, marginPct: 25 }))
      ).toBe(36)
      expect(
        resolveHeroKpiValue('margin', createProps({ operatingMarginPct: undefined, marginPct: 25 }))
      ).toBe(25)
    })

    it('netProfit resolves via the tax cascade and is null with no data', () => {
      // No tax → operating profit (pre-tax) is used.
      expect(
        resolveHeroKpiValue('netProfit', createProps({ operatingProfitAnalytical: 18000 }))
      ).toBe(18000)
      // No data at all → null.
      expect(
        resolveHeroKpiValue(
          'netProfit',
          createProps({
            operatingProfitAnalytical: undefined,
            grossProfit: undefined,
            payoutTotal: undefined,
            taxMetrics: null,
          })
        )
      ).toBeNull()
    })

    it('netProfit label is honest when the value is pre-tax operating profit', () => {
      const p = createProps({ taxMetrics: null, operatingProfitAnalytical: 18000 })

      expect(resolveHeroKpiLabel('netProfit', p)).toBe('Операционная прибыль (до налога)')
      expect(getPersonaHeroKpis('Owner', p)[0].label).toBe('Операционная прибыль (до налога)')
    })

    it('returns null for undefined scalar values', () => {
      const p = createProps({ saleGross: undefined, totalOrders: undefined })
      expect(resolveHeroKpiValue('revenue', p)).toBeNull()
      expect(resolveHeroKpiValue('orders' as HeroKpiId, p)).toBeNull()
    })
  })

  describe('getPersonaHeroKpis', () => {
    it('returns defs + resolved values aligned per persona', () => {
      const p = createProps()
      const ownerKpis = getPersonaHeroKpis('Owner', p)
      expect(ownerKpis.length).toBe(PERSONA_HERO_KPIS.Owner.length)
      // Lead is first; its value resolves.
      expect(ownerKpis[0].def.lead).toBe(true)
      expect(ownerKpis[0].value).toBe(resolveHeroKpiValue(ownerKpis[0].def.id, p))
      // CFO payout KPI resolves to payoutTotal.
      const cfoPayout = getPersonaHeroKpis('CFO', p).find(k => k.def.id === 'payout')
      expect(cfoPayout?.value).toBe(40000)
    })
  })
})
