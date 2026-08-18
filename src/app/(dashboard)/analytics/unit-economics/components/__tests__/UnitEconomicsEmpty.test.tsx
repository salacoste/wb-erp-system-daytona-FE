import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { UnitEconomicsEmpty } from '../UnitEconomicsEmpty'

// 168.11 token migration: the info-box uses the /10 status-information surface idiom
// (168.8 precedent) instead of legacy bg-blue-50/text-blue-*.
describe('UnitEconomicsEmpty — info-box tokens (168.11)', () => {
  it('info box uses bg-status-information/10 surface', () => {
    render(<UnitEconomicsEmpty />)
    const box = screen.getByText('Как получить данные юнит-экономики?').closest('div')
    expect(box?.className).toContain('bg-status-information/10')
    expect(box?.className).not.toContain('bg-blue-50')
  })

  it('info box heading uses text-status-information', () => {
    render(<UnitEconomicsEmpty />)
    const heading = screen.getByText('Как получить данные юнит-экономики?')
    expect(heading.className).toContain('text-status-information')
  })

  it('hint list text uses muted foreground (readable on /10 surface)', () => {
    render(<UnitEconomicsEmpty />)
    const list = screen.getByText(/Загрузите недельный отчёт WB/).closest('ul')
    expect(list?.className).toContain('text-muted-foreground')
    expect(list?.className).not.toContain('text-blue-700')
  })
})
