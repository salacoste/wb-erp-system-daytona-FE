import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { runPrivacyCheck, scanPrivacyFiles } from './check-privacy-console.mjs'

async function withFixture(source, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'privacy-console-'))
  const relativePath = 'src/private.ts'
  const absolutePath = path.join(root, relativePath)

  try {
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, source, 'utf8')
    await callback({ root, relativePath })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('accepts a PII file without console calls', async () => {
  await withFixture('export const clientId = "masked"\n', async ({ root, relativePath }) => {
    const result = await scanPrivacyFiles({ root, files: [relativePath] })

    assert.deepEqual(result.violations, [])
    assert.deepEqual(result.missing, [])
    assert.deepEqual(result.scanned, [relativePath])
  })
})

test('fails closed when a configured PII file is missing', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'privacy-console-missing-'))
  const errorMessages = []
  const originalConsoleError = console.error

  try {
    console.error = message => errorMessages.push(String(message))
    const exitCode = await runPrivacyCheck({ root, files: ['src/missing.ts'] })

    assert.equal(exitCode, 1)
    assert.match(errorMessages.join('\n'), /configured PII file\(s\) are missing/)
  } finally {
    console.error = originalConsoleError
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects a forbidden console call in a PII file', async () => {
  await withFixture('console.warn("client email", email)\n', async ({ root, relativePath }) => {
    const result = await scanPrivacyFiles({ root, files: [relativePath] })
    const errorMessages = []
    const originalConsoleError = console.error

    console.error = message => errorMessages.push(String(message))
    let exitCode
    try {
      exitCode = await runPrivacyCheck({ root, files: [relativePath] })
    } finally {
      console.error = originalConsoleError
    }

    assert.equal(result.violations.length, 1)
    assert.equal(result.violations[0].file, relativePath)
    assert.equal(result.violations[0].line, 1)
    assert.equal(exitCode, 1)
    assert.match(errorMessages.join('\n'), /Privacy check failed/)
    assert.match(errorMessages.join('\n'), /src\/private\.ts:1: console\.warn/)
  })
})

test('rejects multiline, computed, and optional console calls', async () => {
  const source = [
    'console',
    '  .log("client email", email)',
    "console['warn']('client phone', phone)",
    'console?.error?.("client name", name)',
    'console[`debug`]("client address", address)',
    "const method = 'warn'",
    'console[method]("client phone", phone)',
  ].join('\n')

  await withFixture(source, async ({ root, relativePath }) => {
    const result = await scanPrivacyFiles({ root, files: [relativePath] })

    assert.deepEqual(
      result.violations.map(({ file, line, source: violationSource }) => ({
        file,
        line,
        source: violationSource,
      })),
      [
        { file: relativePath, line: 1, source: 'console' },
        { file: relativePath, line: 3, source: "console['warn']('client phone', phone)" },
        { file: relativePath, line: 4, source: 'console?.error?.("client name", name)' },
        { file: relativePath, line: 5, source: 'console[`debug`]("client address", address)' },
        { file: relativePath, line: 7, source: 'console[method]("client phone", phone)' },
      ]
    )
  })
})

test('ignores console-shaped text that is not a call', async () => {
  const source = [
    'const message = "console.log(clientEmail)"',
    '// console.warn(clientPhone)',
    'const logger = { console: { log: clientName } }',
  ].join('\n')

  await withFixture(source, async ({ root, relativePath }) => {
    const result = await scanPrivacyFiles({ root, files: [relativePath] })

    assert.deepEqual(result.violations, [])
  })
})
