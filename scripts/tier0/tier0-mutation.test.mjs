import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import {
  assertCleanupAbsenceProof,
  assertCleanupDeleteProof,
  assertReceiptSnapshotBinding,
  assertMutationAuthorityBinding,
  captureMutationCleanupAuthority,
  createMutationExecutionPlan,
  resolveTier0ProjectCapabilities,
  selectMutationCleanupId,
  shouldIncludeTier0MutationProject,
} from '../../e2e/fixtures/tier0-mutation.ts'
import { controlTier0NavigationURL } from '../../e2e/fixtures/tier0-runtime.ts'
import { MUTATION_ACK_VALUE, validateEnvironmentDescriptor } from './runtime-safety.mjs'

const hash = 'a'.repeat(64)
function descriptor() {
  return validateEnvironmentDescriptor({
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
        cleanup_url_template: 'https://api.cert-sandbox.example.test/records/{id}',
        cleanup_method: 'DELETE',
      },
    },
  })
}

const env = {
  E2E_TEST_EMAIL: 'user@example.test',
  E2E_TEST_PASSWORD: 'user-secret',
  E2E_ENABLE_MUTATIONS: 'true',
  E2E_MUTATION_TARGET: 'sandbox',
  E2E_MUTATION_ACK: MUTATION_ACK_VALUE,
}

test('mutation cleanup target remains the signed ID and response mismatch fails closed', () => {
  assert.equal(selectMutationCleanupId('signed-id', 'signed-id', 'owner', 'owner'), 'signed-id')
  assert.throws(
    () => selectMutationCleanupId('signed-id', 'response-id', 'owner', 'owner'),
    error => error?.code === 'MUTATION_RESPONSE_ID_MISMATCH'
  )
  assert.throws(
    () => selectMutationCleanupId('signed-id', 'signed-id', 'other-owner', 'owner'),
    error => error?.code === 'MUTATION_RESPONSE_OWNER_MISMATCH'
  )
})

test('mutation project independently recomputes receipt capabilities', () => {
  const validated = descriptor()
  assert.equal(
    shouldIncludeTier0MutationProject(
      env,
      { capabilities: { P_MUTATION: true, P_CLEANUP: true } },
      validated
    ),
    true
  )
  assert.throws(
    () =>
      shouldIncludeTier0MutationProject(
        { ...env, E2E_ENABLE_MUTATIONS: '1' },
        { capabilities: { P_MUTATION: true, P_CLEANUP: true } },
        validated
      ),
    error => error?.code === 'MUTATION_CAPABILITY_RECEIPT_MISMATCH'
  )
})

test('RT-E14 observation resolves only against the exact frontend origin', () => {
  assert.equal(
    controlTier0NavigationURL('/orders/observe', ['http://127.0.0.1:3100']).href,
    'http://127.0.0.1:3100/orders/observe'
  )
  assert.throws(
    () =>
      controlTier0NavigationURL('https://api.cert-sandbox.example.test/orders/observe', [
        'http://127.0.0.1:3100',
      ]),
    error => error?.code === 'DESTINATION_NOT_ALLOWLISTED'
  )
})

test('structural mutation plan fixes the signed cleanup target and rejects query-bearing controls', () => {
  const plan = createMutationExecutionPlan(descriptor())
  assert.equal(plan.signedId, 'signed-id')
  assert.equal(plan.cleanup.href, 'https://api.cert-sandbox.example.test/records/signed-id')
  const queried = structuredClone(descriptor())
  queried.fixtures.mutation.cleanup_url_template =
    'https://api.cert-sandbox.example.test/records/{id}?mode=delete'
  assert.throws(() => createMutationExecutionPlan(queried), /must not contain a query/)
})

test('mutation methods are explicit signed POST and DELETE with no defaults', () => {
  for (const missing of ['create_method', 'cleanup_method']) {
    const changed = structuredClone(descriptor())
    delete changed.fixtures.mutation[missing]
    assert.throws(() => createMutationExecutionPlan(changed), /method/i)
  }
})

test('signed fixtures, mutation, and create body are deeply immutable', () => {
  const validated = descriptor()
  const plan = createMutationExecutionPlan(validated)
  assert.equal(Object.isFrozen(validated.fixtures), true)
  assert.equal(Object.isFrozen(validated.fixtures.mutation), true)
  assert.equal(Object.isFrozen(validated.fixtures.mutation.create_body), true)
  assert.equal(Object.isFrozen(plan.mutation), true)
  assert.equal(Object.isFrozen(plan.mutation.create_body), true)
  assert.throws(() => {
    plan.mutation.create_body.id = 'attacker-id'
  }, TypeError)
  assert.equal(plan.bodyDigest, createMutationExecutionPlan(validated).bodyDigest)
})

