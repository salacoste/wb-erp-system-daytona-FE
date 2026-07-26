import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import {
  collectApiProvenance,
  bindOuterExitCode,
  classifyPlaywrightRow,
  collectPlaywrightFailureClasses,
  collectPlaywrightOutcomes,
  exitCodeForVerdict,
  playwrightRunnerIntegrity,
  preflightFailureOutcome,
  preflightFailureRow,
  cleanupProvenanceObserved,
  createPrivatePlaywrightLayout,
  buildPlaywrightChildEnv,
  removeUnexpectedEvidenceArtifacts,
  quarantineUnsafeEvidence,
  runCertification,
  sanitizeEvidenceScanForPublication,
  sanitizePlaywrightReport,
  scanPublishableEvidence,
  scanExactEvidenceBytes,
  scanSerializableEvidence,
} from './run-certification.mjs'
import { access, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { cleanupControlDigest, Tier0SafetyError } from './runtime-safety.mjs'

function report(statuses, failureClasses = {}) {
  return {
    suites: [
      {
        specs: Object.entries(statuses).map(([id, status]) => ({
          title: `[${id}] contract`,
          tests: [
            {
              annotations: failureClasses[id]
                ? [{ type: 'tier0-failure-class', description: failureClasses[id] }]
                : [],
              results: [{ status }],
            },
          ],
        })),
      },
    ],
  }
}

function provenanceReport(body, rowId = 'OI-E10', testId = 'oi-e10-test') {
  return {
    suites: [
      {
        specs: [
          {
            id: testId,
            title: `[${rowId}] provenance contract`,
            tests: [
              {
                results: [{ attachments: [{ name: 'tier0-api-provenance.json', body }] }],
              },
            ],
          },
        ],
      },
    ],
  }
}

test('Playwright pass, skip, and failure map to PASS, BLOCKED, and FAIL', () => {
  const outcomes = collectPlaywrightOutcomes(
    report({
      'RT-E01': 'passed',
      'RT-E02': 'skipped',
      'RT-E03': 'failed',
      'OI-E01': 'passed',
    })
  )
  assert.equal(outcomes.get('RT-E01'), 'PASS')
  assert.equal(outcomes.get('RT-E02'), 'BLOCKED')
  assert.equal(outcomes.get('RT-E03'), 'FAIL')
  assert.equal(outcomes.get('OI-E01'), 'PASS')
})

test('a failure dominates a pass when a row appears in more than one result', () => {
  const mixed = report({ 'RT-E01': 'passed' })
  mixed.suites[0].specs[0].tests[0].results.push({ status: 'failed' })
  assert.equal(collectPlaywrightOutcomes(mixed).get('RT-E01'), 'FAIL')
})

test('only a fully passing matrix returns a successful certification command exit', () => {
  assert.equal(exitCodeForVerdict('PASS'), 0)
  assert.equal(exitCodeForVerdict('FAIL'), 1)
  assert.equal(exitCodeForVerdict('UNDETERMINED'), 3)
})

test('OBS-I01 is bound to the outer certification exit code', () => {
  const matrix = {
    verdict: 'UNDETERMINED',
    rows: [{ row_id: 'OBS-I01', exit_code: null }],
  }
  assert.equal(bindOuterExitCode(matrix).rows[0].exit_code, 3)
})

test('missing capability is BLOCKED but an executed failure is FAIL', () => {
  const row = { id: 'RT-E08', dependencies: ['G_RUNNER', 'P_USER', 'P_CABINET'] }
  assert.deepEqual(classifyPlaywrightRow(row, new Map(), { P_USER: true, P_CABINET: false }), {
    status: 'BLOCKED',
    reason_code: 'CABINET_FIXTURE_MISSING',
    failure_class: 'prerequisite',
  })
  assert.deepEqual(
    classifyPlaywrightRow(
      row,
      new Map([['RT-E08', 'FAIL']]),
      { P_USER: true, P_CABINET: true },
      true,
      new Map([['RT-E08', 'product']])
    ),
    {
      status: 'FAIL',
      reason_code: 'LIVE_PRODUCT_ASSERTION_FAILED',
      failure_class: 'product',
    }
  )
})

test('an executed pass cannot override an absent declared capability', () => {
  const row = { id: 'RT-E13', dependencies: ['G_RUNNER', 'P_MUTATION'] }
  assert.deepEqual(
    classifyPlaywrightRow(row, new Map([['RT-E13', 'PASS']]), { P_MUTATION: false }),
    {
      status: 'BLOCKED',
      reason_code: 'MUTATION_AUTHORITY_MISSING',
      failure_class: 'prerequisite',
    }
  )
})

test('an executed failure is never masked by an absent declared capability', () => {
  const row = { id: 'RT-E14', dependencies: ['G_RUNNER', 'P_MUTATION'] }
  assert.deepEqual(
    classifyPlaywrightRow(
      row,
      new Map([['RT-E14', 'FAIL']]),
      { P_MUTATION: false },
      true,
      new Map([['RT-E14', 'product']])
    ),
    {
      status: 'FAIL',
      reason_code: 'LIVE_PRODUCT_ASSERTION_FAILED',
      failure_class: 'product',
    }
  )
})

test('nonzero Playwright exits and report-level errors fail runner integrity', () => {
  assert.deepEqual(playwrightRunnerIntegrity({ exitCode: 1, report: report({}) }), {
    status: 'FAIL',
    reason_code: 'PLAYWRIGHT_EXIT_OR_STATS_INCONSISTENT',
    failure_class: 'runner',
  })
  assert.deepEqual(
    playwrightRunnerIntegrity({ exitCode: 0, report: { ...report({}), errors: [{}] } }),
    {
      status: 'FAIL',
      reason_code: 'PLAYWRIGHT_REPORT_LEVEL_ERROR',
      failure_class: 'runner',
    }
  )
  assert.equal(playwrightRunnerIntegrity({ exitCode: 0, report: report({}) }).status, 'PASS')
})

test('reported product assertion failures do not corrupt PRE-I05 runner integrity', () => {
  const productFailure = report({ 'RT-E01': 'failed' }, { 'RT-E01': 'product' })
  assert.deepEqual(
    playwrightRunnerIntegrity({
      exitCode: 1,
      report: productFailure,
      privateCleanup: { deleted: true },
    }),
    {
      status: 'PASS',
      reason_code: 'PRODUCT_FAILURES_REPORTED',
      failure_class: 'none',
    }
  )
})

test('infrastructure or untyped failures fail PRE-I05 instead of masquerading as product', () => {
  for (const failureReport of [
    report({ 'RT-E01': 'failed' }, { 'RT-E01': 'infrastructure' }),
    report({ 'RT-E01': 'timedOut' }),
  ]) {
    assert.equal(
      playwrightRunnerIntegrity({
        exitCode: 1,
        report: failureReport,
        privateCleanup: { deleted: true },
      }).failure_class,
      'runner'
    )
  }
  assert.equal(
    collectPlaywrightFailureClasses(
      report({ 'RT-E01': 'failed' }, { 'RT-E01': 'infrastructure' })
    ).get('RT-E01'),
    'infrastructure'
  )
})

test('a skipped result with all declared dependencies is FAIL, never BLOCKED', () => {
  const row = { id: 'RT-E08', dependencies: ['G_RUNNER', 'P_USER', 'P_CABINET'] }
  assert.deepEqual(
    classifyPlaywrightRow(row, new Map([['RT-E08', 'BLOCKED']]), { P_USER: true, P_CABINET: true }),
    { status: 'FAIL', reason_code: 'EXECUTION_SKIPPED_WITH_PREREQUISITES', failure_class: 'runner' }
  )
})

test('Playwright child environment excludes arbitrary secrets, proxies, and NODE_OPTIONS', () => {
  const child = buildPlaywrightChildEnv(
    {
      PATH: '/bin',
      HOME: '/home/test',
      TMPDIR: '/tmp',
      E2E_TEST_EMAIL: 'user@example.test',
      E2E_TEST_PASSWORD: 'secret',
      TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256: 'a'.repeat(64),
      HTTPS_PROXY: 'http://proxy.invalid',
      NODE_OPTIONS: '--require bad',
      ARBITRARY_SECRET: 'leak',
    },
    { TIER0_RUN_ID: 'run-1', TIER0_ENV_DESCRIPTOR: '/tmp/snapshot.json' }
  )
  assert.equal(child.PATH, '/bin')
  assert.equal(child.E2E_TEST_PASSWORD, 'secret')
  assert.equal(child.TIER0_RUN_ID, 'run-1')
  assert.equal(child.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256, 'a'.repeat(64))
  assert.equal('HTTPS_PROXY' in child, false)
  assert.equal('NODE_OPTIONS' in child, false)
  assert.equal('ARBITRARY_SECRET' in child, false)
})

test('unexpected preflight exceptions fail runner integrity instead of blocking it', () => {
  assert.deepEqual(preflightFailureOutcome(new Error('internal defect')), {
    status: 'FAIL',
    reason_code: 'GLOBAL_PREFLIGHT_ERROR',
    failure_class: 'runner',
  })
  assert.deepEqual(
    preflightFailureOutcome(new Tier0SafetyError('DESCRIPTOR_PATH_MISSING', 'no descriptor')),
    {
      status: 'BLOCKED',
      reason_code: 'GLOBAL_DESCRIPTOR_PATH_MISSING',
      failure_class: 'prerequisite',
    }
  )
  for (const code of [
    'EVIDENCE_SCHEMA_INVALID',
    'REGISTRY_HASH_MISMATCH',
    'NEXT_ROUTING_UNPROVEN',
    'BUILT_DESTINATION_FILE_UNREADABLE',
    'MUTATION_CAPABILITY_RECEIPT_MISMATCH',
  ]) {
    assert.deepEqual(preflightFailureOutcome(new Tier0SafetyError(code, 'integrity fault')), {
      status: 'FAIL',
      reason_code: `GLOBAL_${code}`,
      failure_class: 'runner',
    })
  }
})

test('external prerequisite failures block their exact invariant rows', () => {
  for (const [code, row] of [
    ['DESCRIPTOR_FILE_UNREADABLE', 'PRE-I01'],
    ['DESCRIPTOR_AUTHORITY_INVALID', 'PRE-I01'],
    ['IMMUTABLE_FETCH_RECEIPT_UNREADABLE', 'PRE-I03'],
    ['IMMUTABLE_FETCH_FILE_MISSING', 'PRE-I03'],
    ['PORT_OCCUPIED', 'PRE-I03'],
    ['RETENTION_EXPIRED', 'PRE-I03'],
    ['IDENTITY_HEALTH_FAILED', 'PRE-I04'],
  ]) {
    const error = new Tier0SafetyError(code, 'external prerequisite')
    assert.equal(preflightFailureOutcome(error).status, 'BLOCKED')
    assert.equal(preflightFailureRow(error), row)
  }
  assert.equal(preflightFailureRow(new Tier0SafetyError('NEXT_ROUTING_UNPROVEN', 'bug')), 'PRE-I02')
  assert.equal(
    preflightFailureOutcome(new Tier0SafetyError('NEXT_ROUTING_UNPROVEN', 'bug')).status,
    'FAIL'
  )
})

test('an explicitly named missing descriptor blocks PRE-I01 instead of failing the runner', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-missing-descriptor-'))
  try {
    const result = await runCertification({
      descriptorPath: path.join(root, 'missing.json'),
      evidenceRoot: path.join(root, 'evidence'),
      env: {},
    })
    const preflight = result.matrix.rows.find(row => row.row_id === 'PRE-I01')
    assert.equal(result.matrix.verdict, 'UNDETERMINED')
    assert.equal(exitCodeForVerdict(result.matrix.verdict), 3)
    assert.equal(preflight.status, 'BLOCKED')
    assert.equal(preflight.reason_code, 'GLOBAL_DESCRIPTOR_FILE_UNREADABLE')
    assert.equal(preflight.failure_class, 'prerequisite')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('RT-E14 cleanup proof requires the exact signed DELETE destination', () => {
  const controlDigest = cleanupControlDigest('cleanup-v1', 'signed-id', 'owner')
  const cleanupBinding = {
    run_id: 'run-1',
    receipt_sha256: 'a'.repeat(64),
    row_id: 'RT-E14',
    test_id: 'rt-e14-test',
    source: 'direct-api',
    attachment_id: 'b'.repeat(64),
  }
  const mutationDescriptor = {
    backendAllowlist: ['https://api.cert-sandbox.example.test'],
    frontendAllowlist: ['http://127.0.0.1:3100'],
    frontendOrigin: 'http://127.0.0.1:3100',
    fixtures: {
      mutation_record_id: 'signed-id',
      cleanup_control_id: 'cleanup-v1',
      mutation: {
        create_url: 'https://api.cert-sandbox.example.test/records',
        create_method: 'POST',
        create_id_field: 'id',
        create_body: { id: 'signed-id', owner_marker: 'owner' },
        response_id_field: 'id',
        response_id_header: 'x-tier0-created-id',
        response_owner_header: 'x-tier0-owner-marker',
        owner_marker: 'owner',
        observe_path: '/records/signed-id',
        observe_text: 'signed-id owner',
        cleanup_method: 'DELETE',
        cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
      },
    },
  }
  assert.equal(
    cleanupProvenanceObserved(
      [
        {
          ...cleanupBinding,
          method: 'DELETE',
          origin: 'https://api.cert-sandbox.example.test',
          pathname: '/records/signed-id',
          search: '',
          status: 204,
          proof: 'cleanup-delete-ack',
          controlDigest,
        },
        {
          ...cleanupBinding,
          method: 'GET',
          origin: 'https://api.cert-sandbox.example.test',
          pathname: '/records/signed-id',
          search: '',
          status: 404,
          proof: 'cleanup-absence',
          controlDigest,
        },
      ],
      mutationDescriptor
    ),
    true
  )
  assert.equal(
    cleanupProvenanceObserved(
      [
        {
          ...cleanupBinding,
          method: 'DELETE',
          origin: 'https://api.cert-sandbox.example.test',
          pathname: '/records/signed-id',
          status: 204,
          proof: 'cleanup-delete-ack',
          controlDigest,
        },
        {
          ...cleanupBinding,
          attachment_id: 'c'.repeat(64),
          method: 'GET',
          origin: 'https://api.cert-sandbox.example.test',
          pathname: '/records/signed-id',
          status: 404,
          proof: 'cleanup-absence',
          controlDigest,
        },
      ],
      mutationDescriptor
    ),
    false
  )
  for (const record of [
    {
      method: 'DELETE',
      origin: 'https://api.cert-sandbox.example.test',
      pathname: '/records/other',
      status: 204,
    },
    {
      method: 'POST',
      origin: 'https://api.cert-sandbox.example.test',
      pathname: '/records/signed-id',
      status: 204,
    },
    {
      method: 'DELETE',
      origin: 'https://other.example.test',
      pathname: '/records/signed-id',
      status: 204,
    },
  ]) {
    assert.equal(
      cleanupProvenanceObserved(
        [
          record,
          {
            ...cleanupBinding,
            method: 'GET',
            origin: 'https://api.cert-sandbox.example.test',
            pathname: '/records/signed-id',
            status: 404,
            proof: 'cleanup-absence',
            controlDigest,
          },
        ],
        mutationDescriptor
      ),
      false
    )
  }
})

test('typed final artifacts are scanned before publication', async () => {
  const clean = await scanSerializableEvidence({ rows: [{ status: 'PASS' }] }, {})
  const unsafe = await scanSerializableEvidence({ rows: [{ clientSecret: 'unsafe' }] }, {})
  assert.equal(clean.disposition, 'CLEAR_FOR_MATRIX_ASSEMBLY')
  assert.equal(unsafe.disposition, 'QUARANTINE')
  assert.equal(
    unsafe.findings.some(item => item.code === 'SENSITIVE_JSON_FIELD'),
    true
  )
})

test('exact final bytes, including pretty-print whitespace, are the bytes scanned', async () => {
  const bytes = Buffer.from('{\n  "status": "PASS"\n}\n')
  const scan = await scanExactEvidenceBytes(bytes, {})
  assert.equal(scan.scanned[0].sha256, createHash('sha256').update(bytes).digest('hex'))
  assert.equal(scan.scanned[0].size_bytes, bytes.length)
})

test('Playwright raw report, auth state, and failure artifacts are private and outside evidence', async () => {
  const evidenceRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-public-evidence-'))
  const layout = await createPrivatePlaywrightLayout(
    path.join(evidenceRoot, 'playwright-results.json')
  )
  for (const privatePath of [layout.rawOutputPath, layout.outputDir, layout.authStateRoot]) {
    assert.equal(path.relative(layout.ephemeralRoot, privatePath).startsWith('..'), false)
    assert.equal(path.relative(evidenceRoot, privatePath).startsWith('..'), true)
  }
  await rm(layout.ephemeralRoot, { recursive: true, force: true })
})

test('unexpected recursive failure artifacts are deleted and reported as metadata only', async () => {
  const evidenceRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-unexpected-evidence-'))
  const expected = path.join(evidenceRoot, 'playwright-results.json')
  const failureDir = path.join(evidenceRoot, 'raw-failures', 'nested')
  const forbidden = path.join(failureDir, 'trace.zip')
  await writeFile(expected, '{"status":"FAIL"}\n')
  await mkdir(failureDir, { recursive: true })
  await writeFile(forbidden, 'Bearer forbidden-sensitive-value')

  const result = await removeUnexpectedEvidenceArtifacts(evidenceRoot, [expected])

  await access(expected)
  await assert.rejects(access(forbidden))
  assert.deepEqual(result, { count: 1, all_removed: true, raw_material_retained: false })
  assert.doesNotMatch(JSON.stringify(result), /trace|forbidden|Bearer/)
})

test('an absent spec result is not synthesized as pass', () => {
  const outcomes = collectPlaywrightOutcomes(report({ 'OI-E01': 'passed' }))
  assert.equal(outcomes.has('OI-E10'), false)
})

test('sanitized Playwright evidence drops errors, stdout, and attachment paths', () => {
  const raw = report({ 'OI-E01': 'failed' })
  raw.suites[0].specs[0].tests[0].results[0].error = { message: 'sensitive DOM snapshot' }
  raw.suites[0].specs[0].tests[0].results[0].attachments = [{ path: '/secret/raw.html' }]
  const serialized = JSON.stringify(sanitizePlaywrightReport(raw))
  assert.doesNotMatch(serialized, /sensitive|secret|attachments|error/)
  assert.match(serialized, /failed/)
})

test('API provenance aggregation accepts only the sanitized allowlisted shape', async () => {
  const binding = {
    run_id: 'run-1',
    receipt_sha256: 'a'.repeat(64),
    row_id: 'OI-E10',
    test_id: 'oi-e10-test',
    source: 'browser-response',
  }
  const body = Buffer.from(
    JSON.stringify([
      {
        ...binding,
        method: 'GET',
        origin: 'https://sandbox.example.test',
        pathname: '/health/orders-integrity',
        status: 200,
      },
    ])
  ).toString('base64')
  const result = await collectApiProvenance(
    provenanceReport(body),
    '/tmp/tier0-evidence',
    ['https://sandbox.example.test'],
    { runId: binding.run_id, receiptSha256: binding.receipt_sha256 }
  )
  assert.equal(result.invalid, false)
  assert.equal(result.attachmentCount, 1)
  assert.equal(result.records.length, 1)
  assert.equal(result.records[0].pathname, '/health/orders-integrity')
})

test('API provenance rejects unsafe URL syntax and unexpected methods before canonicalization', async () => {
  const binding = {
    run_id: 'run-1',
    receipt_sha256: 'a'.repeat(64),
    row_id: 'OI-E10',
    test_id: 'oi-e10-test',
    source: 'browser-response',
  }
  for (const record of [
    {
      ...binding,
      method: 'GET',
      origin: 'https://sandbox.example.test?token=hidden',
      pathname: '/health/orders-integrity',
      status: 200,
    },
    {
      ...binding,
      method: 'TRACE',
      origin: 'https://sandbox.example.test',
      pathname: '/health/orders-integrity',
      status: 200,
    },
  ]) {
    const body = Buffer.from(JSON.stringify([record])).toString('base64')
    const result = await collectApiProvenance(
      provenanceReport(body),
      '/tmp/tier0-evidence',
      ['https://sandbox.example.test'],
      { runId: binding.run_id, receiptSha256: binding.receipt_sha256 }
    )
    assert.equal(result.invalid, true)
    assert.equal(result.records.length, 0)
  }
})

test('format-aware evidence scan quarantines structured secrets without reproducing them', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-scan-'))
  const cleanPath = path.join(root, 'clean.json')
  const unsafePath = path.join(root, 'unsafe.json')
  await writeFile(cleanPath, JSON.stringify({ token_count: 2, status: 'PASS' }))
  await writeFile(
    unsafePath,
    JSON.stringify({
      clientSecret: 'super-sensitive-value',
      customerEmail: 'person@example.test',
      phone_number: '+79991234567',
      headers: 'Set-Cookie: session=unsafe',
    })
  )
  const result = await scanPublishableEvidence([cleanPath, unsafePath], {
    E2E_TEST_PASSWORD: 'super-sensitive-value',
  })
  assert.equal(result.disposition, 'QUARANTINE')
  assert.equal(result.scanned.length, 2)
  assert.equal(
    result.findings.some(item => item.code === 'SENSITIVE_JSON_FIELD'),
    true
  )
  assert.equal(
    result.findings.some(item => item.code === 'BUSINESS_PII_JSON_FIELD'),
    true
  )
  assert.equal(
    result.findings.some(item => item.code === 'COOKIE_HEADER_VALUE'),
    true
  )
  assert.doesNotMatch(JSON.stringify(result), /super-sensitive-value/)
})

test('completed-log scan quarantines sensitive query keys even across chunk prefixes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-query-scan-'))
  const unsafePath = path.join(root, 'server.log')
  const redactedPath = path.join(root, 'redacted.log')
  await writeFile(unsafePath, '[stdout] GET /callback?tok[stdout] en=split-value\n')
  await writeFile(redactedPath, '[stdout] GET /callback?token=[REDACTED]\n')

  const result = await scanPublishableEvidence([unsafePath], {})
  const redacted = await scanPublishableEvidence([redactedPath], {})

  assert.equal(result.disposition, 'QUARANTINE')
  assert.equal(
    result.findings.some(item => item.code === 'SENSITIVE_QUERY_VALUE'),
    true
  )
  assert.doesNotMatch(JSON.stringify(result), /split-value/)
  assert.equal(redacted.disposition, 'CLEAR_FOR_MATRIX_ASSEMBLY')
})

