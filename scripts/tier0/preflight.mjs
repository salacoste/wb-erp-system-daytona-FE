import { execFile } from 'node:child_process'
import { createHash, randomUUID, verify as verifySignature } from 'node:crypto'
import { lstat, readFile, readdir, readlink, realpath, stat, writeFile } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import {
  Tier0SafetyError,
  canonicalOrigin,
  assertAllowedURL,
  capabilityState,
  findUnprovenNextRouting,
  loadEnvironmentDescriptor,
  validateRedirectChain,
} from './runtime-safety.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const execFileAsync = promisify(execFile)
const REGISTRY_PATH = path.join(ROOT, 'e2e/tier0/tier0-row-registry.v1.json')

function fail(code, message) {
  throw new Tier0SafetyError(code, message)
}

async function sha256File(filePath) {
  return createHash('sha256')
    .update(await readFile(filePath))
    .digest('hex')
}

function escapesRoot(relativePath) {
  return (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  )
}

export async function verifyDescriptorAuthority(
  descriptorPath,
  signaturePath,
  publicKeyPath,
  descriptor,
  trustedAnchor
) {
  if (
    !signaturePath ||
    !publicKeyPath ||
    typeof trustedAnchor?.issuer !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(trustedAnchor?.publicKeySha256 ?? '')
  ) {
    fail(
      'DESCRIPTOR_AUTHORITY_MISSING',
      'detached signature, public key, and independent pinned issuer/fingerprint are required'
    )
  }
  let descriptorBytes
  let publicKeyBytes
  let signatureRecord
  try {
    descriptorBytes = await readFile(descriptorPath)
    publicKeyBytes = await readFile(publicKeyPath)
    signatureRecord = JSON.parse(await readFile(signaturePath, 'utf8'))
  } catch {
    fail('DESCRIPTOR_AUTHORITY_INVALID', 'descriptor authority proof is unreadable')
  }
  const publicKeySha256 = createHash('sha256').update(publicKeyBytes).digest('hex')
  const descriptorSha256 = createHash('sha256').update(descriptorBytes).digest('hex')
  const issuedAt = Date.parse(signatureRecord.issued_at)
  const expiresAt = Date.parse(signatureRecord.expires_at)
  const now = Date.now()
  if (
    signatureRecord.schema_version !== 1 ||
    signatureRecord.algorithm !== 'Ed25519' ||
    signatureRecord.issuer !== descriptor.authorityIssuer ||
    signatureRecord.issuer !== trustedAnchor.issuer ||
    signatureRecord.descriptor_sha256 !== descriptorSha256 ||
    publicKeySha256 !== descriptor.descriptorPublicKeySha256 ||
    publicKeySha256 !== trustedAnchor.publicKeySha256.toLowerCase() ||
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    issuedAt > now ||
    expiresAt <= now ||
    expiresAt - issuedAt > 72 * 60 * 60 * 1000 ||
    typeof signatureRecord.signature_base64 !== 'string'
  ) {
    fail('DESCRIPTOR_AUTHORITY_MISMATCH', 'descriptor authority metadata is not trusted')
  }
  let valid = false
  try {
    valid = verifySignature(
      null,
      descriptorBytes,
      publicKeyBytes,
      Buffer.from(signatureRecord.signature_base64, 'base64')
    )
  } catch {
    valid = false
  }
  if (!valid) fail('DESCRIPTOR_SIGNATURE_INVALID', 'descriptor signature verification failed')
  return {
    issuer: signatureRecord.issuer,
    trusted_issuer: trustedAnchor.issuer,
    pinned_public_key_sha256: trustedAnchor.publicKeySha256.toLowerCase(),
    signature_path: path.resolve(signaturePath),
    signature_sha256: await sha256File(signaturePath),
    public_key_path: path.resolve(publicKeyPath),
    public_key_sha256: publicKeySha256,
    expires_at: signatureRecord.expires_at,
  }
}

