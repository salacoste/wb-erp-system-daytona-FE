import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const FORBIDDEN_HOST_SUFFIXES = ['wildberries.ru', 'wb.ru']
const WILDCARD_PATTERN = /[*?\[\]{}]/
export const SENSITIVE_QUERY_KEYS = new Set([
  'authorization',
  'apikey',
  'cookie',
  'credential',
  'csrftoken',
  'jwt',
  'key',
  'password',
  'refreshtoken',
  'secret',
  'session',
  'sessionid',
  'token',
  'accesstoken',
])

const BEARER_VALUE_PATTERN = /\bBearer\s+(?!\[REDACTED\])\S+/gi
const JWT_VALUE_PATTERN = /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}(?:\.[A-Za-z0-9_-]+)?\b/g
const SENSITIVE_HEADER_PATTERN =
  /(\b(?:set-cookie|cookie|authorization)\s*:\s*)([^\r\n]*?)(?=\r?\n|\s+(?:set-cookie|cookie|authorization)\s*:|$)/gi

function decodeQueryKey(value) {
  let decoded = value.replace(/\+/g, ' ')
  let residualEncoding = false
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      residualEncoding = true
      break
    }
  }
  if (/%[0-9a-f]{2}/i.test(decoded)) residualEncoding = true
  return { decoded, residualEncoding }
}

