#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MatrixRecorder,
  loadRegistry,
  serializeMatrix,
  writeMatrixAtomic,
} from './evidence-matrix.mjs'
import { runPreflight } from './preflight.mjs'
import {
  assertAllowedURL,
  assertReceiptMutationCapabilities,
  containsUnredactedSensitiveHeader,
  containsUnredactedSensitiveQuery,
  declaredTier0SecretEntries,
  loadEnvironmentDescriptor,
  mutationExecutionControl,
  Tier0SafetyError,
} from './runtime-safety.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REGISTRY_PATH = path.join(ROOT, 'e2e/tier0/tier0-row-registry.v1.json')

function argument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function safeCode(value, fallback) {
  const normalized = String(value || fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
  return normalized.slice(0, 120) || fallback
}

const EXTERNAL_PREFLIGHT_ROWS = new Map([
  ['DESCRIPTOR_PATH_MISSING', 'PRE-I01'],
  ['DESCRIPTOR_FILE_UNREADABLE', 'PRE-I01'],
  ['DESCRIPTOR_AUTHORITY_MISSING', 'PRE-I01'],
  ['DESCRIPTOR_AUTHORITY_INVALID', 'PRE-I01'],
  ['IMMUTABLE_FETCH_RECEIPT_MISSING', 'PRE-I03'],
  ['IMMUTABLE_FETCH_RECEIPT_UNREADABLE', 'PRE-I03'],
  ['IMMUTABLE_FETCH_RECEIPT_PERMISSIONS', 'PRE-I03'],
  ['IMMUTABLE_FETCH_FILE_MISSING', 'PRE-I03'],
  ['BUILD_ARTIFACT_MISSING', 'PRE-I03'],
  ['PORT_OCCUPIED', 'PRE-I03'],
  ['RETENTION_UNTIL_INVALID', 'PRE-I03'],
  ['RETENTION_EXPIRED', 'PRE-I03'],
  ['BROWSER_INTEGRITY_UNPROVEN', 'PRE-I05'],
  ['IDENTITY_UNREACHABLE', 'PRE-I04'],
  ['IDENTITY_HEALTH_FAILED', 'PRE-I04'],
  ['IDENTITY_NOT_NON_PRODUCTION', 'PRE-I04'],
  ['IDENTITY_DEPLOYMENT_MISMATCH', 'PRE-I04'],
  ['IDENTITY_CONTRACT_MISMATCH', 'PRE-I04'],
])

export function preflightFailureRow(error) {
  if (!(error instanceof Tier0SafetyError)) return 'PRE-I05'
  const externalRow = EXTERNAL_PREFLIGHT_ROWS.get(error.code)
  if (externalRow) return externalRow
  if (
    /^(?:ORIGIN_|ALLOWLIST_|DESTINATION_|DESCRIPTOR_|FRONTEND_|BACKEND_|PRODUCTION_HOST_|REDIRECT_CHAIN_)/.test(
      error.code
    )
  ) {
    return 'PRE-I01'
  }
  if (/^(?:NEXT_ROUTING_|BUILT_|BOUND_PUBLIC_API_|PUBLIC_API_ORIGIN_)/.test(error.code)) {
    return 'PRE-I02'
  }
  if (
    /^(?:ARTIFACT_|BUILD_|RCSM_|IMMUTABLE_|ENTRY_MANIFEST_|EXTRACTED_|RUNTIME_INPUT_|RUNTIME_IDENTITY_|PACKAGE_|SOURCE_TREE_|RETENTION_|RETRIEVAL_|OBJECT_|PLATFORM_|ARCH_|NODE_VERSION_|NPM_VERSION_|NEXT_VERSION_)/.test(
      error.code
    )
  ) {
    return 'PRE-I03'
  }
  if (/^(?:IDENTITY_|ENVIRONMENT_)/.test(error.code)) return 'PRE-I04'
  return 'PRE-I05'
}

export function preflightFailureOutcome(error) {
  const prerequisite = error instanceof Tier0SafetyError && EXTERNAL_PREFLIGHT_ROWS.has(error.code)
  return {
    status: prerequisite ? 'BLOCKED' : 'FAIL',
    reason_code: `GLOBAL_${safeCode(error?.code, 'PREFLIGHT_ERROR')}`,
    failure_class: prerequisite ? 'prerequisite' : 'runner',
  }
}

function environmentFromReceipt(receipt) {
  return (
    receipt?.environment || {
      name: 'unverified',
      deployment_id: 'unverified',
      contract_version: 'unverified',
    }
  )
}

function matrixContext(runId, receipt) {
  const rcsm = receipt?.artifact?.rcsm_sha256 || process.env.TIER0_RCSM_SHA256 || '0'.repeat(64)
  return {
    run_id: runId,
    environment: environmentFromReceipt(receipt),
    rcsm_sha256: /^[a-f0-9]{64}$/i.test(rcsm) ? rcsm.toLowerCase() : '0'.repeat(64),
    runtime_input_sha256: receipt?.artifact?.runtime_input_sha256 || '0'.repeat(64),
    revision: receipt?.artifact?.revision || '0'.repeat(40),
    source_tree_sha256: receipt?.artifact?.source_tree_sha256 || '0'.repeat(64),
    command: JSON.stringify([process.execPath, ...process.argv.slice(1)]),
    cwd: ROOT,
  }
}

export function bindOuterExitCode(matrix) {
  const row = matrix.rows.find(candidate => candidate.row_id === 'OBS-I01')
  if (row) row.exit_code = exitCodeForVerdict(matrix.verdict)
  return matrix
}

async function sha256File(filePath) {
  return createHash('sha256')
    .update(await readFile(filePath))
    .digest('hex')
}

const SECRET_KEY_PATTERN =
  /(?:authorization|cookie|cookies|setcookie|password|passwd|pwd|secret|token|apikey|privatekey|credential|sessionid|csrftoken)$/i
const BUSINESS_PII_KEY_PATTERN =
  /(?:email|phone|phonenumber|firstname|lastname|fullname|address|taxid|inn|snils|passport|cabinetid|orderid|supplierid|accountid|customerid|userid|employeeid)$/i
const BEARER_PATTERN = /\bBearer\s+(?!\[REDACTED\])\S+/i
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}(?:\.[A-Za-z0-9_-]+)?\b/
const PRIVATE_KEY_PATTERN = /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/
const GENERIC_EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const GENERIC_PHONE_PATTERN = /(?:\+\d{10,15}|\b\d{3}[- ()]\d{3}[- ]\d{4}\b)/
const HYDRATION_PATTERN = /\bhydrat(?:e|ed|ion)[^\n]*(?:mismatch|failed|error|warning)/i
const FATAL_RUNTIME_PATTERN = /\b(?:fatal|TypeError|uncaught exception|unhandled rejection)\b/i
const SERVER_5XX_PATTERN =
  /(?:\bHTTP(?:\/\d(?:\.\d)?)?\s+5\d\d\b|\bstatus(?:Code)?["':=\s]+5\d\d\b|\bresponse[^\n]{0,30}\b5\d\d\b)/i

function credentialFingerprints(env) {
  return declaredTier0SecretEntries(env).map(({ key, value, pii }) => ({
    key,
    value,
    code: pii ? 'DECLARED_PII_VALUE' : 'DECLARED_CREDENTIAL_VALUE',
  }))
}

export async function scanPublishableEvidence(paths, env = process.env) {
  const findings = []
  const scanned = []
  const credentials = credentialFingerprints(env)
  const add = (filePath, code, location) =>
    findings.push({ path: filePath, code, location, disposition: 'QUARANTINE' })
  const scanString = (value, filePath, location) => {
    const completedLog = value.replace(/\[(?:stdout|stderr)\]\s*/gi, '')
    if (BEARER_PATTERN.test(completedLog)) add(filePath, 'BEARER_CREDENTIAL', location)
    if (JWT_PATTERN.test(completedLog)) add(filePath, 'JWT_LIKE_VALUE', location)
    if (PRIVATE_KEY_PATTERN.test(completedLog)) add(filePath, 'PRIVATE_KEY_MATERIAL', location)
    if (containsUnredactedSensitiveHeader(completedLog)) {
      add(filePath, 'COOKIE_HEADER_VALUE', location)
    }
    if (containsUnredactedSensitiveQuery(completedLog)) {
      add(filePath, 'SENSITIVE_QUERY_VALUE', location)
    }
    if (GENERIC_EMAIL_PATTERN.test(completedLog)) add(filePath, 'GENERIC_EMAIL_PII', location)
    if (GENERIC_PHONE_PATTERN.test(completedLog)) add(filePath, 'GENERIC_PHONE_PII', location)
    if (HYDRATION_PATTERN.test(completedLog)) add(filePath, 'HYDRATION_WARNING', location)
    if (FATAL_RUNTIME_PATTERN.test(completedLog)) add(filePath, 'FATAL_RUNTIME_ERROR', location)
    if (SERVER_5XX_PATTERN.test(completedLog)) add(filePath, 'UNEXPECTED_SERVER_5XX', location)
    for (const credential of credentials) {
      if (completedLog.includes(credential.value)) add(filePath, credential.code, location)
    }
  }
  const walkJson = (value, filePath, location = '$') => {
    if (Array.isArray(value))
      return value.forEach((item, index) => walkJson(item, filePath, `${location}[${index}]`))
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string') scanString(value, filePath, location)
      return
    }
    for (const [key, child] of Object.entries(value)) {
      const childLocation = `${location}.${key}`
      const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
      if (
        SECRET_KEY_PATTERN.test(normalizedKey) &&
        child != null &&
        child !== '' &&
        child !== '[REDACTED]'
      ) {
        add(filePath, 'SENSITIVE_JSON_FIELD', childLocation)
      }
      if (
        BUSINESS_PII_KEY_PATTERN.test(normalizedKey) &&
        child != null &&
        child !== '' &&
        child !== '[REDACTED]'
      ) {
        add(filePath, 'BUSINESS_PII_JSON_FIELD', childLocation)
      }
      walkJson(child, filePath, childLocation)
    }
  }
  for (const filePath of [...new Set(paths)]) {
    let bytes
    try {
      bytes = await readFile(filePath)
    } catch {
      add(filePath, 'PUBLISHABLE_FILE_UNREADABLE', '$')
      continue
    }
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    scanned.push({ path: filePath, sha256, size_bytes: bytes.length })
    let text
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      add(filePath, 'NON_UTF8_PUBLISHABLE_BYTES', '$')
      continue
    }
    if (path.extname(filePath).toLowerCase() === '.json') {
      try {
        walkJson(JSON.parse(text), filePath)
      } catch {
        add(filePath, 'INVALID_JSON_EVIDENCE', '$')
      }
    } else {
      scanString(text, filePath, '$text')
    }
  }
  return {
    schema_version: 1,
    scope: 'pre-matrix-publishable-evidence',
    scanner: 'tier0-format-aware-v1',
    patterns: [
      'DECLARED_CREDENTIAL_VALUE',
      'DECLARED_PII_VALUE',
      'SENSITIVE_JSON_FIELD',
      'BEARER_CREDENTIAL',
      'JWT_LIKE_VALUE',
      'PRIVATE_KEY_MATERIAL',
      'COOKIE_HEADER_VALUE',
      'SENSITIVE_QUERY_VALUE',
      'GENERIC_EMAIL_PII',
      'GENERIC_PHONE_PII',
      'BUSINESS_PII_JSON_FIELD',
      'NON_UTF8_PUBLISHABLE_BYTES',
      'HYDRATION_WARNING',
      'FATAL_RUNTIME_ERROR',
      'UNEXPECTED_SERVER_5XX',
    ],
    scanned,
    findings,
    disposition: findings.length === 0 ? 'CLEAR_FOR_MATRIX_ASSEMBLY' : 'QUARANTINE',
    publication_gate: findings.length === 0 ? 'OPEN_FOR_EXTERNAL_CERT_F01_RESCAN' : 'CLOSED',
    retention: 'EXTERNAL_CERT_F01_POLICY_REQUIRED',
  }
}

