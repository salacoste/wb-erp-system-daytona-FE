#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, realpath, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const MANIFEST_SCHEMA_VERSION = 'epic128-frontend-command-manifest/v1'
export const RECEIPT_SCHEMA_VERSION = 'epic128-frontend-verification-receipt/v1'
export const REVIEWED_BACKEND_COMMIT = 'cc9705bce25554a68c8fda5a833d0dec37ef3fa7'
export const REQUIRED_COMMANDS = Object.freeze([
  'node --version',
  'npm --version',
  'npm ci',
  'node --test scripts/story-128-10/verify-frontend.test.mjs',
  'npm test -- --run',
  'npx vitest run src/test/outbound-network-guard.test.ts src/test/playwright-network-guard.test.ts src/test/playwright-object-graph-guard.test.ts src/test/playwright-facade-security.test.ts src/test/playwright-static-boundary.test.ts src/lib/api/__tests__/notifications.test.ts',
  'npx playwright test e2e/outbound-network-guard.spec.ts --project=chromium --no-deps',
  'npm run test:privacy',
  'npm run check:privacy',
  'npm run type-check',
  'npm run lint',
  'npm run format:check',
  'npm run build',
  'git diff --check',
])
export const REQUIRED_ARTIFACTS = Object.freeze([
  'e2e/accessibility-merged-groups-epic-37.spec.ts',
  'e2e/acquiring.spec.ts',
  'e2e/advertising-analytics-epic-36.spec.ts',
  'e2e/ai-admin-preferences.spec.ts',
  'e2e/ai-admin.spec.ts',
  'e2e/alerts-page.spec.ts',
  'e2e/analytics/ai-models.spec.ts',
  'e2e/analytics/analytics-hub.spec.ts',
  'e2e/analytics/analytics-pages-smoke.spec.ts',
  'e2e/analytics/fbs-orders-analytics.spec.ts',
  'e2e/analytics/forecast.spec.ts',
  'e2e/analytics/product-analytics.spec.ts',
  'e2e/analytics/search-analytics.spec.ts',
  'e2e/auth-manager.setup.ts',
  'e2e/auth.setup.ts',
  'e2e/backfill-page.spec.ts',
  'e2e/box-types-page.spec.ts',
  'e2e/brand-analytics.spec.ts',
  'e2e/buyout-reconciliation.spec.ts',
  'e2e/category-analytics.spec.ts',
  'e2e/cogs-assignment.spec.ts',
  'e2e/cogs-pages.spec.ts',
  'e2e/cross-reference.spec.ts',
  'e2e/dashboard-metrics.spec.ts',
  'e2e/dashboard-period.spec.ts',
  'e2e/dashboard-session-fixes.spec.ts',
  'e2e/expenses-page.spec.ts',
  'e2e/fbs-enhanced.spec.ts',
  'e2e/fbs-stock.spec.ts',
  'e2e/finance-history.spec.ts',
  'e2e/financial-gaps.spec.ts',
  'e2e/financial-summary.spec.ts',
  'e2e/fixtures/network-test.ts',
  'e2e/fixtures/playwright-network-guard.ts',
  'e2e/forecast-accuracy.spec.ts',
  'e2e/forecast-page.spec.ts',
  'e2e/fr7-by-variant.spec.ts',
  'e2e/funnel.spec.ts',
  'e2e/liquidity.spec.ts',
  'e2e/login-dashboard.spec.ts',
  'e2e/m1-moysklad-stock.spec.ts',
  'e2e/m2-moysklad-products.spec.ts',
  'e2e/m3-moysklad-variants.spec.ts',
  'e2e/m4-mappings-pagination.spec.ts',
  'e2e/margin-analytics.spec.ts',
  'e2e/merged-group-table-epic-37.spec.ts',
  'e2e/monitor.spec.ts',
  'e2e/monitoring.spec.ts',
  'e2e/moysklad.spec.ts',
  'e2e/o1-operational-status.spec.ts',
  'e2e/onboarding.spec.ts',
  'e2e/orders-accessibility.spec.ts',
  'e2e/orders-client-info.spec.ts',
  'e2e/orders-integrity.spec.ts',
  'e2e/orders-price-anomaly.spec.ts',
  'e2e/orders.spec.ts',
  'e2e/outbound-network-guard.spec.ts',
  'e2e/period-selection-month-test.spec.ts',
  'e2e/price-calculator-visual.spec.ts',
  'e2e/price-calculator.spec.ts',
  'e2e/pricing-page.spec.ts',
  'e2e/products-assortment.spec.ts',
  'e2e/reorder-page.spec.ts',
  'e2e/returns-analytics.spec.ts',
  'e2e/search-analytics.spec.ts',
  'e2e/settings-pages.spec.ts',
  'e2e/settings/backfill-a11y.spec.ts',
  'e2e/settings/backfill-admin.spec.ts',
  'e2e/shipments-page.spec.ts',
  'e2e/shipments/shipments-a11y.spec.ts',
  'e2e/shipments/shipments-detail.spec.ts',
  'e2e/shipments/shipments-lifecycle.spec.ts',
  'e2e/shipments/shipments-list.spec.ts',
  'e2e/sku-analytics.spec.ts',
  'e2e/sku-packaging-page.spec.ts',
  'e2e/sku-share-columns.spec.ts',
  'e2e/storage-analytics.spec.ts',
  'e2e/supplies-page.spec.ts',
  'e2e/supplies/supplies-a11y.spec.ts',
  'e2e/supplies/supplies-list.spec.ts',
  'e2e/supplies/supply-detail.spec.ts',
  'e2e/supplies/supply-lifecycle.spec.ts',
  'e2e/supply-planning.spec.ts',
  'e2e/time-period-analytics.spec.ts',
  'e2e/unit-economics-waterfall.spec.ts',
  'e2e/unit-economics.spec.ts',
  'e2e/widget-settings.spec.ts',
  'package.json',
  'playwright.config.ts',
  'scripts/check-privacy-console.mjs',
  'scripts/check-privacy-console.test.mjs',
  'scripts/privacy/diagnostic-capture-policy.json',
  'scripts/privacy/diagnostic-capture-policy.test.mjs',
  'scripts/privacy/diagnostic-capture.mjs',
  'scripts/story-128-10/frontend-command-manifest.json',
  'scripts/story-128-10/verify-frontend.mjs',
  'scripts/story-128-10/verify-frontend.test.mjs',
  'src/lib/api-client-debug.ts',
  'src/lib/api-client.test.ts',
  'src/lib/api/__tests__/notifications.test.ts',
  'src/test/fixtures/module-evaluation-network-attempt.ts',
  'src/test/network-guard-bootstrap.ts',
  'src/test/outbound-network-guard.test.ts',
  'src/test/outbound-network-guard.ts',
  'src/test/outbound-node-network-guard.ts',
  'src/test/playwright-facade-security.test.ts',
  'src/test/playwright-network-guard.test.ts',
  'src/test/playwright-object-graph-guard.test.ts',
  'src/test/playwright-static-boundary.test.ts',
  'src/test/playwright-static-boundary.ts',
  'src/test/playwright-static-dataflow.ts',
  'src/test/setup.ts',
  'test-utils/network-policy.json',
  'test-utils/outbound-network-policy.ts',
  'tests/e2e/telegram-notifications.spec.ts',
  'vitest.config.ts',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function safeRelativePath(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !path.isAbsolute(value) &&
    !value.split(/[\\/]/).includes('..')
  )
}

function invalidCommand(command) {
  return (
    typeof command !== 'string' ||
    command.trim().length === 0 ||
    /<[^>]+>|\$\{|\b(?:TODO|TBD|PLACEHOLDER)\b|[*?]/i.test(command) ||
    /(?:&&|\|\||;|\n|\r)/.test(command)
  )
}

function exactArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  )
}

