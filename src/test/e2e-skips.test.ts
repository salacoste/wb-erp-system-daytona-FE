import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  collectScanFiles,
  resolveScanTargets,
  scanFiles,
  scanGitRevision,
  scanSource,
} from '../../scripts/check-e2e-skips.mjs'

describe('Story 162.9 E2E bare-skip scanner', () => {
  it('flags a bare test.skip() with no arguments', () => {
    const source = `
      test('x', async ({ page }) => {
        if (!ready) {
          test.skip()
          return
        }
      })
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([
      expect.objectContaining({
        line: 4,
        message: expect.stringContaining('bare test.skip()'),
      }),
    ])
  })

  it('passes clean source that uses no skips at all', () => {
    const source = `
      test('x', async ({ page }) => {
        await expect(page.getByRole('heading')).toBeVisible()
      })
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not flag a commented-out test.skip()', () => {
    const source = `
      // test.skip()
      /* test.skip() */
      /**
       * Use \`test.skip()\` to mark the test as skipped instead of returning.
       */
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not flag a reasoned test.skip(true, reason)', () => {
    const source = `
      if (!page.url().includes('/settings/backfill')) {
        test.skip(true, 'Backfill admin route did not load — redirected away')
      }
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not flag a conditional test.skip(condition, reason)', () => {
    const source = `
      test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)
      test.skip(!(await button.isVisible()), 'button missing')
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not flag test.describe.skip(...)', () => {
    const source = `
      test.describe.skip('disabled suite', () => {
        test('x', () => {})
      })
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('does not flag a string-embedded mention of test.skip()', () => {
    const source = `
      const reason = 'prefer test.skip() over an early return'
      console.log('do not call test.skip() here')
      const template = \`avoid test.skip()\`
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([])
  })

  it('flags a bare skip even when surrounded by reasoned skips', () => {
    const source = `
      test.skip(shouldSkip(), 'mutating suite gated')
      test('x', async () => {
        if (!ready) {
          test.skip()
        }
      })
      test.skip(true, 'explicit fixture reason')
    `

    expect(scanSource(source, 'sample.spec.ts')).toEqual([expect.objectContaining({ line: 5 })])
  })

  it('fails closed when a configured target is missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'e2e-skip-scan-'))
    await writeFile(join(root, 'present.spec.ts'), 'test("x", () => {})')

    await expect(scanFiles(['present.spec.ts', 'missing.spec.ts'], root)).rejects.toThrow(
      'missing.spec.ts'
    )
  })

  it('walks the e2e tree and discovers spec files relative to root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'e2e-skip-walk-'))
    await mkdir(join(root, 'e2e', 'supplies'), { recursive: true })
    await writeFile(join(root, 'e2e', 'supply.spec.ts'), 'test("x", () => {})')
    await writeFile(join(root, 'e2e', 'supplies', 'lifecycle.spec.ts'), 'test("y", () => {})')
    await writeFile(join(root, 'e2e', 'auth.setup.ts'), 'export {}')
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'app.ts'), 'test.skip()')

    const files = await collectScanFiles(root)
    expect(files).toEqual(
      expect.arrayContaining([
        'e2e/auth.setup.ts',
        'e2e/supply.spec.ts',
        'e2e/supplies/lifecycle.spec.ts',
      ])
    )
    expect(files.some(file => file.startsWith('src'))).toBe(false)

    const findings = await scanFiles(files, root)
    expect(findings).toEqual([])
  })

  it('keeps the default target list as the e2e tree walk and accepts explicit CLI targets', async () => {
    expect(await resolveScanTargets(['e2e/sample.spec.ts'])).toEqual(['e2e/sample.spec.ts'])
    const defaults = await resolveScanTargets([])
    expect(defaults.some((file: string) => file.endsWith('.spec.ts'))).toBe(true)
  })

  it('detects exactly the six known base bare skips at the story base revision', async () => {
    const files = await collectScanFiles()
    const findings = (await scanGitRevision(files, 'a7017d54')).flat()

    expect(findings).toHaveLength(6)
    expect(findings.every(finding => finding.message.includes('bare test.skip()'))).toBe(true)
    expect(findings.map(finding => finding.file).sort()).toEqual([
      'e2e/settings/backfill-a11y.spec.ts',
      'e2e/settings/backfill-a11y.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
      'e2e/supplies/supply-lifecycle.spec.ts',
    ])
  })

  it('keeps every owned target free of bare skips at HEAD', async () => {
    const files = await collectScanFiles()
    expect(await scanFiles(files)).toEqual([])
  })
})