export async function scanSerializableEvidence(value, env = process.env) {
  return scanExactEvidenceBytes(Buffer.from(`${JSON.stringify(value)}\n`), env)
}

export async function scanExactEvidenceBytes(bytes, env = process.env) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-typed-evidence-'))
  const filePath = path.join(root, 'typed-evidence.json')
  try {
    await writeFile(filePath, bytes, { flag: 'wx', mode: 0o600 })
    return await scanPublishableEvidence([filePath], env)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

export async function quarantineUnsafeEvidence(scan, evidenceRoot) {
  const root = path.resolve(evidenceRoot)
  const unsafePaths = [...new Set(scan.findings.map(finding => path.resolve(finding.path)))]
  const inRootPaths = unsafePaths.filter(unsafePath => {
    const relative = path.relative(root, unsafePath)
    return !relative.startsWith('..') && !path.isAbsolute(relative)
  })
  const quarantineRoot =
    inRootPaths.length > 0
      ? await mkdtemp(path.join(os.tmpdir(), 'tier0-evidence-quarantine-'))
      : null
  const removedPaths = []
  for (const [index, unsafePath] of inRootPaths.entries()) {
    const destination = path.join(quarantineRoot, `${index}-${path.basename(unsafePath)}`)
    try {
      await rename(unsafePath, destination)
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      await copyFile(unsafePath, destination)
      await unlink(unsafePath)
    }
    removedPaths.push(unsafePath)
  }
  if (quarantineRoot) await rm(quarantineRoot, { recursive: true, force: true })
  let quarantineRootDeleted = true
  if (quarantineRoot) {
    try {
      await stat(quarantineRoot)
      quarantineRootDeleted = false
    } catch (error) {
      quarantineRootDeleted = error?.code === 'ENOENT'
    }
  }
  let originalsRemovedFromEvidenceRoot = true
  for (const unsafePath of inRootPaths) {
    try {
      await stat(unsafePath)
      originalsRemovedFromEvidenceRoot = false
    } catch (error) {
      if (error?.code !== 'ENOENT') originalsRemovedFromEvidenceRoot = false
    }
  }
  return {
    removedPaths,
    count: removedPaths.length,
    originalsRemovedFromEvidenceRoot,
    quarantineRootDeleted,
    rawMaterialRetained: !quarantineRootDeleted || !originalsRemovedFromEvidenceRoot,
  }
}

function removeQuarantinedEvidenceReferences(recorder, removedPaths) {
  const removed = new Set(removedPaths.map(filePath => path.resolve(filePath)))
  for (const record of recorder.records.values()) {
    const retained = record.evidence_paths
      .map((evidencePath, index) => ({ evidencePath, sha256: record.evidence_sha256[index] }))
      .filter(item => !removed.has(path.resolve(item.evidencePath)))
    record.evidence_paths = retained.map(item => item.evidencePath)
    record.evidence_sha256 = retained.map(item => item.sha256)
  }
}

export function sanitizeEvidenceScanForPublication(scan, evidenceRoot, quarantine) {
  const root = path.resolve(evidenceRoot)
  const safePath = filePath => {
    const relative = path.relative(root, path.resolve(filePath))
    return relative.startsWith('..') || path.isAbsolute(relative)
      ? path.basename(filePath)
      : relative
  }
  return {
    ...scan,
    scanned: scan.scanned.map(item => ({ ...item, path: safePath(item.path) })),
    findings: scan.findings.map(item => ({ ...item, path: safePath(item.path) })),
    quarantine: {
      count: quarantine.count,
      originals_removed_from_evidence_root: quarantine.originalsRemovedFromEvidenceRoot,
      quarantine_root_deleted: quarantine.quarantineRootDeleted,
      raw_material_retained: quarantine.rawMaterialRetained,
      raw_material_published: false,
    },
  }
}

export function sanitizePlaywrightReport(report) {
  function sanitizeNode(node) {
    if (!node || typeof node !== 'object') return null
    const clean = {}
    if (typeof node.title === 'string') clean.title = node.title
    if (Array.isArray(node.tests)) {
      clean.tests = node.tests.map(test => ({
        annotations: Array.isArray(test.annotations)
          ? test.annotations.filter(annotation => annotation.type === 'tier0-failure-class')
          : [],
        results: Array.isArray(test.results)
          ? test.results.map(result => ({ status: result.status }))
          : [],
      }))
    }
    for (const key of ['suites', 'specs']) {
      if (Array.isArray(node[key])) clean[key] = node[key].map(sanitizeNode)
    }
    return clean
  }
  return sanitizeNode(report)
}

export function collectPlaywrightOutcomes(report) {
  const outcomes = new Map()
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (typeof node.title === 'string') {
      const id = node.title.match(/\[((?:RT-E|OI-E)\d{2})\]/)?.[1]
      if (id && Array.isArray(node.tests)) {
        const results = node.tests.flatMap(test =>
          Array.isArray(test.results) ? test.results : []
        )
        const statuses = results.map(result => result.status)
        const status =
          statuses.length > 0 && statuses.every(value => value === 'skipped')
            ? 'BLOCKED'
            : statuses.some(value => !['passed', 'skipped'].includes(value))
              ? 'FAIL'
              : statuses.includes('passed')
                ? 'PASS'
                : 'FAIL'
        outcomes.set(id, status)
      }
    }
    for (const key of ['suites', 'specs']) {
      if (Array.isArray(node[key])) node[key].forEach(visit)
    }
  }
  visit(report)
  return outcomes
}

