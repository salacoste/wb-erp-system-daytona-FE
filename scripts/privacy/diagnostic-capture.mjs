import { readFileSync } from 'node:fs'

export const DIAGNOSTIC_CAPTURE_POLICY = JSON.parse(
  readFileSync(new URL('./diagnostic-capture-policy.json', import.meta.url), 'utf8')
)

const REQUIRED_FIELDS = [
  'schemaVersion',
  'enabledByDefault',
  'maxBytes',
  'maxRecords',
  'retentionHours',
  'accessControl',
  'sanitization',
  'allowedFields',
]
const RESPONSE_CLASSES = new Set([
  'SUCCESS',
  'HTTP_4XX',
  'HTTP_5XX',
  'RATE_LIMITED',
  'CHALLENGE',
  'TIMEOUT',
  'CANCELLED',
  'NETWORK_ERROR',
  'SCHEMA_DRIFT',
  'MALFORMED',
  'OVERSIZE',
  'NOT_FOUND',
  'AMBIGUOUS',
])
const PROVIDER_VERSION_PATTERN = /^provider-v[1-9][0-9]{0,2}$/
const PROFILE_VERSION_PATTERN = /^profile-v[1-9][0-9]{0,2}$/
const CAPTURE_ID_PATTERN = /^capture_[a-f0-9]{12}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

const FIELD_VALIDATORS = Object.freeze({
  captureId: value => typeof value === 'string' && CAPTURE_ID_PATTERN.test(value),
  capturedAt: value =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(Date.parse(value)).toISOString() === value,
  providerContractVersion: value =>
    typeof value === 'string' && PROVIDER_VERSION_PATTERN.test(value),
  profileVersion: value => typeof value === 'string' && PROFILE_VERSION_PATTERN.test(value),
  responseClass: value => typeof value === 'string' && RESPONSE_CLASSES.has(value),
  statusCode: value => Number.isSafeInteger(value) && value >= 100 && value <= 599,
  bodyShapeHash: value => typeof value === 'string' && SHA256_PATTERN.test(value),
})

function isForbiddenField(field) {
  return (
    field !== 'bodyShapeHash' &&
    /token|cookie|authorization|header|url|body|payload|storage|fingerprint/i.test(field)
  )
}

export function validateDiagnosticCapturePolicy(policy = DIAGNOSTIC_CAPTURE_POLICY) {
  const errors = []
  const keys = Object.keys(policy ?? {}).sort()
  const expected = [...REQUIRED_FIELDS].sort()
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    errors.push(`fields must be exactly: ${expected.join(', ')}`)
  }
  if (policy?.schemaVersion !== 'epic128-diagnostic-capture-policy/v1') {
    errors.push('unsupported schemaVersion')
  }
  if (policy?.enabledByDefault !== false) errors.push('capture must be disabled by default')
  if (
    !Number.isSafeInteger(policy?.maxBytes) ||
    policy.maxBytes < 1 ||
    policy.maxBytes > 1_048_576
  ) {
    errors.push('maxBytes must be bounded to 1 MiB')
  }
  if (
    !Number.isSafeInteger(policy?.maxRecords) ||
    policy.maxRecords < 1 ||
    policy.maxRecords > 1000
  ) {
    errors.push('maxRecords must be bounded to 1000')
  }
  if (
    !Number.isSafeInteger(policy?.retentionHours) ||
    policy.retentionHours < 1 ||
    policy.retentionHours > 24
  ) {
    errors.push('retentionHours must be between 1 and 24')
  }
  if (policy?.accessControl !== 'OWNER_ONLY') errors.push('accessControl must be OWNER_ONLY')
  if (policy?.sanitization !== 'ALLOWLIST_V1') errors.push('sanitization must be ALLOWLIST_V1')
  if (!Array.isArray(policy?.allowedFields) || policy.allowedFields.length === 0) {
    errors.push('allowedFields must be a non-empty array')
  }
  const seen = new Set()
  for (const field of policy?.allowedFields ?? []) {
    if (
      typeof field !== 'string' ||
      seen.has(field) ||
      isForbiddenField(field) ||
      !Object.hasOwn(FIELD_VALIDATORS, field)
    ) {
      errors.push(`forbidden diagnostic field: ${String(field)}`)
    }
    seen.add(field)
  }
  return errors
}

function assertPlainData(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return
  if (seen.has(value)) throw new Error('diagnostic record contains a cyclic object')
  seen.add(value)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if ('get' in descriptor || 'set' in descriptor) {
      throw new Error('diagnostic record contains an accessor')
    }
    if (isForbiddenField(key)) throw new Error('diagnostic record contains a forbidden field')
    assertPlainData(descriptor.value, seen)
  }
}

export function sanitizeDiagnosticRecord(input, policy = DIAGNOSTIC_CAPTURE_POLICY) {
  const policyErrors = validateDiagnosticCapturePolicy(policy)
  if (policyErrors.length > 0) throw new Error(policyErrors.join('; '))
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('diagnostic record must be a plain object')
  }
  assertPlainData(input)

  const descriptors = Object.getOwnPropertyDescriptors(input)
  const sanitized = {}
  for (const field of policy.allowedFields) {
    const descriptor = descriptors[field]
    if (!descriptor) continue
    if ('get' in descriptor || 'set' in descriptor) {
      throw new Error('diagnostic record contains an accessor')
    }
    if (!FIELD_VALIDATORS[field](descriptor.value)) {
      throw new Error(`invalid diagnostic value for ${field}`)
    }
    sanitized[field] = descriptor.value
  }
  return sanitized
}

export function prepareDiagnosticCapture({
  records,
  enabled = false,
  actorRole,
  now = new Date(),
  authorizationExpiresAt,
  policy = DIAGNOSTIC_CAPTURE_POLICY,
}) {
  const policyErrors = validateDiagnosticCapturePolicy(policy)
  if (policyErrors.length > 0) throw new Error(policyErrors.join('; '))
  if (!enabled) return { enabled: false, records: [], deleteAt: null }
  if (actorRole !== 'OWNER') throw new Error('diagnostic capture requires OWNER access')
  if (!Array.isArray(records) || records.length > policy.maxRecords) {
    throw new Error('diagnostic record count exceeds policy')
  }
  const sanitized = records.map(record => sanitizeDiagnosticRecord(record, policy))
  const bytes = Buffer.byteLength(JSON.stringify(sanitized))
  if (bytes > policy.maxBytes) throw new Error('diagnostic capture exceeds byte policy')
  const retentionDeadline = now.getTime() + policy.retentionHours * 60 * 60 * 1000
  const authorizationDeadline = authorizationExpiresAt
    ? Date.parse(authorizationExpiresAt)
    : retentionDeadline
  if (!Number.isFinite(authorizationDeadline) || authorizationDeadline <= now.getTime()) {
    throw new Error('diagnostic authorization is expired or invalid')
  }
  return {
    enabled: true,
    records: sanitized,
    bytes,
    deleteAt: new Date(Math.min(retentionDeadline, authorizationDeadline)).toISOString(),
  }
}
