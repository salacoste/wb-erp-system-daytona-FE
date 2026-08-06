import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  STORY_162_5_BASE_REVISION,
  STORY_162_5_BASELINE_FILES,
  STORY_162_5_CANONICAL_WAIT_COUNT,
  STORY_162_5_CURRENT_BASE_WAIT_COUNT,
  STORY_162_5_CURRENT_BASE_TIMER_COUNT,
  STORY_162_5_E2E_FILES,
  STORY_162_6_BASE_REVISION,
  STORY_162_6_CANONICAL_WAIT_COUNT,
  STORY_162_6_CURRENT_BASE_TIMER_COUNT,
  STORY_162_6_CURRENT_BASE_WAIT_COUNT,
  STORY_162_6_E2E_FILES,
  STORY_162_6_FIXTURE_FILES,
  STORY_162_6_SCAN_FILES,
  STORY_162_7_BASE_REVISION,
  STORY_162_7_CANONICAL_WAIT_COUNT,
  STORY_162_7_CURRENT_BASE_TIMER_COUNT,
  STORY_162_7_CURRENT_BASE_WAIT_COUNT,
  STORY_162_7_E2E_FILES,
  STORY_162_7_FIXTURE_FILES,
  STORY_162_7_SCAN_FILES,
  STORY_FIXED_WAIT_SCAN_FILES,
  resolveScanTargets,
  scanFiles,
  scanGitRevision,
  scanSource,
} from '../../scripts/check-e2e-fixed-waits.mjs'

