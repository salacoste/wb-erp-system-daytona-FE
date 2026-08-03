#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  chmodSync,
  createWriteStream,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const METRICS = ['statements', 'branches', 'functions', 'lines']
const SELECTION_SCHEMA = './schemas/coverage-policy-selection.v1.json'
const WAIVER_SCHEMA = '../coverage-waiver.schema.json'
const SELECTION_FIELDS = ['$schema', 'mode', 'schemaVersion', 'thresholdPolicy', 'waiver']
const WAIVER_FIELDS = [
  '$schema',
  'approvals',
  'baselineReduction',
  'controls',
  'created_at',
  'expires_at',
  'issue',
  'metrics',
  'mode',
  'owner',
  'reason',
  'revocation',
  'schemaVersion',
  'scope',
]
const WAIVER_VALIDATION_FIELDS = [
  'approvals',
  'baselineReduction',
  'controls',
  'created_at',
  'expires_at',
  'issue',
  'metrics',
  'mode',
  'owner',
  'reason',
  'result',
  'revocation',
  'schemaVersion',
  'scope',
  'selectedPolicy',
  'selectedPolicyDigest',
  'selectionDigest',
  'validatedAt',
]
const CANONICAL_THRESHOLD_POLICY = 'quality/coverage-policy.v1.json'
const CANONICAL_SELECTION = 'quality/coverage-policy-selection.v1.json'
const CANONICAL_WAIVER_PATTERN =
  /^quality\/coverage-waivers\/[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?\.v1\.json$/
const SELECTION_PATH = join(ROOT, 'quality/coverage-policy-selection.v1.json')
const VITEST_PATH = join(ROOT, 'node_modules/vitest/vitest.mjs')
const COVERAGE_SCOPE = readJson(join(ROOT, 'quality/coverage-scope.v1.json'))

function fail(message) {
  throw new Error(message)
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(key => [key, stable(value[key])])
    )
  }
  return value
}

function digestJson(value) {
  return sha256(JSON.stringify(stable(value)))
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
}

function exactPercentage(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100
}

export function normalizeSummary(summary) {
  const total = summary?.total
  if (!total || typeof total !== 'object') fail('coverage summary must contain a total object')

  const normalized = {}
  for (const metric of METRICS) {
    const value = total[metric]
    if (!value || !Number.isInteger(value.total) || !Number.isInteger(value.covered)) {
      fail(`coverage summary is missing integer ${metric} counts`)
    }
    if (value.total < 0 || value.covered < 0 || value.covered > value.total) {
      fail(`coverage summary has invalid ${metric} counts`)
    }
    normalized[metric] = {
      total: value.total,
      covered: value.covered,
      uncovered: value.total - value.covered,
      percentage: exactPercentage(value.covered, value.total),
    }
  }
  return normalized
}

export function deriveThresholdPolicy(summary, epsilonPercentagePoints = 0.01) {
  if (epsilonPercentagePoints !== 0.01)
    fail('coverage epsilon must be exactly 0.01 percentage points')
  const baseline = normalizeSummary(summary)
  const thresholds = {}
  for (const metric of METRICS) {
    thresholds[metric] = baseline[metric].uncovered === 0 ? 100 : -baseline[metric].uncovered
  }
  return {
    schemaVersion: 1,
    mode: 'threshold',
    epsilonPercentagePoints,
    baseline,
    vitestThresholds: thresholds,
  }
}

export function validateThresholdPolicy(policy) {
  if (policy?.schemaVersion !== 1 || policy.mode !== 'threshold')
    fail('invalid threshold policy identity')
  if (policy.epsilonPercentagePoints !== 0.01) fail('threshold policy epsilon must equal 0.01')
  for (const metric of METRICS) {
    const baseline = policy.baseline?.[metric]
    if (!baseline || !Number.isInteger(baseline.total) || !Number.isInteger(baseline.covered)) {
      fail(`threshold policy is missing ${metric} baseline counts`)
    }
    if (baseline.uncovered !== baseline.total - baseline.covered) {
      fail(`${metric} uncovered baseline is not derived from total-covered`)
    }
    const expected = baseline.uncovered === 0 ? 100 : -baseline.uncovered
    if (policy.vitestThresholds?.[metric] !== expected) {
      fail(`${metric} threshold is not derived from uncovered baseline count`)
    }
    const expectedPercentage = exactPercentage(baseline.covered, baseline.total)
    if (Math.abs(baseline.percentage - expectedPercentage) > Number.EPSILON * 100) {
      fail(`${metric} baseline percentage is not derived from covered/total`)
    }
  }
  return policy
}

