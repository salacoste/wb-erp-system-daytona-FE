import assert from 'node:assert/strict'

import test from 'node:test'

import { scanSource } from './check-e2e-bare-skips.mjs'

test('Story 162.9 bare-skip scanner detects a bare test.skip()', () => {
  const source = `
    test('needs a fixture', async ({ page }) => {
      if (!createdSupplyId) {
        test.skip()
        return
      }
    })
  `

  const findings = scanSource(source, 'e2e/sample.spec.ts')
  assert.equal(findings.length, 1)
  assert.equal(findings[0].line, 4)
  assert.match(
    findings[0].message,
    /bare test\.skip\(\) has no reason — use test\.skip\(condition, reason\)/
  )
})

test('Story 162.9 bare-skip scanner allows test.skip(condition, reason)', () => {
  const source = `
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)
    test.skip(!seedData, 'DBW order seed endpoint unavailable — tests require dev backend')
    test.skip(rowCount === 0, 'No orders present — nothing to assert')
  `

  assert.deepEqual(scanSource(source, 'e2e/sample.spec.ts'), [])
})

test('Story 162.9 bare-skip scanner allows test.skip(true, reason)', () => {
  const source = `
    if (!(await addButton.isVisible())) {
      test.skip(true, 'Add-orders button unavailable — supply not in OPEN status')
      return
    }
  `

  assert.deepEqual(scanSource(source, 'e2e/sample.spec.ts'), [])
})

test('Story 162.9 bare-skip scanner ignores commented-out and doc-comment mentions', () => {
  const source = `
    // Anti-pattern #6: a bare test.skip() is a silent E2E skip.
    /* test.skip() — historical, do not reintroduce */
    /**
     * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
     * - never write test.skip() with no reason
     */
    const docs = 'example: test.skip() is forbidden'
    const template = \`skip pattern: test.skip()\`
  `

  assert.deepEqual(scanSource(source, 'e2e/sample.spec.ts'), [])
})

test('Story 162.9 bare-skip scanner flags multiple bare skips and sorts by line', () => {
  const source = `
    test('a', async () => { test.skip() })
    test('b', async () => { test.skip(  ) })
    test('c', async () => { test.skip(true, 'explicit reason') })
    test('d', async () => { test.skip() })
  `

  const findings = scanSource(source, 'e2e/sample.spec.ts')
  assert.deepEqual(
    findings.map(finding => finding.line),
    [2, 3, 5]
  )
})

test('Story 162.9 bare-skip scanner allows whitespace inside an explicit skip', () => {
  const source = `
    test.skip(
      !hasCards,
      'KPI cards not visible — needs backend data seeding for gauge test'
    )
  `

  assert.deepEqual(scanSource(source, 'e2e/sample.spec.ts'), [])
})

test('Story 162.9 bare-skip scanner does not match a similarly-named identifier', () => {
  const source = `
    const result = mytest.skip()
    const alt = test.skipDisabled()
  `

  assert.deepEqual(scanSource(source, 'e2e/sample.spec.ts'), [])
})