async function collectExtractedEntries(root, relative = '', canonicalRoot) {
  canonicalRoot ??= await realpath(root)
  const directory = path.join(root, relative)
  const names = (await readdir(directory)).sort()
  const entries = []
  for (const name of names) {
    const entryPath = relative ? `${relative}/${name}` : name
    const absolute = path.join(root, ...entryPath.split('/'))
    const metadata = await lstat(absolute)
    const mode = metadata.mode & 0o777
    if (metadata.isSymbolicLink()) {
      const target = await readlink(absolute)
      const lexicalTarget = path.resolve(path.dirname(absolute), target)
      const lexicalRelative = path.relative(path.resolve(root), lexicalTarget)
      if (escapesRoot(lexicalRelative)) {
        fail('ENTRY_MANIFEST_SYMLINK_ESCAPE', `artifact symlink escapes its root: ${entryPath}`)
      }
      let resolvedTarget
      try {
        resolvedTarget = await realpath(absolute)
      } catch {
        fail('ENTRY_MANIFEST_SYMLINK_UNRESOLVED', `artifact symlink is unresolved: ${entryPath}`)
      }
      const resolvedRelative = path.relative(canonicalRoot, resolvedTarget)
      if (escapesRoot(resolvedRelative)) {
        fail('ENTRY_MANIFEST_SYMLINK_ESCAPE', `artifact symlink escapes its root: ${entryPath}`)
      }
      entries.push({ path: entryPath, type: 'symlink', mode, target })
    } else if (metadata.isDirectory()) {
      entries.push({ path: entryPath, type: 'directory', mode })
      entries.push(...(await collectExtractedEntries(root, entryPath, canonicalRoot)))
    } else if (metadata.isFile()) {
      entries.push({ path: entryPath, type: 'file', mode, sha256: await sha256File(absolute) })
    } else {
      fail('ENTRY_MANIFEST_UNSUPPORTED_TYPE', `unsupported artifact entry type: ${entryPath}`)
    }
  }
  return entries
}

export async function verifyExtractedEntryManifest(root, manifestPath) {
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch {
    fail('ENTRY_MANIFEST_INVALID', 'entry manifest is not valid JSON')
  }
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.entries)) {
    fail('ENTRY_MANIFEST_INVALID', 'entry manifest schema is invalid')
  }
  const paths = manifest.entries.map(entry => entry?.path)
  if (
    paths.some(
      entry =>
        typeof entry !== 'string' ||
        entry === '' ||
        entry.startsWith('/') ||
        entry.includes('\\') ||
        entry.split('/').includes('..')
    ) ||
    new Set(paths).size !== paths.length ||
    paths.join('\0') !== [...paths].sort().join('\0')
  ) {
    fail('ENTRY_MANIFEST_INVALID', 'entry manifest paths must be safe, unique, and sorted')
  }
  for (const required of [
    '.next/BUILD_ID',
    'next.config.ts',
    'node_modules',
    'package-lock.json',
    'package.json',
    'public',
  ]) {
    if (!paths.includes(required)) {
      fail('ENTRY_MANIFEST_INCOMPLETE', `entry manifest omitted required path: ${required}`)
    }
  }
  const actual = await collectExtractedEntries(root)
  if (JSON.stringify(actual) !== JSON.stringify(manifest.entries)) {
    fail('EXTRACTED_TREE_MISMATCH', 'extracted artifact tree differs from the bound entry manifest')
  }
}

export async function verifyEvidenceSchema(root = ROOT) {
  let schema
  try {
    schema = JSON.parse(
      await readFile(path.join(root, 'e2e/tier0/tier0-row-evidence.schema.v1.json'), 'utf8')
    )
  } catch {
    fail('EVIDENCE_SCHEMA_INVALID', 'Tier-0 evidence schema is missing or invalid JSON')
  }
  const statuses = schema?.properties?.status?.enum
  const required = new Set(schema?.required || [])
  if (
    schema.additionalProperties !== false ||
    !Array.isArray(statuses) ||
    statuses.join(',') !== 'PASS,FAIL,BLOCKED' ||
    [
      'runtime_input_sha256',
      'revision',
      'source_tree_sha256',
      'command_sha256',
      'exit_code',
      'evidence_sha256',
    ].some(field => !required.has(field))
  ) {
    fail('EVIDENCE_SCHEMA_INVALID', 'Tier-0 evidence schema terminal contract drifted')
  }
}

