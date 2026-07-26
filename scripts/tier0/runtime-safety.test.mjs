import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  MUTATION_ACK_VALUE,
  Tier0SafetyError,
  assertAllowedURL,
  canonicalOrigin,
  capabilityState,
  findUnprovenNextRouting,
  isMutationAuthorized,
  isTier0MutationCapabilityAuthorized,
  assertReceiptMutationCapabilities,
  redactTier0EvidenceText,
  validateEnvironmentDescriptor,
  validateOriginAllowlist,
  validateRedirectChain,
} from './runtime-safety.mjs'

const hash = 'a'.repeat(64)
function descriptor(overrides = {}) {
  return {
    schema_version: 1,
    authority: { issuer: 'sandbox-runtime-operator', role: 'runtime-operator' },
    environment: { name: 'cert-sandbox', classification: 'non-production' },
    allowed_origins: {
      frontend: ['http://127.0.0.1:3100'],
      backend: ['https://api.cert-sandbox.example.test'],
    },
    frontend: { origin: 'http://127.0.0.1:3100' },
    backend: {
      origin: 'https://api.cert-sandbox.example.test',
      identity_url: 'https://api.cert-sandbox.example.test/health/identity',
      deployment_id: 'sandbox-deployment-1',
      contract_version: 'v1',
    },
    artifact: {
      build_id: 'build-1',
      rcsm_sha256: hash,
      registry_sha256: 'd'.repeat(64),
      package_sha256: 'e'.repeat(64),
      entry_manifest_sha256: 'f'.repeat(64),
      runtime_input_sha256: '1'.repeat(64),
      descriptor_public_key_sha256: '2'.repeat(64),
      revision: '3'.repeat(40),
      source_tree_sha256: '4'.repeat(64),
      platform: process.platform,
      arch: process.arch,
      node_version: 'v24.18.0',
      npm_version: '11.11.0',
      next_version: '16.2.10',
      object_version_id: 'object-version-1',
      retrieval_locator: 's3://cert-artifacts/frontend/object-version-1',
      retention_until: '2099-01-01T00:00:00.000Z',
      public_api_origin: 'https://api.cert-sandbox.example.test',
    },
    fixtures: {},
    ...overrides,
  }
}

function rejectsCode(fn, code) {
  assert.throws(fn, error => error instanceof Tier0SafetyError && error.code === code)
}

test('canonicalOrigin accepts only an exact origin', () => {
  assert.equal(
    canonicalOrigin('https://sandbox.example.test:8443'),
    'https://sandbox.example.test:8443'
  )
  rejectsCode(() => canonicalOrigin('https://sandbox.example.test/api'), 'ORIGIN_NOT_EXACT')
  rejectsCode(() => canonicalOrigin('https://*.example.test'), 'ORIGIN_WILDCARD_FORBIDDEN')
  rejectsCode(
    () => canonicalOrigin('https://user:pass@example.test'),
    'ORIGIN_CREDENTIALS_FORBIDDEN'
  )
})

test('known production hosts are denied even when presented as positive entries', () => {
  rejectsCode(() => canonicalOrigin('https://seller.wildberries.ru'), 'PRODUCTION_HOST_FORBIDDEN')
  rejectsCode(() => canonicalOrigin('https://api.wildberries.ru'), 'PRODUCTION_HOST_FORBIDDEN')
})

test('allowlist uses canonical exact equality, never suffix or substring matching', () => {
  const allowed = validateOriginAllowlist(['https://api.sandbox.example.test'], 'backend')
  assert.equal(
    assertAllowedURL('https://api.sandbox.example.test/v1/orders', allowed).pathname,
    '/v1/orders'
  )
  rejectsCode(
    () => assertAllowedURL('https://api.sandbox.example.test.evil.invalid/v1/orders', allowed),
    'DESTINATION_NOT_ALLOWLISTED'
  )
  rejectsCode(
    () => assertAllowedURL('https://user:pass@api.sandbox.example.test/v1/orders', allowed),
    'DESTINATION_CREDENTIALS_OR_PROTOCOL_FORBIDDEN'
  )
})