export function collectPlaywrightFailureClasses(report) {
  const classes = new Map()
  const priority = { product: 1, infrastructure: 2, runner: 3 }
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (typeof node.title === 'string') {
      const id = node.title.match(/\[((?:RT-E|OI-E)\d{2})\]/)?.[1]
      if (id && Array.isArray(node.tests)) {
        for (const candidate of node.tests) {
          const failed = (candidate.results || []).some(result =>
            ['failed', 'timedOut', 'interrupted'].includes(result.status)
          )
          if (!failed) continue
          const declared = (candidate.annotations || [])
            .filter(annotation => annotation.type === 'tier0-failure-class')
            .map(annotation => annotation.description)
            .filter(value => ['product', 'infrastructure', 'runner'].includes(value))
            .sort((left, right) => priority[right] - priority[left])[0]
          const failureClass = declared || 'runner'
          if (priority[failureClass] > (priority[classes.get(id)] || 0)) {
            classes.set(id, failureClass)
          }
        }
      }
    }
    for (const key of ['suites', 'specs']) {
      if (Array.isArray(node[key])) node[key].forEach(visit)
    }
  }
  visit(report)
  return classes
}

export async function collectApiProvenance(
  report,
  evidenceRoot,
  allowedOrigins,
  { runId, receiptSha256 }
) {
  const discovered = []
  function visit(node, inherited = {}) {
    if (!node || typeof node !== 'object') return
    const rowId =
      (typeof node.title === 'string' &&
        (node.title.match(/\[((?:RT-E|OI-E)\d{2})\]/)?.[1] ||
          (node.title === 'create bound Tier-0 user storage state'
            ? 'PRE-I06'
            : node.title === 'create bound Tier-0 manager storage state'
              ? 'PRE-I07'
              : undefined))) ||
      inherited.rowId
    const testId = (typeof node.id === 'string' && node.id) || inherited.testId
    if (Array.isArray(node.attachments)) {
      discovered.push(...node.attachments.map(attachment => ({ attachment, rowId, testId })))
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(item => visit(item, { rowId, testId }))
      else if (value && typeof value === 'object') visit(value, { rowId, testId })
    }
  }
  visit(report)
  const candidates = discovered.filter(
    candidate => candidate.attachment?.name === 'tier0-api-provenance.json'
  )
  const records = []
  let invalid = false
  for (const [attachmentIndex, candidate] of candidates.entries()) {
    const { attachment, rowId, testId } = candidate
    let bytes
    try {
      if (typeof attachment.path === 'string') {
        const resolved = path.resolve(attachment.path)
        const relative = path.relative(path.resolve(evidenceRoot), resolved)
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          invalid = true
          continue
        }
        bytes = await readFile(resolved)
        await unlink(resolved).catch(() => undefined)
      } else if (typeof attachment.body === 'string') {
        bytes = Buffer.from(attachment.body, 'base64')
      } else {
        invalid = true
        continue
      }
      const parsed = JSON.parse(bytes.toString('utf8'))
      if (!Array.isArray(parsed)) {
        invalid = true
        continue
      }
      const attachmentId = createHash('sha256')
        .update(String(attachmentIndex))
        .update(bytes)
        .digest('hex')
      const attachmentBindings = new Set(
        parsed.map(record =>
          JSON.stringify([record?.run_id, record?.receipt_sha256, record?.row_id, record?.test_id])
        )
      )
      if (parsed.length > 0 && attachmentBindings.size !== 1) invalid = true
      for (const record of parsed) {
        const keys = Object.keys(record || {})
        const controlled =
          typeof record?.origin === 'string' && typeof record?.method === 'string'
            ? assertAllowedURL(record.origin, allowedOrigins, 'API provenance origin', {
                method: record.method,
                allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'DELETE'],
              })
            : null
        const origin = controlled?.origin || ''
        const valid =
          keys.every(key =>
            [
              'method',
              'origin',
              'pathname',
              'search',
              'status',
              'correlationId',
              'proof',
              'controlDigest',
              'run_id',
              'receipt_sha256',
              'row_id',
              'test_id',
              'source',
            ].includes(key)
          ) &&
          record.method === record.method.toUpperCase() &&
          record.origin === origin &&
          typeof record?.pathname === 'string' &&
          record.pathname.startsWith('/') &&
          !record.pathname.includes('?') &&
          (record.search === undefined || record.search === '') &&
          (record.status === undefined || Number.isInteger(record.status)) &&
          (record.correlationId === undefined || typeof record.correlationId === 'string') &&
          (record.proof === undefined ||
            ['cleanup-delete-ack', 'cleanup-absence'].includes(record.proof)) &&
          (record.controlDigest === undefined || /^[a-f0-9]{64}$/.test(record.controlDigest)) &&
          record.run_id === runId &&
          record.receipt_sha256 === receiptSha256 &&
          record.row_id === rowId &&
          record.test_id === testId &&
          /^(?:PRE-I|RT-E|OI-E)\d{2}$/.test(record.row_id) &&
          typeof record.test_id === 'string' &&
          record.test_id.length > 0 &&
          ['browser-response', 'direct-api'].includes(record.source)
        if (!valid) invalid = true
        else records.push({ ...record, origin, attachment_id: attachmentId })
      }
    } catch {
      invalid = true
    }
  }
  return { records, attachmentCount: candidates.length, invalid }
}

