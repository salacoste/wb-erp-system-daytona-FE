import { execFile } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import {
  OWNED_E2E_FILES,
  resolveScanTargets,
  scanFiles,
  scanSource,
} from '../../scripts/check-e2e-vacuous-assertions.mjs'

const execFileAsync = promisify(execFile)
const STORY_BASE_REVISION = 'cc733289b03cb16d30dcdc54325e5b5b0b966d4f'

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

  it('preserves the exact 57-site semantic inventory from the story baseline', async () => {
    const baselineSources = await Promise.all(
      OWNED_E2E_FILES.map(async file => {
        const { stdout } = await execFileAsync('git', ['show', `${STORY_BASE_REVISION}:${file}`], {
          cwd: process.cwd(),
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
        })
        return scanSource(stdout, file)
      })
    )

    expect(baselineSources.flat()).toHaveLength(57)
  })

  it('uses explicit CLI paths without changing the eight-file default', () => {
    expect(resolveScanTargets([])).toEqual(OWNED_E2E_FILES)
    expect(resolveScanTargets(['e2e/liquidity.spec.ts'])).toEqual(['e2e/liquidity.spec.ts'])
  })
})
