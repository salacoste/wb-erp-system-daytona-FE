import { writeFileSync } from 'node:fs'

import { expect, test } from './fixtures/network-test'
import {
  STORY_174_3_ROUTE_EVIDENCE,
  STORY_174_3_THEMES,
} from './fixtures/story-174-3-visual-accessibility'
import {
  MATRIX_HEIGHT,
  applyTheme,
  assertSettledRoute,
  prepareSessionProfile,
} from './support/story-174-3-runner-core'

const REAL_BROWSER_ZOOM = process.env.STORY_174_3_REAL_BROWSER_ZOOM === '1'
const READY_FILE = process.env.STORY_174_3_ZOOM_READY_FILE

type ZoomBaseline = {
  devicePixelRatio: number
  innerWidth: number
}

async function assertActualBrowserZoom(
  page: Parameters<typeof assertSettledRoute>[0],
  baseline: ZoomBaseline
) {
  const evidence = await page.evaluate(() => ({
    cssZoom: getComputedStyle(document.documentElement).zoom,
    devicePixelRatio: window.devicePixelRatio,
    innerWidth: window.innerWidth,
  }))

  expect(evidence.cssZoom, 'the real-browser evidence must not use CSS root zoom').toMatch(
    /^(?:1|normal)$/
  )
  expect(
    evidence.devicePixelRatio / baseline.devicePixelRatio,
    'browser UI zoom doubles the page device-pixel ratio'
  ).toBeGreaterThanOrEqual(1.9)
  expect(
    evidence.innerWidth,
    'browser UI zoom reduces the CSS viewport instead of preserving a CSS-zoom proxy viewport'
  ).toBeLessThanOrEqual(baseline.innerWidth / 1.9)
}

async function assertZoomedRoute(
  page: Parameters<typeof assertSettledRoute>[0],
  routeEvidence: (typeof STORY_174_3_ROUTE_EVIDENCE)[number],
  theme: (typeof STORY_174_3_THEMES)[number],
  baseline: ZoomBaseline
) {
  await page.goto(routeEvidence.effectiveUrl, { waitUntil: 'domcontentloaded' })
  await applyTheme(page, theme)
  await assertSettledRoute(page, routeEvidence)
  await assertActualBrowserZoom(page, baseline)

  const geometry = await page.evaluate(() => {
    const root = document.documentElement
    const main = document.querySelector('main') ?? document.body
    const box = main.getBoundingClientRect()
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      surfaceLeft: box.left,
      surfaceRight: box.right,
    }
  })

  expect(
    geometry.scrollWidth,
    `${routeEvidence.route}: document remains bounded at actual 200% browser zoom in ${theme}`
  ).toBeLessThanOrEqual(geometry.clientWidth + 2)
  expect(
    geometry.surfaceLeft,
    `${routeEvidence.route}: zoomed main starts inside the viewport`
  ).toBeGreaterThanOrEqual(-2)
  expect(
    geometry.surfaceRight,
    `${routeEvidence.route}: zoomed main ends inside the viewport`
  ).toBeLessThanOrEqual(geometry.clientWidth + 2)
}

test.describe('Story 174.3 actual browser UI zoom evidence', () => {
  test.skip(
    !REAL_BROWSER_ZOOM,
    'Runs only through the headed macOS browser-zoom evidence orchestrator.'
  )
  test.setTimeout(30 * 60 * 1000)

  test('all 76 routes preserve both themes at real browser 200 percent zoom', async ({ page }) => {
    expect(
      READY_FILE,
      'the real-browser zoom orchestrator supplies a private ready-file path'
    ).toBeTruthy()
    expect(STORY_174_3_ROUTE_EVIDENCE).toHaveLength(76)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: MATRIX_HEIGHT })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await assertSettledRoute(page, '/dashboard')

    const baseline = await page.evaluate(() => ({
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
    }))
    writeFileSync(READY_FILE!, 'ready\n', { flag: 'wx' })

    await expect
      .poll(
        () =>
          page.evaluate(
            initialDevicePixelRatio => window.devicePixelRatio / initialDevicePixelRatio,
            baseline.devicePixelRatio
          ),
        {
          message: 'headed Chromium receives the macOS browser UI 200% zoom command',
          timeout: 30_000,
        }
      )
      .toBeGreaterThanOrEqual(1.9)

    const authenticatedRoutes = STORY_174_3_ROUTE_EVIDENCE.filter(
      route => route.sessionProfile === 'authenticated'
    )
    const unauthenticatedRoutes = STORY_174_3_ROUTE_EVIDENCE.filter(
      route => route.sessionProfile === 'unauthenticated-onboarding'
    )

    for (const theme of STORY_174_3_THEMES) {
      for (const routeEvidence of authenticatedRoutes) {
        await assertZoomedRoute(page, routeEvidence, theme, baseline)
      }
    }

    for (const routeEvidence of unauthenticatedRoutes) {
      await prepareSessionProfile(page, routeEvidence)
    }
    for (const theme of STORY_174_3_THEMES) {
      for (const routeEvidence of unauthenticatedRoutes) {
        await assertZoomedRoute(page, routeEvidence, theme, baseline)
      }
    }
  })
})