export async function verifyBuildBinding(descriptor, root = ROOT) {
  const buildIdPath = path.join(root, '.next/BUILD_ID')
  let actualBuildId
  try {
    actualBuildId = (await readFile(buildIdPath, 'utf8')).trim()
  } catch {
    fail('BUILD_ARTIFACT_MISSING', '.next/BUILD_ID is required; ECC must not rebuild it')
  }
  if (actualBuildId !== descriptor.buildId) {
    fail('BUILD_ID_MISMATCH', 'served .next/BUILD_ID does not match the bound descriptor')
  }

  const registrySha256 = await sha256File(path.join(root, 'e2e/tier0/tier0-row-registry.v1.json'))
  if (descriptor.registrySha256 !== registrySha256) {
    fail('REGISTRY_HASH_MISMATCH', 'Tier-0 registry hash does not match the bound descriptor')
  }
  return { actualBuildId, registrySha256 }
}

export async function verifyImmutableFetchReceipt(descriptor, receiptPath, root = ROOT) {
  if (!receiptPath) {
    fail('IMMUTABLE_FETCH_RECEIPT_MISSING', 'TIER0_IMMUTABLE_FETCH_RECEIPT is required')
  }
  let bytes
  let metadata
  try {
    bytes = await readFile(receiptPath)
    metadata = await stat(receiptPath)
  } catch {
    fail('IMMUTABLE_FETCH_RECEIPT_UNREADABLE', 'immutable fetch receipt is unavailable')
  }
  if (metadata.mode & 0o077) {
    fail('IMMUTABLE_FETCH_RECEIPT_PERMISSIONS', 'immutable fetch receipt must be private')
  }
  let receipt
  try {
    receipt = JSON.parse(bytes.toString('utf8'))
  } catch {
    fail('IMMUTABLE_FETCH_RECEIPT_INVALID', 'immutable fetch receipt is not valid JSON')
  }
  const exact = [
    ['rcsm_sha256', descriptor.rcsmSha256],
    ['package_sha256', descriptor.packageSha256],
    ['entry_manifest_sha256', descriptor.entryManifestSha256],
    ['runtime_input_sha256', descriptor.runtimeInputSha256],
    ['object_version_id', descriptor.objectVersionId],
    ['build_id', descriptor.buildId],
    ['registry_sha256', descriptor.registrySha256],
    ['retrieval_locator', descriptor.retrievalLocator],
    ['retention_until', descriptor.retentionUntil],
    ['public_api_origin', descriptor.publicApiOrigin],
    ['platform', descriptor.platform],
    ['arch', descriptor.arch],
    ['node_version', descriptor.nodeVersion],
    ['npm_version', descriptor.npmVersion],
    ['next_version', descriptor.nextVersion],
    ['descriptor_public_key_sha256', descriptor.descriptorPublicKeySha256],
    ['revision', descriptor.revision],
    ['source_tree_sha256', descriptor.sourceTreeSha256],
  ]
  if (receipt.schema_version !== 1 || exact.some(([key, value]) => receipt[key] !== value)) {
    fail(
      'IMMUTABLE_FETCH_BINDING_MISMATCH',
      'immutable fetch receipt does not match the descriptor'
    )
  }
  if (
    receipt.read_only_fetch !== true ||
    receipt.verified_before_extraction !== true ||
    receipt.reconstruction_performed !== false ||
    receipt.entry_manifest_verified !== true ||
    receipt.runtime_identity_verified !== true ||
    receipt.public_api_origin_verified !== true ||
    receipt.retention_verified_at_fetch !== true
  ) {
    fail('IMMUTABLE_FETCH_NOT_PROVEN', 'read-only verification before extraction is not proven')
  }
  const boundFiles = [
    ['package_path', descriptor.packageSha256],
    ['entry_manifest_path', descriptor.entryManifestSha256],
    ['runtime_input_manifest_path', descriptor.runtimeInputSha256],
  ]
  for (const [field, expectedSha256] of boundFiles) {
    if (typeof receipt[field] !== 'string' || !path.isAbsolute(receipt[field])) {
      fail('IMMUTABLE_FETCH_FILE_MISSING', `${field} must name an absolute retained proof file`)
    }
    let metadata
    try {
      metadata = await stat(receipt[field])
    } catch {
      fail('IMMUTABLE_FETCH_FILE_MISSING', `${field} is unavailable`)
    }
    if (!metadata.isFile() || (await sha256File(receipt[field])) !== expectedSha256) {
      fail('IMMUTABLE_FETCH_FILE_MISMATCH', `${field} does not match the bound digest`)
    }
  }
  let runtimeInput
  try {
    runtimeInput = JSON.parse(await readFile(receipt.runtime_input_manifest_path, 'utf8'))
  } catch {
    fail('RUNTIME_INPUT_MANIFEST_INVALID', 'runtime-input manifest is not valid JSON')
  }
  const runtimeInputBindings = [
    ['build_id', descriptor.buildId],
    ['registry_sha256', descriptor.registrySha256],
    ['public_api_origin', descriptor.publicApiOrigin],
    ['platform', descriptor.platform],
    ['arch', descriptor.arch],
    ['node_version', descriptor.nodeVersion],
    ['npm_version', descriptor.npmVersion],
    ['next_version', descriptor.nextVersion],
    ['descriptor_public_key_sha256', descriptor.descriptorPublicKeySha256],
    ['revision', descriptor.revision],
    ['source_tree_sha256', descriptor.sourceTreeSha256],
  ]
  if (
    runtimeInput.schema_version !== 1 ||
    runtimeInputBindings.some(([key, value]) => runtimeInput[key] !== value)
  ) {
    fail(
      'RUNTIME_INPUT_BINDING_MISMATCH',
      'runtime-input manifest differs from the bound build and public API identity'
    )
  }
  await verifyExtractedEntryManifest(root, receipt.entry_manifest_path)
  if ((await realpath(receipt.artifact_root)) !== (await realpath(root))) {
    fail('IMMUTABLE_FETCH_ROOT_MISMATCH', 'current runtime root is not the fetched artifact root')
  }
  if (Date.parse(descriptor.retentionUntil) - Date.now() < 30 * 24 * 60 * 60 * 1000) {
    fail(
      'IMMUTABLE_RETENTION_TOO_SHORT',
      'immutable object has less than 30 days retention remaining'
    )
  }
  return createHash('sha256').update(bytes).digest('hex')
}