const CAPABILITY_REASON = {
  P_USER: 'USER_AUTHORITY_MISSING',
  P_MANAGER: 'MANAGER_AUTHORITY_MISSING',
  P_CABINET: 'CABINET_FIXTURE_MISSING',
  P_FINANCE: 'FINANCE_FIXTURE_MISSING',
  P_ORDERS: 'ORDERS_CONTROL_MISSING',
  P_MUTATION: 'MUTATION_AUTHORITY_MISSING',
  P_CLEANUP: 'CLEANUP_CONTROL_UNPROVEN',
}

export function classifyPlaywrightRow(
  row,
  outcomes,
  capabilities,
  reportPresent = true,
  failureClasses = new Map()
) {
  const outcome = outcomes.get(row.id)
  if (outcome === 'FAIL') {
    const failureClass = failureClasses.get(row.id) || 'runner'
    return {
      status: 'FAIL',
      reason_code:
        failureClass === 'product'
          ? 'LIVE_PRODUCT_ASSERTION_FAILED'
          : failureClass === 'infrastructure'
            ? 'LIVE_INFRASTRUCTURE_FAILED'
            : 'LIVE_RUNNER_EXECUTION_FAILED',
      failure_class: failureClass,
    }
  }
  const missing = row.dependencies.find(
    dependency => dependency.startsWith('P_') && !capabilities[dependency]
  )
  if (missing) {
    return {
      status: 'BLOCKED',
      reason_code: CAPABILITY_REASON[missing] || 'DECLARED_PREREQUISITE_MISSING',
      failure_class: 'prerequisite',
    }
  }
  if (outcome) {
    if (outcome === 'BLOCKED') {
      return {
        status: 'FAIL',
        reason_code: 'EXECUTION_SKIPPED_WITH_PREREQUISITES',
        failure_class: 'runner',
      }
    }
    return {
      status: outcome,
      reason_code: outcome === 'PASS' ? 'LIVE_ASSERTION_PASSED' : 'LIVE_ASSERTION_FAILED',
      failure_class: outcome === 'PASS' ? 'none' : 'product',
    }
  }
  return {
    status: 'FAIL',
    reason_code: reportPresent ? 'SPEC_RESULT_MISSING' : 'PLAYWRIGHT_REPORT_MISSING',
    failure_class: 'runner',
  }
}

