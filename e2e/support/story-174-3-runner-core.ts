import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect } from '../fixtures/network-test'
import type { Locator, Page } from '../fixtures/network-test'
import type { Story1743RouteEvidence } from '../fixtures/story-174-3-visual-accessibility'

export const EXPECTED_ROUTE_COUNT = 76
export const MATRIX_HEIGHT = 900
export const ROUTE_SETTLE_TIMEOUT = 15_000
const REPOSITORY_ROOT = '.'

export function summarizeAxeViolations(
  violations: readonly {
    id: string
    impact?: string | null
    nodes: readonly { target?: unknown }[]
  }[]
) {
  return violations.map(violation => ({
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    nodeCount: violation.nodes.length,
    targets: violation.nodes.slice(0, 8).map(node => node.target),
  }))
}

export function readEvidenceLine(source: string, line: number): string {
  return readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)[line - 1] ?? ''
}

export function evidenceSha256(source: string): string {
  return createHash('sha256')
    .update(readFileSync(join(REPOSITORY_ROOT, source)))
    .digest('hex')
}

export type ComputedContrastEvidence = {
  background: string
  contrastRatio: number
  expectedContrastRatio: number
  fontSize: string
  fontWeight: string
  foreground: string
  sample: string
}

export async function measureComputedTextContrast(page: Page): Promise<ComputedContrastEvidence[]> {
  return page.evaluate(() => {
    type Rgba = { alpha: number; blue: number; green: number; red: number }

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return []

    const parseColor = (color: string): Rgba | null => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = '#000'
      try {
        context.fillStyle = color
      } catch {
        return null
      }
      context.fillRect(0, 0, 1, 1)
      const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
      return { alpha: alpha / 255, blue, green, red }
    }
    const composite = (foreground: Rgba, background: Rgba): Rgba => {
      const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha)
      if (alpha === 0) return { alpha: 0, blue: 0, green: 0, red: 0 }
      const channel = (front: number, back: number) =>
        (front * foreground.alpha + back * background.alpha * (1 - foreground.alpha)) / alpha
      return {
        alpha,
        blue: channel(foreground.blue, background.blue),
        green: channel(foreground.green, background.green),
        red: channel(foreground.red, background.red),
      }
    }
    const luminance = ({ red, green, blue }: Rgba) => {
      const linear = (channel: number) => {
        const value = channel / 255
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
    }
    const contrastRatio = (foreground: Rgba, background: Rgba) => {
      const foregroundLuminance = luminance(foreground)
      const backgroundLuminance = luminance(background)
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      )
    }
    const effectiveBackground = (node: HTMLElement): Rgba | null => {
      const ancestors: HTMLElement[] = []
      let current: HTMLElement | null = node
      while (current) {
        ancestors.push(current)
        current = current.parentElement
      }
      let background: Rgba = { alpha: 1, blue: 255, green: 255, red: 255 }
      for (const ancestor of ancestors.reverse()) {
        const style = getComputedStyle(ancestor)
        if (style.backgroundImage !== 'none' || Number.parseFloat(style.opacity) < 1) return null
        const layer = parseColor(style.backgroundColor)
        if (layer && layer.alpha > 0) background = composite(layer, background)
      }
      return background
    }
    const directText = (node: HTMLElement) =>
      [...node.childNodes]
        .filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

    const measured = new Map<string, ComputedContrastEvidence>()
    for (const node of document.querySelectorAll<HTMLElement>('body *')) {
      const sample = directText(node)
      if (!sample || node.getClientRects().length === 0 || node.closest('[aria-hidden="true"]')) {
        continue
      }
      const style = getComputedStyle(node)
      if (style.visibility !== 'visible' || style.display === 'none') continue
      const background = effectiveBackground(node)
      const rawForeground = parseColor(style.color)
      if (!background || !rawForeground) continue
      const foreground = composite(rawForeground, background)
      const fontSizePx = Number.parseFloat(style.fontSize)
      const numericWeight = Number.parseInt(style.fontWeight, 10)
      const fontWeight = Number.isFinite(numericWeight)
        ? numericWeight
        : style.fontWeight === 'bold'
          ? 700
          : 400
      const expectedContrastRatio =
        fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700) ? 3 : 4.5
      const evidence: ComputedContrastEvidence = {
        background: `rgba(${background.red.toFixed(1)}, ${background.green.toFixed(1)}, ${background.blue.toFixed(1)}, ${background.alpha.toFixed(3)})`,
        contrastRatio: contrastRatio(foreground, background),
        expectedContrastRatio,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        foreground: style.color,
        sample: sample.slice(0, 80),
      }
      const key = [
        evidence.foreground,
        evidence.background,
        evidence.fontSize,
        evidence.fontWeight,
        evidence.expectedContrastRatio,
      ].join('|')
      if (!measured.has(key)) measured.set(key, evidence)
    }
    return [...measured.values()]
  })
}

