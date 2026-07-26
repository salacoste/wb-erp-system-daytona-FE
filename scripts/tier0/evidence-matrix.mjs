import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

const TERMINAL = new Set(['PASS', 'FAIL', 'BLOCKED'])
const FAILURE_CLASSES = new Set(['none', 'prerequisite', 'product', 'infrastructure', 'runner'])
const REGISTRY_V1_SEMANTIC_SHA256 =
  '4f9383620e3971b73771973fef0d0d0cc26ac27a7d9e9c679fbaf1b28c7baf6b'

export function validateRegistry(registry) {
  if (registry?.schema_version !== 1 || registry?.registry_version !== 'tier0-v1') {
    throw new Error('Unsupported Tier-0 registry')
  }
  if (!Array.isArray(registry.rows) || registry.rows.length !== 38) {
    throw new Error('Tier-0 registry v1 must contain exactly 38 rows')
  }
  const ids = registry.rows.map(row => row.id)
  if (new Set(ids).size !== ids.length)
    throw new Error('Tier-0 registry contains duplicate row IDs')
  if (
    registry.immutable_after_first_use !== true ||
    registry.closure_postcondition !== 'CERT-F01' ||
    createHash('sha256').update(JSON.stringify(registry)).digest('hex') !==
      REGISTRY_V1_SEMANTIC_SHA256
  ) {
    throw new Error('Tier-0 registry v1 immutable contract drifted; create a new registry version')
  }
  return registry
}

export async function loadRegistry(registryPath) {
  return validateRegistry(JSON.parse(await readFile(registryPath, 'utf8')))
}

export class MatrixRecorder {
  constructor(registry, context) {
    this.registry = validateRegistry(registry)
    this.context = context
    this.records = new Map()
  }

  record(rowId, outcome) {
    const row = this.registry.rows.find(candidate => candidate.id === rowId)
    if (!row) throw new Error(`Unknown Tier-0 row: ${rowId}`)
    if (this.records.has(rowId)) throw new Error(`Tier-0 row already terminal: ${rowId}`)
    if (!TERMINAL.has(outcome.status)) throw new Error(`Invalid terminal status for ${rowId}`)
    if (!FAILURE_CLASSES.has(outcome.failure_class)) {
      throw new Error(`Invalid failure class for ${rowId}`)
    }
    if (!outcome.reason_code) throw new Error(`Missing reason code for ${rowId}`)
    const evidencePaths = outcome.evidence_paths || []
    const evidenceSha256 = outcome.evidence_sha256 || []
    if (evidencePaths.length !== evidenceSha256.length) {
      throw new Error(`Evidence path/hash count mismatch for ${rowId}`)
    }
    const command = outcome.command || this.context.command
    const now = new Date().toISOString()
    this.records.set(rowId, {
      schema_version: 1,
      registry_version: this.registry.registry_version,
      run_id: this.context.run_id,
      row_id: rowId,
      status: outcome.status,
      reason_code: outcome.reason_code,
      failure_class: outcome.failure_class,
      started_at: outcome.started_at || now,
      finished_at: outcome.finished_at || now,
      dependencies: row.dependencies,
      environment: this.context.environment,
      rcsm_sha256: this.context.rcsm_sha256,
      runtime_input_sha256: this.context.runtime_input_sha256 || '0'.repeat(64),
      revision: this.context.revision || '0'.repeat(40),
      source_tree_sha256: this.context.source_tree_sha256 || '0'.repeat(64),
      command,
      command_sha256: createHash('sha256').update(command).digest('hex'),
      cwd: this.context.cwd || process.cwd(),
      exit_code: Number.isInteger(outcome.exit_code) ? outcome.exit_code : null,
      evidence_paths: evidencePaths,
      evidence_sha256: evidenceSha256,
      cleanup_status: outcome.cleanup_status || 'not-applicable',
    })
  }

  blockRemaining(reasonCode, failureClass = 'prerequisite') {
    for (const row of this.registry.rows) {
      if (!this.records.has(row.id)) {
        this.record(row.id, {
          status: 'BLOCKED',
          reason_code: reasonCode,
          failure_class: failureClass,
        })
      }
    }
  }

  finalize() {
    const missing = this.registry.rows.filter(row => !this.records.has(row.id)).map(row => row.id)
    if (missing.length > 0) throw new Error(`Tier-0 matrix is incomplete: ${missing.join(', ')}`)
    const rows = this.registry.rows.map(row => this.records.get(row.id))
    const verdict = rows.some(row => row.status === 'FAIL')
      ? 'FAIL'
      : rows.every(row => row.status === 'PASS')
        ? 'PASS'
        : 'UNDETERMINED'
    return {
      schema_version: 1,
      registry_version: this.registry.registry_version,
      run_id: this.context.run_id,
      generated_at: new Date().toISOString(),
      verdict,
      certification_status:
        verdict === 'PASS' ? 'PENDING_EXTERNAL_CERT_F01' : 'NOT_ELIGIBLE_FOR_CERT_F01',
      counts: Object.fromEntries(
        [...TERMINAL].map(status => [status, rows.filter(row => row.status === status).length])
      ),
      rows,
      closure_postcondition: 'CERT-F01_NOT_EVALUATED',
    }
  }
}

export function serializeMatrix(matrix) {
  return Buffer.from(`${JSON.stringify(matrix, null, 2)}\n`)
}

export async function writeMatrixAtomic(outputPath, matrix, exactBytes = serializeMatrix(matrix)) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  const temporary = `${outputPath}.tmp-${process.pid}`
  await writeFile(temporary, exactBytes, { flag: 'wx', mode: 0o600 })
  await rename(temporary, outputPath)
}