export function playwrightRunnerIntegrity({ exitCode, report, privateCleanup }) {
  if (privateCleanup && privateCleanup.deleted !== true) {
    return {
      status: 'FAIL',
      reason_code: 'PRIVATE_PLAYWRIGHT_ARTIFACT_CLEANUP_FAILED',
      failure_class: 'runner',
    }
  }
  if (!report) {
    return {
      status: 'FAIL',
      reason_code: 'PLAYWRIGHT_REPORT_MISSING',
      failure_class: 'runner',
    }
  }
  const reportLevelError =
    (Array.isArray(report.errors) && report.errors.length > 0) || report.error != null
  if (reportLevelError) {
    return {
      status: 'FAIL',
      reason_code: 'PLAYWRIGHT_REPORT_LEVEL_ERROR',
      failure_class: 'runner',
    }
  }
  const outcomes = collectPlaywrightOutcomes(report)
  const failureClasses = collectPlaywrightFailureClasses(report)
  const failedRows = [...outcomes.entries()].filter(([, status]) => status === 'FAIL')
  const onlyExplicitProductFailures =
    failedRows.length > 0 && failedRows.every(([rowId]) => failureClasses.get(rowId) === 'product')
  if (exitCode === 1 && onlyExplicitProductFailures) {
    return {
      status: 'PASS',
      reason_code: 'PRODUCT_FAILURES_REPORTED',
      failure_class: 'none',
    }
  }
  return exitCode !== 0 ||
    (Number.isInteger(report.stats?.unexpected) && report.stats.unexpected > 0)
    ? {
        status: 'FAIL',
        reason_code: 'PLAYWRIGHT_EXIT_OR_STATS_INCONSISTENT',
        failure_class: 'runner',
      }
    : {
        status: 'PASS',
        reason_code: 'RUNNER_INTEGRITY_PASSED',
        failure_class: 'none',
      }
}

function collectSetupOutcome(report, exactTitle) {
  const statuses = []
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.title === exactTitle && Array.isArray(node.tests)) {
      for (const test of node.tests) {
        for (const result of test.results || []) statuses.push(result.status)
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(report)
  if (statuses.some(status => !['passed', 'skipped'].includes(status))) return 'FAIL'
  if (statuses.includes('passed')) return 'PASS'
  return 'BLOCKED'
}

export async function createPrivatePlaywrightLayout(outputPath) {
  const ephemeralRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-playwright-private-'))
  return {
    ephemeralRoot,
    rawOutputPath: path.join(ephemeralRoot, 'report.json'),
    outputDir: path.join(ephemeralRoot, 'test-artifacts'),
    authStateRoot: path.join(ephemeralRoot, 'auth-state'),
    sanitizedOutputPath: path.resolve(outputPath),
  }
}

const PLAYWRIGHT_ENV_ALLOWLIST = [
  'PATH',
  'HOME',
  'TMPDIR',
  'PLAYWRIGHT_BROWSERS_PATH',
  'E2E_TEST_EMAIL',
  'E2E_TEST_PASSWORD',
  'E2E_MANAGER_EMAIL',
  'E2E_MANAGER_PASSWORD',
  'E2E_RESTRICTED_EMAIL',
  'E2E_RESTRICTED_PASSWORD',
  'E2E_ENABLE_MUTATIONS',
  'E2E_MUTATION_TARGET',
  'E2E_MUTATION_ACK',
  'TIER0_ENV_DESCRIPTOR',
  'TIER0_PREFLIGHT_RECEIPT',
  'TIER0_SERVER_IDENTITY',
  'TIER0_SERVER_LOG',
  'TIER0_TRUSTED_DESCRIPTOR_ISSUER',
  'TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256',
  'TIER0_RCSM_SHA256',
  'TIER0_RUN_ID',
  'TIER0_EXPECTED_RUN_ID',
  'TIER0_EXPECTED_DESCRIPTOR_SHA256',
  'TIER0_EXPECTED_DESCRIPTOR_SIGNATURE_SHA256',
  'TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256',
]

export function buildPlaywrightChildEnv(env, controls) {
  const child = {}
  for (const key of PLAYWRIGHT_ENV_ALLOWLIST) {
    if (typeof env[key] === 'string' && env[key] !== '') child[key] = env[key]
  }
  for (const [key, value] of Object.entries(controls)) {
    if (typeof value === 'string' && value !== '') child[key] = value
  }
  return child
}

export async function removeUnexpectedEvidenceArtifacts(evidenceRoot, expectedPaths) {
  const root = path.resolve(evidenceRoot)
  const expected = new Set(expectedPaths.map(filePath => path.resolve(filePath)))
  let count = 0
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    let containsExpected = false
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        const childContainsExpected = await walk(entryPath)
        containsExpected ||= childContainsExpected
        if (!childContainsExpected) {
          await rm(entryPath, { recursive: true, force: true }).catch(() => undefined)
        }
      } else if (expected.has(path.resolve(entryPath))) {
        containsExpected = true
      } else {
        await rm(entryPath, { recursive: true, force: true })
        count += 1
      }
    }
    return containsExpected
  }
  await walk(root)
  let allRemoved = true
  async function verify(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) await verify(entryPath)
      else if (!expected.has(path.resolve(entryPath))) allRemoved = false
    }
  }
  await verify(root)
  return { count, all_removed: allRemoved, raw_material_retained: !allRemoved }
}

async function runPlaywright(env, outputPath) {
  const { ephemeralRoot, rawOutputPath, outputDir, authStateRoot } =
    await createPrivatePlaywrightLayout(outputPath)
  const cli = path.join(ROOT, 'node_modules/@playwright/test/cli.js')
  let report = null
  const privateCleanup = { deleted: false }
  try {
    const child = spawn(process.execPath, [cli, 'test', '--config=playwright.tier0.config.ts'], {
      cwd: ROOT,
      env: buildPlaywrightChildEnv(env, {
        TIER0_PLAYWRIGHT_PRIVATE_ROOT: ephemeralRoot,
        TIER0_PLAYWRIGHT_JSON: rawOutputPath,
        TIER0_PLAYWRIGHT_OUTPUT_DIR: outputDir,
        TIER0_USER_STORAGE_STATE: path.join(authStateRoot, 'user.json'),
        TIER0_MANAGER_STORAGE_STATE: path.join(authStateRoot, 'manager.json'),
      }),
      stdio: ['ignore', 'inherit', 'inherit'],
    })
    const exitCode = await new Promise(resolve => {
      child.once('error', () => resolve(1))
      child.once('exit', code => resolve(code ?? 1))
    })
    try {
      report = JSON.parse(await readFile(rawOutputPath, 'utf8'))
    } catch {
      // The caller maps absent/corrupt reporter output to FAIL, never PASS.
    }
    if (report) {
      await writeFile(
        outputPath,
        `${JSON.stringify(sanitizePlaywrightReport(report), null, 2)}\n`,
        { flag: 'wx', mode: 0o600 }
      )
    }
    return { exitCode, report, privateCleanup }
  } finally {
    await unlink(rawOutputPath).catch(() => undefined)
    await rm(ephemeralRoot, { recursive: true, force: true })
    try {
      await stat(ephemeralRoot)
    } catch (error) {
      privateCleanup.deleted = error?.code === 'ENOENT'
    }
  }
}

