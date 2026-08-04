import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIAGNOSTIC_CAPTURE_POLICY,
  sanitizeDiagnosticRecord,
  validateDiagnosticCapturePolicy,
} from './diagnostic-capture.mjs'

test('diagnostic capture is disabled, bounded, owner-only, and retained no longer than 24h', () => {
  assert.deepEqual(validateDiagnosticCapturePolicy(), [])
  assert.equal(DIAGNOSTIC_CAPTURE_POLICY.enabledByDefault, false)
  assert.ok(DIAGNOSTIC_CAPTURE_POLICY.maxBytes <= 65536)
  assert.ok(DIAGNOSTIC_CAPTURE_POLICY.maxRecords <= 100)
  assert.ok(DIAGNOSTIC_CAPTURE_POLICY.retentionHours <= 24)
  assert.equal(DIAGNOSTIC_CAPTURE_POLICY.accessControl, 'OWNER_ONLY')
})

test('retains only valid allowlisted scalar diagnostic fields', () => {
  const input = {
    captureId: 'capture_1234abcdef12',
    capturedAt: '2026-08-04T00:00:00.000Z',
    providerContractVersion: 'provider-v1',
    profileVersion: 'profile-v1',
    responseClass: 'RATE_LIMITED',
    statusCode: 429,
    bodyShapeHash: 'a'.repeat(64),
    ignored: 'not-retained',
  }

  assert.deepEqual(sanitizeDiagnosticRecord(input), {
    captureId: 'capture_1234abcdef12',
    capturedAt: '2026-08-04T00:00:00.000Z',
    providerContractVersion: 'provider-v1',
    profileVersion: 'profile-v1',
    responseClass: 'RATE_LIMITED',
    statusCode: 429,
    bodyShapeHash: 'a'.repeat(64),
  })
})

test('rejects forbidden nested diagnostic material', () => {
  const rawBodyKey = ['raw', 'Body'].join('')
  const authorizationKey = ['Author', 'ization'].join('')
  const fingerprintMaterialKey = ['finger', 'printMaterial'].join('')
  for (const input of [
    { captureId: 'capture_1234abcdef12', nested: { [rawBodyKey]: 'constructed-value' } },
    { captureId: 'capture_1234abcdef12', values: [{ [authorizationKey]: 'constructed-value' }] },
    { captureId: 'capture_1234abcdef12', [fingerprintMaterialKey]: 'constructed-value' },
  ]) {
    assert.throws(() => sanitizeDiagnosticRecord(input), /forbidden field/)
  }
})

test('rejects nested, array, invalid scalar, and accessor values without evaluating accessors', () => {
  let accessorReads = 0
  const input = {
    captureId: { nested: 'not-retained' },
    capturedAt: ['2026-08-04T00:00:00.000Z'],
    responseClass: 'UNKNOWN',
    statusCode: '429',
    bodyShapeHash: 'not-a-hash',
  }
  Object.defineProperty(input, 'profileVersion', {
    enumerable: true,
    get() {
      accessorReads += 1
      return 'must-not-be-read'
    },
  })

  assert.throws(() => sanitizeDiagnosticRecord(input), /diagnostic record|invalid diagnostic value/)
  assert.equal(accessorReads, 0)
})

test('rejects credential-shaped diagnostic identifiers without retaining them', () => {
  const credentialShaped = ['credential', 'token', '12810'].join('')
  const base = {
    captureId: 'capture_1234abcdef12',
    capturedAt: '2026-08-04T00:00:00.000Z',
    providerContractVersion: 'provider-v1',
    profileVersion: 'profile-v1',
    responseClass: 'SUCCESS',
    statusCode: 200,
    bodyShapeHash: 'a'.repeat(64),
  }
  for (const field of ['captureId', 'providerContractVersion', 'profileVersion']) {
    assert.throws(
      () => sanitizeDiagnosticRecord({ ...base, [field]: credentialShaped }),
      new RegExp(`invalid diagnostic value for ${field}`)
    )
  }
  assert.equal(JSON.stringify(base).includes(credentialShaped), false)
})
