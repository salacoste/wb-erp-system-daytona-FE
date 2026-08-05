import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  OWNED_E2E_FILES,
  STORY_162_3_E2E_FILES,
  STORY_162_4_E2E_FILES,
  resolveScanTargets,
  scanFiles,
  scanGitRevision,
  scanSource,
} from '../../scripts/check-e2e-vacuous-assertions.mjs'

const STORY_162_3_BASE_REVISION = 'cc733289b03cb16d30dcdc54325e5b5b0b966d4f'
const STORY_162_4_BASE_REVISION = '9a882a1de72e8716a1969002a648e027f4a05c0f'

describe('E2E vacuous assertion scanner', () => {
  it('detects every prohibited assertion family', () => {
    const source = `
      expect(visible || true).toBeTruthy()
      expect(true).toBeTruthy()
      expect(await rows.count() >= 0).toBeTruthy()
      expect(await rows.count()).toBeGreaterThanOrEqual(0)
      const flag = locator.count() >= 0
      expect(flag).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toHaveLength(5)
  })

  it('detects a toBeGreaterThanOrEqual(0) matcher on the next line', () => {
    const source = `
      expect(await rows.count())
        .toBeGreaterThanOrEqual(0)
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({
        message: 'toBeGreaterThanOrEqual(0) cannot prove content exists',
      }),
    ])
  })

  it('accepts meaningful assertions, including count > 0', () => {
    const source = `
      expect(visible).toBeTruthy()
      expect(await rows.count() > 0).toBeTruthy()
      expect(await rows.count()).toBeGreaterThan(0)
      await expect(rows).toHaveCount(2)
      const compound = rows.count() >= 0 && isReady
      expect(compound).toBeTruthy()
      const ternary = isReady ? rows.count() >= 0 : false
      expect(ternary).toBeTruthy()
      let reassigned = rows.count() >= 0
      reassigned = hasVisibleRows
      expect(reassigned).toBeTruthy()
      expect(count >= 0 && isReady).toBeTruthy()
      expect(accountBalance >= 0).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('detects multiline and type-annotated indirect locator count comparisons', () => {
    const source = `
      const multiline =
        (await rows.count())
        >= 0
      expect(multiline).toBeTruthy()

      const typed: boolean = await cards.count() >= 0
      expect(typed).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toHaveLength(2)
  })

  it('detects locator count disjunctions and variables derived from locator counts', () => {
    const source = `
      expect((await modal.count()) >= 0 || (await liquidationInfo.count()) >= 0).toBeTruthy()

      const rowCount = await tableRows.count()
      expect(rowCount >= 0).toBeTruthy()

      {
        const count = unrelatedValue
        expect(count > 0).toBeTruthy()
      }
      {
        const count = await currencyValues.count()
        expect(count >= 0).toBeTruthy()
      }
      {
        const count = laterUnrelatedValue
        expect(count > 0).toBeTruthy()
      }
    `

    expect(scanSource(source, 'sample.spec.ts')).toHaveLength(3)
  })

  it('detects nonnegative comparisons derived from locator counts with catch fallbacks', () => {
    const source = `
      const skeletonCount = await page
        .locator('[class*="skeleton"]')
        .count()
        .catch(() => 0)
      expect(skeletonCount >= 0).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({
        message: 'a nonnegative count assertion is unconditional',
      }),
    ])
  })

  it('detects disabled-or-enabled complements derived from the same locator', () => {
    const source = `
      const isButtonDisabled = await calculateButton.isDisabled()
      const isButtonEnabled = await calculateButton.isEnabled()
      expect(isButtonDisabled || isButtonEnabled).toBeTruthy()

      expect(
        (await submitButton.isDisabled()) || (await submitButton.isEnabled())
      ).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toHaveLength(2)
  })

  it('accepts state disjunctions from different locators', () => {
    const source = `
      const isPrimaryDisabled = await primaryButton.isDisabled()
      const isFallbackEnabled = await fallbackButton.isEnabled()
      expect(isPrimaryDisabled || isFallbackEnabled).toBeTruthy()
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('ignores prohibited-looking text in comments and strings', () => {
    const source = `
      // expect(value || true).toBeTruthy()
      /* expect(count >= 0).toBeTruthy() */
      const example = 'expect(true).toBeTruthy()'
      const matcher = "toBeGreaterThanOrEqual(0)"
      const template = \`expect(value || true)\`
      expect(example).toContain('expect')
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('fails closed when a configured file is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'e2e-assertion-scan-'))
    await writeFile(join(root, 'present.spec.ts'), 'expect(value).toBeTruthy()')

    await expect(scanFiles(['present.spec.ts', 'missing.spec.ts'], root)).rejects.toThrow(
      'missing.spec.ts'
    )
  })

  it('scans the real default allowlist in the normal Vitest suite', async () => {
    expect(await scanFiles()).toEqual([])
  })

  it('preserves the exact 57-site Story 162.3 semantic inventory', async () => {
    const baselineSources = await scanGitRevision(STORY_162_3_E2E_FILES, STORY_162_3_BASE_REVISION)

    expect(baselineSources.flat()).toHaveLength(57)
  })

  it('preserves the exact 38-site Story 162.4 semantic inventory', async () => {
    const baselineSources = await scanGitRevision(STORY_162_4_E2E_FILES, STORY_162_4_BASE_REVISION)

    expect(baselineSources.flat()).toHaveLength(38)
  })

  it('uses explicit CLI paths without changing the combined story default', () => {
    expect(OWNED_E2E_FILES).toEqual([...STORY_162_3_E2E_FILES, ...STORY_162_4_E2E_FILES])
    expect(resolveScanTargets([])).toEqual(OWNED_E2E_FILES)
    expect(resolveScanTargets(['e2e/liquidity.spec.ts'])).toEqual(['e2e/liquidity.spec.ts'])
  })
})