test('cleanup authority survives expiry drift only after sufficient TTL was captured before POST', () => {
  const now = Date.parse('2098-01-01T00:00:00.000Z')
  const plan = createMutationExecutionPlan(descriptor())
  const context = {
    receipt: {
      run_id: 'run-1',
      expires_at: new Date(now + 120_000).toISOString(),
      descriptor_authority: { expires_at: new Date(now + 120_000).toISOString() },
    },
    plan,
    binding: 'a'.repeat(64),
    receiptSha256: 'b'.repeat(64),
  }
  const authority = captureMutationCleanupAuthority(context, now, 90_000)
  assert.equal(authority.cleanup.href, plan.cleanup.href)
  assert.equal(authority.expiresAt <= now + 120_000, true)
  assert.doesNotThrow(() => assertMutationAuthorityBinding(authority, context))
  assert.equal(
    authority.cleanup.href,
    plan.cleanup.href,
    'captured cleanup remains usable after TTL'
  )
  assert.throws(
    () => captureMutationCleanupAuthority(context, now + 40_000, 90_000),
    /remaining TTL/i
  )
})

test('project scheduling requires exact receipt-bound capabilities and rejects short credentials', () => {
  const validated = descriptor()
  const receipt = {
    capabilities: { P_USER: true, P_MANAGER: true, P_MUTATION: true, P_CLEANUP: true },
  }
  const full = {
    ...env,
    E2E_MANAGER_EMAIL: 'manager@example.test',
    E2E_MANAGER_PASSWORD: 'manager-secret',
  }
  assert.deepEqual(resolveTier0ProjectCapabilities(full, receipt, validated), {
    P_USER: true,
    P_MANAGER: true,
    P_MUTATION: true,
  })
  assert.throws(
    () => resolveTier0ProjectCapabilities({ ...full, E2E_TEST_PASSWORD: 'x' }, receipt, validated),
    /capabilit/i
  )
})

test('cleanup completion requires exact delete acknowledgement and authoritative absence proof', () => {
  const expected = {
    signedId: 'signed-id',
    ownerMarker: 'owner',
    cleanupControlId: 'cleanup-v1',
  }
  assert.doesNotThrow(() =>
    assertCleanupDeleteProof(
      204,
      {
        'x-tier0-deleted-id': 'signed-id',
        'x-tier0-owner-marker': 'owner',
        'x-tier0-cleanup-control-id': 'cleanup-v1',
      },
      expected
    )
  )
  assert.throws(() => assertCleanupDeleteProof(204, {}, expected), /acknowledgement/)
  assert.doesNotThrow(() =>
    assertCleanupAbsenceProof(
      404,
      {
        'x-tier0-absent-id': 'signed-id',
        'x-tier0-owner-marker': 'owner',
        'x-tier0-cleanup-control-id': 'cleanup-v1',
      },
      expected
    )
  )
  assert.throws(() => assertCleanupAbsenceProof(200, {}, expected), /absence/)
})

test('receipt snapshot binding rejects changed bytes, mismatched identity, and expiry', () => {
  const bytes = Buffer.from('immutable descriptor snapshot')
  const descriptorSha = createHash('sha256').update(bytes).digest('hex')
  const receipt = {
    status: 'READY',
    run_id: 'run-1',
    expires_at: '2099-01-01T00:00:00.000Z',
    descriptor_sha256: descriptorSha,
    descriptor_authority: {
      signature_sha256: 'b'.repeat(64),
      expires_at: '2099-01-01T00:00:00.000Z',
    },
  }
  const bindingEnv = {
    TIER0_EXPECTED_RUN_ID: 'run-1',
    TIER0_EXPECTED_DESCRIPTOR_SHA256: descriptorSha,
    TIER0_EXPECTED_DESCRIPTOR_SIGNATURE_SHA256: 'b'.repeat(64),
  }
  const receiptBytes = Buffer.from(JSON.stringify(receipt))
  bindingEnv.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256 = createHash('sha256')
    .update(receiptBytes)
    .digest('hex')
  assert.match(
    assertReceiptSnapshotBinding(receipt, bindingEnv, bytes, receiptBytes),
    /^[a-f0-9]{64}$/
  )
  assert.throws(
    () => assertReceiptSnapshotBinding(receipt, bindingEnv, Buffer.from('changed'), receiptBytes),
    /expired or mismatched/
  )
  assert.throws(
    () =>
      assertReceiptSnapshotBinding(
        receipt,
        { ...bindingEnv, TIER0_EXPECTED_RUN_ID: 'other' },
        bytes,
        receiptBytes
      ),
    /expired or mismatched/
  )
  assert.throws(
    () =>
      assertReceiptSnapshotBinding(
        { ...receipt, expires_at: '2000-01-01T00:00:00.000Z' },
        bindingEnv,
        bytes,
        receiptBytes
      ),
    /expired or mismatched/
  )
  assert.throws(
    () => assertReceiptSnapshotBinding(receipt, bindingEnv, bytes, Buffer.from(`${receiptBytes} `)),
    /expired or mismatched/
  )
})
