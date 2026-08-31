import AxeBuilder from '@axe-core/playwright'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from './fixtures/network-test'
import type { Locator, Page } from './fixtures/network-test'
import {
  STORY_174_3_ROUTE_EVIDENCE,
  STORY_174_3_ROUTE_IDENTITIES,
  STORY_174_3_STATES,
  STORY_174_3_THEMES,
  STORY_174_3_WIDTHS,
} from './fixtures/story-174-3-visual-accessibility'
import { STORY_174_3_SURFACE_CONTRACTS } from './fixtures/story-174-3-surface-contracts'
import type { Story1743RouteSurfaceContract } from './fixtures/story-174-3-surface-contracts'
import type {
  Story1743RouteEvidence,
  Story1743RouteIdentity,
} from './fixtures/story-174-3-visual-accessibility'

const EXPECTED_ROUTE_COUNT = 76
const MATRIX_HEIGHT = 900
const ROUTE_SETTLE_TIMEOUT = 15_000
const REPOSITORY_ROOT = '.'

function summarizeAxeViolations(
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

function readEvidenceLine(source: string, line: number): string {
  return readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)[line - 1] ?? ''
}

function evidenceSha256(source: string): string {
  return createHash('sha256')
    .update(readFileSync(join(REPOSITORY_ROOT, source)))
    .digest('hex')
}

type ComputedContrastEvidence = {
  background: string
  contrastRatio: number
  expectedContrastRatio: number
  fontSize: string
  fontWeight: string
  foreground: string
  sample: string
}

async function measureComputedTextContrast(page: Page): Promise<ComputedContrastEvidence[]> {
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

async function applyTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => window.localStorage.setItem('theme', selectedTheme), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
}