test('shared URL control rejects fragments, sensitive queries, and unexpected methods', () => {
  const allowed = ['https://api.sandbox.example.test']
  rejectsCode(
    () => assertAllowedURL('https://api.sandbox.example.test/orders#secret', allowed),
    'DESTINATION_FRAGMENT_FORBIDDEN'
  )
  rejectsCode(
    () => assertAllowedURL('https://api.sandbox.example.test/orders#', allowed),
    'DESTINATION_FRAGMENT_FORBIDDEN'
  )
  rejectsCode(
    () => assertAllowedURL('https://api.sandbox.example.test/orders?access_token=unsafe', allowed),
    'DESTINATION_SENSITIVE_QUERY_FORBIDDEN'
  )
  rejectsCode(
    () =>
      assertAllowedURL('https://api.sandbox.example.test/orders', allowed, 'orders create', {
        method: 'PUT',
        allowedMethods: ['POST'],
      }),
    'DESTINATION_METHOD_FORBIDDEN'
  )
  assert.equal(
    assertAllowedURL('https://api.sandbox.example.test/orders?page=2', allowed, 'orders read', {
      method: 'GET',
      allowedMethods: ['GET'],
    }).pathname,
    '/orders'
  )
})

test('every redirect hop must remain inside the positive allowlist', () => {
  const allowed = ['https://api.sandbox.example.test']
  assert.equal(
    validateRedirectChain(
      ['https://api.sandbox.example.test/start', 'https://api.sandbox.example.test/identity'],
      allowed
    ).length,
    2
  )
  rejectsCode(
    () =>
      validateRedirectChain(
        ['https://api.sandbox.example.test/start', 'https://evil.invalid'],
        allowed
      ),
    'DESTINATION_NOT_ALLOWLISTED'
  )
})

test('descriptor binds local production server, sandbox backend, public API and artifact', () => {
  const result = validateEnvironmentDescriptor(descriptor())
  assert.equal(result.frontendOrigin, 'http://127.0.0.1:3100')
  assert.equal(result.publicApiOrigin, result.backendOrigin)
  rejectsCode(
    () =>
      validateEnvironmentDescriptor(
        descriptor({ environment: { name: 'production', classification: 'production' } })
      ),
    'ENVIRONMENT_NOT_NON_PRODUCTION'
  )
})

test('descriptor cannot widen egress to an additional unverified origin', () => {
  const widened = descriptor()
  widened.allowed_origins.backend.push('https://secondary.sandbox.example.test')
  rejectsCode(() => validateEnvironmentDescriptor(widened), 'ALLOWLIST_SCOPE_UNPROVEN')
})

test('triple mutation guard requires exact values', () => {
  const enabled = {
    E2E_ENABLE_MUTATIONS: 'true',
    E2E_MUTATION_TARGET: 'sandbox',
    E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
  }
  assert.equal(isMutationAuthorized(enabled), true)
  assert.equal(isMutationAuthorized({ ...enabled, E2E_ENABLE_MUTATIONS: '1' }), false)
  assert.equal(isMutationAuthorized({ ...enabled, E2E_MUTATION_TARGET: 'production' }), false)
})

test('Tier-0 mutation execution requires the exact guard and preflight capabilities', () => {
  const enabled = {
    E2E_ENABLE_MUTATIONS: 'true',
    E2E_MUTATION_TARGET: 'sandbox',
    E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
  }
  const capabilities = { P_MUTATION: true, P_CLEANUP: true }
  assert.equal(isTier0MutationCapabilityAuthorized(enabled, capabilities), true)
  assert.equal(
    isTier0MutationCapabilityAuthorized({ ...enabled, E2E_ENABLE_MUTATIONS: '1' }, capabilities),
    false
  )
  assert.equal(
    isTier0MutationCapabilityAuthorized(enabled, { P_MUTATION: false, P_CLEANUP: true }),
    false
  )
  assert.equal(
    isTier0MutationCapabilityAuthorized(enabled, { P_MUTATION: true, P_CLEANUP: false }),
    false
  )
})