export function cleanupProvenanceObserved(records, descriptor) {
  let plan
  try {
    plan = mutationExecutionControl(descriptor)
  } catch {
    return false
  }
  const exact = (record, method, proof, status) =>
    record.method === method &&
    record.origin === plan.cleanup.origin &&
    record.pathname === plan.cleanup.pathname &&
    (record.search === undefined || record.search === '') &&
    record.proof === proof &&
    record.controlDigest === plan.controlDigest &&
    record.row_id === 'RT-E14' &&
    record.source === 'direct-api' &&
    status(record.status)
  const deleted = records.filter(record =>
    exact(
      record,
      'DELETE',
      'cleanup-delete-ack',
      value => typeof value === 'number' && value >= 200 && value < 300
    )
  )
  return deleted.some(deleteRecord =>
    records.some(
      record =>
        record.attachment_id === deleteRecord.attachment_id &&
        record.test_id === deleteRecord.test_id &&
        record.run_id === deleteRecord.run_id &&
        record.receipt_sha256 === deleteRecord.receipt_sha256 &&
        exact(record, 'GET', 'cleanup-absence', value => [404, 410].includes(value))
    )
  )
}

export async function runCertification({ descriptorPath, evidenceRoot, env = process.env }) {
  const certificationStartedAt = new Date().toISOString()
  const registry = await loadRegistry(REGISTRY_PATH)
  const runId = env.TIER0_RUN_ID || `tier0-${Date.now()}`
  await mkdir(evidenceRoot, { recursive: false, mode: 0o700 })
  const receiptPath = path.join(evidenceRoot, 'preflight-receipt.json')
  const matrixPath = path.join(evidenceRoot, 'tier0-matrix.json')
  let receipt
  let validatedDescriptor
  let descriptorSnapshotRoot
  let descriptorSnapshotPath = descriptorPath

  try {
    if (descriptorPath) {
      descriptorSnapshotRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-descriptor-private-'))
      descriptorSnapshotPath = path.join(descriptorSnapshotRoot, 'environment-descriptor.json')
      let descriptorBytes
      try {
        descriptorBytes = await readFile(descriptorPath)
      } catch {
        throw new Tier0SafetyError(
          'DESCRIPTOR_FILE_UNREADABLE',
          'environment descriptor is unavailable or unreadable'
        )
      }
      await writeFile(descriptorSnapshotPath, descriptorBytes, {
        flag: 'wx',
        mode: 0o400,
      })
    }
    receipt = await runPreflight({
      descriptorPath: descriptorSnapshotPath,
      receiptPath,
      env: { ...env, TIER0_RUN_ID: runId },
    })
    const loaded = await loadEnvironmentDescriptor(descriptorSnapshotPath)
    if (loaded.sha256 !== receipt.descriptor_sha256) {
      throw new Tier0SafetyError(
        'DESCRIPTOR_CHANGED_AFTER_PREFLIGHT',
        'descriptor changed after the preflight receipt was created'
      )
    }
    validatedDescriptor = loaded.descriptor
    assertReceiptMutationCapabilities(env, receipt.capabilities, validatedDescriptor)
  } catch (error) {
    if (descriptorSnapshotRoot) await rm(descriptorSnapshotRoot, { recursive: true, force: true })
    const failure = preflightFailureOutcome(error)
    const recorder = new MatrixRecorder(registry, matrixContext(runId, null))
    recorder.record(preflightFailureRow(error), failure)
    recorder.blockRemaining(failure.reason_code, failure.failure_class)
    const matrix = bindOuterExitCode(recorder.finalize())
    const matrixBytes = serializeMatrix(matrix)
    const finalScan = await scanExactEvidenceBytes(matrixBytes, env)
    if (finalScan.findings.length > 0) {
      throw new Error('blocked Tier-0 matrix bytes failed the publication scan')
    }
    await writeMatrixAtomic(matrixPath, matrix, matrixBytes)
    return { matrix, matrixPath, blockedBeforeCredentials: true }
  }

  const recorder = new MatrixRecorder(registry, matrixContext(runId, receipt))
  for (const rowId of ['PRE-I01', 'PRE-I02', 'PRE-I03', 'PRE-I04']) {
    recorder.record(rowId, {
      status: 'PASS',
      reason_code: 'PREFLIGHT_ASSERTION_PASSED',
      failure_class: 'none',
    })
  }
  recorder.record('PRE-I09', {
    status: receipt.capabilities.P_MUTATION ? 'PASS' : 'BLOCKED',
    reason_code: receipt.capabilities.P_MUTATION
      ? 'MUTATION_AUTHORITY_DECLARED'
      : 'MUTATION_AUTHORITY_MISSING',
    failure_class: receipt.capabilities.P_MUTATION ? 'none' : 'prerequisite',
  })
  const fixtureCapabilities = ['P_CABINET', 'P_FINANCE', 'P_ORDERS']
  const missingFixtureCapability = fixtureCapabilities.find(key => !receipt.capabilities[key])
  const fixturesReady = !missingFixtureCapability
  recorder.record('PRE-I08', {
    status: fixturesReady ? 'PASS' : 'BLOCKED',
    reason_code: fixturesReady
      ? 'FIXTURE_CAPABILITIES_PRESENT'
      : CAPABILITY_REASON[missingFixtureCapability],
    failure_class: fixturesReady ? 'none' : 'prerequisite',
  })
  const reportPath = path.join(evidenceRoot, 'playwright-results.json')
  const serverIdentityPath = path.join(evidenceRoot, 'server-identity.json')
  const serverLogPath = path.join(evidenceRoot, 'server.log')
  const expectedReceiptSha256 = await sha256File(receiptPath)
  let playwright
  try {
    playwright = await runPlaywright(
      {
        ...env,
        TIER0_ENV_DESCRIPTOR: descriptorSnapshotPath,
        TIER0_RUN_ID: receipt.run_id,
        TIER0_EXPECTED_RUN_ID: receipt.run_id,
        TIER0_EXPECTED_DESCRIPTOR_SHA256: receipt.descriptor_sha256,
        TIER0_EXPECTED_DESCRIPTOR_SIGNATURE_SHA256: receipt.descriptor_authority.signature_sha256,
        TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256: expectedReceiptSha256,
        TIER0_PREFLIGHT_RECEIPT: receiptPath,
        TIER0_SERVER_IDENTITY: serverIdentityPath,
        TIER0_SERVER_LOG: serverLogPath,
      },
      reportPath
    )
  } finally {
    if (descriptorSnapshotRoot) {
      await rm(descriptorSnapshotRoot, { recursive: true, force: true })
      descriptorSnapshotRoot = undefined
    }
  }
  recorder.record('PRE-I05', playwrightRunnerIntegrity(playwright))
  const outcomes = collectPlaywrightOutcomes(playwright.report)
  const failureClasses = collectPlaywrightFailureClasses(playwright.report)
  const provenancePath = path.join(evidenceRoot, 'api-provenance.json')
  const provenance = await collectApiProvenance(
    playwright.report,
    evidenceRoot,
    [
      ...(receipt.allowed_origins?.frontend || [receipt.frontend_origin]),
      ...(receipt.allowed_origins?.backend || [receipt.backend_origin]),
    ].map(origin => new URL(origin).origin),
    { runId: receipt.run_id, receiptSha256: expectedReceiptSha256 }
  )
  if (!provenance.invalid && provenance.records.length > 0) {
    await writeFile(provenancePath, `${JSON.stringify(provenance.records, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    })
  }
  const provenanceSha256 =
    provenance.records.length > 0 && !provenance.invalid
      ? await sha256File(provenancePath)
      : undefined
  const userSetup = collectSetupOutcome(playwright.report, 'create bound Tier-0 user storage state')
  const managerSetup = collectSetupOutcome(
    playwright.report,
    'create bound Tier-0 manager storage state'
  )
  for (const [rowId, capability, setupOutcome, missingReason] of [
    ['PRE-I06', 'P_USER', userSetup, 'USER_AUTHORITY_MISSING'],
    ['PRE-I07', 'P_MANAGER', managerSetup, 'MANAGER_AUTHORITY_MISSING'],
  ]) {
    const declared = receipt.capabilities[capability]
    const status = !declared ? 'BLOCKED' : setupOutcome === 'PASS' ? 'PASS' : 'FAIL'
    recorder.record(rowId, {
      status,
      reason_code: !declared
        ? missingReason
        : status === 'PASS'
          ? 'AUTHORITY_LIVE_PROOF_PASSED'
          : setupOutcome === 'FAIL'
            ? 'AUTHORITY_LIVE_PROOF_FAILED'
            : 'AUTHORITY_LIVE_PROOF_MISSING',
      failure_class:
        status === 'PASS' ? 'none' : status === 'FAIL' ? 'infrastructure' : 'prerequisite',
    })
  }
  const mutationOutcome = outcomes.get('RT-E14')
  const cleanupDeclared = receipt.capabilities.P_MUTATION && receipt.capabilities.P_CLEANUP
  const cleanupObserved = cleanupProvenanceObserved(provenance.records, validatedDescriptor)
  recorder.record('PRE-I10', {
    status: !cleanupDeclared
      ? 'BLOCKED'
      : mutationOutcome === 'PASS' && cleanupObserved
        ? 'PASS'
        : 'FAIL',
    reason_code: !cleanupDeclared
      ? 'CLEANUP_CONTROL_UNPROVEN'
      : mutationOutcome === 'PASS' && cleanupObserved
        ? 'CLEANUP_LIVE_PROOF_PASSED'
        : mutationOutcome === 'FAIL'
          ? 'CLEANUP_LIVE_PROOF_FAILED'
          : 'CLEANUP_LIVE_PROOF_MISSING',
    failure_class:
      cleanupDeclared && mutationOutcome === 'PASS' && cleanupObserved
        ? 'none'
        : mutationOutcome === 'FAIL'
          ? failureClasses.get('RT-E14') || 'runner'
          : 'runner',
  })
  const reportSha256 = playwright.report ? await sha256File(reportPath) : undefined
  for (const row of registry.rows.filter(row =>
    ['runtime', 'orders-integrity'].includes(row.group)
  )) {
    let result = classifyPlaywrightRow(
      row,
      outcomes,
      receipt.capabilities,
      Boolean(playwright.report),
      failureClasses
    )
    if (row.id === 'RT-E14' && result.status === 'PASS' && !cleanupObserved) {
      result = {
        status: 'FAIL',
        reason_code: 'CLEANUP_LIVE_PROOF_MISSING',
        failure_class: 'runner',
      }
    }
    recorder.record(row.id, {
      ...result,
      evidence_paths: playwright.report ? [reportPath] : [],
      evidence_sha256: reportSha256 ? [reportSha256] : [],
      cleanup_status:
        row.id === 'RT-E14'
          ? result.status === 'PASS'
            ? 'complete'
            : result.status === 'BLOCKED'
              ? 'not-started'
              : 'failed'
          : 'not-applicable',
    })
    if (row.id === 'RT-E14' && provenanceSha256) {
      const recorded = recorder.records.get(row.id)
      recorded.evidence_paths.push(provenancePath)
      recorded.evidence_sha256.push(provenanceSha256)
    }
  }

  recorder.record('OBS-I01', {
    status: 'PASS',
    reason_code: 'COMMAND_PROVENANCE_RECORDED',
    failure_class: 'none',
    evidence_paths: [receiptPath],
    evidence_sha256: [await sha256File(receiptPath)],
    started_at: certificationStartedAt,
    finished_at: new Date().toISOString(),
  })
  let serverLogPresent = false
  let serverLogSafe = false
  try {
    const serverLog = await readFile(serverLogPath, 'utf8')
    serverLogPresent = true
    serverLogSafe =
      !/\bBearer\s+(?!\[REDACTED\])\S+/i.test(serverLog) &&
      !/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/.test(serverLog)
  } catch {
    serverLogSafe = false
  }
  recorder.record('OBS-I03', {
    status: provenance.invalid || provenance.records.length === 0 ? 'FAIL' : 'PASS',
    reason_code: provenance.invalid
      ? 'API_PROVENANCE_INVALID'
      : provenance.records.length > 0
        ? 'SANITIZED_API_PROVENANCE_PRESENT'
        : provenance.attachmentCount > 0
          ? 'API_PROVENANCE_EMPTY'
          : 'API_PROVENANCE_ATTACHMENT_MISSING',
    failure_class: provenance.records.length > 0 && !provenance.invalid ? 'none' : 'runner',
    evidence_paths: provenanceSha256 ? [provenancePath] : [],
    evidence_sha256: provenanceSha256 ? [provenanceSha256] : [],
  })
  const scanReportPath = path.join(evidenceRoot, 'evidence-scan-report.json')
  const publishablePaths = [
    receiptPath,
    ...(playwright.report ? [reportPath] : []),
    ...(serverLogPresent ? [serverLogPath] : []),
    ...(provenance.records.length > 0 && !provenance.invalid ? [provenancePath] : []),
  ]
  try {
    await stat(serverIdentityPath)
    publishablePaths.push(serverIdentityPath)
  } catch {
    // The server identity is optional evidence, never synthesized.
  }
  const unexpectedArtifacts = await removeUnexpectedEvidenceArtifacts(
    evidenceRoot,
    publishablePaths
  )
  const evidenceScan = await scanPublishableEvidence(publishablePaths, env)
  const quarantine = await quarantineUnsafeEvidence(evidenceScan, evidenceRoot)
  if (unexpectedArtifacts.count > 0 || !unexpectedArtifacts.all_removed) {
    evidenceScan.findings.push({
      path: evidenceRoot,
      code: 'UNEXPECTED_EVIDENCE_ARTIFACT',
      location: '$private-root',
      disposition: 'DELETED',
    })
    evidenceScan.disposition = 'QUARANTINE'
    evidenceScan.publication_gate = 'CLOSED'
  }
  removeQuarantinedEvidenceReferences(recorder, quarantine.removedPaths)
  let publishableScan = sanitizeEvidenceScanForPublication(evidenceScan, evidenceRoot, quarantine)
  let scanReportBytes = Buffer.from(`${JSON.stringify(publishableScan, null, 2)}\n`)
  const typedScanReportScan = await scanExactEvidenceBytes(scanReportBytes, env)
  if (typedScanReportScan.findings.length > 0) {
    evidenceScan.findings.push({
      path: scanReportPath,
      code: 'SANITIZED_SCAN_REPORT_UNSAFE',
      location: '$typed-report',
      disposition: 'QUARANTINE',
    })
    evidenceScan.disposition = 'QUARANTINE'
    evidenceScan.publication_gate = 'CLOSED'
    publishableScan = {
      schema_version: 1,
      scope: 'pre-matrix-publishable-evidence',
      scanner: 'tier0-format-aware-v1',
      scanned: [],
      findings: [{ code: 'SANITIZED_SCAN_REPORT_UNSAFE', disposition: 'QUARANTINE' }],
      disposition: 'QUARANTINE',
      publication_gate: 'CLOSED',
      retention: 'EXTERNAL_CERT_F01_POLICY_REQUIRED',
      quarantine: {
        count: quarantine.count,
        originals_removed_from_evidence_root: quarantine.originalsRemovedFromEvidenceRoot,
        quarantine_root_deleted: quarantine.quarantineRootDeleted,
        raw_material_retained: quarantine.rawMaterialRetained,
        raw_material_published: false,
      },
    }
    scanReportBytes = Buffer.from(`${JSON.stringify(publishableScan, null, 2)}\n`)
    const fallbackScan = await scanExactEvidenceBytes(scanReportBytes, env)
    if (fallbackScan.findings.length > 0) {
      throw new Error('sanitized Tier-0 scan report bytes failed the publication scan')
    }
  }
  await writeFile(scanReportPath, scanReportBytes, {
    flag: 'wx',
    mode: 0o600,
  })
  const scanClean = evidenceScan.findings.length === 0
  const obs2Pass = Boolean(playwright.report) && serverLogSafe && scanClean
  recorder.record('OBS-I02', {
    status: obs2Pass ? 'PASS' : 'FAIL',
    reason_code: !scanClean
      ? 'PUBLISHABLE_EVIDENCE_QUARANTINED'
      : obs2Pass
        ? 'FORMAT_AWARE_SCAN_CLEAR'
        : playwright.report
          ? 'SANITIZED_SERVER_LOG_MISSING_OR_UNSAFE'
          : 'PLAYWRIGHT_REPORT_MISSING',
    failure_class: obs2Pass ? 'none' : 'runner',
    evidence_paths: [
      ...evidenceScan.scanned
        .filter(item => !quarantine.removedPaths.includes(path.resolve(item.path)))
        .map(item => item.path),
      scanReportPath,
    ],
    evidence_sha256: [
      ...evidenceScan.scanned
        .filter(item => !quarantine.removedPaths.includes(path.resolve(item.path)))
        .map(item => item.sha256),
      await sha256File(scanReportPath),
    ],
  })
  recorder.record('OBS-I04', {
    status: 'PASS',
    reason_code: 'MATRIX_EXACTLY_COMPLETE',
    failure_class: 'none',
  })

  let matrix = bindOuterExitCode(recorder.finalize())
  let matrixBytes = serializeMatrix(matrix)
  const candidateMatrixScan = await scanExactEvidenceBytes(matrixBytes, env)
  if (candidateMatrixScan.findings.length > 0) {
    const observation = recorder.records.get('OBS-I02')
    observation.status = 'FAIL'
    observation.reason_code = 'FINAL_MATRIX_TYPED_SCAN_FAILED'
    observation.failure_class = 'runner'
    matrix = bindOuterExitCode(recorder.finalize())
    matrixBytes = serializeMatrix(matrix)
    const failedMatrixScan = await scanExactEvidenceBytes(matrixBytes, env)
    if (failedMatrixScan.findings.length > 0) {
      throw new Error('final Tier-0 matrix bytes failed the publication scan')
    }
  }
  await writeMatrixAtomic(matrixPath, matrix, matrixBytes)
  return {
    matrix,
    matrixPath,
    blockedBeforeCredentials: false,
    playwrightExitCode: playwright.exitCode,
  }
}

export function exitCodeForVerdict(verdict) {
  if (verdict === 'PASS') return 0
  if (verdict === 'FAIL') return 1
  return 3
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const descriptorPath = argument('--descriptor') || process.env.TIER0_ENV_DESCRIPTOR
  const evidenceRoot = argument('--evidence-root')
  if (!evidenceRoot) {
    process.stderr.write('Missing --evidence-root (must name a new private directory)\n')
    process.exitCode = 2
  } else {
    try {
      const result = await runCertification({ descriptorPath, evidenceRoot })
      process.stdout.write(
        `${JSON.stringify({ matrix_verdict: result.matrix.verdict, certification_status: result.matrix.certification_status, counts: result.matrix.counts, matrix: result.matrixPath })}\n`
      )
      process.exitCode = exitCodeForVerdict(result.matrix.verdict)
    } catch (error) {
      process.stderr.write(
        `${JSON.stringify({ status: 'RUNNER_FAILURE', message: error.message })}\n`
      )
      process.exitCode = 2
    }
  }
}