export async function applyTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => window.localStorage.setItem('theme', selectedTheme), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
}

export async function prepareSessionProfile(
  page: Page,
  routeEvidence: Pick<Story1743RouteEvidence, 'sessionProfile'>
) {
  if (routeEvidence.sessionProfile !== 'unauthenticated-onboarding') return

  await page.context().clearCookies()
  await page.addInitScript(() => {
    // Do not inspect persisted authentication data. These public onboarding
    // routes need an explicit empty session so their own UI is rendered rather
    // than racing useOnboardingGuard's existing-user redirect to /dashboard.
    window.localStorage.removeItem('auth-storage')
    window.localStorage.removeItem('auth-storage-event')
  })
}

export async function assertSettledRoute(
  page: Page,
  routeOrUrl: string | Pick<Story1743RouteEvidence, 'effectiveUrl' | 'routeIdentity' | 'route'>
): Promise<Locator> {
  const effectiveUrl = typeof routeOrUrl === 'string' ? routeOrUrl : routeOrUrl.effectiveUrl
  const identity = typeof routeOrUrl === 'string' ? undefined : routeOrUrl.routeIdentity
  const expectedPathnames =
    identity?.kind === 'redirector'
      ? Object.keys(identity.finalRoutes)
      : [new URL(effectiveUrl, 'http://localhost').pathname]
  const settledPath = expect.poll(() => new URL(page.url()).pathname, {
    message: `${effectiveUrl}: exact pathname remains mounted`,
    timeout: ROUTE_SETTLE_TIMEOUT,
  })
  if (identity?.kind === 'redirector') {
    const escapedPathnames = expectedPathnames.map(pathname =>
      pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    await settledPath.toMatch(new RegExp(`^(?:${escapedPathnames.join('|')})$`))
  } else {
    await settledPath.toBe(expectedPathnames[0])
  }
  const settledPathname = new URL(page.url()).pathname
  expect(expectedPathnames, `${effectiveUrl}: pathname is an explicitly allowed route`).toContain(
    settledPathname
  )
  await expect
    .poll(() => page.evaluate(() => document.readyState), {
      message: `${effectiveUrl}: document reaches a settled ready state`,
      timeout: ROUTE_SETTLE_TIMEOUT,
    })
    .toMatch(/^(?:interactive|complete)$/)
  await expect(page.locator('#next-error-h1, [data-nextjs-error-overlay]')).toHaveCount(0)

  const routeHeading = page.locator('h1:visible')
  await expect(routeHeading, `${effectiveUrl}: exactly one visible route identity`).toHaveCount(1, {
    timeout: ROUTE_SETTLE_TIMEOUT,
  })
  const initialIdentity = (await routeHeading.innerText()).trim()
  expect(initialIdentity, `${effectiveUrl}: route identity is non-empty`).not.toBe('')

  const fallbackEvidence = await page.locator('h1:visible, h2:visible').evaluateAll(nodes =>
    nodes.map(node => ({
      level: node.tagName.toLocaleLowerCase(),
      text: node.textContent?.trim() ?? '',
    }))
  )
  const genericFallback = fallbackEvidence.find(({ level, text }) => {
    if (!text) return false
    if (level === 'h1') {
      return (
        text === 'Страница не найдена' ||
        text === 'Произошла ошибка' ||
        text === 'Ошибка загрузки' ||
        text.startsWith('Не удалось загрузить') ||
        text.startsWith('Не удалось открыть')
      )
    }
    return text === 'Страница не найдена' || text === 'Произошла ошибка'
  })
  expect(
    genericFallback,
    `${effectiveUrl}: generic error/not-found shell is rejected`
  ).toBeUndefined()

  if (identity) {
    switch (identity.kind) {
      case 'static-h1':
      case 'materialized-h1':
        await expect(routeHeading, `${effectiveUrl}: exact route-specific h1`).toHaveText(
          identity.expectedText
        )
        break
      case 'backend-h1': {
        const backendHeading = page.locator(`${identity.selector}:visible`)
        await expect(
          backendHeading,
          `${effectiveUrl}: backend route identity landmark`
        ).toHaveCount(1)
        const backendText = (await backendHeading.innerText()).trim()
        expect(backendText, `${effectiveUrl}: backend route identity is meaningful`).toMatch(
          identity.expectedPattern
        )
        expect(
          identity.forbiddenTexts,
          `${effectiveUrl}: backend identity is not a fallback`
        ).not.toContain(backendText)
        break
      }
      case 'route-landmark': {
        const landmark = page.locator(`${identity.selector}:visible`).first()
        await expect(landmark, `${effectiveUrl}: route-owned identity landmark`).toBeVisible()
        const landmarkText = (await landmark.innerText()).replace(/\s+/g, ' ').trim()
        expect(landmarkText, `${effectiveUrl}: route-owned landmark names this route`).toContain(
          identity.expectedAccessibleName
        )
        expect(initialIdentity, `${effectiveUrl}: route heading is route-specific`).toMatch(
          identity.headingPattern
        )
        expect(identity.forbiddenTexts).not.toContain(initialIdentity)
        break
      }
      case 'redirector': {
        const expectedFinalHeading = identity.finalRoutes[settledPathname]
        expect(
          expectedFinalHeading,
          `${effectiveUrl}: redirect destination has identity`
        ).toBeTruthy()
        await expect(routeHeading, `${effectiveUrl}: redirect destination identity`).toHaveText(
          expectedFinalHeading
        )
        break
      }
    }
  }
  const verifiedIdentity = (await routeHeading.innerText()).trim()
  const settledIdentity = await routeHeading.evaluate(async node => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    return node.textContent?.trim() ?? ''
  })
  expect(settledIdentity, `${effectiveUrl}: verified route identity is stable after paint`).toBe(
    verifiedIdentity
  )
  return routeHeading
}

export async function assertReducedMotionIsApplied(page: Page, route: string) {
  const motionEvidence = await page.evaluate(() => {
    const milliseconds = (value: string) =>
      value.split(',').map(item => {
        const duration = item.trim()
        return duration.endsWith('ms')
          ? Number.parseFloat(duration)
          : Number.parseFloat(duration) * 1000
      })
    const visible = [...document.querySelectorAll<HTMLElement>('body *')].filter(
      node => node.getClientRects().length > 0
    )
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      maximumDurationMs: Math.max(
        0,
        ...visible.flatMap(node => {
          const style = getComputedStyle(node)
          return [
            ...milliseconds(style.animationDuration),
            ...milliseconds(style.transitionDuration),
          ]
        })
      ),
    }
  })
  expect(motionEvidence.mediaMatches, `${route}: reduced-motion media query`).toBe(true)
  expect(
    motionEvidence.maximumDurationMs,
    `${route}: visible animations/transitions are effectively disabled`
  ).toBeLessThanOrEqual(0.1)
}