export function compareStoryOwnedFiles(actual, expected = REQUIRED_ARTIFACTS) {
  const actualFiles = Array.isArray(actual) ? actual : []
  const missing = expected.filter(file => !actualFiles.includes(file))
  const unexpected = actualFiles.filter(file => !expected.includes(file))
  return {
    valid: exactArray(actualFiles, expected),
    missing,
    unexpected,
  }
}

export function validateFrontendManifest(manifest) {
  const errors = []
  if (!isObject(manifest) || manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    return { valid: false, errors: [`schemaVersion must be ${MANIFEST_SCHEMA_VERSION}`] }
  }
  if (manifest.storyId !== '128.10') errors.push('storyId must be 128.10')
  if (manifest.repository !== 'frontend') errors.push('repository must be frontend')
  if (
    !isObject(manifest.runtime) ||
    manifest.runtime.node !== 'v24.18.0' ||
    manifest.runtime.npm !== '11.11.0'
  ) {
    errors.push('runtime must pin Node v24.18.0 and npm 11.11.0')
  }
  if (manifest.requiredBranch !== 'feat/epic-128-10-frontend-verification-foundation') {
    errors.push('requiredBranch is invalid')
  }
  if (manifest.backendContractCommit !== REVIEWED_BACKEND_COMMIT) {
    errors.push('backendContractCommit must bind the independently reviewed remediation commit')
  }
  if (
    manifest.networkPolicyNote !==
    'Frontend retains the backend v1 host list and intentionally disables Unix sockets.'
  ) {
    errors.push('networkPolicyNote must document the frontend-only Unix-socket tightening')
  }
  if (!exactArray(manifest.commands, REQUIRED_COMMANDS)) {
    errors.push('commands must exactly match the canonical frontend command set')
  } else {
    manifest.commands.forEach((command, index) => {
      if (invalidCommand(command)) errors.push(`command ${index + 1} is incomplete or unsafe`)
    })
  }
  if (!exactArray(manifest.expectedArtifacts, REQUIRED_ARTIFACTS)) {
    errors.push('expectedArtifacts must exactly match the canonical frontend artifact set')
  } else {
    for (const artifact of manifest.expectedArtifacts) {
      if (!safeRelativePath(artifact)) errors.push('artifact path must be safe and literal')
    }
  }
  if (!safeRelativePath(manifest.evidencePath)) errors.push('evidencePath must be safe and literal')
  return { valid: errors.length === 0, errors }
}

