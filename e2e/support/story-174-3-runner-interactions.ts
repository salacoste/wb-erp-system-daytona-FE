import { expect } from '../fixtures/network-test'
import type { Locator, Page } from '../fixtures/network-test'
import type { Story1743RouteSurfaceContract } from '../fixtures/story-174-3-surface-contracts'
import { ROUTE_SETTLE_TIMEOUT } from './story-174-3-runner-core'

export async function assertKeyboardFocus(
  page: Page,
  route: string,
  contract: Story1743RouteSurfaceContract
) {
  await page.keyboard.press('Escape')
  expect(contract.keyboard.surface).toBe('main-or-route-body')
  const main = page.locator('main:visible').first()
  const routeSurface = (await main.count()) > 0 ? main : page.locator('body')
  const interactive = routeSurface.locator(
    [
      'a[href]:visible',
      'button:visible',
      'input:visible:not([aria-hidden="true"]):not([type="hidden"]):not([tabindex="-1"])',
      'select:visible',
      'textarea:visible',
      '[contenteditable="true"]:visible',
      '[role="checkbox"]:visible',
      '[role="combobox"]:visible',
      '[role="menuitem"]:visible',
      '[role="radio"]:visible',
      '[role="switch"]:visible',
      '[role="tab"]:visible',
    ].join(', ')
  )
  const isRouteOwnedControl = (node: Element) => {
    const identity = [node.getAttribute('aria-label'), node.getAttribute('title'), node.textContent]
      .filter(Boolean)
      .join(' ')
    return Boolean(
      !node.closest('nextjs-portal') &&
      !node.closest('header, nav, aside, [data-sidebar]') &&
      !(node as HTMLElement).matches(':disabled, [aria-disabled="true"]') &&
      (node as HTMLElement).tabIndex >= 0 &&
      !/Open Tanstack query devtools|Open Next\.js Dev Tools|Open issues overlay|Collapse issues badge/i.test(
        identity
      )
    )
  }
  const countRouteOwnedControls = () =>
    interactive.evaluateAll(
      nodes =>
        nodes.filter(node => {
          const identity = [
            node.getAttribute('aria-label'),
            node.getAttribute('title'),
            node.textContent,
          ]
            .filter(Boolean)
            .join(' ')
          return Boolean(
            !node.closest('nextjs-portal') &&
            !node.closest('header, nav, aside, [data-sidebar]') &&
            !(node as HTMLElement).matches(':disabled, [aria-disabled="true"]') &&
            (node as HTMLElement).tabIndex >= 0 &&
            !/Open Tanstack query devtools|Open Next\.js Dev Tools|Open issues overlay|Collapse issues badge/i.test(
              identity
            )
          )
        }).length
    )
  const routeOwnedControlCount = await countRouteOwnedControls()
  if (contract.keyboard.disposition === 'not-applicable') {
    expect(routeOwnedControlCount, contract.keyboard.rationale).toBe(0)
    return
  }
  await expect
    .poll(countRouteOwnedControls, {
      message: contract.keyboard.rationale,
      timeout: ROUTE_SETTLE_TIMEOUT,
    })
    .toBeGreaterThan(0)

  await routeSurface.evaluate(node => (node as HTMLElement).focus())
  await page.evaluate(() => {
    document.activeElement?.setAttribute('data-story1743-initial-focus', 'true')
  })
  let foundVisibleFocus = false
  for (let attempt = 0; attempt < 20 && !foundVisibleFocus; attempt += 1) {
    await page.keyboard.press('Tab')
    const candidate = routeSurface.locator(':focus:visible').first()
    foundVisibleFocus =
      (await candidate.count()) > 0 && (await candidate.evaluate(isRouteOwnedControl))
  }
  expect(foundVisibleFocus, `${route}: route-owned controls are keyboard reachable`).toBe(true)
  const focused = routeSurface.locator(':focus:visible').first()
  await expect(focused, `${route}: Tab produces a visible focus target`).toBeVisible()
  expect(
    await focused.evaluate(node => !node.hasAttribute('data-story1743-initial-focus')),
    `${route}: Tab moves focus to a route workflow control`
  ).toBe(true)
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
  await page.evaluate(() => {
    document
      .querySelector('[data-story1743-initial-focus]')
      ?.removeAttribute('data-story1743-initial-focus')
  })
}

export async function reachByKeyboard(page: Page, target: Locator, maximumTabs = 160) {
  for (let attempt = 0; attempt < maximumTabs; attempt += 1) {
    await page.keyboard.press('Tab')
    if (await target.evaluate(node => node === document.activeElement)) return
  }
  const targetName =
    (await target.getAttribute('aria-label')) ??
    (await target.getAttribute('title')) ??
    (await target.textContent()) ??
    '<unnamed target>'
  throw new Error(
    `Keyboard traversal did not reach ${JSON.stringify(targetName.trim())} after ${maximumTabs} Tab presses`
  )
}

