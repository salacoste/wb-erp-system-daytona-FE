import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures/network-test'
import {
  STORY_174_3_ROUTE_EVIDENCE,
  STORY_174_3_ROUTE_IDENTITIES,
  STORY_174_3_STATES,
  STORY_174_3_THEMES,
  STORY_174_3_WIDTHS,
} from './fixtures/story-174-3-visual-accessibility'
import { STORY_174_3_SURFACE_CONTRACTS } from './fixtures/story-174-3-surface-contracts'
import {
  EXPECTED_ROUTE_COUNT,
  MATRIX_HEIGHT,
  ROUTE_SETTLE_TIMEOUT,
  applyTheme,
  assertReducedMotionIsApplied,
  assertSettledRoute,
  evidenceSha256,
  measureComputedTextContrast,
  prepareSessionProfile,
  readEvidenceLine,
  summarizeAxeViolations,
} from './support/story-174-3-runner-core'
import type { ComputedContrastEvidence } from './support/story-174-3-runner-core'
import {
  assertKeyboardFocus,
  assertOverlayInventory,
  reachByKeyboard,
} from './support/story-174-3-runner-interactions'
import { assertSemanticDataSurfaces } from './support/story-174-3-runner-surfaces'

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
        expect(chart.alternative.association).toMatch(
          /^(?:explicit-accessible-name|shared-complete-data-table)$/
        )
        if (chart.alternative.association === 'shared-complete-data-table') {
          expect(chart.alternative.selector).toMatch(/^#[a-z0-9-]+$/)
          expect(chart.alternative.sharedSurfaceIds?.length).toBeGreaterThanOrEqual(2)
          expect(chart.alternative.sharedSurfaceIds).toContain(chart.id)
        }
      }
      for (const conditional of [
        ...surfaceContract.overlay.conditionalInventory,
        ...surfaceContract.table.conditionalSurfaces,
        ...surfaceContract.chart.conditionalSurfaces,
      ]) {
        expect(conditional.disposition).toBe('not-applicable-in-canonical-default')
        expect(conditional.rationale).toContain(row.route)
        if (conditional.verification.execution === 'owner-test') {
          expect(conditional.verification.runner).toMatch(/^(?:vitest|playwright)$/)
          expect(conditional.verification.source).not.toBe('')
          expect(conditional.verification.scenarioId).not.toBe('')
        } else {
          expect(conditional.verification.role).toMatch(/^(?:button|tab)$/)
          expect(conditional.verification.name).not.toBe('')
          expect(conditional.verification.restoreName).not.toBe('')
          expect(conditional.verification.activationKey).toBe('Enter')
        }
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
        if (
          stateEvidence.kind !== 'story-runner' ||
          process.env.STORY_174_3_RECORDING_DEFAULTS !== '1'
        ) {
          expect(stateEvidence.command).toContain(stateEvidence.source!)
        }
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

        const keyboardRoute =
          routeEvidence.routeIdentity.kind === 'redirector'
            ? new URL(page.url()).pathname
            : routeEvidence.route
        await assertKeyboardFocus(page, keyboardRoute, STORY_174_3_SURFACE_CONTRACTS[keyboardRoute])
        themeSignatures.push(
          await page.locator('html').evaluate(root => {
            const rootStyle = getComputedStyle(root)
            const bodyStyle = getComputedStyle(document.body)
            return JSON.stringify({
              colorScheme: rootStyle.colorScheme,
              rootBackground: rootStyle.backgroundColor,
              rootColor: rootStyle.color,
              bodyBackground: bodyStyle.backgroundColor,
              bodyColor: bodyStyle.color,
            })
          })
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