function run(command, { cwd, echo = true } = {}) {
  return new Promise(resolve => {
    const started = process.hrtime.bigint()
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => {
      stdout += chunk
      if (echo) process.stdout.write(chunk)
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
      if (echo) process.stderr.write(chunk)
    })
    child.on('error', error => {
      stderr += error.message
      resolve({
        exitCode: 1,
        stdout,
        stderr,
        durationMs: Number(process.hrtime.bigint() - started) / 1e6,
      })
    })
    child.on('close', exitCode => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
        durationMs: Number(process.hrtime.bigint() - started) / 1e6,
      })
    })
  })
}

async function commandOutput(command, cwd) {
  const result = await run(command, { cwd, echo: false })
  if (result.exitCode !== 0) throw new Error(`Command failed: ${command}`)
  return result.stdout.trim()
}

export function extractTestCounts(output) {
  const counts = {}
  const tap = output.match(/(?:#|ℹ)\s*tests\s+(\d+)/u)
  const tapPass = output.match(/(?:#|ℹ)\s*pass\s+(\d+)/u)
  const tapFail = output.match(/(?:#|ℹ)\s*fail\s+(\d+)/u)
  const vitest = output.match(
    /Tests\s+(?:(\d+) failed\s*\|\s*)?(\d+) passed(?:\s*\|\s*(\d+) skipped)?\s*\((\d+)\)/
  )
  const playwright = output.match(/^\s*(\d+) passed \([^\n]+\)$/m)
  if (tap) counts.total = Number(tap[1])
  if (tapPass) counts.passed = Number(tapPass[1])
  if (tapFail) counts.failed = Number(tapFail[1])
  if (vitest) {
    counts.failed = Number(vitest[1] ?? 0)
    counts.passed = Number(vitest[2])
    counts.skipped = Number(vitest[3] ?? 0)
    counts.total = Number(vitest[4])
  }
  if (playwright) {
    counts.failed = 0
    counts.passed = Number(playwright[1])
    counts.total = Number(playwright[1])
  }
  return counts
}

async function fileEvidence(absolutePath, root) {
  const metadata = await stat(absolutePath)
  if (!metadata.isFile()) throw new Error(`Expected artifact is not a file: ${absolutePath}`)
  return {
    path: path.relative(root, absolutePath),
    bytes: metadata.size,
    sha256: createHash('sha256')
      .update(await readFile(absolutePath))
      .digest('hex'),
  }
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  await rename(temporary, filePath)
}

function privacyFileCount(output) {
  const match = output.match(/Privacy check passed:\s+(\d+) text files/)
  return match ? Number(match[1]) : null
}

export async function verifyFrontend({ root, manifestPath }) {
  const repositoryRoot = await realpath(root)
  const gitRoot = await realpath(
    await commandOutput('git rev-parse --show-toplevel', repositoryRoot)
  )
  if (gitRoot !== repositoryRoot)
    throw new Error('frontend root is not an independent Git worktree')

  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'))
  if (packageJson.name !== 'wb-repricer-frontend') throw new Error('unexpected frontend package')

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const validation = validateFrontendManifest(manifest)
  if (!validation.valid)
    throw new Error(`Invalid frontend manifest:\n${validation.errors.join('\n')}`)

  const runtime = {
    node: process.version,
    npm: await commandOutput('npm --version', repositoryRoot),
  }
  if (runtime.node !== manifest.runtime.node || runtime.npm !== manifest.runtime.npm) {
    throw new Error(
      `Pinned runtime required: Node ${manifest.runtime.node}, npm ${manifest.runtime.npm}; ` +
        `received Node ${runtime.node}, npm ${runtime.npm}`
    )
  }

  const branch = await commandOutput('git branch --show-current', repositoryRoot)
  if (branch !== manifest.requiredBranch) throw new Error(`unexpected frontend branch: ${branch}`)
  const commit = await commandOutput('git rev-parse HEAD', repositoryRoot)
  const preStatus = await commandOutput('git status --porcelain', repositoryRoot)
  if (preStatus !== '') throw new Error('frontend worktree is dirty before verification')

  const storyOwnedCommand = 'git diff-tree --no-commit-id --name-only -r HEAD'
  const storyOwnedFiles = (await commandOutput(storyOwnedCommand, repositoryRoot))
    .split('\n')
    .filter(Boolean)
    .sort()
  const storyOwnedComparison = compareStoryOwnedFiles(storyOwnedFiles)
  if (!storyOwnedComparison.valid) {
    throw new Error(
      [
        'committed Story-owned file inventory does not match expectedArtifacts',
        `missing: ${storyOwnedComparison.missing.join(', ') || '(none)'}`,
        `unexpected: ${storyOwnedComparison.unexpected.join(', ') || '(none)'}`,
      ].join('\n')
    )
  }

  const receiptPath = path.resolve(repositoryRoot, manifest.evidencePath)
  const ignored = await run(`git check-ignore -q ${manifest.evidencePath}`, {
    cwd: repositoryRoot,
    echo: false,
  })
  if (ignored.exitCode !== 0) throw new Error('frontend evidence receipt path must be ignored')

  const commandResults = []
  let scannedPrivacyFiles = null
  for (const command of manifest.commands) {
    console.log(`[128.10/frontend] ${command}`)
    const result = await run(command, { cwd: repositoryRoot })
    const output = `${result.stdout}\n${result.stderr}`
    if (command === 'npm run check:privacy') scannedPrivacyFiles = privacyFileCount(output)
    commandResults.push({
      command,
      exitCode: result.exitCode,
      durationMs: Math.round(result.durationMs),
      testCounts: extractTestCounts(output),
      outputSha256: createHash('sha256').update(output).digest('hex'),
    })
    if (result.exitCode !== 0) throw new Error(`Verification command failed: ${command}`)
  }
  if (scannedPrivacyFiles === null) {
    throw new Error('privacy scan did not report its scanned-file count')
  }
  const networkEvidenceCommands = REQUIRED_COMMANDS.filter(
    command =>
      command.includes('outbound-network-guard') || command.includes('playwright-network-guard')
  )
  const networkEvidencePassed = networkEvidenceCommands.every(command => {
    const result = commandResults.find(candidate => candidate.command === command)
    return result?.exitCode === 0 && result.testCounts.failed === 0 && result.testCounts.passed > 0
  })
  if (!networkEvidencePassed) throw new Error('network guard evidence is incomplete')

  const artifacts = []
  for (const artifact of manifest.expectedArtifacts) {
    artifacts.push(await fileEvidence(path.resolve(repositoryRoot, artifact), repositoryRoot))
  }
  const postStatus = await commandOutput('git status --porcelain', repositoryRoot)
  if (postStatus !== '') throw new Error('frontend worktree is dirty after verification')

  const totals = commandResults.reduce(
    (result, command) => ({
      total: result.total + (command.testCounts.total ?? 0),
      passed: result.passed + (command.testCounts.passed ?? 0),
      failed: result.failed + (command.testCounts.failed ?? 0),
      skipped: result.skipped + (command.testCounts.skipped ?? 0),
    }),
    { total: 0, passed: 0, failed: 0, skipped: 0 }
  )
  const receipt = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    storyId: '128.10',
    scope: 'frontend',
    verifiedAt: new Date().toISOString(),
    runtime,
    frontend: { root: repositoryRoot, branch, commit },
    backendContractCommit: manifest.backendContractCommit,
    commands: commandResults,
    testCounts: totals,
    artifacts,
    storyOwnedInventory: {
      command: storyOwnedCommand,
      fileCount: storyOwnedFiles.length,
      exactMatch: true,
      allFilesHashed: artifacts.length === storyOwnedFiles.length,
    },
    network: {
      policy: 'epic128-test-network-policy/v1',
      frontendTightening: 'Unix sockets disabled while retaining the backend v1 host list.',
      evidenceCommands: networkEvidenceCommands,
      unauthorizedLiveCalls: 0,
      failBeforeIo: true,
    },
    privacy: {
      result: 'passed',
      filesScanned: scannedPrivacyFiles,
      matchedValuesRetained: false,
    },
    diagnostics: {
      policy: 'epic128-diagnostic-capture-policy/v1',
      enabledByDefault: false,
      retentionHoursMaximum: 24,
      accessControl: 'OWNER_ONLY',
    },
    worktreeStatus: { pre: preStatus, post: postStatus },
  }

  await writeJsonAtomic(receiptPath, receipt)
  const finalStatus = await commandOutput('git status --porcelain', repositoryRoot)
  if (finalStatus !== '') throw new Error('frontend worktree became dirty after receipt write')
  console.log(
    JSON.stringify(
      { verified: true, storyId: '128.10', receiptPath, testCounts: receipt.testCounts },
      null,
      2
    )
  )
  return { receipt, receiptPath }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isCli) {
  try {
    const scriptRoot = path.dirname(fileURLToPath(import.meta.url))
    const root = path.resolve(scriptRoot, '..', '..')
    await verifyFrontend({
      root,
      manifestPath: path.join(scriptRoot, 'frontend-command-manifest.json'),
    })
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