async function prepareSessionProfile(
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

async function assertSettledRoute(
  page: Page,
  routeOrUrl: string | Pick<Story1743RouteEvidence, 'effectiveUrl' | 'routeIdentity' | 'route'>
): Promise<Locator> {
  const routeEvidence = typeof routeOrUrl === 'string' ? undefined : routeOrUrl
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

async function assertReducedMotionIsApplied(page: Page, route: string) {
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

async function assertKeyboardFocus(page: Page, route: string) {
  await page.keyboard.press('Escape')
  await page.evaluate(() => {
    document.documentElement.dataset.story1743LastKey = ''
    addEventListener(
      'keydown',
      event => {
        document.documentElement.dataset.story1743LastKey = event.key
      },
      { once: true }
    )
  })
  const interactive = page.locator(
    'a[href]:visible, button:visible, input:visible, select:visible, textarea:visible, [tabindex]:visible'
  )
  const isRouteOwnedControl = (node: Element) => {
    const identity = [node.getAttribute('aria-label'), node.getAttribute('title'), node.textContent]
      .filter(Boolean)
      .join(' ')
    return (
      !node.closest('nextjs-portal') &&
      !/Open Tanstack query devtools|Open Next\.js Dev Tools|Open issues overlay|Collapse issues badge/i.test(
        identity
      )
    )
  }
  const routeOwnedControlCount = await interactive.evaluateAll(
    nodes =>
      nodes.filter(node => {
        const identity = [
          node.getAttribute('aria-label'),
          node.getAttribute('title'),
          node.textContent,
        ]
          .filter(Boolean)
          .join(' ')
        return (
          !node.closest('nextjs-portal') &&
          !/Open Tanstack query devtools|Open Next\.js Dev Tools|Open issues overlay|Collapse issues badge/i.test(
            identity
          )
        )
      }).length
  )
  if (routeOwnedControlCount === 0) {
    await page.keyboard.press('Tab')
    await expect(page.locator('html')).toHaveAttribute('data-story1743-last-key', 'Tab')
    return
  }

  let foundVisibleFocus = false
  for (let attempt = 0; attempt < 20 && !foundVisibleFocus; attempt += 1) {
    await page.keyboard.press('Tab')
    const candidate = page.locator(':focus:visible').first()
    foundVisibleFocus =
      (await candidate.count()) > 0 && (await candidate.evaluate(isRouteOwnedControl))
  }
  await expect(page.locator('html')).toHaveAttribute('data-story1743-last-key', 'Tab')
  expect(foundVisibleFocus, `${route}: route-owned controls are keyboard reachable`).toBe(true)
  const focused = page.locator(':focus:visible').first()
  await expect(focused, `${route}: Tab produces a visible focus target`).toBeVisible()
  const focusEvidence = await focused.evaluate(async node => {
    const snapshot = () => {
      const style = getComputedStyle(node)
      return {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        boxShadow: style.boxShadow,
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      }
    }
    const focusedStyle = snapshot()
    const keyboardVisible = node.matches(':focus-visible')
    ;(node as HTMLElement).blur()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    const unfocusedStyle = snapshot()
    return {
      keyboardVisible,
      focusedStyle,
      hasFocusSpecificStyle: JSON.stringify(focusedStyle) !== JSON.stringify(unfocusedStyle),
    }
  })
  expect(focusEvidence.keyboardVisible, `${route}: focus is keyboard-derived`).toBe(true)
  expect(
    (focusEvidence.focusedStyle.outlineStyle !== 'none' &&
      focusEvidence.focusedStyle.outlineWidth > 0) ||
      focusEvidence.focusedStyle.boxShadow !== 'none' ||
      focusEvidence.hasFocusSpecificStyle,
    `${route}: keyboard focus has a visible indicator`
  ).toBe(true)
}

async function reachByKeyboard(page: Page, target: Locator, maximumTabs = 40) {
  for (let attempt = 0; attempt < maximumTabs; attempt += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate(node => node === document.activeElement)) return
  }
  throw new Error(`Keyboard traversal did not reach target after ${maximumTabs} Tab presses`)
}

async function assertOverlayInventory(
  page: Page,
  route: string,
  contract: Story1743RouteSurfaceContract,
  width: number
) {
  expect(contract.overlay.disposition).toBe('executed')
  expect(contract.overlay.inventory, contract.overlay.rationale).toHaveLength(
    contract.overlay.expectedCount
  )
  if (width !== 390) return

  for (const overlay of contract.overlay.inventory) {
    const escapedName = overlay.trigger.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const name =
      overlay.trigger.match === 'prefix'
        ? new RegExp(`^${escapedName}`)
        : overlay.trigger.match === 'contains'
          ? new RegExp(escapedName)
          : overlay.trigger.name
    const trigger = page.getByRole(overlay.trigger.role, { name })
    const assertionMessage = `${route}: ${overlay.id} closed-by-default ${overlay.archetype} retains its route-owned trigger`
    if (overlay.trigger.cardinality === 'one-or-more') {
      expect(await trigger.count(), assertionMessage).toBeGreaterThan(0)
      await expect(trigger.first()).toBeVisible()
    } else {
      await expect(trigger, assertionMessage).toHaveCount(1)
      await expect(trigger).toBeVisible()
    }
  }
}

async function assertSemanticDataSurfaces(
  page: Page,
  route: string,
  contract: Story1743RouteSurfaceContract,
  width: number
) {
  expect(contract.route).toBe(route)
  const expectedTableSurfaces = contract.table.surfaces.filter(
    surface => width !== 390 || surface.narrowWidthDisposition.disposition === 'executed'
  )
  if (expectedTableSurfaces.length > 0 || contract.chart.expectedCount > 0) {
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const visible = (node: Element) => node.getClientRects().length > 0
            const tableCount = [...document.querySelectorAll('table, [role="table"]')]
              .filter(
                table =>
                  !table.matches('[data-chart-summary]') &&
                  !table.matches('table.sr-only') &&
                  !table.closest('[data-chart-alternative], [data-chart-evidence]')
              )
              .filter(visible).length
            const chartCount = [
              ...document.querySelectorAll(
                '[role="img"]:has(svg.recharts-surface), [role="img"][aria-label*="График"], [role="img"][aria-label*="Диаграмма"]'
              ),
            ].filter(visible).length
            return { tableCount, chartCount }
          }),
        {
          message: `${route}: required live data surfaces finish loading`,
          timeout: 20_000,
        }
      )
      .toEqual({
        tableCount: expectedTableSurfaces.length,
        chartCount: contract.chart.expectedCount,
      })
  }
  const dataEvidence = await page.evaluate(() => {
    const visible = (node: Element) => node.getClientRects().length > 0
    const accessibleName = (node: Element) => {
      const labelledBy = node.getAttribute('aria-labelledby')
      return (
        node.getAttribute('aria-label')?.trim() ||
        (labelledBy
          ? labelledBy
              .split(/\s+/)
              .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
              .join(' ')
              .trim()
          : '') ||
        node.querySelector('caption')?.textContent?.trim() ||
        ''
      )
    }
    const interactiveName = (node: Element) =>
      accessibleName(node) || node.textContent?.trim() || node.getAttribute('title')?.trim() || ''
    const cellSemanticValue = (cell: Element) => {
      const formControl = cell.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input:not([type="hidden"]), select'
      )
      return (
        cell.textContent?.trim() ||
        formControl?.value?.trim() ||
        (formControl ? accessibleName(formControl) : '')
      )
    }
    const tables = [...document.querySelectorAll('table, [role="table"]')]
      .filter(
        table =>
          !table.matches('[data-chart-summary]') &&
          !table.matches('table.sr-only') &&
          !table.closest('[data-chart-alternative], [data-chart-evidence]')
      )
      .filter(visible)
      .map(table => {
        const headers = [...table.querySelectorAll('thead th, [role="columnheader"]')]
        const rows = [...table.querySelectorAll('tbody tr, [role="row"]')].filter(row =>
          Boolean(row.querySelector('td, th[scope="row"], [role="cell"], [role="gridcell"]'))
        )
        const cells = [...table.querySelectorAll('td, [role="cell"], [role="gridcell"]')]
        const identityColumn = headers.findIndex(header => Boolean(header.textContent?.trim()))
        const identityCells = rows
          .map(
            row =>
              row.querySelector('th[scope="row"], [role="rowheader"]') ??
              row.querySelectorAll('td, [role="cell"], [role="gridcell"]')[identityColumn]
          )
          .filter((cell): cell is Element => Boolean(cell))
        const numericCells = cells.filter(cell =>
          /^[-+]?\d[\d\s.,]*(?:\s*(?:₽|%|шт\.?|дн\.?))?$/.test(cellSemanticValue(cell) ?? '')
        )
        const numericAlignmentByColumn = numericCells.reduce<Record<string, Set<string>>>(
          (groups, cell) => {
            const column = String([...cell.parentElement!.children].indexOf(cell))
            ;(groups[column] ??= new Set()).add(getComputedStyle(cell).textAlign)
            return groups
          },
          {}
        )
        const interactive = [...table.querySelectorAll('button, a[href], input, select')]
          .filter(visible)
          .filter(
            node =>
              !node.matches('input[aria-hidden="true"], input[type="hidden"], input[tabindex="-1"]')
          )
        const scrollContainer = (() => {
          let candidate = table.parentElement
          while (candidate && candidate !== document.body) {
            if (['auto', 'scroll'].includes(getComputedStyle(candidate).overflowX)) return candidate
            candidate = candidate.parentElement
          }
          return null
        })()
        const box = table.getBoundingClientRect()
        return {
          name: accessibleName(table),
          headerCount: headers.length,
          dataCellCount: cells.length,
          identityHeader: headers[identityColumn]?.textContent?.trim() ?? '',
          emptyIdentityCellCount: identityCells.filter(cell => !cellSemanticValue(cell)).length,
          numericCellCount: numericCells.length,
          numericAlignmentVariantCounts: Object.values(numericAlignmentByColumn).map(
            set => set.size
          ),
          invalidNumericCellCount: numericCells.filter(cell =>
            /NaN|Infinity/.test(cellSemanticValue(cell) ?? '')
          ).length,
          sortControlCount: table.querySelectorAll(
            'th button, [role="columnheader"] button, [aria-sort]'
          ).length,
          unnamedInteractiveCount: interactive.filter(node => !interactiveName(node)).length,
          virtualized:
            table.hasAttribute('aria-rowcount') || Boolean(table.closest('[data-virtualized]')),
          rowCount: rows.length,
          ariaRowCount: Number(table.getAttribute('aria-rowcount') ?? '0'),
          narrowContained:
            box.left >= -2 &&
            (box.right <= document.documentElement.clientWidth + 2 || Boolean(scrollContainer)),
        }
      })
    const chartContainers = [
      ...document.querySelectorAll(
        '[role="img"]:has(svg.recharts-surface), [role="img"][aria-label*="График"], [role="img"][aria-label*="Диаграмма"]'
      ),
    ].filter(visible)
    const charts = [...new Set(chartContainers)].map(container => {
      const chart = container.querySelector('svg.recharts-surface, canvas[data-chart]') ?? container
      const legendNodes = [
        ...(container?.querySelectorAll(
          '.recharts-legend-item-text, [aria-label*="legend" i], [data-chart-legend]'
        ) ?? []),
      ]
      const box = chart.getBoundingClientRect()
      return {
        chartClasses: chart.getAttribute('class') ?? '',
        containerClasses: container?.getAttribute('class') ?? '',
        containerTag: container?.tagName.toLocaleLowerCase() ?? '',
        name: accessibleName(container ?? chart),
        legendCount: legendNodes.length,
        unnamedLegendCount: legendNodes.filter(
          node => !(accessibleName(node) || node.textContent?.trim())
        ).length,
        responsiveContained:
          box.left >= -2 && box.right <= document.documentElement.clientWidth + 2,
      }
    })
    const alternatives = [
      ...new Set(
        document.querySelectorAll(
          '[data-chart-summary], [data-chart-alternative], table.sr-only:has(> caption), table[aria-label], table:has(> caption), [role="table"][aria-label]'
        )
      ),
    ]
      .filter(visible)
      .map(alternative => ({
        name: accessibleName(alternative),
        headerCount: alternative.querySelectorAll('th, [role="columnheader"], [role="rowheader"]')
          .length,
        dataCellCount: alternative.querySelectorAll('td, [role="cell"], [role="gridcell"]').length,
      }))
    return { tables, charts, alternatives }
  })

  expect(dataEvidence.tables, contract.table.emptyRationale).toHaveLength(
    expectedTableSurfaces.length
  )
  expect(dataEvidence.charts, contract.chart.emptyRationale).toHaveLength(
    contract.chart.expectedCount
  )

  for (const expectedSurface of expectedTableSurfaces) {
    const matchingTables = dataEvidence.tables.filter(table =>
      table.name.startsWith(expectedSurface.accessibleName)
    )
    expect(
      matchingTables,
      `${route}: ${expectedSurface.id} resolves exactly once through ${expectedSurface.selector}`
    ).toHaveLength(1)
    const table = matchingTables[0]!
    expect(
      table.name.startsWith(expectedSurface.accessibleName),
      `${route}: ${expectedSurface.id} matches stable semantic selector ${expectedSurface.selector}`
    ).toBe(true)
    expect(table.name, `${route}: ${expectedSurface.id} has a caption or accessible name`).not.toBe(
      ''
    )
    expect(
      table.headerCount,
      `${route}: ${expectedSurface.id} exposes semantic headers`
    ).toBeGreaterThan(0)
    expect(
      table.dataCellCount,
      `${route}: ${expectedSurface.id} exposes data cells in its rendered state`
    ).toBeGreaterThan(0)
    expect(
      table.identityHeader,
      `${route}: ${expectedSurface.id} declares an identity column`
    ).not.toBe('')
    expect(table.emptyIdentityCellCount, `${route}: ${expectedSurface.id} identity values`).toBe(0)
    expect(table.invalidNumericCellCount, `${route}: ${expectedSurface.id} numeric precision`).toBe(
      0
    )
    expect(
      table.numericAlignmentVariantCounts.every(count => count === 1),
      `${route}: ${expectedSurface.id} numeric alignment is column-consistent`
    ).toBe(true)
    if (expectedSurface.features['numeric-alignment-and-precision'].disposition === 'executed') {
      expect(
        table.numericCellCount,
        `${route}: ${expectedSurface.id} executes numeric precision evidence`
      ).toBeGreaterThan(0)
    }
    if (expectedSurface.features.sorting.disposition === 'executed') {
      expect(
        table.sortControlCount,
        `${route}: ${expectedSurface.id} executes sorting evidence`
      ).toBeGreaterThan(0)
    }
    expect(table.unnamedInteractiveCount, `${route}: ${expectedSurface.id} actions are named`).toBe(
      0
    )
    if (table.virtualized) {
      expect(
        table.ariaRowCount,
        `${route}: ${expectedSurface.id} virtual row count`
      ).toBeGreaterThanOrEqual(table.rowCount)
    }
    if (width === 390) {
      expect(table.narrowContained, `${route}: ${expectedSurface.id} narrow-width strategy`).toBe(
        true
      )
    }
  }
  for (const expectedSurface of contract.chart.surfaces) {
    const matchingCharts = dataEvidence.charts.filter(chart =>
      chart.name.startsWith(expectedSurface.accessibleName)
    )
    expect(
      matchingCharts,
      `${route}: ${expectedSurface.id} resolves exactly once through ${expectedSurface.selector}`
    ).toHaveLength(1)
    const chart = matchingCharts[0]!
    expect(
      chart.name.startsWith(expectedSurface.accessibleName),
      `${route}: ${expectedSurface.id} matches stable semantic selector ${expectedSurface.selector}`
    ).toBe(true)
    expect(chart.name, `${route}: ${expectedSurface.id} has an accessible name`).not.toBe('')
    const alternatives = dataEvidence.alternatives.filter(alternative =>
      alternative.name.startsWith(expectedSurface.alternative.accessibleName)
    )
    expect(
      alternatives.length,
      `${route}: ${expectedSurface.id} has a stable explicit-accessible-name association to ${expectedSurface.alternative.selector}`
    ).toBeGreaterThan(0)
    const alternative = alternatives[0]!
    expect(
      alternative.headerCount,
      `${route}: ${expectedSurface.id} alternative has headers`
    ).toBeGreaterThan(0)
    expect(
      alternative.dataCellCount,
      `${route}: ${expectedSurface.id} alternative has data`
    ).toBeGreaterThan(0)
    expect(chart.unnamedLegendCount, `${route}: ${expectedSurface.id} legend meaning`).toBe(0)
    expect(
      chart.responsiveContained,
      `${route}: ${expectedSurface.id} responsive containment`
    ).toBe(true)
  }
}