export function normalizedSensitiveKey(value) {
  const { decoded } = decodeQueryKey(String(value))
  return decoded.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

export function isSensitiveQueryKey(value) {
  const decoded = decodeQueryKey(String(value))
  return (
    decoded.residualEncoding || SENSITIVE_QUERY_KEYS.has(normalizedSensitiveKey(decoded.decoded))
  )
}

export function containsUnredactedSensitiveQuery(value) {
  const pattern = /[?&]([^=&\s]+)=([^&\s]*)/g
  for (const match of String(value).matchAll(pattern)) {
    if (isSensitiveQueryKey(match[1]) && match[2] !== '[REDACTED]') return true
  }
  return false
}

export function containsUnredactedSensitiveHeader(value) {
  for (const match of String(value).matchAll(new RegExp(SENSITIVE_HEADER_PATTERN.source, 'gi'))) {
    if (match[2].trim() !== '[REDACTED]') return true
  }
  return false
}

function redactSensitiveQueryValues(value) {
  return value.replace(/([?&])([^=&\s]+)=([^&\s]*)/g, (match, separator, key, rawValue) =>
    isSensitiveQueryKey(key) && rawValue !== '[REDACTED]' ? `${separator}${key}=[REDACTED]` : match
  )
}

export function redactTier0EvidenceText(value, declaredSecrets = []) {
  let sanitized = String(value)
    .replace(SENSITIVE_HEADER_PATTERN, '$1[REDACTED]')
    .replace(BEARER_VALUE_PATTERN, 'Bearer [REDACTED]')
    .replace(JWT_VALUE_PATTERN, '[REDACTED_JWT]')
  sanitized = redactSensitiveQueryValues(sanitized)
  for (const secret of declaredSecrets) {
    if (typeof secret === 'string' && secret.length > 0) {
      sanitized = sanitized.split(secret).join('[REDACTED]')
    }
  }
  return sanitized
}

export function declaredTier0SecretEntries(env = process.env) {
  return Object.entries(env)
    .filter(
      ([key, value]) =>
        /(?:PASSWORD|TOKEN|SECRET|API_KEY|AUTHORIZATION|COOKIE|EMAIL|CREDENTIAL|SESSION|JWT|PRIVATE_KEY)/i.test(
          key
        ) &&
        typeof value === 'string' &&
        value.length > 0
    )
    .map(([key, value]) => ({
      key,
      value,
      pii: /EMAIL/i.test(key),
    }))
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

function immutableClone(value) {
  return deepFreeze(structuredClone(value))
}

export function assertReceiptSnapshotBinding(
  receipt,
  env,
  descriptorBytes,
  receiptBytes,
  { allowExpired = false } = {}
) {
  const expectedRunId = env.TIER0_EXPECTED_RUN_ID
  const expectedDescriptorSha = env.TIER0_EXPECTED_DESCRIPTOR_SHA256
  const expectedSignatureSha = env.TIER0_EXPECTED_DESCRIPTOR_SIGNATURE_SHA256
  const expectedReceiptSha = env.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256
  const descriptorSha = createHash('sha256').update(descriptorBytes).digest('hex')
  const receiptSha = createHash('sha256').update(receiptBytes).digest('hex')
  const receiptExpiry = Date.parse(receipt.expires_at || '')
  const authorityExpiry = Date.parse(receipt.descriptor_authority?.expires_at || '')
  if (
    receipt.status !== 'READY' ||
    !expectedRunId ||
    receipt.run_id !== expectedRunId ||
    !expectedDescriptorSha ||
    receipt.descriptor_sha256 !== expectedDescriptorSha ||
    descriptorSha !== expectedDescriptorSha ||
    !expectedReceiptSha ||
    receiptSha !== expectedReceiptSha ||
    !expectedSignatureSha ||
    receipt.descriptor_authority?.signature_sha256 !== expectedSignatureSha ||
    !Number.isFinite(receiptExpiry) ||
    (!allowExpired && receiptExpiry <= Date.now()) ||
    !Number.isFinite(authorityExpiry) ||
    (!allowExpired && authorityExpiry <= Date.now())
  ) {
    fail('RECEIPT_SNAPSHOT_BINDING_INVALID', 'Tier-0 receipt binding is expired or mismatched')
  }
  return createHash('sha256')
    .update(
      JSON.stringify([
        expectedRunId,
        expectedDescriptorSha,
        expectedSignatureSha,
        expectedReceiptSha,
        receipt.expires_at,
      ])
    )
    .digest('hex')
}

export function loadBoundDescriptorSnapshot(
  env = process.env,
  { allowExpiredReceipt = false } = {}
) {
  const receiptPath = env.TIER0_PREFLIGHT_RECEIPT
  if (!receiptPath) fail('RECEIPT_PATH_MISSING', 'Tier-0 preflight receipt is required')
  if (statSync(receiptPath).mode & 0o077) {
    fail('RECEIPT_NOT_PRIVATE', 'Tier-0 preflight receipt must be private')
  }
  const receiptBytes = readFileSync(receiptPath)
  let receipt
  try {
    receipt = JSON.parse(receiptBytes.toString('utf8'))
  } catch {
    fail('RECEIPT_JSON_INVALID', 'Tier-0 preflight receipt is not valid JSON')
  }
  const descriptorPath = receipt.descriptor_path
  if (!descriptorPath) {
    fail('RECEIPT_DESCRIPTOR_PATH_MISSING', 'Tier-0 receipt descriptor snapshot is required')
  }
  if (
    env.TIER0_ENV_DESCRIPTOR &&
    realpathSync(env.TIER0_ENV_DESCRIPTOR) !== realpathSync(descriptorPath)
  ) {
    fail('RECEIPT_DESCRIPTOR_PATH_MISMATCH', 'Tier-0 descriptor snapshot path mismatched')
  }
  const bytes = readFileSync(descriptorPath)
  const metadataBinding = assertReceiptSnapshotBinding(receipt, env, bytes, receiptBytes, {
    allowExpired: allowExpiredReceipt,
  })
  const binding = createHash('sha256')
    .update(
      JSON.stringify([metadataBinding, realpathSync(receiptPath), realpathSync(descriptorPath)])
    )
    .digest('hex')
  return Object.freeze({
    receipt: immutableClone(receipt),
    descriptor: validateEnvironmentDescriptor(JSON.parse(bytes.toString('utf8'))),
    binding,
    receiptSha256: createHash('sha256').update(receiptBytes).digest('hex'),
  })
}

export const MUTATION_ACK_VALUE = 'I_UNDERSTAND_THIS_MUTATES_TEST_DATA'

export class Tier0SafetyError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'Tier0SafetyError'
    this.code = code
  }
}