test('receipt mutation capabilities are recomputed from the signed descriptor and exact guard', () => {
  const enabled = {
    E2E_TEST_EMAIL: 'user@example.test',
    E2E_TEST_PASSWORD: 'user-secret',
    E2E_ENABLE_MUTATIONS: 'true',
    E2E_MUTATION_TARGET: 'sandbox',
    E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
  }
  const validated = validateEnvironmentDescriptor(
    descriptor({
      fixtures: {
        mutation_record_id: 'owned-record',
        cleanup_control_id: 'cleanup-v1',
        mutation: {
          create_url: 'https://api.cert-sandbox.example.test/records',
          create_method: 'POST',
          create_id_field: 'id',
          create_body: { id: 'owned-record', owner_marker: 'owner' },
          response_id_field: 'id',
          response_id_header: 'x-tier0-created-id',
          response_owner_header: 'x-tier0-owner-marker',
          owner_marker: 'owner',
          observe_path: '/records/owned-record',
          observe_text: 'owned-record owner',
          cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
          cleanup_method: 'DELETE',
        },
      },
    })
  )
  assert.deepEqual(
    assertReceiptMutationCapabilities(enabled, { P_MUTATION: true, P_CLEANUP: true }, validated),
    { P_MUTATION: true, P_CLEANUP: true }
  )
  rejectsCode(
    () =>
      assertReceiptMutationCapabilities(enabled, { P_MUTATION: true, P_CLEANUP: false }, validated),
    'MUTATION_CAPABILITY_RECEIPT_MISMATCH'
  )
  rejectsCode(
    () =>
      assertReceiptMutationCapabilities(
        { ...enabled, E2E_ENABLE_MUTATIONS: '1' },
        { P_MUTATION: true, P_CLEANUP: true },
        validated
      ),
    'MUTATION_CAPABILITY_RECEIPT_MISMATCH'
  )
})

test('durable evidence redaction covers headers, encoded query keys, JWTs, and declared values', () => {
  const declared = 'declared-secret-value'
  const raw = [
    'Cookie: session=unsafe',
    'Set-Cookie: sid=unsafe; HttpOnly',
    'Authorization: Bearer header-secret',
    'GET /callback?%74oken=encoded-secret&session_id=session-secret',
    'eyJaaaaaaaaaaaa.bbbbbbbbbbbb.cccccccccccc',
    declared,
  ].join('\n')
  const redacted = redactTier0EvidenceText(raw, [declared])
  assert.doesNotMatch(
    redacted,
    /session=unsafe|sid=unsafe|header-secret|encoded-secret|session-secret|eyJ|declared-secret/
  )
  assert.match(redacted, /Cookie: \[REDACTED\]/)
  assert.match(redacted, /Set-Cookie: \[REDACTED\]/)
  assert.match(redacted, /%74oken=\[REDACTED\]/)
})

test('short declared secrets are rejected for capabilities and triple-encoded query keys redact', () => {
  const validated = validateEnvironmentDescriptor(descriptor())
  assert.equal(
    capabilityState({ E2E_TEST_EMAIL: 'a@b.c', E2E_TEST_PASSWORD: 'x' }, validated).P_USER,
    false
  )
  const redacted = redactTier0EvidenceText('GET /?%252574oken=unsafe short=x', ['x'])
  assert.doesNotMatch(redacted, /unsafe|short=x/)
  assert.match(redacted, /%252574oken=\[REDACTED\]/)
})

test('capabilities are scoped; absent optional authority does not disable user reads', () => {
  const validated = validateEnvironmentDescriptor(
    descriptor({
      fixtures: { cabinet_a_id: 'a', cabinet_b_id: 'b', orders_control_id: 'orders-v1' },
    })
  )
  const state = capabilityState(
    { E2E_TEST_EMAIL: 'user@example.test', E2E_TEST_PASSWORD: 'not-recorded' },
    validated
  )
  assert.equal(state.P_USER, true)
  assert.equal(state.P_CABINET, true)
  assert.equal(state.P_ORDERS, true)
  assert.equal(state.P_MANAGER, false)
  assert.equal(state.P_MUTATION, false)
})

test('manager and mutation capabilities include the user-session authority they require', () => {
  const validated = validateEnvironmentDescriptor(
    descriptor({ fixtures: { mutation_record_id: 'owned-record' } })
  )
  const state = capabilityState(
    {
      E2E_MANAGER_EMAIL: 'manager@example.test',
      E2E_MANAGER_PASSWORD: 'manager-secret',
      E2E_ENABLE_MUTATIONS: 'true',
      E2E_MUTATION_TARGET: 'sandbox',
      E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
    },
    validated
  )
  assert.equal(state.P_MANAGER, false)
  assert.equal(state.P_MUTATION, false)
})

