import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import * as navigationModule from './sidebar-navigation'
import type { NavigationItem } from './sidebar-navigation'

type NavigationContract = {
  resolveNavigationItems: (options: {
    role: string | null | undefined
    urgentCount: number
  }) => NavigationItem[]
  isNavigationItemActive: (
    pathname: string,
    href: string,
    items: readonly NavigationItem[]
  ) => boolean
}

const navigationContract = navigationModule as unknown as NavigationContract

describe('Story 167.1 shared navigation model', () => {
  it('[P0] resolves the canonical Owner order without mutating the static model', () => {
    const before = navigationModule.NAVIGATION_ITEMS.map(item => ({ ...item }))

    const resolved = navigationContract.resolveNavigationItems({ role: 'Owner', urgentCount: 0 })

    expect(resolved.map(({ label, href }) => ({ label, href }))).toEqual(
      before.map(({ label, href }) => ({ label, href }))
    )
    expect(navigationModule.NAVIGATION_ITEMS).toEqual(before)
  })

  it('[P0] removes Owner-only entries for every non-Owner role', () => {
    for (const role of ['Manager', 'Analyst', 'Service', null]) {
      const resolved = navigationContract.resolveNavigationItems({ role, urgentCount: 0 })
      expect(resolved.some(item => item.adminOnly)).toBe(false)
      expect(resolved.map(item => item.href)).not.toContain('/analytics/ai-admin/models')
    }
  })

  it('[P0] applies only a positive urgent count to supply planning', () => {
    const withUrgency = navigationContract.resolveNavigationItems({
      role: 'Owner',
      urgentCount: 12,
    })
    const withoutUrgency = navigationContract.resolveNavigationItems({
      role: 'Owner',
      urgentCount: 0,
    })

    expect(withUrgency.find(item => item.href === '/analytics/supply-planning')?.badge).toBe(12)
    expect(
      withoutUrgency.find(item => item.href === '/analytics/supply-planning')?.badge
    ).toBeUndefined()
  })

  it.each([
    ['/analytics/dashboard', '/analytics/dashboard'],
    ['/analytics/dashboard/details', '/analytics/dashboard'],
    ['/settings/tax/history', '/settings/tax'],
  ])('[P0] selects the deepest segment-aware route for %s', (pathname, expectedHref) => {
    const items = navigationContract.resolveNavigationItems({ role: 'Owner', urgentCount: 0 })
    const active = items.filter(item =>
      navigationContract.isNavigationItemActive(pathname, item.href, items)
    )

    expect(active.map(item => item.href)).toEqual([expectedHref])
  })

  it('[P1] does not treat a shared string prefix as a route-segment match', () => {
    const items = navigationContract.resolveNavigationItems({ role: 'Owner', urgentCount: 0 })

    expect(navigationContract.isNavigationItemActive('/analytics-old', '/analytics', items)).toBe(
      false
    )
  })

  it('[P0] keeps automatic auth refresh out of every Story-owned shell presentation', () => {
    const shellSources = [
      readFileSync('src/app/(dashboard)/layout.tsx', 'utf8'),
      readFileSync('src/components/custom/Sidebar.tsx', 'utf8'),
      readFileSync('src/app/(dashboard)/layout/MobileSidebarSheet.tsx', 'utf8'),
      readFileSync('src/components/custom/Navbar.tsx', 'utf8'),
      readFileSync('src/components/custom/SidebarCabinetInfo.tsx', 'utf8'),
    ]
    const authProviderSource = readFileSync('src/components/auth/AuthProvider.tsx', 'utf8')

    expect(shellSources.join('\n')).not.toMatch(/useAuth\s*\(/)
    expect(authProviderSource).toMatch(/useAuth\s*\(/)
  })

  it('[P0] keeps the cabinet destination at least 44 CSS pixels tall while loading', () => {
    const cabinetSource = readFileSync('src/components/custom/SidebarCabinetInfo.tsx', 'utf8')

    expect(cabinetSource).toMatch(/className="[^"]*min-h-11[^"]*"/)
  })
})
