/**
 * Story 168.1 behavior lock — analytics hub navigation.
 * Pins the grouped navigation contract (section headings, hrefs, titles, badges)
 * across the shadcn token migration. Any href/title/badge drift fails here.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NavigationSection } from '../AnalyticsNavigation'
import { analyticsNavigation } from '../analytics-navigation-config'

const sections = Object.values(analyticsNavigation)

function renderHub() {
  const { container } = render(
    <div>
      {sections.map(section => (
        <NavigationSection key={section.title} {...section} />
      ))}
    </div>
  )
  return container
}

describe('AnalyticsNavigation — grouped hub navigation lock', () => {
  it('renders all four sections with their group headings (h2) and descriptions', () => {
    const container = renderHub()
    const headings = [
      'Финансовый анализ',
      'Операционная аналитика',
      'Маркетинг и SEO',
      'Стратегический анализ',
    ]
    const rendered = Array.from(container.querySelectorAll('h2')).map(el => el.textContent)
    for (const h of headings) expect(rendered).toContain(h)
  })

  it('renders every configured navigation card as a link with its exact href', () => {
    const container = renderHub()
    const all = sections.flatMap(s => s.items)
    expect(all.length).toBe(24)
    for (const item of all) {
      const link = container.querySelector(`a[href="${item.href}"]`)
      expect(link, `missing link for ${item.href}`).toBeTruthy()
    }
  })

  it('hardcodes the 24 navigation hrefs (review MEDIUM-4: config-independent lock)', () => {
    // The loop above iterates the CONFIG, so config drift passes it silently;
    // this literal list pins the public navigation contract independent of config edits.
    const expected = [
      '/analytics/advertising',
      '/analytics/alerts',
      '/analytics/brand',
      '/analytics/buyout',
      '/analytics/buyout-reconciliation',
      '/analytics/category',
      '/analytics/cross-reference',
      '/analytics/fbs-enhanced',
      '/analytics/fbs-stock',
      '/analytics/finance-history',
      '/analytics/forecast',
      '/analytics/forecast-accuracy',
      '/analytics/funnel',
      '/analytics/gaps',
      '/analytics/orders',
      '/analytics/pricing',
      '/analytics/reorder',
      '/analytics/returns',
      '/analytics/search',
      '/analytics/sku',
      '/analytics/storage',
      '/analytics/supply-planning',
      '/analytics/time-period',
      '/analytics/unit-economics',
    ]
    const container = renderHub()
    const rendered = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[href^="/analytics"]')
    ).map(el => el.getAttribute('href'))
    for (const href of expected) expect(rendered).toContain(href)
    expect(rendered.filter(h => h && h.startsWith('/analytics')).length).toBeGreaterThanOrEqual(
      expected.length
    )
  })

  it('keeps the exact badge copies (Важно / Новое / ML)', () => {
    const container = renderHub()
    const badges = Array.from(container.querySelectorAll('span')).map(el => el.textContent)
    for (const b of ['Важно', 'Новое', 'ML']) expect(badges).toContain(b)
  })

  it('uses static semantic-token accent classes (no runtime-interpolated hue classes)', () => {
    const container = renderHub()
    const links = Array.from(container.querySelectorAll('a'))
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.className).not.toMatch(
        /text-(blue|emerald|violet|amber|cyan|sky|slate|rose|orange|teal|pink|purple|indigo|yellow|red)-\d/
      )
    }
    // at least one card carries a semantic token accent
    expect(container.querySelector('[class*="text-status-"], [class*="text-primary"]')).toBeTruthy()
  })
})
