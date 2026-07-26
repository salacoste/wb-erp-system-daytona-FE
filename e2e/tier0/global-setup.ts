import { createHash } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import path from 'node:path'

interface ServerIdentity {
  schema_version: number
  server_pid: number
  host: string
  port: number
  build_id: string
  rcsm_sha256: string
  preflight_receipt_sha256: string
}

interface Receipt {
  schema_version: number
  status: string
  expires_at: string
  descriptor_path: string
  descriptor_sha256: string
  descriptor_authority: {
    signature_path: string
    signature_sha256: string
    public_key_path: string
    public_key_sha256: string
    trusted_issuer: string
    pinned_public_key_sha256: string
    expires_at: string
  }
  registry_sha256: string
  frontend_origin: string
  artifact: {
    build_id: string
    rcsm_sha256: string
    fetch_receipt_path: string
    fetch_receipt_sha256: string
  }
}

async function digest(filePath: string): Promise<string> {
  return createHash('sha256')
    .update(await readFile(filePath))
    .digest('hex')
}

export default async function tier0GlobalSetup(): Promise<void> {
  const receiptPath = process.env.TIER0_PREFLIGHT_RECEIPT
  const descriptorPath = process.env.TIER0_ENV_DESCRIPTOR
  const serverIdentityPath = process.env.TIER0_SERVER_IDENTITY
  if (!receiptPath || !descriptorPath || !serverIdentityPath) {
    throw new Error('Tier-0 receipt, descriptor, and owned-server identity are required')
  }

  const receipt = JSON.parse(await readFile(receiptPath, 'utf8')) as Receipt
  const receiptSha256 = await digest(receiptPath)
  const receiptStat = await stat(receiptPath)
  if (receipt.schema_version !== 1 || receipt.status !== 'READY') {
    throw new Error('Tier-0 preflight receipt is not READY')
  }
  if (process.env.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256 !== receiptSha256) {
    throw new Error('Tier-0 preflight receipt bytes were substituted after runner binding')
  }
  if (receiptStat.mode & 0o077)
    throw new Error('Tier-0 preflight receipt permissions are not private')
  const receiptExpiry = Date.parse(receipt.expires_at)
  if (!Number.isFinite(receiptExpiry) || receiptExpiry <= Date.now())
    throw new Error('Tier-0 preflight receipt expired')
  if (receipt.frontend_origin !== 'http://127.0.0.1:3100') {
    throw new Error('Tier-0 frontend origin drifted from the port-3100 contract')
  }
  if ((await realpath(receipt.descriptor_path)) !== (await realpath(descriptorPath))) {
    throw new Error('Tier-0 descriptor path does not match the preflight receipt')
  }
  if ((await digest(descriptorPath)) !== receipt.descriptor_sha256) {
    throw new Error('Tier-0 descriptor changed after preflight')
  }
  const authorityExpiry = Date.parse(receipt.descriptor_authority.expires_at)
  if (
    !Number.isFinite(authorityExpiry) ||
    authorityExpiry <= Date.now() ||
    (await digest(receipt.descriptor_authority.signature_path)) !==
      receipt.descriptor_authority.signature_sha256 ||
    (await digest(receipt.descriptor_authority.public_key_path)) !==
      receipt.descriptor_authority.public_key_sha256 ||
    process.env.TIER0_TRUSTED_DESCRIPTOR_ISSUER !== receipt.descriptor_authority.trusted_issuer ||
    process.env.TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256?.toLowerCase() !==
      receipt.descriptor_authority.pinned_public_key_sha256
  ) {
    throw new Error('Tier-0 descriptor authority proof changed or expired after preflight')
  }
  if ((await digest('e2e/tier0/tier0-row-registry.v1.json')) !== receipt.registry_sha256) {
    throw new Error('Tier-0 registry changed after preflight')
  }
  if (
    (await readFile(path.join('.next', 'BUILD_ID'), 'utf8')).trim() !== receipt.artifact.build_id
  ) {
    throw new Error('Tier-0 build identity changed after preflight')
  }
  if (process.env.TIER0_RCSM_SHA256?.toLowerCase() !== receipt.artifact.rcsm_sha256) {
    throw new Error('Tier-0 RCSM binding changed after preflight')
  }
  if (
    (await digest(receipt.artifact.fetch_receipt_path)) !== receipt.artifact.fetch_receipt_sha256
  ) {
    throw new Error('Tier-0 immutable fetch receipt changed after preflight')
  }

  const identity = JSON.parse(await readFile(serverIdentityPath, 'utf8')) as ServerIdentity
  const identityStat = await stat(serverIdentityPath)
  if (identityStat.mode & 0o077)
    throw new Error('Tier-0 server identity permissions are not private')
  if (identity.schema_version !== 1 || identity.host !== '127.0.0.1' || identity.port !== 3100) {
    throw new Error('Tier-0 server identity violates the bound port contract')
  }
  if (
    identity.build_id !== receipt.artifact.build_id ||
    identity.rcsm_sha256 !== receipt.artifact.rcsm_sha256
  ) {
    throw new Error('Tier-0 server identity is not bound to the preflight artifact')
  }
  if (identity.preflight_receipt_sha256 !== receiptSha256) {
    throw new Error('Tier-0 server identity references a different preflight receipt')
  }
  try {
    process.kill(identity.server_pid, 0)
  } catch {
    throw new Error('Tier-0 owned server PID is not alive')
  }
}
