import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  assertExpectedCoverageBreach,
  assertExpectedWaiverValidationFailure,
  assertCoverage,
  coverageArtifactFiles,
  deriveThresholdPolicy,
  normalizeSummary,
  sha256,
  validateSelection,
  validateExecutionMode,
  validateThresholdPolicy,
  validateToolchain,
  validateWaiver,
  verifyArtifactSet,
  writeWaiverValidationArtifact,
} from './coverage-governance.mjs'

const SELECTION_SCHEMA = './schemas/coverage-policy-selection.v1.json'
const WAIVER_SCHEMA = '../coverage-waiver.schema.json'

function summary(overrides = {}) {
  return {
    total: {
      statements: { total: 1000, covered: 803, pct: 80.3 },
      branches: { total: 500, covered: 301, pct: 60.2 },
      functions: { total: 200, covered: 101, pct: 50.5 },
      lines: { total: 900, covered: 720, pct: 80 },
      ...overrides,
    },
  }
}

function validWaiver(overrides = {}) {
  return {
    $schema: WAIVER_SCHEMA,
    schemaVersion: 1,
    mode: 'waiver',
    owner: 'Frontend Platform Team',
    issue: 'FE-1234',
    reason: 'Temporary provider instability with an owned removal plan',
    metrics: ['statements', 'branches', 'functions', 'lines'],
    scope: 'frontend-global-coverage-non-regression',
    baselineReduction: false,
    controls: 'Daily governed coverage comparison',
    revocation: 'Revoke immediately when provider instability is resolved',
    created_at: '2026-07-25T00:00:00.000Z',
    expires_at: '2026-08-01T00:00:00.000Z',
    approvals: [
      {
        name: 'Frontend Owner',
        role: 'Frontend Tech Lead',
        approved_at: '2026-07-25T00:00:00.000Z',
      },
      { name: 'Quality Owner', role: 'QA Owner', approved_at: '2026-07-25T00:00:00.000Z' },
    ],
    ...overrides,
  }
}

function thresholdSelection(overrides = {}) {
  return {
    $schema: SELECTION_SCHEMA,
    schemaVersion: 1,
    mode: 'threshold',
    thresholdPolicy: 'quality/coverage-policy.v1.json',
    waiver: null,
    ...overrides,
  }
}

function waiverSelection(overrides = {}) {
  return {
    $schema: SELECTION_SCHEMA,
    schemaVersion: 1,
    mode: 'waiver',
    thresholdPolicy: null,
    waiver: 'quality/coverage-waivers/FE-1234.v1.json',
    ...overrides,
  }
}

function git(root, ...args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
}

function policyRepository(prefix = 'coverage-policy-repository-') {
  const root = mkdtempSync(join(tmpdir(), prefix))
  git(root, 'init', '--quiet')
  mkdirSync(join(root, 'quality/coverage-waivers'), { recursive: true })
  return root
}