export function assertCoverage(summary, policy) {
  validateThresholdPolicy(policy)
  const actual = normalizeSummary(summary)
  const failures = []
  for (const metric of METRICS) {
    const baseline = policy.baseline[metric]
    const floor = baseline.percentage - policy.epsilonPercentagePoints
    if (actual[metric].percentage < floor) {
      failures.push(`${metric}: ${actual[metric].percentage} < ${floor}`)
    }
    if (actual[metric].uncovered > baseline.uncovered) {
      failures.push(`${metric}: ${actual[metric].uncovered} uncovered > ${baseline.uncovered}`)
    }
  }
  if (failures.length) fail(`coverage policy breach: ${failures.join('; ')}`)
  return actual
}

function parseIso(value, field) {
  if (typeof value !== 'string') fail(`waiver ${field} must be an ISO timestamp`)
  const time = Date.parse(value)
  if (!Number.isFinite(time)) fail(`waiver ${field} must be an ISO timestamp`)
  return time
}

export function validateWaiver(waiver, now = new Date()) {
  if (!waiver || typeof waiver !== 'object' || Array.isArray(waiver))
    fail('invalid waiver identity')
  const fields = Object.keys(waiver).sort()
  if (
    fields.length !== WAIVER_FIELDS.length ||
    fields.some((field, index) => field !== WAIVER_FIELDS[index])
  )
    fail('waiver contains missing or unexpected fields')
  if (waiver.$schema !== WAIVER_SCHEMA) fail('waiver requires the canonical $schema')
  if (waiver.schemaVersion !== 1 || waiver.mode !== 'waiver') fail('invalid waiver identity')
  if (
    [waiver.owner, waiver.issue, waiver.reason, waiver.scope].some(
      value => typeof value !== 'string' || value.length === 0
    )
  )
    fail('waiver requires owner, issue, reason, and scope')
  if (
    !Array.isArray(waiver.metrics) ||
    waiver.metrics.length !== METRICS.length ||
    waiver.metrics.some((metric, index) => metric !== METRICS[index])
  ) {
    fail('waiver metrics must be statements, branches, functions, and lines')
  }
  if (waiver.scope !== 'frontend-global-coverage-non-regression')
    fail('waiver scope is not approved')
  if (waiver.baselineReduction !== false) fail('waiver cannot approve a baseline reduction')
  if (
    [waiver.controls, waiver.revocation].some(
      value => typeof value !== 'string' || value.length === 0
    )
  )
    fail('waiver requires controls and revocation conditions')
  const nowTime = now instanceof Date ? now.getTime() : Number.NaN
  if (!Number.isFinite(nowTime)) fail('waiver validation clock must be a valid date')
  const issuedAt = parseIso(waiver.created_at, 'created_at')
  const expiresAt = parseIso(waiver.expires_at, 'expires_at')
  if (issuedAt > nowTime) fail('waiver created_at cannot be in the future')
  if (expiresAt <= nowTime) fail('waiver is expired')
  if (expiresAt - issuedAt > 14 * 24 * 60 * 60 * 1000) fail('waiver lifetime exceeds 14 days')
  if (!Array.isArray(waiver.approvals)) fail('waiver approvals must be an array')
  const roles = new Map()
  for (const approval of waiver.approvals ?? []) {
    const approvalFields = Object.keys(approval ?? {}).sort()
    if (
      approvalFields.length !== 3 ||
      approvalFields.some((field, index) => field !== ['approved_at', 'name', 'role'][index])
    ) {
      fail('waiver approval contains missing or unexpected fields')
    }
    if (!approval?.name || !approval?.role || !approval?.approved_at)
      fail('waiver approval is incomplete')
    if (!['Frontend Tech Lead', 'QA Owner'].includes(approval.role))
      fail(`waiver approval role is not approved: ${approval.role}`)
    const approvedAt = parseIso(approval.approved_at, 'approval approved_at')
    if (approvedAt < issuedAt) fail('waiver approval approved_at cannot precede created_at')
    if (approvedAt > nowTime) fail('waiver approval approved_at cannot be in the future')
    roles.set(approval.role, approval)
  }
  for (const role of ['Frontend Tech Lead', 'QA Owner']) {
    if (!roles.has(role)) fail(`waiver requires named ${role} approval`)
  }
  return waiver
}

function isWithinRoot(root, candidate) {
  const pathFromRoot = relative(root, candidate)
  return pathFromRoot === '' || (!isAbsolute(pathFromRoot) && !pathFromRoot.startsWith('..'))
}