function fail(code, message) {
  throw new Tier0SafetyError(code, message)
}

export function canonicalOrigin(rawValue, label = 'origin') {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    fail('ORIGIN_MISSING', `${label} is required`)
  }
  if (WILDCARD_PATTERN.test(rawValue)) {
    fail('ORIGIN_WILDCARD_FORBIDDEN', `${label} must not contain wildcard syntax`)
  }

  let parsed
  try {
    parsed = new URL(rawValue)
  } catch {
    fail('ORIGIN_INVALID', `${label} must be an absolute URL`)
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    fail('ORIGIN_PROTOCOL_FORBIDDEN', `${label} must use http or https`)
  }
  if (parsed.username || parsed.password) {
    fail('ORIGIN_CREDENTIALS_FORBIDDEN', `${label} must not contain credentials`)
  }
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    fail('ORIGIN_NOT_EXACT', `${label} must contain only scheme, host, and port`)
  }
  const hostname = parsed.hostname.toLowerCase()
  if (
    FORBIDDEN_HOST_SUFFIXES.some(suffix => hostname === suffix || hostname.endsWith(`.${suffix}`))
  ) {
    fail('PRODUCTION_HOST_FORBIDDEN', `${label} points at a forbidden production host`)
  }

  return parsed.origin
}

export function validateOriginAllowlist(rawOrigins, label) {
  if (!Array.isArray(rawOrigins) || rawOrigins.length === 0) {
    fail('ALLOWLIST_MISSING', `${label} allowlist must contain at least one exact origin`)
  }
  const origins = rawOrigins.map((value, index) => canonicalOrigin(value, `${label}[${index}]`))
  if (new Set(origins).size !== origins.length) {
    fail('ALLOWLIST_DUPLICATE', `${label} allowlist contains duplicate canonical origins`)
  }
  return Object.freeze(origins)
}

export function assertAllowedURL(rawURL, allowedOrigins, label = 'destination', control = {}) {
  let parsed
  try {
    parsed = new URL(rawURL)
  } catch {
    fail('DESTINATION_INVALID', `${label} must be an absolute URL`)
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol) || parsed.username || parsed.password) {
    fail('DESTINATION_CREDENTIALS_OR_PROTOCOL_FORBIDDEN', `${label} has unsafe URL syntax`)
  }
  if (parsed.hash || String(rawURL).includes('#')) {
    fail('DESTINATION_FRAGMENT_FORBIDDEN', `${label} must not contain a URL fragment`)
  }
  for (const key of parsed.searchParams.keys()) {
    if (isSensitiveQueryKey(key)) {
      fail(
        'DESTINATION_SENSITIVE_QUERY_FORBIDDEN',
        `${label} must not contain sensitive query keys`
      )
    }
  }
  if (!allowedOrigins.includes(parsed.origin)) {
    fail('DESTINATION_NOT_ALLOWLISTED', `${label} origin is not explicitly allowlisted`)
  }
  if (control.method !== undefined || control.allowedMethods !== undefined) {
    const method = String(control.method || '').toUpperCase()
    const allowedMethods = Array.isArray(control.allowedMethods)
      ? control.allowedMethods.map(value => String(value).toUpperCase())
      : []
    if (!method || !allowedMethods.includes(method)) {
      fail('DESTINATION_METHOD_FORBIDDEN', `${label} method is not explicitly allowlisted`)
    }
  }
  return parsed
}

export function resolveAllowedURL(rawURL, baseURL, allowedOrigins, label = 'destination') {
  let parsed
  try {
    parsed = new URL(rawURL, baseURL)
  } catch {
    fail('DESTINATION_INVALID', `${label} could not be resolved`)
  }
  return assertAllowedURL(parsed.href, allowedOrigins, label)
}