test.describe('Story 174.3 inclusive visual and accessibility matrix', () => {
  test.describe.configure({ mode: 'parallel' })
  test.setTimeout(120_000)

  test('registry matches all 76 ledger routes with one canonical lifecycle state', async () => {
    expect(STORY_174_3_ROUTE_EVIDENCE).toHaveLength(EXPECTED_ROUTE_COUNT)
    expect(Object.keys(STORY_174_3_ROUTE_IDENTITIES)).toHaveLength(EXPECTED_ROUTE_COUNT)
    expect(Object.keys(STORY_174_3_SURFACE_CONTRACTS)).toHaveLength(EXPECTED_ROUTE_COUNT)
    expect(new Set(STORY_174_3_ROUTE_EVIDENCE.map(row => row.story)).size).toBe(
      EXPECTED_ROUTE_COUNT
    )
    expect(new Set(STORY_174_3_ROUTE_EVIDENCE.map(row => row.route)).size).toBe(
      EXPECTED_ROUTE_COUNT
    )
    expect(new Set(STORY_174_3_ROUTE_EVIDENCE.map(row => row.entry)).size).toBe(
      EXPECTED_ROUTE_COUNT
    )
    const ledgerStatuses = new Set(STORY_174_3_ROUTE_EVIDENCE.map(row => row.ledgerStatus))
    expect(ledgerStatuses.size).toBe(1)
    expect([...ledgerStatuses][0]).toMatch(/^(?:planned|verified)$/)
    for (const row of STORY_174_3_ROUTE_EVIDENCE) {
      const surfaceContract = STORY_174_3_SURFACE_CONTRACTS[row.route]
      expect(surfaceContract?.route).toBe(row.route)
      expect(surfaceContract.table.expectedCount).toBe(surfaceContract.table.surfaces.length)
      expect(surfaceContract.chart.expectedCount).toBe(surfaceContract.chart.surfaces.length)
      expect(surfaceContract.overlay.expectedCount).toBe(surfaceContract.overlay.inventory.length)
      expect(surfaceContract.overlay.evidenceSource).toBe(row.entry)
      for (const table of surfaceContract.table.surfaces) {
        expect(Object.keys(table.features)).toHaveLength(8)
      }
      for (const chart of surfaceContract.chart.surfaces) {
        expect(Object.keys(chart.features)).toHaveLength(7)
        expect(chart.alternative.association).toBe('explicit-accessible-name')
      }
      for (const conditional of [
        ...surfaceContract.overlay.conditionalInventory,
        ...surfaceContract.table.conditionalSurfaces,
        ...surfaceContract.chart.conditionalSurfaces,
      ]) {
        expect(conditional.disposition).toBe('not-applicable-in-canonical-default')
        expect(conditional.rationale).toContain(row.route)
      }
      expect(STORY_174_3_ROUTE_IDENTITIES[row.route]).toEqual(row.routeIdentity)
      expect(row.effectiveUrl).not.toMatch(/\[[^\]]+\]/)
      expect(row.states.length).toBeGreaterThan(0)
      expect(row.states.every(state => STORY_174_3_STATES.includes(state))).toBe(true)
      expect(row.ownerArtifact).toMatch(
        new RegExp(`^_bmad-output/implementation-artifacts/${row.story.replace('.', '-')}-fe-`)
      )
      expect(row.browserEvidence).toMatch(/^e2e\/.+\.spec\.ts$/)
      expect([row.browserEvidence, row.ownerArtifact]).toContain(row.routeIdentityEvidence.source)
      expect(row.routeIdentityEvidence.line).toBeGreaterThan(0)
      expect(
        readEvidenceLine(row.routeIdentityEvidence.source, row.routeIdentityEvidence.line)
          .toLocaleLowerCase()
          .includes(row.routeIdentityEvidence.matchedToken)
      ).toBe(true)
      expect(row.stateEvidence.map(evidence => evidence.state)).toEqual(STORY_174_3_STATES)
      expect(
        row.stateEvidence
          .filter(evidence => evidence.disposition === 'executed')
          .map(evidence => evidence.state)
      ).toEqual(row.states)
      for (const stateEvidence of row.stateEvidence) {
        expect(stateEvidence.route).toBe(row.route)
        expect(stateEvidence.rationale).toContain(row.route)
        if (stateEvidence.disposition === 'not-applicable') {
          expect(stateEvidence.source).toBeUndefined()
          expect(stateEvidence.scenarioId).toBeUndefined()
          expect(stateEvidence.declarationSource).toMatch(/^e2e\/.+\.ts$/)
          expect(stateEvidence.declarationSha256).toBe(
            evidenceSha256(stateEvidence.declarationSource!)
          )
          expect(stateEvidence.declarationLine).toBeGreaterThan(0)
          expect(stateEvidence.declarationId).toBe(
            `${row.route}:${stateEvidence.state}:not-applicable`
          )
          continue
        }
        expect(stateEvidence.disposition).not.toBe('blocked')
        expect(stateEvidence.result).toBe('passed')
        expect(stateEvidence.source).toMatch(/^(?:e2e|src)\/.+\.(?:test|spec)\.(?:ts|tsx)$/)
        expect(stateEvidence.sourceSha256).toBe(evidenceSha256(stateEvidence.source!))
        expect(stateEvidence.command).toContain(stateEvidence.source!)
        expect(stateEvidence.scenarioId).toBeTruthy()
        if (stateEvidence.kind !== 'story-runner') {
          expect(stateEvidence.line).toBeGreaterThan(0)
          expect(readEvidenceLine(stateEvidence.source!, stateEvidence.line!)).toContain(
            stateEvidence.scenarioId
          )
        }
      }
      expect(row.screenshotDisposition).toBe('privacy-safe-dom-equivalent')
      expect(row.manualAtDisposition).toBe('environment-gap-real-at')
    }
  })

  test('representative mobile overlay traps and restores keyboard focus in both themes', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: MATRIX_HEIGHT })

    for (const theme of STORY_174_3_THEMES) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await applyTheme(page, theme)
      await assertSettledRoute(page, '/dashboard')

      const trigger = page.locator('button[aria-label="Open menu"]')
      await expect(trigger).toBeVisible()
      await reachByKeyboard(page, trigger)
      await expect(trigger).toBeFocused()
      for (const activationKey of ['Enter', 'Space'] as const) {
        await page.keyboard.press(activationKey)

        const dialog = page.locator('[role="dialog"][data-state="open"]')
        await expect(dialog).toBeVisible({ timeout: ROUTE_SETTLE_TIMEOUT })
        await expect
          .poll(() => dialog.evaluate(node => node.contains(document.activeElement)), {
            message: `${theme}/${activationKey}: overlay receives focus on keyboard open`,
          })
          .toBe(true)
        await page.keyboard.press('Tab')
        expect(
          await dialog.evaluate(node => node.contains(document.activeElement)),
          `${theme}/${activationKey}: overlay contains forward Tab focus`
        ).toBe(true)
        await page.keyboard.press('Shift+Tab')
        expect(
          await dialog.evaluate(node => node.contains(document.activeElement)),
          `${theme}/${activationKey}: overlay contains reverse Shift+Tab focus`
        ).toBe(true)

        const box = await dialog.boundingBox()
        expect(
          box,
          `${theme}/${activationKey}: overlay has measurable mobile geometry`
        ).not.toBeNull()
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390)

        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(
          trigger,
          `${theme}/${activationKey}: overlay restores focus to its trigger`
        ).toBeFocused()
      }
    }
  })

  test('representative non-modal popover supports keyboard open and close without a modal-trap claim', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: MATRIX_HEIGHT })
    await page.goto('/analytics/funnel', { waitUntil: 'domcontentloaded' })
    const routeEvidence = STORY_174_3_ROUTE_EVIDENCE.find(row => row.route === '/analytics/funnel')!
    const contract = STORY_174_3_SURFACE_CONTRACTS['/analytics/funnel'].overlay
    const productFilter = contract.inventory.find(overlay => overlay.id === 'product-filter')
    expect(
      productFilter,
      'The /analytics/funnel product-filter inventory is executable'
    ).toBeTruthy()
    expect(productFilter?.archetype).toBe('non-modal-popover')

    for (const theme of STORY_174_3_THEMES) {
      await applyTheme(page, theme)
      await assertSettledRoute(page, routeEvidence)
      const trigger = page.getByRole('combobox', { name: productFilter!.trigger.name })
      await reachByKeyboard(page, trigger)
      await page.keyboard.press('Enter')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const search = page.getByPlaceholder('Поиск по названию, бренду или nmId...')
      const popover = search.locator('xpath=ancestor::*[@data-state="open"][1]')
      await expect(popover, `${theme}: actual Popover content is visible`).toBeVisible()
      expect(
        await popover.evaluate(
          (node, triggerElement) => {
            const active = document.activeElement
            return node.contains(active) || active === triggerElement
          },
          await trigger.elementHandle()
        ),
        `${theme}: Popover opens with an intentional trigger/content focus target`
      ).toBe(true)
      await page.keyboard.press('Tab')
      expect(
        await popover.evaluate(node => node.contains(document.activeElement)),
        `${theme}: forward keyboard navigation enters the Popover content`
      ).toBe(true)
      await page.keyboard.press('Escape')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger, `${theme}: Popover returns focus to its trigger`).toBeFocused()
    }
  })

  for (const routeEvidence of STORY_174_3_ROUTE_EVIDENCE) {
    test(`${routeEvidence.story} ${routeEvidence.route} has privacy-safe width/theme/axe/focus evidence`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await prepareSessionProfile(page, routeEvidence)
      await page.goto(routeEvidence.effectiveUrl, { waitUntil: 'domcontentloaded' })
      let routeHeading = await assertSettledRoute(page, routeEvidence)

      const main = page.locator('main').first()
      const hasMain = (await main.count()) > 0
      const surface = hasMain ? main : page.locator('body')
      await expect(surface).toBeVisible()
      const themeSignatures: string[] = []

      for (const theme of STORY_174_3_THEMES) {
        await applyTheme(page, theme)
        routeHeading = await assertSettledRoute(page, routeEvidence)
        await expect(surface).toBeVisible()

        for (const width of STORY_174_3_WIDTHS) {
          await page.setViewportSize({ width, height: MATRIX_HEIGHT })

          const visualEvidence = await surface.evaluate(node => {
            const root = document.documentElement
            const style = getComputedStyle(node)
            const headings = [...node.querySelectorAll('h1')].filter(
              candidate => candidate.getClientRects().length > 0
            )
            const heading = headings[0]
            const firstDataSurface = node.querySelector('table, [role="table"], [role="img"]')
            return {
              backgroundColor: style.backgroundColor,
              color: style.color,
              documentClientWidth: root.clientWidth,
              documentScrollWidth: root.scrollWidth,
              hasLogicalHeadingOrder:
                headings.length === 1 &&
                (!firstDataSurface ||
                  Boolean(
                    heading.compareDocumentPosition(firstDataSurface) &
                    Node.DOCUMENT_POSITION_FOLLOWING
                  )),
              reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
              surfaceLeft: node.getBoundingClientRect().left,
              surfaceRight: node.getBoundingClientRect().right,
              surfaceClientWidth: node.clientWidth,
              surfaceScrollWidth: node.scrollWidth,
              themeColorScheme: getComputedStyle(root).colorScheme,
            }
          })

          expect(visualEvidence.reducedMotion).toBe(true)
          expect(visualEvidence.themeColorScheme).toContain(theme)
          if (visualEvidence.documentScrollWidth > visualEvidence.documentClientWidth + 2) {
            const overflowSources = await page.evaluate(() =>
              [...document.querySelectorAll<HTMLElement>('body *')]
                .map(node => {
                  const box = node.getBoundingClientRect()
                  return {
                    selector: `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}${[
                      ...node.classList,
                    ]
                      .slice(0, 4)
                      .map(name => `.${name.replaceAll(':', '\\:')}`)
                      .join('')}`,
                    left: Math.round(box.left),
                    right: Math.round(box.right),
                    width: Math.round(box.width),
                  }
                })
                .filter(
                  box => box.left < -2 || box.right > document.documentElement.clientWidth + 2
                )
                .sort((left, right) => right.width - left.width)
                .slice(0, 8)
            )
            expect(
              visualEvidence.documentScrollWidth,
              `${routeEvidence.route}: ${width}px overflow sources ${JSON.stringify(overflowSources)}`
            ).toBeLessThanOrEqual(visualEvidence.documentClientWidth + 2)
          }
          expect(visualEvidence.surfaceLeft).toBeGreaterThanOrEqual(-2)
          expect(visualEvidence.surfaceRight).toBeLessThanOrEqual(width + 2)
          expect(visualEvidence.hasLogicalHeadingOrder).toBe(true)
          expect(visualEvidence.color).toMatch(/^(?:rgba?|color|oklab|oklch)\(/)
          expect(visualEvidence.backgroundColor).toMatch(/^(?:rgba?|color|oklab|oklch)\(/)

          if (width === 390 || width === 1280) {
            const axeResults = await new AxeBuilder({ page })
              .include('body')
              .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
              .analyze()
            const violationTargets = axeResults.violations.flatMap(violation =>
              violation.nodes.flatMap(node =>
                Array.isArray(node.target)
                  ? node.target.filter((target): target is string => typeof target === 'string')
                  : []
              )
            )
            const targetStyles = await page.evaluate(selectors => {
              return selectors.map(selector => {
                const node = document.querySelector<HTMLElement>(selector)
                const parent = node?.parentElement
                const style = node ? getComputedStyle(node) : null
                const parentStyle = parent ? getComputedStyle(parent) : null
                return {
                  selector,
                  tag: node?.tagName.toLocaleLowerCase() ?? null,
                  classes: node ? [...node.classList] : [],
                  parentTag: parent?.tagName.toLocaleLowerCase() ?? null,
                  parentClasses: parent ? [...parent.classList] : [],
                  role: node?.getAttribute('role') ?? null,
                  color: style?.color ?? null,
                  backgroundColor: style?.backgroundColor ?? null,
                  parentBackgroundColor: parentStyle?.backgroundColor ?? null,
                }
              })
            }, violationTargets)
            expect(
              summarizeAxeViolations(axeResults.violations),
              `${routeEvidence.route}: axe in ${theme} at ${width}px; target styles ${JSON.stringify(targetStyles)}`
            ).toEqual([])
            const contrastEvidence = axeResults.passes
              .filter(result => result.id === 'color-contrast')
              .flatMap(result =>
                result.nodes.flatMap(node =>
                  node.any.map(
                    check =>
                      check.data as {
                        contrastRatio?: number
                        expectedContrastRatio?: number | string
                        fontSize?: string
                        fontWeight?: string
                      }
                  )
                )
              )
              .filter(
                evidence =>
                  typeof evidence.contrastRatio === 'number' &&
                  ['number', 'string'].includes(typeof evidence.expectedContrastRatio)
              )
            const computedContrastEvidence =
              contrastEvidence.length === 0 ? await measureComputedTextContrast(page) : []
            const measuredContrastEvidence =
              contrastEvidence.length > 0 ? contrastEvidence : computedContrastEvidence
            expect(
              measuredContrastEvidence.length,
              `${routeEvidence.route}: axe or computed-style fallback exposes measured text contrast in ${theme} at ${width}px`
            ).toBeGreaterThan(0)
            for (const evidence of measuredContrastEvidence) {
              const computedDetail =
                'sample' in evidence
                  ? ` for “${String(evidence.sample)}” (${(evidence as ComputedContrastEvidence).foreground} on ${(evidence as ComputedContrastEvidence).background})`
                  : ''
              expect(
                evidence.contrastRatio,
                `${routeEvidence.route}: ${theme}/${width}px ${evidence.fontSize}/${evidence.fontWeight} contrast${computedDetail}`
              ).toBeGreaterThanOrEqual(
                Number.parseFloat(String(evidence.expectedContrastRatio ?? '4.5'))
              )
            }
            await assertReducedMotionIsApplied(page, routeEvidence.route)
            const contractRoute =
              routeEvidence.routeIdentity.kind === 'redirector'
                ? new URL(page.url()).pathname
                : routeEvidence.route
            const activeSurfaceContract = STORY_174_3_SURFACE_CONTRACTS[contractRoute]
            expect(
              activeSurfaceContract,
              `${routeEvidence.route}: settled route ${contractRoute} has a canonical surface contract`
            ).toBeTruthy()
            await assertOverlayInventory(page, contractRoute, activeSurfaceContract, width)
            await assertSemanticDataSurfaces(page, contractRoute, activeSurfaceContract, width)
          }
        }

        await assertKeyboardFocus(page, routeEvidence.route)
        themeSignatures.push(
          await page.locator('html').evaluate((root, selectedTheme) => {
            const rootStyle = getComputedStyle(root)
            const bodyStyle = getComputedStyle(document.body)
            return JSON.stringify({
              selectedTheme,
              colorScheme: rootStyle.colorScheme,
              rootBackground: rootStyle.backgroundColor,
              rootColor: rootStyle.color,
              bodyBackground: bodyStyle.backgroundColor,
              bodyColor: bodyStyle.color,
            })
          }, theme)
        )
      }
      expect(
        new Set(themeSignatures).size,
        `${routeEvidence.route}: themes change computed tokens`
      ).toBe(STORY_174_3_THEMES.length)

      await page.setViewportSize({ width: 720, height: MATRIX_HEIGHT })
      const unzoomedHeadingHeight = await routeHeading.evaluate(
        node => node.getBoundingClientRect().height
      )
      await page.evaluate(() => {
        document.documentElement.style.zoom = '200%'
      })
      const zoomEvidence = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        headingHeight: document.querySelector('h1')?.getBoundingClientRect().height ?? 0,
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        zoom: getComputedStyle(document.documentElement).zoom,
      }))
      expect(zoomEvidence.zoom).toBe('2')
      expect(zoomEvidence.headingHeight).toBeGreaterThan(unzoomedHeadingHeight * 1.5)
      expect(zoomEvidence.innerWidth).toBe(720)
      expect(zoomEvidence.scrollWidth).toBeLessThanOrEqual(zoomEvidence.clientWidth + 2)
    })
  }
})
