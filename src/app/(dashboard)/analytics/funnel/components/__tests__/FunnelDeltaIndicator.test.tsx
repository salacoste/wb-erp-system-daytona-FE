import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DeltaIndicator } from '../FunnelDeltaIndicator'
import { calculateFunnelDelta } from '../funnel-comparison-utils'

describe('DeltaIndicator — Story 169.8 semantic desirability', () => {
  it('renders an increasing cancelCount as financially negative', () => {
    render(
      <DeltaIndicator delta={calculateFunnelDelta(110, 100)} field="cancelCount" loading={false} />
    )

    expect(screen.getByText('↑ 10,0%')).toHaveClass('text-financial-negative')
  })

  it('keeps an increasing cancelRate non-inverted and financially positive', () => {
    render(
      <DeltaIndicator delta={calculateFunnelDelta(11, 10)} field="cancelRate" loading={false} />
    )

    const delta = screen.getByText('↑ 10,0%')
    expect(delta).toHaveClass('text-financial-positive')
    expect(delta).not.toHaveClass('text-financial-negative')
  })

  it('keeps a neutral delta muted regardless of inversion', () => {
    render(
      <DeltaIndicator delta={calculateFunnelDelta(10, 10)} field="cancelCount" loading={false} />
    )

    expect(screen.getByText('— 0,0%')).toHaveClass('text-muted-foreground')
  })

  it('renders missing comparison meaning as persistent visible text', () => {
    render(<DeltaIndicator delta={null} field="ordersCount" loading={false} />)

    expect(screen.getByText('Нет данных')).toBeVisible()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