function resolveTrackedRepositoryFile(root, repositoryPath, description) {
  if (isAbsolute(repositoryPath)) fail(`${description} path must be repository-relative`)
  if (repositoryPath.split(/[\\/]/).includes('..'))
    fail(`${description} path cannot contain traversal`)

  const rootRealpath = realpathSync(root)
  if (!statSync(rootRealpath).isDirectory()) fail('coverage policy root must be a directory')
  const candidate = resolve(rootRealpath, repositoryPath)
  if (!isWithinRoot(rootRealpath, candidate)) fail(`${description} path is outside the repository`)

  let component = rootRealpath
  for (const segment of repositoryPath.split('/')) {
    component = join(component, segment)
    if (lstatSync(component).isSymbolicLink())
      fail(`${description} path cannot contain a symbolic link`)
  }
  if (!lstatSync(candidate).isFile()) fail(`${description} must be a regular file`)

  const candidateRealpath = realpathSync(candidate)
  if (!isWithinRoot(rootRealpath, candidateRealpath))
    fail(`${description} realpath is outside the repository`)

  const repository = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: rootRealpath,
    encoding: 'utf8',
  })
  if (repository.status !== 0) fail('coverage policy root must be a git repository')
  if (realpathSync(repository.stdout.trim()) !== rootRealpath)
    fail('coverage policy root must be the git repository root')
  const candidateRepository = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: dirname(candidateRealpath),
    encoding: 'utf8',
  })
  if (candidateRepository.status !== 0) fail(`${description} must belong to the repository`)
  if (realpathSync(candidateRepository.stdout.trim()) !== rootRealpath)
    fail(`${description} cannot cross a nested git repository boundary`)
  const tracked = spawnSync('git', ['ls-files', '--error-unmatch', '--', repositoryPath], {
    cwd: rootRealpath,
    encoding: 'utf8',
  })
  if (tracked.status !== 0) fail(`${description} must be tracked by git`)

  return { path: candidateRealpath, repositoryPath }
}

function resolveSelectedPolicy(root, repositoryPath, mode) {
  if (isAbsolute(repositoryPath)) fail('selected policy path must be repository-relative')
  if (repositoryPath.split(/[\\/]/).includes('..'))
    fail('selected policy path cannot contain traversal')
  if (mode === 'threshold' && repositoryPath !== CANONICAL_THRESHOLD_POLICY) {
    fail(`threshold mode requires canonical threshold policy ${CANONICAL_THRESHOLD_POLICY}`)
  }
  if (mode === 'waiver' && !CANONICAL_WAIVER_PATTERN.test(repositoryPath)) {
    fail('waiver mode requires quality/coverage-waivers/<name>.v1.json')
  }
  return resolveTrackedRepositoryFile(root, repositoryPath, `${mode} policy`)
}

export function validateSelection(selection, { root = ROOT, now = new Date() } = {}) {
  if (!selection || typeof selection !== 'object' || Array.isArray(selection))
    fail('invalid coverage policy selection')
  if (selection.$schema !== SELECTION_SCHEMA)
    fail('coverage policy selection requires the canonical $schema')
  const fields = Object.keys(selection).sort()
  if (
    fields.length !== SELECTION_FIELDS.length ||
    fields.some((field, index) => field !== SELECTION_FIELDS[index])
  ) {
    fail('coverage policy selection contains an unexpected field')
  }
  if (selection.schemaVersion !== 1) fail('invalid coverage policy selection')
  const thresholdActive =
    typeof selection.thresholdPolicy === 'string' && selection.thresholdPolicy.length > 0
  const waiverActive = typeof selection.waiver === 'string' && selection.waiver.length > 0
  if (thresholdActive === waiverActive)
    fail('exactly one of thresholdPolicy or waiver must be active')
  if (selection.mode === 'threshold' && thresholdActive && selection.waiver === null) {
    const { path, repositoryPath: selectedPolicyPath } = resolveSelectedPolicy(
      root,
      selection.thresholdPolicy,
      'threshold'
    )
    const selectedPolicy = validateThresholdPolicy(readJson(path))
    return {
      mode: 'threshold',
      path,
      selectedPolicyPath,
      selectedPolicy,
      selectedPolicyDigest: sha256(readFileSync(path)),
    }
  }
  if (selection.mode === 'waiver' && waiverActive && selection.thresholdPolicy === null) {
    const { path, repositoryPath: selectedPolicyPath } = resolveSelectedPolicy(
      root,
      selection.waiver,
      'waiver'
    )
    const selectedPolicy = validateWaiver(readJson(path), now)
    return {
      mode: 'waiver',
      path,
      selectedPolicyPath,
      selectedPolicy,
      selectedPolicyDigest: sha256(readFileSync(path)),
    }
  }
  fail('coverage selection mode does not match its active branch')
}

function git(...args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' })
  if (result.status !== 0) fail(`git ${args.join(' ')} failed: ${result.stderr.trim()}`)
  return result.stdout.trim()
}

function candidatePaths() {
  return git('ls-files', '-co', '--exclude-standard', '-z')
    .split('\0')
    .filter(Boolean)
    .filter(path => !path.startsWith('.omx/'))
    .sort()
}

function sourceIdentity(requiredPaths = []) {
  const paths = candidatePaths()
  for (const path of requiredPaths) {
    if (!paths.includes(path))
      fail(`coverage source identity is missing canonical policy input: ${path}`)
  }
  const content = createHash('sha256')
  for (const path of paths) {
    const absolute = join(ROOT, path)
    const info = lstatSync(absolute)
    content.update(`${path}\0${info.mode.toString(8)}\0`)
    content.update(info.isSymbolicLink() ? readlinkSync(absolute) : readFileSync(absolute))
    content.update('\0')
  }
  return {
    revision: git('rev-parse', 'HEAD'),
    headTree: git('rev-parse', 'HEAD^{tree}'),
    indexTree: git('write-tree'),
    pathSetDigest: sha256(paths.join('\n')),
    contentDigest: content.digest('hex'),
    pathCount: paths.length,
  }
}