function writeTrackedJson(root, path, value) {
  const absolute = join(root, path)
  mkdirSync(join(absolute, '..'), { recursive: true })
  writeFileSync(absolute, `${JSON.stringify(value)}\n`)
  git(root, 'add', '--', path)
  return absolute
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function waiverArtifactSet() {
  const root = mkdtempSync(join(tmpdir(), 'coverage-waiver-artifact-set-test-'))
  const selection = {
    mode: 'waiver',
    selectedPolicyPath: 'quality/coverage-waivers/FE-1234.v1.json',
    selectedPolicyDigest: 'a'.repeat(64),
    selectionDigest: 'b'.repeat(64),
    selectedPolicy: validWaiver(),
  }
  const baseIdentity = {
    provider: { name: 'v8' },
    scopeDigest: 'scope-digest',
    resolvedTestPathDigest: 'test-path-digest',
    source: { contentDigest: 'source-digest' },
    lockDigest: 'lock-digest',
    policyMode: 'waiver',
    policyPath: selection.selectedPolicyPath,
    policyDigest: selection.selectedPolicyDigest,
    policySelectionDigest: selection.selectionDigest,
  }
  const validationTimes = {
    'final-1': new Date('2026-07-26T00:00:00.000Z'),
    'final-2': new Date('2026-07-26T01:00:00.000Z'),
  }

  for (const name of ['measurement', 'negative', 'final-1', 'final-2']) {
    const outputDir = join(root, name)
    mkdirSync(outputDir)
    for (const file of coverageArtifactFiles('waiver', name)) {
      if (!['identity.json', 'waiver-validation.json'].includes(file)) {
        writeFileSync(join(outputDir, file), '{}\n')
      }
    }
    const identity = { ...baseIdentity }
    if (name.startsWith('final-')) {
      const validationPath = writeWaiverValidationArtifact(
        outputDir,
        selection,
        validationTimes[name]
      )
      identity.waiverValidationDigest = sha256(readFileSync(validationPath))
    }
    writeJson(join(outputDir, 'identity.json'), identity)
  }

  return { root }
}

function sealArtifactSet(root) {
  for (const name of ['measurement', 'negative', 'final-1', 'final-2']) {
    const outputDir = join(root, name)
    for (const entry of readdirSync(outputDir)) chmodSync(join(outputDir, entry), 0o444)
    chmodSync(outputDir, 0o555)
  }
}

describe('coverage threshold governance', () => {
  it('accepts only the exact expected negative threshold failure', () => {
    assert.doesNotThrow(() =>
      assertExpectedCoverageBreach({
        status: 1,
        stderr: 'coverage policy breach: lines regressed\n',
      })
    )
    assert.throws(
      () => assertExpectedCoverageBreach({ status: 2, stderr: 'unknown option\n' }),
      /expected policy breach/
    )
    assert.throws(
      () => assertExpectedCoverageBreach({ status: 1, stderr: 'configuration failed\n' }),
      /expected policy breach/
    )
  })

  it('requires the exact paired Vitest and V8 coverage toolchain', () => {
    const toolchain = validateToolchain()
    assert.deepEqual(
      { ...toolchain, lockDigest: undefined },
      {
        vitest: '4.1.10',
        coverageV8: '4.1.10',
        provider: 'v8',
        lockDigest: undefined,
      }
    )
    assert.match(toolchain.lockDigest, /^[a-f0-9]{64}$/)
  })
  it('derives all four baselines from covered/total counts with the exact 0.01pp epsilon', () => {
    const policy = deriveThresholdPolicy(summary())

    assert.equal(policy.epsilonPercentagePoints, 0.01)
    assert.deepEqual(policy.baseline.statements, {
      total: 1000,
      covered: 803,
      uncovered: 197,
      percentage: 80.30000000000001,
    })
    assert.deepEqual(policy.vitestThresholds, {
      statements: -197,
      branches: -199,
      functions: -99,
      lines: -180,
    })
    assert.equal(validateThresholdPolicy(policy), policy)
    assert.deepEqual(assertCoverage(summary(), policy), policy.baseline)
  })

  it('fails closed when any required summary metric is missing', () => {
    const incomplete = summary()
    delete incomplete.total.branches
    assert.throws(() => normalizeSummary(incomplete), /branches/)
  })

  it('rejects a count regression even when rounded display percentages are unchanged', () => {
    const policy = deriveThresholdPolicy(summary())
    const regressed = summary({ statements: { total: 1000, covered: 802, pct: 80.3 } })
    assert.throws(() => assertCoverage(regressed, policy), /coverage policy breach/)
  })
})

describe('coverage policy exclusivity and waiver validation', () => {
  it('rejects a waiver without both named owners, expiry, or reason', () => {
    assert.throws(
      () =>
        validateWaiver(
          validWaiver({ approvals: [], reason: '' }),
          new Date('2026-07-26T00:00:00Z')
        ),
      /reason|approval/
    )
  })

  it('rejects an expired waiver', () => {
    assert.throws(() => validateWaiver(validWaiver(), new Date('2026-08-02T00:00:00Z')), /expired/)
  })

  it('rejects approval timestamps after now or before waiver creation', () => {
    const now = new Date('2026-07-26T00:00:00.000Z')
    assert.throws(
      () =>
        validateWaiver(
          validWaiver({
            approvals: validWaiver().approvals.map((approval, index) =>
              index === 0 ? { ...approval, approved_at: '2026-07-26T00:00:00.001Z' } : approval
            ),
          }),
          now
        ),
      /approval approved_at cannot be in the future/
    )
    assert.throws(
      () =>
        validateWaiver(
          validWaiver({
            approvals: validWaiver().approvals.map((approval, index) =>
              index === 0 ? { ...approval, approved_at: '2026-07-24T23:59:59.999Z' } : approval
            ),
          }),
          now
        ),
      /approval approved_at cannot precede created_at/
    )
  })

  it('rejects excessive lifetime, unapproved scope, and baseline reduction', () => {
    assert.throws(
      () =>
        validateWaiver(
          validWaiver({ expires_at: '2026-08-20T00:00:00Z' }),
          new Date('2026-07-26T00:00:00Z')
        ),
      /14 days/
    )
    assert.throws(
      () => validateWaiver(validWaiver({ scope: 'some-files' }), new Date('2026-07-26T00:00:00Z')),
      /scope/
    )
    assert.throws(
      () =>
        validateWaiver(validWaiver({ baselineReduction: true }), new Date('2026-07-26T00:00:00Z')),
      /baseline reduction/
    )
  })

  it('fails closed when threshold and waiver branches are both active or both absent', () => {
    assert.throws(
      () =>
        validateSelection(
          thresholdSelection({ waiver: 'quality/coverage-waivers/FE-1234.v1.json' })
        ),
      /exactly one/
    )
    assert.throws(
      () => validateSelection(thresholdSelection({ thresholdPolicy: null })),
      /exactly one/
    )
  })

  it('requires the canonical selection schema and rejects unexpected fields', () => {
    assert.throws(
      () => validateSelection(thresholdSelection({ $schema: './schemas/other.json' })),
      /canonical \$schema/
    )
    assert.throws(
      () => validateSelection(thresholdSelection({ alternateAuthority: 'external.json' })),
      /unexpected field/
    )
    assert.throws(
      () => validateSelection(thresholdSelection({ waiver: 42 })),
      /mode does not match/
    )
    assert.throws(
      () => validateSelection(waiverSelection({ thresholdPolicy: false })),
      /mode does not match/
    )
  })

  it('accepts one threshold branch and validates its count-derived policy', () => {
    const root = policyRepository('coverage-policy-test-')
    writeTrackedJson(root, 'quality/coverage-policy.v1.json', deriveThresholdPolicy(summary()))
    const result = validateSelection(thresholdSelection(), { root })
    assert.equal(result.mode, 'threshold')
    assert.equal(result.selectedPolicyPath, 'quality/coverage-policy.v1.json')
    assert.match(result.selectedPolicyDigest, /^[a-f0-9]{64}$/)
  })

  it('accepts a tracked waiver only at the canonical waiver path pattern', () => {
    const root = policyRepository('coverage-waiver-test-')
    writeTrackedJson(root, 'quality/coverage-waivers/FE-1234.v1.json', validWaiver())

    const result = validateSelection(waiverSelection(), {
      root,
      now: new Date('2026-07-26T00:00:00Z'),
    })

    assert.equal(result.mode, 'waiver')
    assert.equal(result.selectedPolicyPath, 'quality/coverage-waivers/FE-1234.v1.json')
    assert.match(result.selectedPolicyDigest, /^[a-f0-9]{64}$/)
  })

  it('rejects absolute and traversal policy paths', () => {
    const root = policyRepository('coverage-path-boundary-test-')
    const external = writeTrackedJson(
      policyRepository('coverage-external-policy-test-'),
      'quality/coverage-policy.v1.json',
      deriveThresholdPolicy(summary())
    )
    writeTrackedJson(root, 'quality/coverage-policy.v1.json', deriveThresholdPolicy(summary()))

    assert.throws(
      () => validateSelection(thresholdSelection({ thresholdPolicy: external }), { root }),
      /repository-relative|canonical/
    )
    assert.throws(
      () =>
        validateSelection(
          thresholdSelection({ thresholdPolicy: `quality/../${relative(root, external)}` }),
          { root }
        ),
      /traversal|canonical/
    )
  })

  it('rejects symlink escapes and non-regular policy inputs', () => {
    const root = policyRepository('coverage-file-kind-test-')
    const external = writeTrackedJson(
      policyRepository('coverage-symlink-target-test-'),
      'quality/coverage-policy.v1.json',
      deriveThresholdPolicy(summary())
    )
    symlinkSync(external, join(root, 'quality/coverage-policy.v1.json'))
    git(root, 'add', '--', 'quality/coverage-policy.v1.json')

    assert.throws(() => validateSelection(thresholdSelection(), { root }), /symbolic link/)

    const directoryRoot = policyRepository('coverage-directory-policy-test-')
    mkdirSync(join(directoryRoot, 'quality/coverage-policy.v1.json'))
    assert.throws(
      () => validateSelection(thresholdSelection(), { root: directoryRoot }),
      /regular file/
    )
  })

  it('rejects alternate threshold filenames and untracked canonical policies', () => {
    const root = policyRepository('coverage-policy-authority-test-')
    writeTrackedJson(root, 'quality/alternate-policy.v1.json', deriveThresholdPolicy(summary()))

    assert.throws(
      () =>
        validateSelection(
          thresholdSelection({ thresholdPolicy: 'quality/alternate-policy.v1.json' }),
          { root }
        ),
      /canonical threshold policy/
    )

    writeFileSync(
      join(root, 'quality/coverage-policy.v1.json'),
      `${JSON.stringify(deriveThresholdPolicy(summary()))}\n`
    )
    assert.throws(() => validateSelection(thresholdSelection(), { root }), /tracked by git/)
  })

  it('rejects a policy beneath a nested Git repository boundary', () => {
    const root = policyRepository('coverage-nested-repository-test-')
    writeTrackedJson(root, 'quality/coverage-policy.v1.json', deriveThresholdPolicy(summary()))
    git(join(root, 'quality'), 'init', '--quiet')

    assert.throws(
      () => validateSelection(thresholdSelection(), { root }),
      /nested git repository|repository root/
    )
  })

  it('selects only the execution branch authorized by the active policy', () => {
    assert.equal(validateExecutionMode('threshold', { mode: 'threshold' }), 'threshold')
    assert.equal(validateExecutionMode('waiver', { mode: 'waiver' }), 'waiver')
    assert.equal(validateExecutionMode('measurement', { mode: 'waiver' }), 'measurement')
    assert.throws(
      () => validateExecutionMode('threshold', { mode: 'waiver' }),
      /does not match active waiver policy/
    )
    assert.throws(
      () => validateExecutionMode('waiver', { mode: 'threshold' }),
      /does not match active threshold policy/
    )
  })

  it('records and seals the formal waiver validation artifact', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'coverage-waiver-artifact-test-'))
    const selectedPolicy = validWaiver()
    const path = writeWaiverValidationArtifact(
      outputDir,
      {
        mode: 'waiver',
        selectedPolicyPath: 'quality/coverage-waivers/FE-1234.v1.json',
        selectedPolicyDigest: 'a'.repeat(64),
        selectionDigest: 'b'.repeat(64),
        selectedPolicy,
      },
      new Date('2026-07-26T00:00:00Z')
    )
    const artifact = JSON.parse(readFileSync(path, 'utf8'))

    assert.equal(artifact.result, 'PASS')
    assert.equal(artifact.issue, 'FE-1234')
    assert.equal(artifact.baselineReduction, false)
    assert.deepEqual(artifact.metrics, ['statements', 'branches', 'functions', 'lines'])
    assert.deepEqual(
      artifact.approvals.map(approval => approval.role),
      ['Frontend Tech Lead', 'QA Owner']
    )
    assert.equal(statSync(path).mode & 0o222, 0)
  })

  it('verifies a sealed waiver artifact set against each final identity binding', () => {
    const { root } = waiverArtifactSet()
    sealArtifactSet(root)
    assert.doesNotThrow(() =>
      verifyArtifactSet(root, { now: new Date('2026-07-26T02:00:00.000Z') })
    )
  })

  it('rejects swapped waiver validation artifacts even when the set is resealed', () => {
    const { root } = waiverArtifactSet()
    const first = join(root, 'final-1/waiver-validation.json')
    const second = join(root, 'final-2/waiver-validation.json')
    const firstContent = readFileSync(first)
    const secondContent = readFileSync(second)
    chmodSync(first, 0o644)
    chmodSync(second, 0o644)
    writeFileSync(first, secondContent)
    writeFileSync(second, firstContent)
    sealArtifactSet(root)

    assert.throws(
      () => verifyArtifactSet(root, { now: new Date('2026-07-26T02:00:00.000Z') }),
      /waiver validation digest mismatch/
    )
  })

  it('rejects a modified and resealed waiver validation artifact', () => {
    const { root } = waiverArtifactSet()
    const path = join(root, 'final-1/waiver-validation.json')
    const artifact = JSON.parse(readFileSync(path, 'utf8'))
    artifact.reason = 'Modified after the identity was created'
    chmodSync(path, 0o644)
    writeJson(path, artifact)
    sealArtifactSet(root)

    assert.throws(
      () => verifyArtifactSet(root, { now: new Date('2026-07-26T02:00:00.000Z') }),
      /waiver validation digest mismatch/
    )
  })

  it('rejects a stale waiver validation artifact whose authority has expired', () => {
    const { root } = waiverArtifactSet()
    sealArtifactSet(root)

    assert.throws(
      () => verifyArtifactSet(root, { now: new Date('2026-08-02T00:00:00.000Z') }),
      /waiver is expired/
    )
  })

  it('requires waiver validation artifacts only for waiver final runs', () => {
    assert.ok(!coverageArtifactFiles('threshold', 'final-1').includes('waiver-validation.json'))
    assert.ok(coverageArtifactFiles('waiver', 'final-1').includes('waiver-validation.json'))
    assert.ok(coverageArtifactFiles('waiver', 'final-2').includes('waiver-validation.json'))
    assert.ok(!coverageArtifactFiles('waiver', 'measurement').includes('waiver-validation.json'))
  })

  it('accepts only the controlled formal-waiver negative validation failure', () => {
    assert.doesNotThrow(() =>
      assertExpectedWaiverValidationFailure({
        status: 1,
        stderr: 'waiver requires named QA Owner approval\n',
      })
    )
    assert.throws(
      () => assertExpectedWaiverValidationFailure({ status: 1, stderr: 'invalid JSON\n' }),
      /expected waiver validation failure/
    )

    const root = mkdtempSync(join(tmpdir(), 'coverage-waiver-negative-command-test-'))
    const fixture = join(root, 'invalid-waiver.json')
    writeFileSync(
      fixture,
      `${JSON.stringify(
        validWaiver({
          approvals: validWaiver().approvals.filter(approval => approval.role !== 'QA Owner'),
        })
      )}\n`
    )
    const governance = fileURLToPath(new URL('./coverage-governance.mjs', import.meta.url))
    const result = spawnSync(
      process.execPath,
      [
        governance,
        'validate-waiver-fixture',
        '--waiver',
        fixture,
        '--now',
        '2026-07-26T00:00:00.000Z',
      ],
      {
        encoding: 'utf8',
      }
    )
    assertExpectedWaiverValidationFailure(result)
  })

  it('publishes both formal waiver package commands', () => {
    const manifest = JSON.parse(
      readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8')
    )
    assert.equal(
      manifest.scripts['cert:coverage:negative-waiver'],
      'node scripts/certification/coverage-governance.mjs negative-waiver'
    )
    assert.equal(
      manifest.scripts['cert:coverage:waiver'],
      'node scripts/certification/coverage-governance.mjs waiver'
    )
  })

  it('reads only a validated threshold or waiver mode for branch selection', () => {
    const root = mkdtempSync(join(tmpdir(), 'coverage-mode-test-'))
    const policy = join(root, 'active-policy.json')
    writeFileSync(policy, JSON.stringify({ mode: 'threshold' }))
    const reader = fileURLToPath(new URL('./read-policy-mode.mjs', import.meta.url))
    const valid = spawnSync(process.execPath, [reader, policy], {
      encoding: 'utf8',
    })
    assert.equal(valid.status, 0)
    assert.equal(valid.stdout, 'threshold\n')

    writeFileSync(policy, JSON.stringify({ mode: 'both' }))
    const invalid = spawnSync(process.execPath, [reader, policy], {
      encoding: 'utf8',
    })
    assert.notEqual(invalid.status, 0)
  })
})