export function validateRedirectChain(urls, allowedOrigins) {
  if (!Array.isArray(urls) || urls.length === 0) {
    fail('REDIRECT_CHAIN_MISSING', 'redirect chain must contain at least one URL')
  }
  return urls.map(
    (url, index) => assertAllowedURL(url, allowedOrigins, `redirect chain hop ${index}`).href
  )
}

export function isMutationAuthorized(env = process.env) {
  return (
    env.E2E_ENABLE_MUTATIONS === 'true' &&
    env.E2E_MUTATION_TARGET === 'sandbox' &&
    env.E2E_MUTATION_ACK === MUTATION_ACK_VALUE
  )
}

export function isTier0MutationCapabilityAuthorized(env, capabilities) {
  return (
    isMutationAuthorized(env) &&
    capabilities?.P_MUTATION === true &&
    capabilities?.P_CLEANUP === true
  )
}

export function mutationCleanupBinding(signedRecordId, createIdField, createBody) {
  const recordId = requireText(
    signedRecordId,
    'MUTATION_RECORD_ID_MISSING',
    'fixtures.mutation_record_id'
  )
  const idField = requireText(
    createIdField,
    'MUTATION_CREATE_ID_FIELD_MISSING',
    'fixtures.mutation.create_id_field'
  )
  if (
    !createBody ||
    typeof createBody !== 'object' ||
    Array.isArray(createBody) ||
    createBody[idField] !== recordId
  ) {
    fail(
      'MUTATION_CREATE_ID_UNBOUND',
      'mutation create payload must bind the signed mutation record ID used for cleanup'
    )
  }
  return recordId
}

export function mutationResponseBinding(signedRecordId, returnedId, returnedOwner, expectedOwner) {
  const signedId = requireText(
    signedRecordId,
    'MUTATION_RECORD_ID_MISSING',
    'fixtures.mutation_record_id'
  )
  if (returnedId !== signedId) {
    fail(
      'MUTATION_RESPONSE_ID_MISMATCH',
      'mutation response ID must exactly match the signed cleanup target'
    )
  }
  if (returnedOwner !== expectedOwner) {
    fail(
      'MUTATION_RESPONSE_OWNER_MISMATCH',
      'mutation response owner must exactly match the signed owner marker'
    )
  }
  return signedId
}

export function cleanupControlDigest(cleanupControlId, signedId, ownerMarker) {
  return createHash('sha256')
    .update(JSON.stringify([cleanupControlId, signedId, ownerMarker]))
    .digest('hex')
}