describe('Story 162.5 E2E fixed-wait scanner', () => {
  it('detects browser waits, timers, and arbitrary wait helpers', () => {
    const source = `
      await page.waitForTimeout(500)
      await alias.waitForTimeout(250)
      await new Promise(resolve => setTimeout(resolve, 100))
      await sleep(25)
      await helpers.delay(25)
      await pause()
    `

    expect(scanSource(source, 'sample.spec.ts').map(finding => finding.kind)).toEqual([
      'browser-wait',
      'browser-wait',
      'timer',
      'sleep-helper',
      'sleep-helper',
      'sleep-helper',
    ])
  })

  it('detects every supported waitForTimeout invocation and common alias form', () => {
    const source = `
      page.waitForTimeout(10)
      page['waitForTimeout'](10)
      ;(page.waitForTimeout)(10)
      page.waitForTimeout?.(10)
      page?.waitForTimeout?.(10)
      page.waitForTimeout.call(page, 10)
      page['waitForTimeout'].apply(page, [10])
      waitForTimeout(10)
      const waitAlias = page.waitForTimeout
      waitAlias(10)
      const boundWait = page.waitForTimeout.bind(page)
      boundWait(10)
      const { waitForTimeout: destructuredWait } = page
      destructuredWait(10)
      let assignedWait
      assignedWait = page['waitForTimeout']
      assignedWait(10)
    `

    const findings = scanSource(source, 'sample.spec.ts')

    expect(findings).toHaveLength(12)
    expect(findings.every(finding => finding.kind === 'browser-wait')).toBe(true)
  })

  it('unwraps awaited parenthesized callable expressions', () => {
    expect(scanSource('await (page.waitForTimeout)(250)', 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 1, kind: 'browser-wait' }),
    ])

    const source = `
      async function exercise() {
        ;(await page.waitForTimeout)(250)
      }
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 3, kind: 'browser-wait' }),
    ])
  })

  it('restores a prohibited outer alias after a safe inner shadow', () => {
    const source = `
      const wait = page.waitForTimeout
      {
        const wait = safeWait
        wait(10)
      }
      wait(10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 7, kind: 'browser-wait' }),
    ])
  })

  it('limits a prohibited inner alias to its lexical block', () => {
    const source = `
      const wait = safeWait
      wait(10)
      {
        const wait = page.waitForTimeout
        wait(10)
      }
      wait(10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 6, kind: 'browser-wait' }),
    ])
  })

  it('honors function-parameter shadows without losing the outer alias', () => {
    const source = `
      const schedule = setTimeout
      function invokeSafely(schedule) {
        schedule(callback, 10)
      }
      schedule(callback, 10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 6, kind: 'timer' }),
    ])
  })

  it('pushes and pops aliases across nested blocks', () => {
    const source = `
      const nap = helpers.sleep
      {
        const nap = safeWait
        {
          const nap = helpers.delay
          nap(10)
        }
        nap(10)
      }
      nap(10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 7, kind: 'sleep-helper' }),
      expect.objectContaining({ line: 11, kind: 'sleep-helper' }),
    ])
  })

  it('does not classify calls before an alias declaration retroactively', () => {
    const source = `
      later(10)
      const later = page.waitForTimeout
      later(10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 4, kind: 'browser-wait' }),
    ])
  })

  it('resolves a later outer alias when a closure runs after initialization', () => {
    const source = `
      function run() { wait(10) }
      const wait = page.waitForTimeout
      run()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 2, kind: 'browser-wait' }),
    ])
  })

  it('resolves later assignment and destructuring aliases from closures', () => {
    const source = `
      function runAssigned() { assignedWait(10) }
      let assignedWait
      assignedWait = page.waitForTimeout
      runAssigned()

      function runDestructured() { destructuredWait(10) }
      const { waitForTimeout: destructuredWait } = page
      runDestructured()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 2, kind: 'browser-wait' }),
      expect.objectContaining({ line: 7, kind: 'browser-wait' }),
    ])
  })

  it('preserves deferred execution for a closure assigned by an invoked function', () => {
    const source = `
      let callback
      function register() { callback = () => wait(10) }
      register()
      const wait = page.waitForTimeout
      callback()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 3, kind: 'browser-wait' }),
    ])
  })

  it('preserves deferred execution for a closure returned by an invoked function', () => {
    const source = `
      function register() { return () => wait(10) }
      const callback = register()
      const wait = page.waitForTimeout
      callback()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 2, kind: 'browser-wait' }),
    ])
  })

  it('propagates deferred closures through statically resolvable properties', () => {
    const source = `
      const handlers = {}
      function register() { handlers.callback = () => wait(10) }
      register()
      const wait = page.waitForTimeout
      handlers.callback()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 3, kind: 'browser-wait' }),
    ])
  })

  it('does not apply later aliases to assigned or returned closures invoked earlier', () => {
    const source = `
      let assignedCallback
      function assign() { assignedCallback = () => assignedWait(10) }
      assign()
      assignedCallback()
      const assignedWait = page.waitForTimeout

      function create() { return () => returnedWait(10) }
      const returnedCallback = create()
      returnedCallback()
      const returnedWait = page.waitForTimeout
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not use a later alias when its closure runs before initialization', () => {
    const source = `
      function run() { wait(10) }
      run()
      const wait = page.waitForTimeout
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('honors var hoisting without applying its initializer too early', () => {
    const source = `
      function exercise() {
        wait(10)
        var wait = page.waitForTimeout
        wait(10)
      }
      exercise()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 5, kind: 'browser-wait' }),
    ])
  })

  it('keeps catch-parameter shadows inside the catch scope', () => {
    const source = `
      const wait = page.waitForTimeout
      try {
        throw new Error('expected')
      } catch (wait) {
        wait(10)
      }
      wait(10)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 8, kind: 'browser-wait' }),
    ])
  })

  it('honors a hoisted safe function shadow before its declaration', () => {
    const source = `
      setTimeout(callback, 10)
      function setTimeout() {}
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('keeps hoisted safe function shadows inside their block and function scopes', () => {
    const source = `
      {
        delay(10)
        function delay() {}
      }
      delay(10)

      function exercise() {
        sleep(10)
        function sleep() {}
      }
      exercise()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({ line: 6, kind: 'sleep-helper' }),
    ])
  })

  it('detects setTimeout/setInterval invocation wrappers and common aliases', () => {
    const source = `
      import { setTimeout as importedTimer } from 'node:timers'
      setTimeout(callback, 10)
      globalThis['setInterval'](callback, 10)
      ;(setTimeout)(callback, 10)
      setInterval?.(callback, 10)
      setTimeout.call(globalThis, callback, 10)
      globalThis.setInterval.apply(globalThis, [callback, 10])
      importedTimer(callback, 10)
      const timerAlias = globalThis.setTimeout
      timerAlias(callback, 10)
      const { setInterval: destructuredTimer } = globalThis
      destructuredTimer(callback, 10)
      let assignedTimer
      assignedTimer = globalThis['setTimeout']
      assignedTimer(callback, 10)
    `

    const findings = scanSource(source, 'sample.spec.ts')

    expect(findings).toHaveLength(10)
    expect(findings.every(finding => finding.kind === 'timer')).toBe(true)
  })

  it('detects delay/sleep invocation wrappers and common aliases', () => {
    const source = `
      import { sleep as importedSleep } from './helpers'
      sleep(10)
      helpers['delay'](10)
      ;(pause)(10)
      helpers.sleep?.(10)
      helpers?.delay?.(10)
      helpers.sleep.call(helpers, 10)
      helpers['delay'].apply(helpers, [10])
      importedSleep(10)
      const sleepAlias = helpers.sleep
      sleepAlias(10)
      const { delay: destructuredDelay } = helpers
      destructuredDelay(10)
      let assignedPause
      assignedPause = helpers['pause']
      assignedPause(10)
    `

    const findings = scanSource(source, 'sample.spec.ts')

    expect(findings).toHaveLength(11)
    expect(findings.every(finding => finding.kind === 'sleep-helper')).toBe(true)
  })

  it('scans executable template interpolation, including multiline and nested templates', () => {
    const source = `
      const single = \`result: \${alias.waitForTimeout(25)}\`
      const multiline = \`result: \${
        condition
          ? helper.waitForTimeout(50)
          : { nested: () => setTimeout(resolve, 75) }
      }\`
      const nested = \`outer \${\`inner \${page.waitForTimeout(100)}\`}\`
    `

    expect(scanSource(source, 'sample.spec.ts').map(finding => finding.kind)).toEqual([
      'browser-wait',
      'browser-wait',
      'timer',
      'browser-wait',
    ])
  })

  it('masks prohibited-looking comments, strings, templates, and regular expressions', () => {
    const source = `
      // page.waitForTimeout(500)
      /* setTimeout(resolve, 100) */
      const docs = 'sleep(25) and delay(25)'
      const template = \`pause() and page.waitForTimeout(500)\`
      const interpolated = \`\${'setTimeout(resolve, 100)'} inert text delay(25)\`
      const matcher = /page\\.waitForTimeout\\(500\\)/
      const waitReference = page.waitForTimeout
      const timerReference = globalThis['setTimeout']
      const helperReference = helpers.delay
      await expect(page.getByText(docs)).toBeVisible()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('fails closed when any configured target is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'e2e-fixed-wait-scan-'))
    await writeFile(join(root, 'present.spec.ts'), 'await expect(page).toBeTruthy()')

    await expect(scanFiles(['present.spec.ts', 'missing.spec.ts'], root)).rejects.toThrow(
      'missing.spec.ts'
    )
  })

  it('records the immutable canonical count and exact predecessor drift', async () => {
    expect(STORY_162_5_CANONICAL_WAIT_COUNT).toBe(58)
    expect(STORY_162_5_BASELINE_FILES).toHaveLength(3)
    const baseline = await scanGitRevision(STORY_162_5_BASELINE_FILES, STORY_162_5_BASE_REVISION)
    const browserWaits = baseline.flat().filter(finding => finding.kind === 'browser-wait')

    expect(browserWaits).toHaveLength(STORY_162_5_CURRENT_BASE_WAIT_COUNT)
    expect(baseline.flat().filter(finding => finding.kind === 'timer')).toHaveLength(
      STORY_162_5_CURRENT_BASE_TIMER_COUNT
    )
  })

  it('keeps the default target list exact and accepts explicit CLI targets', () => {
    expect(STORY_162_5_E2E_FILES).toEqual([
      ...STORY_162_5_BASELINE_FILES,
      'e2e/fixtures/story-162-5-analytics.ts',
    ])
    expect(resolveScanTargets([])).toEqual(STORY_FIXED_WAIT_SCAN_FILES)
    expect(resolveScanTargets(['e2e/liquidity.spec.ts'])).toEqual(['e2e/liquidity.spec.ts'])
  })

  it('keeps every real owned target free of fixed waits', async () => {
    expect(await scanFiles(STORY_162_5_E2E_FILES)).toEqual([])
  })
})

describe('Story 162.6 dashboard and analytics fixed-wait scanner', () => {
  it('records the immutable canonical count and exact current base drift', async () => {
    expect(STORY_162_6_BASE_REVISION).toBe('aee43c154e0b3ff494a6dc6ee3cacb34043765d9')
    expect(STORY_162_6_CANONICAL_WAIT_COUNT).toBe(67)

    const baseline = await scanGitRevision(STORY_162_6_E2E_FILES, STORY_162_6_BASE_REVISION)
    const findings = baseline.flat()

    expect(findings.filter(finding => finding.kind === 'browser-wait')).toHaveLength(
      STORY_162_6_CURRENT_BASE_WAIT_COUNT
    )
    expect(findings.filter(finding => finding.kind === 'timer')).toHaveLength(
      STORY_162_6_CURRENT_BASE_TIMER_COUNT
    )
    expect(findings).toHaveLength(69)
  })

  it('keeps the Story 162.6 owned spec list exact', () => {
    expect(STORY_162_6_E2E_FILES).toEqual([
      'e2e/accessibility-merged-groups-epic-37.spec.ts',
      'e2e/analytics/ai-models.spec.ts',
      'e2e/analytics/analytics-hub.spec.ts',
      'e2e/analytics/analytics-pages-smoke.spec.ts',
      'e2e/analytics/fbs-orders-analytics.spec.ts',
      'e2e/analytics/forecast.spec.ts',
      'e2e/analytics/product-analytics.spec.ts',
      'e2e/analytics/search-analytics.spec.ts',
      'e2e/brand-analytics.spec.ts',
      'e2e/category-analytics.spec.ts',
      'e2e/dashboard-metrics.spec.ts',
      'e2e/dashboard-period.spec.ts',
      'e2e/dashboard-session-fixes.spec.ts',
      'e2e/financial-summary.spec.ts',
      'e2e/forecast-accuracy.spec.ts',
      'e2e/forecast-page.spec.ts',
      'e2e/margin-analytics.spec.ts',
      'e2e/merged-group-table-epic-37.spec.ts',
      'e2e/period-selection-month-test.spec.ts',
      'e2e/storage-analytics.spec.ts',
    ])
  })

  it('keeps the planned fixture targets exact and fails closed when one is missing', async () => {
    expect(STORY_162_6_FIXTURE_FILES).toEqual([
      'e2e/fixtures/story-162-6-route-controller.ts',
      'e2e/fixtures/story-162-6-dashboard.ts',
      'e2e/fixtures/story-162-6-analytics.ts',
    ])
    expect(STORY_162_6_SCAN_FILES).toEqual([...STORY_162_6_E2E_FILES, ...STORY_162_6_FIXTURE_FILES])

    const root = await mkdtemp(join(tmpdir(), 'story-162-6-fixed-wait-scan-'))
    await expect(scanFiles([STORY_162_6_FIXTURE_FILES[0]], root)).rejects.toThrow(
      STORY_162_6_FIXTURE_FILES[0]
    )
  })

  it('uses the exact Story 162.5, 162.6, and 162.7 target union by default', () => {
    expect(STORY_FIXED_WAIT_SCAN_FILES).toEqual([
      ...STORY_162_5_E2E_FILES,
      ...STORY_162_6_SCAN_FILES,
      ...STORY_162_7_SCAN_FILES,
    ])
    expect(resolveScanTargets([])).toEqual(STORY_FIXED_WAIT_SCAN_FILES)
    expect(resolveScanTargets(['e2e/dashboard-period.spec.ts'])).toEqual([
      'e2e/dashboard-period.spec.ts',
    ])
  })
})

describe('Story 162.7 supplies fixed-wait scanner', () => {
  it('records the immutable canonical count and exact current base drift', async () => {
    expect(STORY_162_7_BASE_REVISION).toBe('3bcbf72c947a56a3ac7961a36a950707c648524e')
    expect(STORY_162_7_CANONICAL_WAIT_COUNT).toBe(76)

    const baseline = await scanGitRevision(STORY_162_7_E2E_FILES, STORY_162_7_BASE_REVISION)
    const findings = baseline.flat()

    expect(findings.filter(finding => finding.kind === 'browser-wait')).toHaveLength(
      STORY_162_7_CURRENT_BASE_WAIT_COUNT
    )
    expect(findings.filter(finding => finding.kind === 'timer')).toHaveLength(
      STORY_162_7_CURRENT_BASE_TIMER_COUNT
    )
    expect(findings).toHaveLength(73)
  })

  it('keeps the Story 162.7 owned spec list exact', () => {
    expect(STORY_162_7_E2E_FILES).toEqual([
      'e2e/supply-planning.spec.ts',
      'e2e/supplies/supplies-list.spec.ts',
      'e2e/supplies/supply-detail.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
      'e2e/supplies/supplies-a11y.spec.ts',
    ])
  })

  it('keeps the planned fixture targets exact and fails closed when one is missing', async () => {
    expect(STORY_162_7_FIXTURE_FILES).toEqual(['e2e/fixtures/mutation-guard.ts'])
    expect(STORY_162_7_SCAN_FILES).toEqual([...STORY_162_7_E2E_FILES, ...STORY_162_7_FIXTURE_FILES])

    const root = await mkdtemp(join(tmpdir(), 'story-162-7-fixed-wait-scan-'))
    await expect(scanFiles([STORY_162_7_FIXTURE_FILES[0]], root)).rejects.toThrow(
      STORY_162_7_FIXTURE_FILES[0]
    )
  })
})