async function focusBeforeOverlayTrigger(page: Page, trigger: Locator) {
  const triggerBelongsToShell = await trigger.evaluate(node =>
    Boolean(node.closest('header, nav, aside, [data-sidebar]'))
  )
  if (!triggerBelongsToShell) {
    const main = page.locator('main:visible').first()
    if ((await main.count()) > 0) {
      await main.evaluate(node => (node as HTMLElement).focus())
      return () => Promise.resolve()
    }
  }

  const originalTabIndex = await page.locator('body').getAttribute('tabindex')
  await page.locator('body').evaluate(node => {
    node.setAttribute('tabindex', '-1')
    ;(node as HTMLElement).focus()
  })
  return async () => {
    await page.locator('body').evaluate((node, tabIndex) => {
      if (tabIndex === null) node.removeAttribute('tabindex')
      else node.setAttribute('tabindex', tabIndex)
    }, originalTabIndex)
  }
}

export async function assertOverlayInventory(
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
    expect(overlay.behavior.execution).toBe('canonical-runner')
    const escapedName = overlay.trigger.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const name =
      overlay.trigger.match === 'prefix'
        ? new RegExp(`^${escapedName}`)
        : overlay.trigger.match === 'contains'
          ? new RegExp(escapedName)
          : overlay.trigger.name
    const matchingTriggers = page.getByRole(overlay.trigger.role, { name })
    const assertionMessage = `${route}: ${overlay.id} closed-by-default ${overlay.archetype} retains its route-owned trigger`
    if (overlay.trigger.cardinality === 'one-or-more') {
      expect(await matchingTriggers.count(), assertionMessage).toBeGreaterThan(0)
    } else {
      await expect(matchingTriggers, assertionMessage).toHaveCount(1)
    }
    const trigger = matchingTriggers.first()
    await expect(trigger).toBeVisible()
    await expect(
      trigger,
      `${route}: ${overlay.id} canonical trigger becomes keyboard-actionable`
    ).toBeEnabled({ timeout: ROUTE_SETTLE_TIMEOUT })
    await page.keyboard.press('Escape')
    const restoreTabStart = await focusBeforeOverlayTrigger(page, trigger)
    try {
      await reachByKeyboard(page, trigger)
    } finally {
      await restoreTabStart()
    }
    await expect(trigger, `${route}: ${overlay.id} trigger receives keyboard focus`).toBeFocused()
    await page.keyboard.press(overlay.behavior.openKey)

    const modal = overlay.archetype.startsWith('modal-')
    const surface =
      overlay.archetype === 'modal-alert-dialog'
        ? page.locator('[role="alertdialog"]:visible').last()
        : modal
          ? page.locator('[role="dialog"]:visible').last()
          : overlay.archetype === 'non-modal-menu'
            ? page.locator('[role="menu"]:visible').last()
            : page
                .locator('[data-radix-popper-content-wrapper] > [data-state="open"]:visible')
                .last()
    await expect(
      surface,
      `${route}: ${overlay.id} opens a visible ${overlay.archetype} surface`
    ).toBeVisible({ timeout: ROUTE_SETTLE_TIMEOUT })

    if (modal) {
      await expect
        .poll(() => surface.evaluate(node => node.contains(document.activeElement)), {
          message: `${route}: ${overlay.id} overlay receives keyboard focus`,
        })
        .toBe(true)
      await page.keyboard.press('Tab')
      expect(
        await surface.evaluate(node => node.contains(document.activeElement)),
        `${route}: ${overlay.id} contains forward Tab focus`
      ).toBe(true)
      await page.keyboard.press('Shift+Tab')
      expect(
        await surface.evaluate(node => node.contains(document.activeElement)),
        `${route}: ${overlay.id} contains reverse Shift+Tab focus`
      ).toBe(true)
    } else {
      const focusIsInWorkflow = async () =>
        (await surface.evaluate(node => node.contains(document.activeElement))) ||
        (await trigger.evaluate(node => node === document.activeElement))
      if (!(await focusIsInWorkflow())) await page.keyboard.press('Tab')
      expect(
        await focusIsInWorkflow(),
        `${route}: ${overlay.id} keeps keyboard focus on its trigger/content workflow`
      ).toBe(true)
    }

    const pendingBindingStart = surface.getByRole('status', {
      name: /создаём код привязки/i,
    })
    if ((await pendingBindingStart.count()) > 0) {
      await expect(
        pendingBindingStart,
        `${route}: ${overlay.id} reaches its dismissible post-start state`
      ).toBeHidden({ timeout: ROUTE_SETTLE_TIMEOUT })
    }

    await page.keyboard.press(overlay.behavior.closeKey)
    await expect(surface, `${route}: ${overlay.id} closes with Escape`).toBeHidden()
    await expect(trigger, `${route}: ${overlay.id} restores focus to its trigger`).toBeFocused()
  }
}
