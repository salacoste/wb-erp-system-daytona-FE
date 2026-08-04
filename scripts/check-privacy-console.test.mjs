import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

import { PRIVACY_SCAN_ROOTS, runPrivacyCheck, scanPrivacyFiles } from './check-privacy-console.mjs'

const execFileAsync = promisify(execFile)

async function withRoot(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'frontend-privacy-scan-'))
  await mkdir(path.join(root, 'fixtures'))
  try {
    await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function withFixture(source, callback) {
  await withRoot(async root => {
    const relativePath = 'fixtures/private.ts'
    await writeFile(path.join(root, relativePath), source, 'utf8')
    await callback({ root, relativePath })
  })
}

test('accepts sanitized source without console calls', async () => {
  await withFixture('export const clientId = "masked"\n', async ({ root, relativePath }) => {
    const result = await scanPrivacyFiles({ root, files: [relativePath] })
    assert.equal(result.valid, true)
    assert.deepEqual(result.violations, [])
    assert.deepEqual(result.missing, [])
    assert.deepEqual(result.scanned, [relativePath])
  })
})

test('fails closed when a configured file is missing', async () => {
  await withRoot(async root => {
    const messages = []
    const originalConsoleError = console.error
    try {
      console.error = message => messages.push(String(message))
      assert.equal(await runPrivacyCheck({ root, files: ['fixtures/missing.ts'] }), 1)
    } finally {
      console.error = originalConsoleError
    }
    assert.match(messages.join('\n'), /configured file missing/)
  })
})

test('rejects multiline, computed, and optional console calls without retaining source', async () => {
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
    assert.deepEqual(result.violations, [
      { file: relativePath, line: 1, rule: 'console-call' },
      { file: relativePath, line: 3, rule: 'console-call' },
      { file: relativePath, line: 4, rule: 'console-call' },
      { file: relativePath, line: 5, rule: 'console-call' },
      { file: relativePath, line: 7, rule: 'console-call' },
    ])
    assert.equal(JSON.stringify(result).includes('client email'), false)
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

test('detects every Story 128 protected-material rule with redacted results', async t => {
  const scenarios = [
    ['authorization-value', ['Author', 'ization: Bearer constructedCredential123'].join('')],
    ['cookie-value', ['set-', 'coo', 'kie: session=constructedCredential123'].join('')],
    ['browser-storage', ['local', 'Storage = { secret: 1 }'].join('')],
    ['fingerprint-material', ['finger', "printMaterial = 'constructedMaterial123'"].join('')],
    [
      'sensitive-raw-url',
      ['https://example.invalid/path?', 'token=constructedCredential123'].join(''),
    ],
    ['unsanitized-payload', ['raw', "Body = 'constructedPayload123'"].join('')],
    ['token-value', ['wb_', "token = 'constructedCredential123'"].join('')],
    ['raw-browser-capture', ['page.', 'screenshot({ path: value })'].join('')],
    ['raw-browser-diagnostic', ['captured.', 'push(response.', 'url())'].join('')],
  ]

  for (const [rule, content] of scenarios) {
    await t.test(rule, async () => {
      await withRoot(async root => {
        await writeFile(path.join(root, 'fixtures', 'unsafe.txt'), `${content}\n`)
        const result = await scanPrivacyFiles({
          root,
          scanRoots: ['fixtures'],
          includeGitChanges: false,
        })
        assert.equal(result.valid, false)
        assert.deepEqual(result.violations, [{ file: 'fixtures/unsafe.txt', line: 1, rule }])
        assert.equal(JSON.stringify(result).includes('constructedCredential123'), false)
        assert.equal(JSON.stringify(result).includes('constructedMaterial123'), false)
        assert.equal(JSON.stringify(result).includes('constructedPayload123'), false)
      })
    })
  }
})

test('fails closed on a symlink in scan scope', async () => {
  await withRoot(async root => {
    await writeFile(path.join(root, 'outside.txt'), 'sanitized')
    await symlink(path.join(root, 'outside.txt'), path.join(root, 'fixtures', 'linked.txt'))
    const result = await scanPrivacyFiles({
      root,
      scanRoots: ['fixtures'],
      includeGitChanges: false,
    })
    assert.equal(result.valid, false)
    assert.match(result.errors.join('\n'), /symlink/)
  })
})

test('scans Git changes outside maintained roots without retaining matched values', async () => {
  await withRoot(async root => {
    await execFileAsync('git', ['init', '--quiet'], { cwd: root })
    await mkdir(path.join(root, 'outside'))
    const value = ['wb_', "token = 'constructedCredential123'"].join('')
    await writeFile(path.join(root, 'outside', 'changed.ts'), `${value}\n`)
    const result = await scanPrivacyFiles({ root, scanRoots: ['fixtures'] })
    assert.equal(result.valid, false)
    assert.deepEqual(result.violations, [
      { file: 'outside/changed.ts', line: 1, rule: 'token-value' },
    ])
    assert.equal(JSON.stringify(result).includes('constructedCredential123'), false)
  })
})

test('credential-looking test and dummy prefixes remain detected in unrelated Git changes', async () => {
  await withRoot(async root => {
    await execFileAsync('git', ['init', '--quiet'], { cwd: root })
    await mkdir(path.join(root, 'unrelated'))
    const testLikeValue = ['test', 'token', 'like', 'credential123'].join('-')
    const dummyLikeValue = ['dummy', 'cookie', 'like', 'credential123'].join('-')
    const content = [
      ['Author', `ization: Bearer ${testLikeValue}`].join(''),
      ['set-', 'coo', `kie: session=${dummyLikeValue}`].join(''),
    ].join('\n')
    await writeFile(path.join(root, 'unrelated', 'changed.ts'), `${content}\n`)

    const result = await scanPrivacyFiles({ root, scanRoots: ['fixtures'] })
    assert.equal(result.valid, false)
    assert.deepEqual(result.violations, [
      { file: 'unrelated/changed.ts', line: 1, rule: 'authorization-value' },
      { file: 'unrelated/changed.ts', line: 2, rule: 'cookie-value' },
    ])
    assert.equal(JSON.stringify(result).includes(testLikeValue), false)
    assert.equal(JSON.stringify(result).includes(dummyLikeValue), false)
  })
})

test('scans Markdown and environment text without retaining matched values', async () => {
  await withRoot(async root => {
    const markdownValue = ['wb_', 'token', " = 'constructedCredential123'"].join('')
    const environmentValue = ['Author', 'ization=Bearer constructedCredential456'].join('')
    await writeFile(path.join(root, 'fixtures', 'evidence.md'), `${markdownValue}\n`)
    await writeFile(path.join(root, 'fixtures', '.env.test'), `${environmentValue}\n`)

    const result = await scanPrivacyFiles({
      root,
      files: ['fixtures/evidence.md', 'fixtures/.env.test'],
    })
    assert.equal(result.valid, false)
    assert.deepEqual(result.violations, [
      { file: 'fixtures/.env.test', line: 1, rule: 'authorization-value' },
      { file: 'fixtures/evidence.md', line: 1, rule: 'token-value' },
    ])
    assert.equal(JSON.stringify(result).includes('constructedCredential'), false)
  })
})

test('scans .cursorrules text while unsupported extensions still fail closed', async () => {
  await withRoot(async root => {
    await writeFile(path.join(root, '.cursorrules'), 'sanitized project guidance\n')
    await writeFile(path.join(root, 'fixtures', 'policy.unsupported'), 'sanitized\n')

    const cursorRules = await scanPrivacyFiles({ root, files: ['.cursorrules'] })
    assert.equal(cursorRules.valid, true)
    assert.deepEqual(cursorRules.scanned, ['.cursorrules'])

    const unsupported = await scanPrivacyFiles({
      root,
      files: ['fixtures/policy.unsupported'],
    })
    assert.equal(unsupported.valid, false)
    assert.deepEqual(unsupported.scanned, [])
    assert.deepEqual(unsupported.errors, [
      'unsupported file type in scan scope: fixtures/policy.unsupported',
    ])
  })
})

test('detects unquoted and multiline authorization values across full file content', async () => {
  await withRoot(async root => {
    const first = ['Author', 'ization: ', 'constructedCredential123'].join('')
    const second = [['Author', 'ization ='].join(''), 'Bearer', 'constructedCredential456'].join(
      '\n'
    )
    await writeFile(path.join(root, 'fixtures', 'multiline.txt'), `${first}\n${second}\n`)

    const result = await scanPrivacyFiles({
      root,
      scanRoots: ['fixtures'],
      includeGitChanges: false,
    })
    assert.deepEqual(result.violations, [
      { file: 'fixtures/multiline.txt', line: 1, rule: 'authorization-value' },
      { file: 'fixtures/multiline.txt', line: 2, rule: 'authorization-value' },
    ])
    assert.equal(JSON.stringify(result).includes('constructedCredential'), false)
  })
})

test('scans maintained shell, stylesheet, and sensitive console diagnostics', async () => {
  await withRoot(async root => {
    await mkdir(path.join(root, 'src'))
    const shellValue = ['wb_', 'token', " = 'constructedCredential123'"].join('')
    const cssValue = ['Author', 'ization: constructedCredential456'].join('')
    const diagnostic = ['console.log(', "  'Raw ' + 'response',", '  response', ')'].join('\n')
    await writeFile(path.join(root, 'src', 'maintained.sh'), `${shellValue}\n`)
    await writeFile(path.join(root, 'src', 'maintained.css'), `${cssValue}\n`)
    await writeFile(path.join(root, 'src', 'diagnostic.ts'), `${diagnostic}\n`)

    const result = await scanPrivacyFiles({
      root,
      scanRoots: ['src'],
      includeGitChanges: false,
    })
    assert.deepEqual(result.violations, [
      { file: 'src/diagnostic.ts', line: 1, rule: 'console-call' },
      { file: 'src/maintained.css', line: 1, rule: 'authorization-value' },
      { file: 'src/maintained.sh', line: 1, rule: 'token-value' },
    ])
    assert.equal(JSON.stringify(result).includes('constructedCredential'), false)
  })
})

test('fails closed on unsupported, NUL-bearing, and invalid UTF-8 files in scope', async () => {
  await withRoot(async root => {
    await execFileAsync('git', ['init', '--quiet'], { cwd: root })
    await mkdir(path.join(root, 'unrelated'))
    await writeFile(path.join(root, 'unrelated', 'changed.unsupported'), 'sanitized\n')
    await writeFile(path.join(root, 'fixtures', 'binary.txt'), Buffer.from([0, 1, 2, 3]))
    await writeFile(path.join(root, 'fixtures', 'invalid-utf8.txt'), Buffer.from([0xc3, 0x28]))

    const changedResult = await scanPrivacyFiles({ root, scanRoots: ['fixtures'] })
    assert.equal(changedResult.valid, false)
    assert.match(changedResult.errors.join('\n'), /unsupported file type in scan scope/)
    assert.match(changedResult.errors.join('\n'), /non-text file is not allowed in scan scope/)
    assert.equal(changedResult.binaryFiles, 2)

    const explicitBinary = await scanPrivacyFiles({
      root,
      files: ['fixtures/binary.txt'],
      includeGitChanges: false,
    })
    assert.equal(explicitBinary.valid, false)
    assert.match(explicitBinary.errors.join('\n'), /non-text file is not allowed in scan scope/)

    const explicitInvalidUtf8 = await scanPrivacyFiles({
      root,
      files: ['fixtures/invalid-utf8.txt'],
      includeGitChanges: false,
    })
    assert.equal(explicitInvalidUtf8.valid, false)
    assert.match(
      explicitInvalidUtf8.errors.join('\n'),
      /non-text file is not allowed in scan scope/
    )
  })
})

test('scans protected checker and policy test files with redacted violations', async () => {
  await withRoot(async root => {
    await execFileAsync('git', ['init', '--quiet'], { cwd: root })
    await mkdir(path.join(root, 'scripts', 'privacy'), { recursive: true })
    const value = ['wb_', 'token', " = 'constructedCredential123'"].join('')
    const protectedPaths = [
      'scripts/check-privacy-console.mjs',
      'scripts/check-privacy-console.test.mjs',
      'scripts/privacy/diagnostic-capture-policy.test.mjs',
    ]
    for (const protectedPath of protectedPaths) {
      await writeFile(path.join(root, protectedPath), `${value}\n`)
    }

    const result = await scanPrivacyFiles({ root, scanRoots: [] })
    assert.equal(result.valid, false)
    assert.deepEqual(
      result.violations,
      protectedPaths.map(file => ({ file, line: 1, rule: 'token-value' }))
    )
    assert.equal(JSON.stringify(result).includes('constructedCredential123'), false)
  })
})

test('recurring clean-tree roots include maintained tests and test utilities', async () => {
  assert.equal(PRIVACY_SCAN_ROOTS.includes('tests'), true)
  assert.equal(PRIVACY_SCAN_ROOTS.includes('test-utils'), true)

  await withRoot(async root => {
    await mkdir(path.join(root, 'tests'))
    await mkdir(path.join(root, 'test-utils'))
    const value = ['wb_', 'token', " = 'constructedCredential123'"].join('')
    await writeFile(path.join(root, 'tests', 'maintained.test.ts'), `${value}\n`)
    await writeFile(path.join(root, 'test-utils', 'maintained.ts'), `${value}\n`)
    const result = await scanPrivacyFiles({
      root,
      scanRoots: PRIVACY_SCAN_ROOTS.filter(candidate =>
        ['tests', 'test-utils'].includes(candidate)
      ),
      includeGitChanges: false,
    })
    assert.deepEqual(result.violations, [
      { file: 'test-utils/maintained.ts', line: 1, rule: 'token-value' },
      { file: 'tests/maintained.test.ts', line: 1, rule: 'token-value' },
    ])
    assert.equal(JSON.stringify(result).includes('constructedCredential123'), false)
  })
})