export function mutationExecutionControl(descriptor) {
  const fixtures = descriptor?.fixtures ?? {}
  const mutation =
    fixtures.mutation && typeof fixtures.mutation === 'object' && !Array.isArray(fixtures.mutation)
      ? fixtures.mutation
      : {}
  const signedId = mutationCleanupBinding(
    fixtures.mutation_record_id,
    mutation.create_id_field,
    mutation.create_body
  )
  const ownerMarker = requireText(
    mutation.owner_marker,
    'MUTATION_OWNER_MARKER_MISSING',
    'fixtures.mutation.owner_marker'
  )
  const cleanupControlId = requireText(
    fixtures.cleanup_control_id,
    'MUTATION_CLEANUP_CONTROL_MISSING',
    'fixtures.cleanup_control_id'
  )
  const createMethod = requireText(
    mutation.create_method,
    'MUTATION_CREATE_METHOD_MISSING',
    'fixtures.mutation.create_method'
  ).toUpperCase()
  const create = assertAllowedURL(
    requireText(mutation.create_url, 'MUTATION_CREATE_URL_MISSING', 'fixtures.mutation.create_url'),
    descriptor.backendAllowlist,
    'signed Tier-0 create control',
    { method: createMethod, allowedMethods: ['POST'] }
  )
  const cleanupTemplate = requireText(
    mutation.cleanup_url_template,
    'MUTATION_CLEANUP_URL_MISSING',
    'fixtures.mutation.cleanup_url_template'
  )
  if (cleanupTemplate.split('{id}').length !== 2) {
    fail('MUTATION_CLEANUP_TEMPLATE_INVALID', 'cleanup URL must contain exactly one {id}')
  }
  const cleanupMethod = requireText(
    mutation.cleanup_method,
    'MUTATION_CLEANUP_METHOD_MISSING',
    'fixtures.mutation.cleanup_method'
  ).toUpperCase()
  const cleanup = assertAllowedURL(
    cleanupTemplate.replace('{id}', encodeURIComponent(signedId)),
    descriptor.backendAllowlist,
    'signed Tier-0 cleanup control',
    { method: cleanupMethod, allowedMethods: ['DELETE'] }
  )
  if (create.search || cleanup.search) {
    fail(
      'MUTATION_QUERY_FORBIDDEN',
      'mutation create and cleanup controls must not contain a query'
    )
  }
  const observation = resolveAllowedURL(
    requireText(
      mutation.observe_path,
      'MUTATION_OBSERVE_PATH_MISSING',
      'fixtures.mutation.observe_path'
    ),
    descriptor.frontendOrigin,
    descriptor.frontendAllowlist,
    'signed Tier-0 observation control'
  )
  if (observation.search)
    fail('MUTATION_OBSERVE_QUERY_FORBIDDEN', 'observation must not contain a query')
  const observeText = requireText(
    mutation.observe_text,
    'MUTATION_OBSERVE_TEXT_MISSING',
    'fixtures.mutation.observe_text'
  )
  if (!observeText.includes(signedId) || !observeText.includes(ownerMarker)) {
    fail('MUTATION_OBSERVE_BINDING_MISMATCH', 'observation text must bind the signed ID and owner')
  }
  if (mutation.create_body?.owner_marker !== ownerMarker) {
    fail('MUTATION_CREATE_OWNER_UNBOUND', 'create body must bind the signed owner marker')
  }
  for (const [field, code] of [
    ['response_id_field', 'MUTATION_RESPONSE_ID_FIELD_MISSING'],
    ['response_id_header', 'MUTATION_RESPONSE_ID_HEADER_MISSING'],
    ['response_owner_header', 'MUTATION_RESPONSE_OWNER_HEADER_MISSING'],
  ])
    requireText(mutation[field], code, `fixtures.mutation.${field}`)
  const immutableMutation = immutableClone(mutation)
  const bodyDigest = createHash('sha256')
    .update(JSON.stringify(immutableMutation.create_body))
    .digest('hex')
  return Object.freeze({
    signedId,
    ownerMarker,
    cleanupControlId,
    controlDigest: cleanupControlDigest(cleanupControlId, signedId, ownerMarker),
    create,
    createMethod,
    cleanup,
    cleanupMethod,
    observation,
    observeText,
    mutation: immutableMutation,
    bodyDigest,
  })
}

export function findUnprovenNextRouting(configSource) {
  const withoutComments = configSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1')
  const matches = []
  for (const key of ['rewrites', 'redirects', 'proxy']) {
    if (new RegExp(`\\b${key}\\s*[:(]`).test(withoutComments)) matches.push(key)
  }
  return matches
}

function requireText(value, code, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(code, `${label} is required`)
  return value
}