test('evidence scan rejoins chunk prefixes before detecting every credential class', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-boundary-scan-'))
  const unsafePath = path.join(root, 'server.log')
  const declared = 'declared-secret-value'
  await writeFile(
    unsafePath,
    [
      '[stdout] Bear[stdout] er abc.def.ghi',
      '[stderr] eyJaaaaaaaaaaaa[stderr] .bbbbbbbbbbbb.cccccccccccc',
      '[stdout] declared-[stdout] secret-value',
      '[stdout] /callback?api_[stdout] key=unsafe',
    ].join('\n')
  )

  const result = await scanPublishableEvidence([unsafePath], { E2E_TEST_PASSWORD: declared })
  for (const code of [
    'BEARER_CREDENTIAL',
    'JWT_LIKE_VALUE',
    'DECLARED_CREDENTIAL_VALUE',
    'SENSITIVE_QUERY_VALUE',
  ]) {
    assert.equal(
      result.findings.some(item => item.code === code),
      true,
      code
    )
  }
})

test('quarantine removes unsafe originals from the evidence root and publishes metadata only', async () => {
  const evidenceRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-quarantine-root-'))
  const cleanPath = path.join(evidenceRoot, 'clean.json')
  const unsafePath = path.join(evidenceRoot, 'unsafe.log')
  await writeFile(cleanPath, '{"status":"PASS"}\n')
  await writeFile(unsafePath, 'Authorization: Bearer unsafe-value\n')
  const scan = await scanPublishableEvidence([cleanPath, unsafePath], {})

  const quarantine = await quarantineUnsafeEvidence(scan, evidenceRoot)
  const published = sanitizeEvidenceScanForPublication(scan, evidenceRoot, quarantine)

  await assert.rejects(access(unsafePath))
  await access(cleanPath)
  assert.equal(quarantine.removedPaths.includes(unsafePath), true)
  assert.equal(published.quarantine.originals_removed_from_evidence_root, true)
  assert.equal(published.quarantine.quarantine_root_deleted, true)
  assert.equal(published.quarantine.raw_material_retained, false)
  assert.doesNotMatch(JSON.stringify(published), new RegExp(evidenceRoot.replaceAll('/', '\\/')))
})