export async function verifyBrowser() {
  const executable = chromium.executablePath()
  try {
    await stat(executable)
    const { stdout } = await execFileAsync(executable, ['--version'], { timeout: 10_000 })
    if (!/^Chromium\s+\d+/i.test(stdout.trim())) throw new Error('unexpected version output')
    return stdout.trim()
  } catch {
    fail('BROWSER_INTEGRITY_UNPROVEN', 'installed Chromium executable/version is unavailable')
  }
}

export async function verifyRuntime(descriptor) {
  let npmVersion
  let nextVersion
  try {
    const npm = await execFileAsync('npm', ['--version'], { timeout: 10_000 })
    npmVersion = npm.stdout.trim()
    const nextPackage = JSON.parse(
      await readFile(path.join(ROOT, 'node_modules/next/package.json'), 'utf8')
    )
    nextVersion = nextPackage.version
  } catch {
    fail('RUNTIME_IDENTITY_UNPROVEN', 'Node/npm/Next runtime identity is unavailable')
  }
  if (
    process.version !== descriptor.nodeVersion ||
    npmVersion !== descriptor.npmVersion ||
    nextVersion !== descriptor.nextVersion ||
    process.platform !== descriptor.platform ||
    process.arch !== descriptor.arch
  ) {
    fail('RUNTIME_IDENTITY_MISMATCH', 'Node/npm/Next platform identity differs from the artifact')
  }
  return { node: process.version, npm: npmVersion, next: nextVersion }
}

export async function verifyNoRuntimeEnvFiles(root = ROOT) {
  const forbidden = new Set(['.env', '.env.local', '.env.production', '.env.production.local'])
  const present = (await readdir(root)).filter(entry => forbidden.has(entry))
  if (present.length > 0) {
    fail(
      'UNBOUND_RUNTIME_ENV_PRESENT',
      `runtime environment files are not permitted in the fetched artifact: ${present.join(', ')}`
    )
  }
}

export async function verifyNextRouting(root = ROOT) {
  const source = await readFile(path.join(root, 'next.config.ts'), 'utf8')
  const unproven = findUnprovenNextRouting(source)
  if (unproven.length > 0) {
    fail('NEXT_ROUTING_UNPROVEN', `unproven Next routing functions: ${unproven.join(', ')}`)
  }
}