function packageVersion(packageName) {
  return readJson(join(ROOT, 'node_modules', packageName, 'package.json')).version
}

export function validateToolchain({ root = ROOT, requireInstalled = true } = {}) {
  const manifest = readJson(join(root, 'package.json'))
  const lock = readJson(join(root, 'package-lock.json'))
  for (const packageName of ['vitest', '@vitest/coverage-v8']) {
    if (manifest.devDependencies?.[packageName] !== '4.1.10') {
      fail(`${packageName} manifest version must be exactly 4.1.10`)
    }
    if (lock.packages?.['']?.devDependencies?.[packageName] !== '4.1.10') {
      fail(`${packageName} lock root version must be exactly 4.1.10`)
    }
    const packageEntries = Object.entries(lock.packages ?? {}).filter(
      ([path]) =>
        path === `node_modules/${packageName}` || path.endsWith(`/node_modules/${packageName}`)
    )
    if (!packageEntries.length || packageEntries.some(([, value]) => value.version !== '4.1.10')) {
      fail(`${packageName} lock contains a missing or conflicting version`)
    }
    if (
      requireInstalled &&
      readJson(join(root, 'node_modules', packageName, 'package.json')).version !== '4.1.10'
    ) {
      fail(`${packageName} installed version must be exactly 4.1.10`)
    }
  }
  if (COVERAGE_SCOPE.provider !== 'v8') fail('coverage provider must be v8')
  if (!COVERAGE_SCOPE.reporter.includes('json-summary'))
    fail('coverage reporters must include json-summary')
  return {
    vitest: '4.1.10',
    coverageV8: '4.1.10',
    provider: 'v8',
    lockDigest: sha256(readFileSync(join(root, 'package-lock.json'))),
  }
}