export function validateEnvironmentDescriptor(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail('DESCRIPTOR_INVALID', 'environment descriptor must be a JSON object')
  }
  if (raw.schema_version !== 1) {
    fail('DESCRIPTOR_VERSION_UNSUPPORTED', 'environment descriptor schema_version must be 1')
  }
  if (raw.environment?.classification !== 'non-production') {
    fail('ENVIRONMENT_NOT_NON_PRODUCTION', 'environment must be explicitly non-production')
  }
  const authorityIssuer = requireText(
    raw.authority?.issuer,
    'AUTHORITY_ISSUER_MISSING',
    'authority.issuer'
  )
  if (raw.authority?.role !== 'runtime-operator') {
    fail('AUTHORITY_ROLE_INVALID', 'descriptor authority role must be runtime-operator')
  }

  const frontendAllowlist = validateOriginAllowlist(raw.allowed_origins?.frontend, 'frontend')
  const backendAllowlist = validateOriginAllowlist(raw.allowed_origins?.backend, 'backend')
  const frontendOrigin = canonicalOrigin(raw.frontend?.origin, 'frontend.origin')
  const backendOrigin = canonicalOrigin(raw.backend?.origin, 'backend.origin')
  if (frontendOrigin !== 'http://127.0.0.1:3100') {
    fail('FRONTEND_ORIGIN_MISMATCH', 'Tier-0 frontend origin must be http://127.0.0.1:3100')
  }
  if (!frontendAllowlist.includes(frontendOrigin)) {
    fail('FRONTEND_NOT_ALLOWLISTED', 'frontend.origin is absent from its exact allowlist')
  }
  if (!backendAllowlist.includes(backendOrigin)) {
    fail('BACKEND_NOT_ALLOWLISTED', 'backend.origin is absent from its exact allowlist')
  }
  if (frontendAllowlist.length !== 1 || backendAllowlist.length !== 1) {
    fail(
      'ALLOWLIST_SCOPE_UNPROVEN',
      'Tier-0 v1 requires exactly one bound frontend origin and one bound backend origin'
    )
  }

  const identityURL = assertAllowedURL(
    requireText(raw.backend?.identity_url, 'IDENTITY_URL_MISSING', 'backend.identity_url'),
    backendAllowlist,
    'backend.identity_url'
  )
  requireText(raw.environment?.name, 'ENVIRONMENT_NAME_MISSING', 'environment.name')
  requireText(raw.backend?.deployment_id, 'DEPLOYMENT_ID_MISSING', 'backend.deployment_id')
  requireText(raw.backend?.contract_version, 'CONTRACT_VERSION_MISSING', 'backend.contract_version')
  requireText(raw.artifact?.build_id, 'BUILD_ID_MISSING', 'artifact.build_id')
  requireText(raw.artifact?.rcsm_sha256, 'RCSM_HASH_MISSING', 'artifact.rcsm_sha256')
  if (!/^[a-f0-9]{64}$/i.test(raw.artifact.rcsm_sha256)) {
    fail('RCSM_HASH_INVALID', 'artifact.rcsm_sha256 must be a SHA-256 hex digest')
  }
  requireText(raw.artifact?.registry_sha256, 'REGISTRY_HASH_MISSING', 'artifact.registry_sha256')
  if (!/^[a-f0-9]{64}$/i.test(raw.artifact.registry_sha256)) {
    fail('REGISTRY_HASH_INVALID', 'artifact.registry_sha256 must be a SHA-256 hex digest')
  }
  for (const [field, code] of [
    ['package_sha256', 'PACKAGE_HASH_INVALID'],
    ['entry_manifest_sha256', 'ENTRY_MANIFEST_HASH_INVALID'],
    ['runtime_input_sha256', 'RUNTIME_INPUT_HASH_INVALID'],
  ]) {
    if (!/^[a-f0-9]{64}$/i.test(raw.artifact?.[field] ?? '')) {
      fail(code, `artifact.${field} must be a SHA-256 hex digest`)
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(raw.artifact?.descriptor_public_key_sha256 ?? '')) {
    fail(
      'DESCRIPTOR_PUBLIC_KEY_HASH_INVALID',
      'artifact.descriptor_public_key_sha256 must be a SHA-256 hex digest'
    )
  }
  if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(raw.artifact?.revision ?? '')) {
    fail('ARTIFACT_REVISION_INVALID', 'artifact.revision must be a 40- or 64-hex revision')
  }
  if (!/^[a-f0-9]{64}$/i.test(raw.artifact?.source_tree_sha256 ?? '')) {
    fail('SOURCE_TREE_HASH_INVALID', 'artifact.source_tree_sha256 must be a SHA-256 hex digest')
  }
  const platform = requireText(raw.artifact?.platform, 'PLATFORM_MISSING', 'artifact.platform')
  const arch = requireText(raw.artifact?.arch, 'ARCH_MISSING', 'artifact.arch')
  const nodeVersion = requireText(
    raw.artifact?.node_version,
    'NODE_VERSION_MISSING',
    'artifact.node_version'
  )
  const npmVersion = requireText(
    raw.artifact?.npm_version,
    'NPM_VERSION_MISSING',
    'artifact.npm_version'
  )
  const nextVersion = requireText(
    raw.artifact?.next_version,
    'NEXT_VERSION_MISSING',
    'artifact.next_version'
  )
  if (nodeVersion !== 'v24.18.0' || npmVersion !== '11.11.0') {
    fail('RUNTIME_VERSION_UNSUPPORTED', 'Tier-0 artifact must bind Node v24.18.0 and npm 11.11.0')
  }
  requireText(
    raw.artifact?.object_version_id,
    'OBJECT_VERSION_MISSING',
    'artifact.object_version_id'
  )
  const locator = requireText(
    raw.artifact?.retrieval_locator,
    'RETRIEVAL_LOCATOR_MISSING',
    'artifact.retrieval_locator'
  )
  let locatorURL
  try {
    locatorURL = new URL(locator)
  } catch {
    fail('RETRIEVAL_LOCATOR_INVALID', 'artifact.retrieval_locator must be an absolute URL')
  }
  if (
    !['https:', 's3:'].includes(locatorURL.protocol) ||
    locatorURL.username ||
    locatorURL.password ||
    locatorURL.search ||
    locatorURL.hash
  ) {
    fail(
      'RETRIEVAL_LOCATOR_UNSAFE',
      'artifact.retrieval_locator must be non-secret https/s3 metadata'
    )
  }
  const retentionUntil = requireText(
    raw.artifact?.retention_until,
    'RETENTION_UNTIL_MISSING',
    'artifact.retention_until'
  )
  if (!Number.isFinite(Date.parse(retentionUntil))) {
    fail('RETENTION_UNTIL_INVALID', 'artifact.retention_until must be an ISO timestamp')
  }
  if (Date.parse(retentionUntil) <= Date.now()) {
    fail('RETENTION_EXPIRED', 'artifact retention expired before certification')
  }
  const publicApiOrigin = canonicalOrigin(
    raw.artifact?.public_api_origin,
    'artifact.public_api_origin'
  )
  if (publicApiOrigin !== backendOrigin) {
    fail('PUBLIC_API_ORIGIN_MISMATCH', 'bound public API origin must equal backend.origin')
  }

  return Object.freeze({
    schemaVersion: 1,
    environmentName: raw.environment.name,
    authorityIssuer,
    frontendOrigin,
    backendOrigin,
    frontendAllowlist,
    backendAllowlist,
    allAllowedOrigins: Object.freeze([...new Set([...frontendAllowlist, ...backendAllowlist])]),
    identityURL: identityURL.href,
    deploymentId: raw.backend.deployment_id,
    contractVersion: raw.backend.contract_version,
    buildId: raw.artifact.build_id,
    rcsmSha256: raw.artifact.rcsm_sha256.toLowerCase(),
    registrySha256: raw.artifact.registry_sha256.toLowerCase(),
    packageSha256: raw.artifact.package_sha256.toLowerCase(),
    entryManifestSha256: raw.artifact.entry_manifest_sha256.toLowerCase(),
    runtimeInputSha256: raw.artifact.runtime_input_sha256.toLowerCase(),
    descriptorPublicKeySha256: raw.artifact.descriptor_public_key_sha256.toLowerCase(),
    revision: raw.artifact.revision.toLowerCase(),
    sourceTreeSha256: raw.artifact.source_tree_sha256.toLowerCase(),
    platform,
    arch,
    nodeVersion,
    npmVersion,
    nextVersion,
    objectVersionId: raw.artifact.object_version_id,
    retrievalLocator: locatorURL.href,
    retentionUntil,
    publicApiOrigin,
    fixtures: immutableClone(raw.fixtures && typeof raw.fixtures === 'object' ? raw.fixtures : {}),
  })
}