test('mutation capability also requires a declared cleanup control', () => {
  const enabled = {
    E2E_TEST_EMAIL: 'user@example.test',
    E2E_TEST_PASSWORD: 'user-secret',
    E2E_ENABLE_MUTATIONS: 'true',
    E2E_MUTATION_TARGET: 'sandbox',
    E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
  }
  const withoutCleanup = validateEnvironmentDescriptor(
    descriptor({
      fixtures: {
        mutation_record_id: 'owned-record',
        mutation: {
          create_id_field: 'id',
          create_body: { id: 'owned-record' },
          cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
        },
      },
    })
  )
  assert.equal(capabilityState(enabled, withoutCleanup).P_MUTATION, false)
  const withCleanup = validateEnvironmentDescriptor(
    descriptor({
      fixtures: { mutation_record_id: 'owned-record', cleanup_control_id: 'cleanup-v1' },
    })
  )
  assert.equal(capabilityState(enabled, withCleanup).P_MUTATION, false)

  const withBoundCleanup = validateEnvironmentDescriptor(
    descriptor({
      fixtures: {
        mutation_record_id: 'owned-record',
        cleanup_control_id: 'cleanup-v1',
        mutation: {
          create_url: 'https://api.cert-sandbox.example.test/records',
          create_method: 'POST',
          create_id_field: 'id',
          create_body: { id: 'owned-record', owner_marker: 'owner' },
          response_id_field: 'id',
          response_id_header: 'x-tier0-created-id',
          response_owner_header: 'x-tier0-owner-marker',
          owner_marker: 'owner',
          observe_path: '/records/owned-record',
          observe_text: 'owned-record owner',
          cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
          cleanup_method: 'DELETE',
        },
      },
    })
  )
  assert.equal(capabilityState(enabled, withBoundCleanup).P_MUTATION, true)
  assert.equal(capabilityState(enabled, withBoundCleanup).P_CLEANUP, true)
  assert.equal(
    capabilityState({ ...enabled, E2E_ENABLE_MUTATIONS: '1' }, withBoundCleanup).P_MUTATION,
    false
  )

  const backendObservation = validateEnvironmentDescriptor(
    descriptor({
      fixtures: {
        ...withBoundCleanup.fixtures,
        mutation: {
          ...withBoundCleanup.fixtures.mutation,
          observe_path: 'https://api.cert-sandbox.example.test/records/owned-record',
        },
      },
    })
  )
  assert.equal(capabilityState(enabled, backendObservation).P_MUTATION, false)
  assert.equal(capabilityState(enabled, backendObservation).P_CLEANUP, false)

  const unboundFallback = validateEnvironmentDescriptor(
    descriptor({
      fixtures: {
        mutation_record_id: 'owned-record',
        cleanup_control_id: 'cleanup-v1',
        mutation: {
          create_id_field: 'id',
          create_body: { id: 'different-record' },
          cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
        },
      },
    })
  )
  assert.equal(capabilityState(enabled, unboundFallback).P_MUTATION, false)
  assert.equal(capabilityState(enabled, unboundFallback).P_CLEANUP, false)
})

test('unproven Next rewrites, redirects and proxies are detected outside comments', () => {
  assert.deepEqual(findUnprovenNextRouting('const config = { headers() {} }'), [])
  assert.deepEqual(findUnprovenNextRouting('const config = { async rewrites() { return [] } }'), [
    'rewrites',
  ])
  assert.deepEqual(findUnprovenNextRouting('// redirects() is absent\nconst config = {}'), [])
})

test('Tier-0 mutation paths do not use the permissive legacy E2E guard', async () => {
  const sources = await Promise.all([
    readFile('playwright.tier0.config.ts', 'utf8'),
    readFile('e2e/runtime-certification.spec.ts', 'utf8'),
  ])
  for (const source of sources) {
    assert.doesNotMatch(source, /fixtures\/mutation-guard/)
    assert.match(source, /shouldIncludeTier0MutationProject/)
  }
})
