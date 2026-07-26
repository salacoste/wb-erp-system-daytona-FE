import {
  assertReceiptSnapshotBinding as assertBoundSnapshot,
  assertReceiptMutationCapabilities,
  isTier0MutationCapabilityAuthorized,
  loadBoundDescriptorSnapshot,
  mutationCleanupBinding as bindMutationCleanup,
  mutationResponseBinding,
  mutationExecutionControl,
  resolveTier0ProjectCapabilities as resolveProjectCapabilities,
} from '../../scripts/tier0/runtime-safety.mjs'

interface MutationReceipt {
  status?: string
  run_id?: string
  expires_at?: string
  descriptor_path?: string
  descriptor_sha256?: string
  descriptor_authority?: { signature_sha256?: string; expires_at?: string }
  capabilities?: {
    P_USER?: boolean
    P_MANAGER?: boolean
    P_MUTATION?: boolean
    P_CLEANUP?: boolean
  }
}

export const MUTATION_MIN_REMAINING_TTL_MS = 90_000

interface MutationDescriptor {
  fixtures?: Record<string, unknown>
}

export function shouldIncludeTier0MutationProject(
  env: Readonly<Record<string, string | undefined>>,
  receipt: MutationReceipt | undefined,
  descriptor: MutationDescriptor | undefined
): boolean {
  if (!receipt || !descriptor) return false
  const recomputed = assertReceiptMutationCapabilities(env, receipt.capabilities, descriptor)
  return isTier0MutationCapabilityAuthorized(env, recomputed)
}

export function loadBoundMutationContext(
  env: Readonly<Record<string, string | undefined>>,
  options: { allowExpiredReceipt?: boolean } = {}
): {
  receipt: MutationReceipt
  descriptor: MutationDescriptor
  plan?: ReturnType<typeof createMutationExecutionPlan>
  binding: string
  receiptSha256: string
} {
  const bound = loadBoundDescriptorSnapshot(env as typeof process.env, options)
  const receipt = bound.receipt as MutationReceipt
  const descriptor = bound.descriptor as MutationDescriptor
  const plan = receipt.capabilities?.P_MUTATION
    ? createMutationExecutionPlan(descriptor)
    : undefined
  return {
    receipt,
    descriptor,
    plan,
    binding: bound.binding,
    receiptSha256: bound.receiptSha256,
  }
}

export function assertReceiptSnapshotBinding(
  receipt: MutationReceipt,
  env: Readonly<Record<string, string | undefined>>,
  descriptorBytes: Uint8Array,
  receiptBytes: Uint8Array
): string {
  return assertBoundSnapshot(receipt, env, descriptorBytes, receiptBytes)
}

export function resolveTier0ProjectCapabilities(
  env: Readonly<Record<string, string | undefined>>,
  receipt: MutationReceipt,
  descriptor: MutationDescriptor
) {
  return resolveProjectCapabilities(env, receipt.capabilities, descriptor)
}

interface MutationContext {
  receipt: MutationReceipt
  plan?: ReturnType<typeof createMutationExecutionPlan>
  binding: string
  receiptSha256: string
}

function freezeDeep<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child)
  return Object.freeze(value)
}

export function captureMutationCleanupAuthority(
  context: MutationContext,
  now = Date.now(),
  minimumRemainingTtlMs = MUTATION_MIN_REMAINING_TTL_MS
) {
  if (!context.plan) throw new Error('signed mutation plan is missing')
  const receiptExpiry = Date.parse(context.receipt.expires_at || '')
  const authorityExpiry = Date.parse(context.receipt.descriptor_authority?.expires_at || '')
  const expiresAt = Math.min(receiptExpiry, authorityExpiry)
  if (!Number.isFinite(expiresAt) || expiresAt - now < minimumRemainingTtlMs) {
    throw new Error('mutation authority has insufficient remaining TTL for POST and cleanup')
  }
  return freezeDeep({
    binding: context.binding,
    receiptSha256: context.receiptSha256,
    runId: context.receipt.run_id,
    expiresAt,
    signedId: context.plan.signedId,
    ownerMarker: context.plan.ownerMarker,
    cleanupControlId: context.plan.cleanupControlId,
    controlDigest: context.plan.controlDigest,
    bodyDigest: context.plan.bodyDigest,
    createBody: structuredClone(context.plan.mutation.create_body),
    cleanupMethod: context.plan.cleanupMethod,
    cleanup: {
      href: context.plan.cleanup!.href,
      origin: context.plan.cleanup!.origin,
      pathname: context.plan.cleanup!.pathname,
      search: context.plan.cleanup!.search,
    },
  })
}

export function assertMutationAuthorityBinding(
  authority: ReturnType<typeof captureMutationCleanupAuthority>,
  context: MutationContext
): void {
  if (
    !context.plan ||
    context.binding !== authority.binding ||
    context.receiptSha256 !== authority.receiptSha256 ||
    context.receipt.run_id !== authority.runId ||
    context.plan.signedId !== authority.signedId ||
    context.plan.controlDigest !== authority.controlDigest ||
    context.plan.bodyDigest !== authority.bodyDigest ||
    context.plan.cleanup?.href !== authority.cleanup.href ||
    JSON.stringify(context.plan.mutation.create_body) !== JSON.stringify(authority.createBody)
  ) {
    throw new Error('mutation authority body or control binding changed')
  }
}

export function createMutationExecutionPlan(descriptor: MutationDescriptor) {
  return mutationExecutionControl(descriptor)
}

interface CleanupExpected {
  signedId: string
  ownerMarker: string
  cleanupControlId: string
}

function assertHeaders(
  headers: Record<string, string>,
  expected: CleanupExpected,
  idHeader: string
) {
  if (
    headers[idHeader] !== expected.signedId ||
    headers['x-tier0-owner-marker'] !== expected.ownerMarker ||
    headers['x-tier0-cleanup-control-id'] !== expected.cleanupControlId
  )
    throw new Error('cleanup semantic acknowledgement is not bound to the signed control')
}

export function assertCleanupDeleteProof(
  status: number,
  headers: Record<string, string>,
  expected: CleanupExpected
): void {
  if (status < 200 || status >= 300) throw new Error('cleanup deletion acknowledgement failed')
  assertHeaders(headers, expected, 'x-tier0-deleted-id')
}

export function assertCleanupAbsenceProof(
  status: number,
  headers: Record<string, string>,
  expected: CleanupExpected
): void {
  if (![404, 410].includes(status)) throw new Error('cleanup authoritative absence proof failed')
  assertHeaders(headers, expected, 'x-tier0-absent-id')
}

export function mutationCleanupBinding(
  signedRecordId: string,
  createIdField: string,
  createBody: Record<string, unknown>
): string {
  return bindMutationCleanup(signedRecordId, createIdField, createBody)
}

export function selectMutationCleanupId(
  signedTestOwnedId: string,
  returnedId: string | undefined,
  returnedOwner: string | undefined,
  expectedOwner: string
): string {
  return mutationResponseBinding(signedTestOwnedId, returnedId, returnedOwner, expectedOwner)
}