export async function loadEnvironmentDescriptor(path) {
  let bytes
  try {
    bytes = await readFile(path)
  } catch {
    fail('DESCRIPTOR_FILE_UNREADABLE', 'environment descriptor is unavailable or unreadable')
  }
  let raw
  try {
    raw = JSON.parse(bytes.toString('utf8'))
  } catch {
    fail('DESCRIPTOR_JSON_INVALID', 'environment descriptor is not valid JSON')
  }
  return {
    descriptor: validateEnvironmentDescriptor(raw),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

export function capabilityState(env, descriptor) {
  const has = key => typeof env[key] === 'string' && env[key].trim().length >= 6
  const fixtures = descriptor.fixtures ?? {}
  const hasUser = has('E2E_TEST_EMAIL') && has('E2E_TEST_PASSWORD')
  const mutation =
    fixtures.mutation && typeof fixtures.mutation === 'object' && !Array.isArray(fixtures.mutation)
      ? fixtures.mutation
      : {}
  let hasCleanup = false
  let hasMutationControl = false
  try {
    mutationExecutionControl(descriptor)
    hasCleanup = true
    hasMutationControl = true
  } catch {
    hasCleanup = false
    hasMutationControl = false
  }
  return Object.freeze({
    P_USER: hasUser,
    P_MANAGER: hasUser && has('E2E_MANAGER_EMAIL') && has('E2E_MANAGER_PASSWORD'),
    P_CABINET: Boolean(fixtures.cabinet_a_id && fixtures.cabinet_b_id),
    P_FINANCE: Boolean(fixtures.finance_control_id || fixtures.reconciliation),
    P_ORDERS: Boolean(fixtures.orders_control_id),
    P_MUTATION: hasUser && isMutationAuthorized(env) && hasMutationControl,
    P_CLEANUP: hasCleanup,
  })
}

export function resolveTier0ProjectCapabilities(env, receiptCapabilities, descriptor) {
  const recomputed = capabilityState(env, descriptor)
  const selected = {
    P_USER: recomputed.P_USER === true,
    P_MANAGER: recomputed.P_MANAGER === true,
    P_MUTATION: recomputed.P_MUTATION === true && recomputed.P_CLEANUP === true,
  }
  for (const key of ['P_USER', 'P_MANAGER', 'P_MUTATION']) {
    if (receiptCapabilities?.[key] !== selected[key]) {
      fail(
        'PROJECT_CAPABILITY_RECEIPT_MISMATCH',
        `receipt ${key} capability differs from the signed descriptor and current authority`
      )
    }
  }
  return Object.freeze(selected)
}

export function assertReceiptMutationCapabilities(env, receiptCapabilities, descriptor) {
  const recomputed = capabilityState(env, descriptor)
  const accepted = {
    P_MUTATION: recomputed.P_MUTATION === true,
    P_CLEANUP: recomputed.P_CLEANUP === true,
  }
  if (
    receiptCapabilities?.P_MUTATION !== accepted.P_MUTATION ||
    receiptCapabilities?.P_CLEANUP !== accepted.P_CLEANUP
  ) {
    fail(
      'MUTATION_CAPABILITY_RECEIPT_MISMATCH',
      'receipt mutation capabilities differ from the signed descriptor and current guard'
    )
  }
  return accepted
}