function runSync(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', ...options })
  if (result.status !== 0)
    fail(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`)
  return result.stdout.trim()
}

function npmVersion() {
  const npmExecutable = process.env.npm_execpath || runSync('which', ['npm'])
  const npmCli = realpathSync(npmExecutable)
  return runSync(process.execPath, [npmCli, '--version'])
}

function resolvedTestPaths(workDir) {
  const output = join(workDir, '.resolved-test-paths.json')
  runSync(process.execPath, [
    VITEST_PATH,
    'list',
    '--filesOnly',
    '--staticParse',
    `--json=${output}`,
  ])
  const raw = readJson(output)
  rmSync(output)
  const paths = (Array.isArray(raw) ? raw : (raw.files ?? []))
    .map(entry => (typeof entry === 'string' ? entry : entry.file))
    .map(path => relative(ROOT, path).replaceAll('\\', '/'))
    .sort()
  if (!paths.length) fail('Vitest resolved no test paths')
  return paths
}

function activePolicy() {
  const selection = resolveTrackedRepositoryFile(ROOT, CANONICAL_SELECTION, 'coverage selection')
  return {
    ...validateSelection(readJson(selection.path)),
    selectionDigest: sha256(readFileSync(selection.path)),
  }
}

export function validateExecutionMode(requestedMode, selection) {
  if (!['measurement', 'threshold', 'waiver'].includes(requestedMode))
    fail(`unsupported coverage mode: ${requestedMode}`)
  if (requestedMode !== 'measurement' && requestedMode !== selection.mode) {
    fail(`requested ${requestedMode} mode does not match active ${selection.mode} policy`)
  }
  return requestedMode
}

function waiverValidationRecord(selection, now = new Date()) {
  if (selection.mode !== 'waiver') fail('waiver validation requires an active waiver policy')
  const waiver = validateWaiver(selection.selectedPolicy, now)
  return {
    schemaVersion: 1,
    result: 'PASS',
    mode: 'waiver',
    selectedPolicy: selection.selectedPolicyPath,
    selectedPolicyDigest: selection.selectedPolicyDigest,
    selectionDigest: selection.selectionDigest,
    owner: waiver.owner,
    issue: waiver.issue,
    reason: waiver.reason,
    metrics: waiver.metrics,
    scope: waiver.scope,
    baselineReduction: waiver.baselineReduction,
    controls: waiver.controls,
    revocation: waiver.revocation,
    created_at: waiver.created_at,
    expires_at: waiver.expires_at,
    approvals: waiver.approvals,
    validatedAt: now.toISOString(),
  }
}

export function writeWaiverValidationArtifact(outputDir, selection, now = new Date()) {
  const path = join(outputDir, 'waiver-validation.json')
  writeJson(path, waiverValidationRecord(selection, now))
  chmodSync(path, 0o444)
  return path
}

function createIdentity(outputDir, commandRecord) {
  validateToolchain()
  const selection = activePolicy()
  const testPaths = resolvedTestPaths(outputDir)
  const vitestVersion = packageVersion('vitest')
  const coverageVersion = packageVersion('@vitest/coverage-v8')
  const source = sourceIdentity([CANONICAL_SELECTION, selection.selectedPolicyPath])
  const identity = {
    schemaVersion: 1,
    provider: {
      runner: 'vitest',
      runnerVersion: vitestVersion,
      name: 'v8',
      package: '@vitest/coverage-v8',
      packageVersion: coverageVersion,
      major: Number(coverageVersion.split('.')[0]),
    },
    scope: COVERAGE_SCOPE,
    scopeDigest: digestJson(COVERAGE_SCOPE),
    resolvedTestPaths: testPaths,
    resolvedTestPathDigest: sha256(testPaths.join('\n')),
    source,
    sourceRevision: source.revision,
    indexTree: source.indexTree,
    pathSet: source.pathSetDigest,
    lockDigest: sha256(readFileSync(join(ROOT, 'package-lock.json'))),
    policyMode: selection.mode,
    policyPath: selection.selectedPolicyPath,
    policyDigest: selection.selectedPolicyDigest,
    policySelectionDigest: selection.selectionDigest,
    runtime: {
      node: process.version,
      npm: npmVersion(),
      platform: process.platform,
      arch: process.arch,
    },
    warnings: { migrationConfigurationDeprecation: [], status: 'resolved' },
    commandRecordDigest: digestJson(commandRecord),
  }
  const waiverValidationPath = join(outputDir, 'waiver-validation.json')
  if (selection.mode === 'waiver' && existsSync(waiverValidationPath)) {
    identity.waiverValidationDigest = sha256(readFileSync(waiverValidationPath))
  }
  return identity
}

function ensureNode24() {
  if (process.version !== 'v24.18.0')
    fail(`coverage certification requires Node v24.18.0; got ${process.version}`)
  const actualNpmVersion = npmVersion()
  if (actualNpmVersion !== '11.11.0')
    fail(`coverage certification requires npm 11.11.0; got ${actualNpmVersion}`)
}

function ensureNewDirectory(path) {
  if (existsSync(path)) fail(`coverage artifact directory already exists: ${path}`)
  mkdirSync(path, { recursive: true })
}

function migrationWarnings(report) {
  const patterns = [
    /CJS build of Vite's Node API is deprecated/i,
    /option was specified by .* plugin.*deprecated/i,
    /Both esbuild and oxc options were set/i,
    /coverage provider.*deprecated/i,
  ]
  return report.split('\n').filter(line => patterns.some(pattern => pattern.test(line)))
}

async function spawnLogged(command, args, { env, reportPath }) {
  const report = createWriteStream(reportPath, { flags: 'wx' })
  const child = spawn(command, args, { cwd: ROOT, env: { ...process.env, ...env } })
  child.stdout.on('data', chunk => {
    process.stdout.write(chunk)
    report.write(chunk)
  })
  child.stderr.on('data', chunk => {
    process.stderr.write(chunk)
    report.write(chunk)
  })
  const exitCode = await new Promise((resolveExit, reject) => {
    child.on('error', reject)
    child.on('close', (code, signal) => resolveExit(signal ? 128 : (code ?? 1)))
  })
  await new Promise(resolveClose => report.end(resolveClose))
  return exitCode
}

async function runCoverage(mode, outputDir) {
  ensureNode24()
  const selection = activePolicy()
  validateExecutionMode(mode, selection)
  ensureNewDirectory(outputDir)
  const startedAt = new Date().toISOString()
  const args = [
    VITEST_PATH,
    '--run',
    '--coverage',
    '--maxWorkers=2',
    `--coverage.reportsDirectory=${outputDir}`,
  ]
  const temporaryReport = `${outputDir}.report-${process.pid}.tmp`
  const exitCode = await spawnLogged(process.execPath, args, {
    env: { COVERAGE_GOVERNANCE_MODE: mode },
    // Vitest cleans reportsDirectory at startup. Capture beside it, then move
    // the completed transcript into the artifact directory.
    reportPath: temporaryReport,
  })
  renameSync(temporaryReport, join(outputDir, 'report.txt'))
  const commandRecord = {
    schemaVersion: 1,
    mode,
    command: [process.execPath, ...args],
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode,
  }
  writeJson(join(outputDir, 'command.json'), commandRecord)
  if (exitCode !== 0) fail(`Vitest coverage exited ${exitCode}`)
  const reportText = readFileSync(join(outputDir, 'report.txt'), 'utf8')
  const warnings = migrationWarnings(reportText)
  if (warnings.length) fail(`unresolved coverage migration warnings:\n${warnings.join('\n')}`)
  const summaryPath = join(outputDir, 'coverage-summary.json')
  if (!existsSync(summaryPath) || statSync(summaryPath).size === 0)
    fail('coverage-summary.json is missing or empty')
  const summary = readJson(summaryPath)
  normalizeSummary(summary)
  if (mode === 'threshold') assertCoverage(summary, selection.selectedPolicy)
  if (mode === 'waiver') writeWaiverValidationArtifact(outputDir, selection)
  writeJson(join(outputDir, 'identity.json'), createIdentity(outputDir, commandRecord))
  const summaryValidation = {
    schemaVersion: 1,
    mode,
    metrics: normalizeSummary(summary),
    result: 'PASS',
  }
  if (mode === 'threshold')
    summaryValidation.epsilonPercentagePoints = selection.selectedPolicy.epsilonPercentagePoints
  if (mode === 'waiver') summaryValidation.selectedPolicyDigest = selection.selectedPolicyDigest
  writeJson(join(outputDir, 'summary-validation.json'), summaryValidation)
  sealDirectory(outputDir)
}

function sealDirectory(root) {
  const entries = readdirSync(root, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) sealDirectory(path)
    else chmodSync(path, 0o444)
  }
  chmodSync(root, 0o555)
}

function assertSealedDirectory(path) {
  if (!statSync(path).isDirectory()) fail(`${path} is not a directory`)
  if ((statSync(path).mode & 0o222) !== 0) fail(`${path} is not sealed read-only`)
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) assertSealedDirectory(child)
    else if ((statSync(child).mode & 0o222) !== 0) fail(`${child} is not sealed read-only`)
  }
}

function option(name, fallback) {
  const argv = process.argv.slice(3)
  const index = argv.indexOf(`--${name}`)
  const inline = argv.find(value => value.startsWith(`--${name}=`))
  if (inline) return inline.slice(inline.indexOf('=') + 1)
  if (index >= 0) return argv[index + 1]
  return fallback
}

function requireOption(name) {
  const value = option(name)
  if (!value) fail(`--${name} is required`)
  return resolve(ROOT, value)
}

function assertExclusive(outputPath) {
  if (process.env.COVERAGE_WAIVER_PATH)
    fail('environment waiver cannot be combined with the versioned selection')
  const selection = activePolicy()
  writeJson(outputPath, {
    schemaVersion: 1,
    mode: selection.mode,
    selectedPolicy: relative(ROOT, selection.path),
    selectedPolicyDigest: selection.selectedPolicyDigest,
    selectionDigest: sha256(readFileSync(SELECTION_PATH)),
    validatedAt: new Date().toISOString(),
  })
  chmodSync(outputPath, 0o444)
}

function mutateSummaryForBreach(summary, policy) {
  const copy = structuredClone(summary)
  const candidate = METRICS.find(metric => policy.baseline[metric].covered > 0)
  if (!candidate) fail('cannot construct negative coverage fixture from zero-covered baseline')
  const baseline = policy.baseline[candidate]
  const requiredDrop = Math.max(
    1,
    Math.ceil((baseline.total * (policy.epsilonPercentagePoints + 0.01)) / 100)
  )
  copy.total[candidate].covered = Math.max(0, baseline.covered - requiredDrop)
  copy.total[candidate].pct = exactPercentage(
    copy.total[candidate].covered,
    copy.total[candidate].total
  )
  return copy
}

export function assertExpectedCoverageBreach(result) {
  if (result.status !== 1 || !/^coverage policy breach:/m.test(result.stderr || '')) {
    fail('negative coverage control did not produce the expected policy breach')
  }
}

export function assertExpectedWaiverValidationFailure(result) {
  if (
    result.status !== 1 ||
    !/^waiver requires named (Frontend Tech Lead|QA Owner) approval$/m.test(result.stderr || '')
  ) {
    fail('negative waiver control did not produce the expected waiver validation failure')
  }
}

function negativeThreshold(outputDir) {
  ensureNode24()
  if (!process.argv.includes('--disposable-copy')) fail('--disposable-copy is required')
  ensureNewDirectory(outputDir)
  const measurement = join(dirname(outputDir), 'measurement', 'coverage-summary.json')
  if (!existsSync(measurement))
    fail('negative test requires sibling measurement/coverage-summary.json')
  const selection = activePolicy()
  validateExecutionMode('threshold', selection)
  const policyInputs = [CANONICAL_SELECTION, selection.selectedPolicyPath]
  const before = sourceIdentity(policyInputs)
  const disposableRoot = mkdtempSync(join(tmpdir(), 'frontend-coverage-negative-'))
  try {
    const fixture = join(disposableRoot, 'coverage-summary.json')
    writeFileSync(
      fixture,
      `${JSON.stringify(mutateSummaryForBreach(readJson(measurement), selection.selectedPolicy), null, 2)}\n`
    )
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), 'check-summary', '--summary', fixture],
      {
        cwd: ROOT,
        encoding: 'utf8',
      }
    )
    assertExpectedCoverageBreach(result)
    const after = sourceIdentity(policyInputs)
    if (digestJson(before) !== digestJson(after))
      fail('repository subject changed during disposable negative test')
    const commandRecord = {
      schemaVersion: 1,
      command: [
        process.execPath,
        fileURLToPath(import.meta.url),
        'check-summary',
        '--summary',
        fixture,
      ],
      childExitCode: result.status,
      expected: 'non-zero',
    }
    writeJson(join(outputDir, 'result.json'), {
      schemaVersion: 1,
      result: 'EXPECTED_FAILURE',
      childExitCode: result.status,
      stderrDigest: sha256(result.stderr),
      repositorySubjectUnchanged: true,
      disposableCopyRemoved: true,
    })
    writeJson(join(outputDir, 'command.json'), commandRecord)
    writeJson(join(outputDir, 'identity.json'), createIdentity(outputDir, commandRecord))
  } finally {
    rmSync(disposableRoot, { recursive: true, force: true })
  }
  sealDirectory(outputDir)
}

function negativeWaiver(outputDir) {
  ensureNode24()
  if (!process.argv.includes('--disposable-copy')) fail('--disposable-copy is required')
  ensureNewDirectory(outputDir)
  const selection = activePolicy()
  validateExecutionMode('waiver', selection)
  const policyInputs = [CANONICAL_SELECTION, selection.selectedPolicyPath]
  const before = sourceIdentity(policyInputs)
  const disposableRoot = mkdtempSync(join(tmpdir(), 'frontend-coverage-waiver-negative-'))
  try {
    const fixture = join(disposableRoot, 'coverage-waiver.json')
    const invalidWaiver = structuredClone(selection.selectedPolicy)
    invalidWaiver.approvals = invalidWaiver.approvals.filter(
      approval => approval.role !== 'QA Owner'
    )
    writeFileSync(fixture, `${JSON.stringify(invalidWaiver, null, 2)}\n`)
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), 'validate-waiver-fixture', '--waiver', fixture],
      { cwd: ROOT, encoding: 'utf8' }
    )
    assertExpectedWaiverValidationFailure(result)
    const after = sourceIdentity(policyInputs)
    if (digestJson(before) !== digestJson(after))
      fail('repository subject changed during disposable negative waiver test')
    const commandRecord = {
      schemaVersion: 1,
      command: [
        process.execPath,
        fileURLToPath(import.meta.url),
        'validate-waiver-fixture',
        '--waiver',
        fixture,
      ],
      childExitCode: result.status,
      expected: 'waiver-validation-failure',
    }
    writeJson(join(outputDir, 'result.json'), {
      schemaVersion: 1,
      result: 'EXPECTED_FAILURE',
      childExitCode: result.status,
      stderrDigest: sha256(result.stderr),
      repositorySubjectUnchanged: true,
      disposableCopyRemoved: true,
    })
    writeJson(join(outputDir, 'command.json'), commandRecord)
    writeJson(join(outputDir, 'identity.json'), createIdentity(outputDir, commandRecord))
  } finally {
    rmSync(disposableRoot, { recursive: true, force: true })
  }
  sealDirectory(outputDir)
}

function compareIdentities(paths) {
  const identities = paths.map(readJson)
  const fields = [
    'provider',
    'scopeDigest',
    'resolvedTestPathDigest',
    'source',
    'lockDigest',
    'policyMode',
    'policyPath',
    'policyDigest',
    'policySelectionDigest',
  ]
  for (const field of fields) {
    const expected = digestJson(identities[0][field])
    for (let index = 1; index < identities.length; index += 1) {
      if (digestJson(identities[index][field]) !== expected)
        fail(`coverage identity mismatch for ${field}`)
    }
  }
  return { result: 'PASS', fields }
}

export function coverageArtifactFiles(policyMode, artifactName) {
  if (!['threshold', 'waiver'].includes(policyMode)) fail(`unsupported policy mode: ${policyMode}`)
  if (!['measurement', 'negative', 'final-1', 'final-2'].includes(artifactName))
    fail(`unsupported coverage artifact: ${artifactName}`)
  if (artifactName === 'negative') return ['result.json', 'identity.json', 'command.json']
  const files = [
    'report.txt',
    'coverage-summary.json',
    'coverage-final.json',
    'identity.json',
    'command.json',
  ]
  if (policyMode === 'waiver' && artifactName.startsWith('final-'))
    files.push('waiver-validation.json')
  return files
}

export function verifyWaiverValidationArtifact(path, identity, { now = new Date() } = {}) {
  const record = readJson(path)
  if (!record || typeof record !== 'object' || Array.isArray(record))
    fail('invalid waiver validation artifact')
  const fields = Object.keys(record).sort()
  if (
    fields.length !== WAIVER_VALIDATION_FIELDS.length ||
    fields.some((field, index) => field !== WAIVER_VALIDATION_FIELDS[index])
  ) {
    fail('waiver validation artifact contains missing or unexpected fields')
  }
  if (record.schemaVersion !== 1 || record.result !== 'PASS' || record.mode !== 'waiver')
    fail('invalid waiver validation artifact identity')
  if (!CANONICAL_WAIVER_PATTERN.test(record.selectedPolicy))
    fail('waiver validation artifact has an invalid selected policy path')
  for (const [field, value] of [
    ['selectedPolicyDigest', record.selectedPolicyDigest],
    ['selectionDigest', record.selectionDigest],
  ]) {
    if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))
      fail(`waiver validation artifact has an invalid ${field}`)
  }

  const validatedAt = parseIso(record.validatedAt, 'validation validatedAt')
  const nowTime = now instanceof Date ? now.getTime() : Number.NaN
  if (!Number.isFinite(nowTime)) fail('waiver validation clock must be a valid date')
  if (validatedAt > nowTime) fail('waiver validation artifact validatedAt is in the future')
  const waiver = {
    $schema: WAIVER_SCHEMA,
    schemaVersion: 1,
    mode: 'waiver',
    owner: record.owner,
    issue: record.issue,
    reason: record.reason,
    metrics: record.metrics,
    scope: record.scope,
    baselineReduction: record.baselineReduction,
    controls: record.controls,
    revocation: record.revocation,
    created_at: record.created_at,
    expires_at: record.expires_at,
    approvals: record.approvals,
  }
  validateWaiver(waiver, new Date(validatedAt))
  validateWaiver(waiver, now)

  if (record.mode !== identity.policyMode) fail('waiver validation mode does not match identity')
  if (record.selectedPolicy !== identity.policyPath)
    fail('waiver validation policy path does not match identity')
  if (record.selectedPolicyDigest !== identity.policyDigest)
    fail('waiver validation policy digest does not match identity')
  if (record.selectionDigest !== identity.policySelectionDigest)
    fail('waiver validation selection digest does not match identity')
  if (
    typeof identity.waiverValidationDigest !== 'string' ||
    !/^[a-f0-9]{64}$/.test(identity.waiverValidationDigest)
  ) {
    fail('waiver final identity is missing a valid waiver validation digest')
  }
  if (sha256(readFileSync(path)) !== identity.waiverValidationDigest)
    fail('waiver validation digest mismatch')
  return record
}

export function verifyArtifactSet(root, { now = new Date() } = {}) {
  const names = ['measurement', 'negative', 'final-1', 'final-2']
  const resolved = names.map(name => resolve(root, name))
  if (new Set(resolved).size !== names.length)
    fail('coverage artifact directories are not distinct')
  const policyMode = readJson(join(root, 'measurement/identity.json')).policyMode
  for (const [index, path] of resolved.entries()) {
    assertSealedDirectory(path)
    for (const file of coverageArtifactFiles(policyMode, names[index])) {
      const required = join(path, file)
      if (!existsSync(required) || statSync(required).size === 0)
        fail(`required coverage artifact missing: ${required}`)
    }
  }
  compareIdentities([
    join(root, 'measurement/identity.json'),
    join(root, 'negative/identity.json'),
    join(root, 'final-1/identity.json'),
    join(root, 'final-2/identity.json'),
  ])
  if (policyMode === 'waiver') {
    for (const name of ['final-1', 'final-2']) {
      verifyWaiverValidationArtifact(
        join(root, name, 'waiver-validation.json'),
        readJson(join(root, name, 'identity.json')),
        { now }
      )
    }
  }
}

async function main() {
  const command = process.argv[2]
  switch (command) {
    case 'record':
      await runCoverage(option('mode', 'measurement'), requireOption('output-dir'))
      break
    case 'threshold':
      await runCoverage('threshold', requireOption('output-dir'))
      break
    case 'waiver':
      await runCoverage('waiver', requireOption('output-dir'))
      break
    case 'ci':
      await runCoverage(activePolicy().mode, requireOption('output-dir'))
      break
    case 'assert-exclusive':
      assertExclusive(requireOption('output'))
      break
    case 'check-summary':
      assertCoverage(readJson(requireOption('summary')), activePolicy().selectedPolicy)
      break
    case 'negative-threshold':
      negativeThreshold(requireOption('output-dir'))
      break
    case 'negative-waiver':
      negativeWaiver(requireOption('output-dir'))
      break
    case 'validate-waiver-fixture':
      validateWaiver(
        readJson(requireOption('waiver')),
        option('now') ? new Date(option('now')) : new Date()
      )
      break
    case 'compare-identities': {
      const result = compareIdentities([
        requireOption('measurement'),
        requireOption('final-1'),
        requireOption('final-2'),
      ])
      process.stdout.write(`${JSON.stringify(result)}\n`)
      break
    }
    case 'verify-artifact-set':
      verifyArtifactSet(requireOption('root'), {
        now: option('now') ? new Date(option('now')) : new Date(),
      })
      break
    case 'check-toolchain':
      process.stdout.write(`${JSON.stringify(validateToolchain())}\n`)
      break
    default:
      fail(`unknown coverage governance command: ${command ?? '<missing>'}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
