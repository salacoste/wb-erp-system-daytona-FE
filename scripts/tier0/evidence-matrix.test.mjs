import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { MatrixRecorder, validateRegistry } from './evidence-matrix.mjs'

const registry = JSON.parse(await readFile('e2e/tier0/tier0-row-registry.v1.json', 'utf8'))
const context = {
  run_id: 'run-1',
  environment: { name: 'sandbox', deployment_id: 'd1', contract_version: 'v1' },
  rcsm_sha256: 'c'.repeat(64),
  command: 'node scripts/tier0/run-certification.mjs',
}

test('registry v1 has an immutable, unique 38-row surface', () => {
  assert.equal(validateRegistry(registry).rows.length, 38)
  assert.equal(registry.closure_postcondition, 'CERT-F01')
})

test('registry v1 rejects row or dependency substitution', () => {
  const substituted = structuredClone(registry)
  substituted.rows[0].dependencies = ['G_FAKE']
  assert.throws(() => validateRegistry(substituted), /immutable contract drifted/)
})

test('a row can receive exactly one terminal result', () => {
  const recorder = new MatrixRecorder(registry, context)
  recorder.record('PRE-I01', {
    status: 'PASS',
    reason_code: 'ASSERTION_PASSED',
    failure_class: 'none',
  })
  assert.throws(
    () =>
      recorder.record('PRE-I01', {
        status: 'FAIL',
        reason_code: 'LATE_WRITE',
        failure_class: 'runner',
      }),
    /already terminal/
  )
})

test('incomplete matrices cannot finalize', () => {
  const recorder = new MatrixRecorder(registry, context)
  recorder.record('PRE-I01', {
    status: 'PASS',
    reason_code: 'ASSERTION_PASSED',
    failure_class: 'none',
  })
  assert.throws(() => recorder.finalize(), /matrix is incomplete/)
})

test('blocked closure is complete but never a passing certificate', () => {
  const recorder = new MatrixRecorder(registry, context)
  recorder.blockRemaining('GLOBAL_DESTINATION_UNPROVEN')
  const matrix = recorder.finalize()
  assert.equal(matrix.rows.length, 38)
  assert.equal(matrix.counts.BLOCKED, 38)
  assert.equal(matrix.verdict, 'UNDETERMINED')
  assert.equal(matrix.certification_status, 'NOT_ELIGIBLE_FOR_CERT_F01')
  assert.equal(matrix.closure_postcondition, 'CERT-F01_NOT_EVALUATED')
})

test('an evidence-backed failed row makes the matrix verdict FAIL', () => {
  const recorder = new MatrixRecorder(registry, context)
  recorder.record('PRE-I01', {
    status: 'FAIL',
    reason_code: 'ASSERTION_FAILED',
    failure_class: 'runner',
  })
  recorder.blockRemaining('DEPENDENCY_BLOCKED')
  const matrix = recorder.finalize()
  assert.equal(matrix.verdict, 'FAIL')
  assert.equal(matrix.certification_status, 'NOT_ELIGIBLE_FOR_CERT_F01')
})

test('evidence schema is fail-closed to PASS, FAIL, and BLOCKED', async () => {
  const schema = JSON.parse(await readFile('e2e/tier0/tier0-row-evidence.schema.v1.json', 'utf8'))
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(schema.properties.status.enum, ['PASS', 'FAIL', 'BLOCKED'])
  assert.equal(schema.required.includes('dependencies'), true)
  assert.equal(schema.required.includes('runtime_input_sha256'), true)
  assert.equal(schema.required.includes('revision'), true)
  assert.equal(schema.required.includes('source_tree_sha256'), true)
  assert.equal(schema.required.includes('command_sha256'), true)
  assert.equal(schema.required.includes('exit_code'), true)
  assert.equal(schema.required.includes('evidence_sha256'), true)
})
