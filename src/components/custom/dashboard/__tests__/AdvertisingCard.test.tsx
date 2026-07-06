/**
 * AdvertisingCard — BD-12 dynamic label by data source.
 *
 * The card headline PREFERS wb_promotion (finance deductions) and falls back to
 * ad-cabinet API spend. The label must follow the source so the dashboard card
 * («Продвижение WB» / finance) isn't confused with the advertising page's «Расход»
 * (ad-cabinet API) — REPORT.md BD-12/A5. Source selection lives in `useFinanceSrc`.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AdvertisingCard } from '../AdvertisingCard'

const renderCard = (props: React.ComponentProps<typeof AdvertisingCard>) =>
  render(
    <TooltipProvider>
      <AdvertisingCard {...props} />
    </TooltipProvider>
  )

describe('AdvertisingCard — BD-12 label follows the data source', () => {
  it('labels «Продвижение WB» when wb_promotion (finance) is the source', () => {
    renderCard({
      totalSpend: 16779,
      previousSpend: null,
      wbPromotionCost: 47281,
      roas: 3,
      saleGross: 620000,
    })

    expect(screen.getByText('Продвижение WB')).toBeInTheDocument()
    // The plain «Реклама» label must NOT appear when the source is wb_promotion.
    expect(screen.queryByText('Реклама')).not.toBeInTheDocument()
  })

  it('labels «Реклама» when only ad-cabinet spend is available (fallback)', () => {
    renderCard({ totalSpend: 16779, previousSpend: null, roas: 3, saleGross: 620000 })

    expect(screen.getByText('Реклама')).toBeInTheDocument()
    expect(screen.queryByText('Продвижение WB')).not.toBeInTheDocument()
  })
})