async function builtTextFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await builtTextFiles(absolute)))
    else if (entry.isFile() && /\.(?:css|js|json|html|txt)$/.test(entry.name)) files.push(absolute)
  }
  return files
}

export async function verifyBuiltPublicApiBinding(descriptor, root = ROOT) {
  const nextRoot = path.join(root, '.next')
  let files
  try {
    files = await builtTextFiles(nextRoot)
  } catch {
    fail(
      'BUILT_DESTINATION_PROOF_MISSING',
      'compiled Next output is unavailable for destination scan'
    )
  }
  let boundOccurrences = 0
  for (const filePath of files) {
    let source
    try {
      source = await readFile(filePath, 'utf8')
    } catch {
      fail('BUILT_DESTINATION_FILE_UNREADABLE', 'compiled destination input is unreadable')
    }
    boundOccurrences += source.split(descriptor.publicApiOrigin).length - 1
    const normalizedSource = source.replaceAll('\\/', '/')
    for (const match of normalizedSource.matchAll(/https?:\/\/[^\s"'`\\<>]+/gi)) {
      let origin
      try {
        origin = new URL(match[0]).origin
      } catch {
        fail('BUILT_DESTINATION_INVALID', 'compiled output contains an invalid HTTP destination')
      }
      if (!descriptor.allAllowedOrigins.includes(origin)) {
        fail(
          'BUILT_HTTP_DESTINATION_UNPROVEN',
          'compiled output contains a non-allowlisted HTTP destination'
        )
      }
    }
    for (const match of normalizedSource.matchAll(/wss?:\/\/[^\s"'`\\<>]+/gi)) {
      const websocket = new URL(match[0])
      const effectiveOrigin = `${websocket.protocol === 'wss:' ? 'https:' : 'http:'}//${websocket.host}`
      if (!descriptor.allAllowedOrigins.includes(effectiveOrigin)) {
        fail(
          'BUILT_WEBSOCKET_DESTINATION_UNPROVEN',
          'compiled output contains a non-allowlisted WebSocket destination'
        )
      }
    }
  }
  if (boundOccurrences === 0) {
    fail(
      'BUILT_PUBLIC_API_BINDING_MISSING',
      'compiled output does not contain the signed sandbox public API origin'
    )
  }
  return { scanned_files: files.length, bound_origin_occurrences: boundOccurrences }
}

export async function assertPortFree(host = '127.0.0.1', port = 3100) {
  await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.once('error', error => {
      reject(
        error?.code === 'EADDRINUSE'
          ? new Tier0SafetyError('PORT_OCCUPIED', `${host}:${port} is already occupied`)
          : error
      )
    })
    server.listen({ host, port, exclusive: true }, () => server.close(resolve))
  })
}

export async function fetchIdentity(descriptor, fetchImpl = fetch) {
  const chain = []
  let current = descriptor.identityURL
  let response
  for (let hop = 0; hop < 6; hop += 1) {
    assertAllowedURL(current, descriptor.backendAllowlist, `identity hop ${hop}`)
    chain.push(current)
    try {
      response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      fail('IDENTITY_UNREACHABLE', 'backend identity endpoint was unreachable')
    }
    if (response.status < 300 || response.status >= 400) break
    const location = response.headers.get('location')
    if (!location) fail('IDENTITY_REDIRECT_INVALID', 'identity redirect omitted Location')
    current = new URL(location, current).href
  }
  if (!response || (response.status >= 300 && response.status < 400)) {
    fail('IDENTITY_REDIRECT_LIMIT', 'identity redirect chain exceeded five hops')
  }
  validateRedirectChain(chain, descriptor.backendAllowlist)
  if (!response.ok)
    fail('IDENTITY_HEALTH_FAILED', `identity endpoint returned HTTP ${response.status}`)

  let raw
  try {
    raw = await response.json()
  } catch {
    fail('IDENTITY_PAYLOAD_INVALID', 'backend identity response was not valid JSON')
  }
  if (raw?.classification !== 'non-production') {
    fail('IDENTITY_NOT_NON_PRODUCTION', 'backend identity did not assert non-production')
  }
  if (raw?.deployment_id !== descriptor.deploymentId) {
    fail('IDENTITY_DEPLOYMENT_MISMATCH', 'backend deployment identity mismatch')
  }
  if (raw?.contract_version !== descriptor.contractVersion) {
    fail('IDENTITY_CONTRACT_MISMATCH', 'backend contract identity mismatch')
  }
  return { chain, status: response.status }
}

export async function runPreflight({
  descriptorPath,
  receiptPath,
  env = process.env,
  root = ROOT,
  fetchImpl = fetch,
}) {
  if (!descriptorPath) fail('DESCRIPTOR_PATH_MISSING', 'TIER0_ENV_DESCRIPTOR is required')
  if (!receiptPath) fail('RECEIPT_PATH_MISSING', 'TIER0_PREFLIGHT_RECEIPT is required')

  const startedAt = new Date().toISOString()
  const { descriptor, sha256: descriptorSha256 } = await loadEnvironmentDescriptor(descriptorPath)
  const descriptorAuthority = await verifyDescriptorAuthority(
    descriptorPath,
    env.TIER0_ENV_DESCRIPTOR_SIGNATURE,
    env.TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY,
    descriptor,
    {
      issuer: env.TIER0_TRUSTED_DESCRIPTOR_ISSUER,
      publicKeySha256: env.TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256,
    }
  )
  const fetchReceiptPath = env.TIER0_IMMUTABLE_FETCH_RECEIPT
  const fetchReceiptSha256 = await verifyImmutableFetchReceipt(descriptor, fetchReceiptPath, root)
  const boundRcsm = env.TIER0_RCSM_SHA256?.toLowerCase()
  if (!boundRcsm || boundRcsm !== descriptor.rcsmSha256) {
    fail('RCSM_BINDING_MISMATCH', 'TIER0_RCSM_SHA256 must exactly match the descriptor binding')
  }
  const publicApiOrigin = env.TIER0_BOUND_PUBLIC_API_ORIGIN
  if (
    !publicApiOrigin ||
    canonicalOrigin(publicApiOrigin, 'TIER0_BOUND_PUBLIC_API_ORIGIN') !== descriptor.publicApiOrigin
  ) {
    fail('BOUND_PUBLIC_API_MISMATCH', 'bound public API origin is absent or mismatched')
  }

  await verifyNoRuntimeEnvFiles(root)
  await verifyEvidenceSchema(root)
  await verifyNextRouting(root)
  const builtDestination = await verifyBuiltPublicApiBinding(descriptor, root)
  const build = await verifyBuildBinding(descriptor, root)
  const runtime = await verifyRuntime(descriptor)
  await assertPortFree()
  const browserVersion = await verifyBrowser()
  const identity = await fetchIdentity(descriptor, fetchImpl)
  const capabilities = capabilityState(env, descriptor)
  const receipt = {
    schema_version: 1,
    run_id: env.TIER0_RUN_ID || randomUUID(),
    status: 'READY',
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    descriptor_path: path.resolve(descriptorPath),
    descriptor_sha256: descriptorSha256,
    descriptor_authority: descriptorAuthority,
    registry_path: REGISTRY_PATH,
    registry_sha256: build.registrySha256,
    frontend_origin: descriptor.frontendOrigin,
    backend_origin: descriptor.backendOrigin,
    allowed_origins: {
      frontend: descriptor.frontendAllowlist,
      backend: descriptor.backendAllowlist,
    },
    environment: {
      name: descriptor.environmentName,
      deployment_id: descriptor.deploymentId,
      contract_version: descriptor.contractVersion,
    },
    artifact: {
      build_id: build.actualBuildId,
      rcsm_sha256: descriptor.rcsmSha256,
      runtime_input_sha256: descriptor.runtimeInputSha256,
      revision: descriptor.revision,
      source_tree_sha256: descriptor.sourceTreeSha256,
      fetch_receipt_path: path.resolve(fetchReceiptPath),
      fetch_receipt_sha256: fetchReceiptSha256,
    },
    browser: { version: browserVersion },
    runtime,
    identity: { redirect_hops: identity.chain.length - 1, http_status: identity.status },
    built_destination: builtDestination,
    capabilities,
  }
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  return receipt
}
