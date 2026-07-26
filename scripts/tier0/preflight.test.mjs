import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import {
  chmod,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readlink,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  fetchIdentity,
  verifyDescriptorAuthority,
  verifyBuildBinding,
  verifyExtractedEntryManifest,
  verifyImmutableFetchReceipt,
  verifyBuiltPublicApiBinding,
  verifyNoRuntimeEnvFiles,
} from './preflight.mjs'
import { Tier0SafetyError, validateEnvironmentDescriptor } from './runtime-safety.mjs'

const hash = 'b'.repeat(64)
const descriptor = validateEnvironmentDescriptor({
  schema_version: 1,
  authority: { issuer: 'sandbox-runtime-operator', role: 'runtime-operator' },
  environment: { name: 'sandbox', classification: 'non-production' },
  allowed_origins: {
    frontend: ['http://127.0.0.1:3100'],
    backend: ['https://api.sandbox.example.test'],
  },
  frontend: { origin: 'http://127.0.0.1:3100' },
  backend: {
    origin: 'https://api.sandbox.example.test',
    identity_url: 'https://api.sandbox.example.test/identity',
    deployment_id: 'deploy-1',
    contract_version: 'v1',
  },
  artifact: {
    build_id: 'build-1',
    rcsm_sha256: hash,
    registry_sha256: createHash('sha256').update('{}\n').digest('hex'),
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
    public_api_origin: 'https://api.sandbox.example.test',
  },
})

async function rootFixture(buildId = 'build-1') {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-preflight-'))
  await mkdir(path.join(root, '.next'), { recursive: true })
  await mkdir(path.join(root, 'e2e/tier0'), { recursive: true })
  await writeFile(path.join(root, '.next/BUILD_ID'), `${buildId}\n`)
  await writeFile(path.join(root, 'e2e/tier0/tier0-row-registry.v1.json'), '{}\n')
  return root
}

test('build binding requires exact BUILD_ID', async () => {
  assert.equal((await verifyBuildBinding(descriptor, await rootFixture())).actualBuildId, 'build-1')
  const mismatchedRoot = await rootFixture('other-build')
  await assert.rejects(
    () => verifyBuildBinding(descriptor, mismatchedRoot),
    error => error instanceof Tier0SafetyError && error.code === 'BUILD_ID_MISMATCH'
  )
})

test('descriptor authority requires a fresh trusted Ed25519 signature', async () => {
  const proofRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-descriptor-authority-'))
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const publicKeyBytes = publicKey.export({ type: 'spki', format: 'pem' })
  const publicKeyPath = path.join(proofRoot, 'runtime-operator-public.pem')
  const descriptorPath = path.join(proofRoot, 'descriptor.json')
  const signaturePath = path.join(proofRoot, 'descriptor-signature.json')
  await writeFile(publicKeyPath, publicKeyBytes)
  const rawDescriptor = {
    schema_version: 1,
    authority: { issuer: 'sandbox-runtime-operator', role: 'runtime-operator' },
    environment: { name: 'sandbox', classification: 'non-production' },
    allowed_origins: {
      frontend: ['http://127.0.0.1:3100'],
      backend: ['https://api.sandbox.example.test'],
    },
    frontend: { origin: 'http://127.0.0.1:3100' },
    backend: {
      origin: 'https://api.sandbox.example.test',
      identity_url: 'https://api.sandbox.example.test/identity',
      deployment_id: 'deploy-1',
      contract_version: 'v1',
    },
    artifact: {
      build_id: 'build-1',
      rcsm_sha256: hash,
      registry_sha256: 'd'.repeat(64),
      package_sha256: 'e'.repeat(64),
      entry_manifest_sha256: 'f'.repeat(64),
      runtime_input_sha256: '1'.repeat(64),
      descriptor_public_key_sha256: createHash('sha256').update(publicKeyBytes).digest('hex'),
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
      public_api_origin: 'https://api.sandbox.example.test',
    },
  }
  const descriptorBytes = Buffer.from(`${JSON.stringify(rawDescriptor)}\n`)
  await writeFile(descriptorPath, descriptorBytes)
  await writeFile(
    signaturePath,
    `${JSON.stringify({
      schema_version: 1,
      algorithm: 'Ed25519',
      issuer: 'sandbox-runtime-operator',
      descriptor_sha256: createHash('sha256').update(descriptorBytes).digest('hex'),
      issued_at: new Date(Date.now() - 60_000).toISOString(),
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      signature_base64: sign(null, descriptorBytes, privateKey).toString('base64'),
    })}\n`
  )
  const validated = validateEnvironmentDescriptor(rawDescriptor)
  await assert.rejects(
    () => verifyDescriptorAuthority(descriptorPath, signaturePath, publicKeyPath, validated),
    error => error instanceof Tier0SafetyError && error.code === 'DESCRIPTOR_AUTHORITY_MISSING'
  )
  const authority = await verifyDescriptorAuthority(
    descriptorPath,
    signaturePath,
    publicKeyPath,
    validated,
    {
      issuer: 'sandbox-runtime-operator',
      publicKeySha256: createHash('sha256').update(publicKeyBytes).digest('hex'),
    }
  )
  assert.equal(authority.issuer, 'sandbox-runtime-operator')
  await writeFile(descriptorPath, Buffer.concat([descriptorBytes, Buffer.from(' ')]))
  await assert.rejects(
    () =>
      verifyDescriptorAuthority(descriptorPath, signaturePath, publicKeyPath, validated, {
        issuer: 'sandbox-runtime-operator',
        publicKeySha256: createHash('sha256').update(publicKeyBytes).digest('hex'),
      }),
    error => error instanceof Tier0SafetyError && error.code === 'DESCRIPTOR_AUTHORITY_MISMATCH'
  )
})

test('identity preflight checks every redirect and exact deployment contract', async () => {
  const responses = [
    new Response(null, { status: 302, headers: { location: '/identity-v1' } }),
    new Response(
      JSON.stringify({
        classification: 'non-production',
        deployment_id: 'deploy-1',
        contract_version: 'v1',
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    ),
  ]
  const result = await fetchIdentity(descriptor, async () => responses.shift())
  assert.equal(result.chain.length, 2)
})

test('identity preflight rejects a redirect outside the exact backend allowlist', async () => {
  await assert.rejects(
    () =>
      fetchIdentity(
        descriptor,
        async () =>
          new Response(null, {
            status: 302,
            headers: { location: 'https://evil.invalid/identity' },
          })
      ),
    error => error instanceof Tier0SafetyError && error.code === 'DESTINATION_NOT_ALLOWLISTED'
  )
})

test('fetched runtime rejects local environment files that could alter next start', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-env-'))
  await writeFile(path.join(root, '.env.local'), 'NEXT_PUBLIC_API_URL=https://unbound.invalid\n')
  await assert.rejects(
    () => verifyNoRuntimeEnvFiles(root),
    error => error instanceof Tier0SafetyError && error.code === 'UNBOUND_RUNTIME_ENV_PRESENT'
  )
})

test('compiled destination proof requires the signed backend origin and rejects production', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-built-origin-'))
  await mkdir(path.join(root, '.next/static'), { recursive: true })
  const chunk = path.join(root, '.next/static/app.js')
  await writeFile(chunk, `const api=${JSON.stringify(descriptor.publicApiOrigin)}`)
  assert.equal((await verifyBuiltPublicApiBinding(descriptor, root)).bound_origin_occurrences, 1)
  await writeFile(chunk, 'fetch("https://api.wildberries.ru/orders")')
  await assert.rejects(
    () => verifyBuiltPublicApiBinding(descriptor, root),
    error => error instanceof Tier0SafetyError && error.code === 'BUILT_HTTP_DESTINATION_UNPROVEN'
  )
  await writeFile(
    chunk,
    `const api=${JSON.stringify(descriptor.publicApiOrigin)}; fetch("https://evil.invalid/orders")`
  )
  await assert.rejects(
    () => verifyBuiltPublicApiBinding(descriptor, root),
    error => error instanceof Tier0SafetyError && error.code === 'BUILT_HTTP_DESTINATION_UNPROVEN'
  )

  await writeFile(chunk, `const api=${JSON.stringify(descriptor.publicApiOrigin)}`)
  await writeFile(
    path.join(root, '.next/static/app.css'),
    'body{background:url(https://evil.invalid/a.png)}'
  )
  await assert.rejects(
    () => verifyBuiltPublicApiBinding(descriptor, root),
    error => error instanceof Tier0SafetyError && error.code === 'BUILT_HTTP_DESTINATION_UNPROVEN'
  )

  await writeFile(path.join(root, '.next/static/app.css'), 'body{}')
  await chmod(chunk, 0o000)
  await assert.rejects(
    () => verifyBuiltPublicApiBinding(descriptor, root),
    error => error instanceof Tier0SafetyError && error.code === 'BUILT_DESTINATION_FILE_UNREADABLE'
  )
})

test('artifact manifest permits only symlinks that resolve inside the immutable root', async () => {
  const createArtifact = async target => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-symlink-'))
    await mkdir(path.join(root, '.next'))
    await mkdir(path.join(root, 'node_modules/.bin'), { recursive: true })
    await mkdir(path.join(root, 'public'))
    await mkdir(path.join(root, 'lib'))
    await writeFile(path.join(root, '.next/BUILD_ID'), 'build-1\n')
    await writeFile(path.join(root, 'next.config.ts'), 'export default {}\n')
    await writeFile(path.join(root, 'package-lock.json'), '{}\n')
    await writeFile(path.join(root, 'package.json'), '{}\n')
    await writeFile(path.join(root, 'lib/tool.js'), 'export {}\n')
    await symlink(target, path.join(root, 'node_modules/.bin/tool'))

    const entry = async relative => {
      const metadata = await lstat(path.join(root, relative))
      const mode = metadata.mode & 0o777
      if (metadata.isDirectory()) return { path: relative, type: 'directory', mode }
      if (metadata.isSymbolicLink()) {
        return {
          path: relative,
          type: 'symlink',
          mode,
          target: await readlink(path.join(root, relative)),
        }
      }
      return {
        path: relative,
        type: 'file',
        mode,
        sha256: createHash('sha256')
          .update(await readFile(path.join(root, relative)))
          .digest('hex'),
      }
    }
    const paths = [
      '.next',
      '.next/BUILD_ID',
      'lib',
      'lib/tool.js',
      'next.config.ts',
      'node_modules',
      'node_modules/.bin',
      'node_modules/.bin/tool',
      'package-lock.json',
      'package.json',
      'public',
    ]
    const manifestPath = `${root}-entry-manifest.json`
    await writeFile(
      manifestPath,
      `${JSON.stringify({ schema_version: 1, entries: await Promise.all(paths.map(entry)) })}\n`
    )
    return { root, manifestPath }
  }

  const internal = await createArtifact('../../lib/tool.js')
  await verifyExtractedEntryManifest(internal.root, internal.manifestPath)

  const escaping = await createArtifact('../../../../outside.js')
  await assert.rejects(
    () => verifyExtractedEntryManifest(escaping.root, escaping.manifestPath),
    error => error instanceof Tier0SafetyError && error.code === 'ENTRY_MANIFEST_SYMLINK_ESCAPE'
  )

  const absolute = await createArtifact('/tmp/tier0-external-tool.js')
  await assert.rejects(
    () => verifyExtractedEntryManifest(absolute.root, absolute.manifestPath),
    error => error instanceof Tier0SafetyError && error.code === 'ENTRY_MANIFEST_SYMLINK_ESCAPE'
  )
})

test('immutable fetch receipt binds exact bytes and forbids reconstruction fallback', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tier0-fetch-'))
  const proofRoot = await mkdtemp(path.join(os.tmpdir(), 'tier0-fetch-proof-'))
  const receiptPath = path.join(proofRoot, 'fetch-receipt.json')
  const packagePath = path.join(proofRoot, 'fetched-package.bin')
  const entryManifestPath = path.join(proofRoot, 'entry-manifest.json')
  const runtimeInputManifestPath = path.join(proofRoot, 'runtime-input.json')
  await writeFile(packagePath, 'package-bytes')
  await mkdir(path.join(root, '.next'))
  await mkdir(path.join(root, 'node_modules'))
  await mkdir(path.join(root, 'public'))
  await writeFile(path.join(root, '.next/BUILD_ID'), 'build-1\n')
  await writeFile(path.join(root, 'next.config.ts'), 'export default {}\n')
  await writeFile(path.join(root, 'package-lock.json'), '{}\n')
  await writeFile(path.join(root, 'package.json'), '{}\n')
  const fileEntry = async relative => ({
    path: relative,
    type: 'file',
    mode: (await stat(path.join(root, relative))).mode & 0o777,
    sha256: createHash('sha256')
      .update(await readFile(path.join(root, relative)))
      .digest('hex'),
  })
  const directoryEntry = async relative => ({
    path: relative,
    type: 'directory',
    mode: (await stat(path.join(root, relative))).mode & 0o777,
  })
  const entryManifest = {
    schema_version: 1,
    entries: [
      await directoryEntry('.next'),
      await fileEntry('.next/BUILD_ID'),
      await fileEntry('next.config.ts'),
      await directoryEntry('node_modules'),
      await fileEntry('package-lock.json'),
      await fileEntry('package.json'),
      await directoryEntry('public'),
    ],
  }
  const entryManifestBytes = `${JSON.stringify(entryManifest)}\n`
  await writeFile(entryManifestPath, entryManifestBytes)
  const runtimeInputBytes = `${JSON.stringify({
    schema_version: 1,
    build_id: descriptor.buildId,
    registry_sha256: descriptor.registrySha256,
    public_api_origin: descriptor.publicApiOrigin,
    platform: descriptor.platform,
    arch: descriptor.arch,
    node_version: descriptor.nodeVersion,
    npm_version: descriptor.npmVersion,
    next_version: descriptor.nextVersion,
    descriptor_public_key_sha256: descriptor.descriptorPublicKeySha256,
    revision: descriptor.revision,
    source_tree_sha256: descriptor.sourceTreeSha256,
  })}\n`
  await writeFile(runtimeInputManifestPath, runtimeInputBytes)
  const boundDescriptor = {
    ...descriptor,
    packageSha256: createHash('sha256').update('package-bytes').digest('hex'),
    entryManifestSha256: createHash('sha256').update(entryManifestBytes).digest('hex'),
    runtimeInputSha256: createHash('sha256').update(runtimeInputBytes).digest('hex'),
  }
  const receipt = {
    schema_version: 1,
    rcsm_sha256: boundDescriptor.rcsmSha256,
    package_sha256: boundDescriptor.packageSha256,
    entry_manifest_sha256: boundDescriptor.entryManifestSha256,
    runtime_input_sha256: boundDescriptor.runtimeInputSha256,
    object_version_id: boundDescriptor.objectVersionId,
    build_id: boundDescriptor.buildId,
    registry_sha256: boundDescriptor.registrySha256,
    retrieval_locator: boundDescriptor.retrievalLocator,
    retention_until: boundDescriptor.retentionUntil,
    public_api_origin: boundDescriptor.publicApiOrigin,
    platform: boundDescriptor.platform,
    arch: boundDescriptor.arch,
    node_version: boundDescriptor.nodeVersion,
    npm_version: boundDescriptor.npmVersion,
    next_version: boundDescriptor.nextVersion,
    descriptor_public_key_sha256: boundDescriptor.descriptorPublicKeySha256,
    revision: boundDescriptor.revision,
    source_tree_sha256: boundDescriptor.sourceTreeSha256,
    package_path: packagePath,
    entry_manifest_path: entryManifestPath,
    runtime_input_manifest_path: runtimeInputManifestPath,
    artifact_root: root,
    read_only_fetch: true,
    verified_before_extraction: true,
    reconstruction_performed: false,
    entry_manifest_verified: true,
    runtime_identity_verified: true,
    public_api_origin_verified: true,
    retention_verified_at_fetch: true,
  }
  await writeFile(receiptPath, `${JSON.stringify(receipt)}\n`, { mode: 0o600 })
  assert.match(
    await verifyImmutableFetchReceipt(boundDescriptor, receiptPath, root),
    /^[a-f0-9]{64}$/
  )
  receipt.reconstruction_performed = true
  const unsafePath = path.join(proofRoot, 'unsafe-fetch-receipt.json')
  await writeFile(unsafePath, `${JSON.stringify(receipt)}\n`, { mode: 0o600 })
  await assert.rejects(
    () => verifyImmutableFetchReceipt(boundDescriptor, unsafePath, root),
    error => error instanceof Tier0SafetyError && error.code === 'IMMUTABLE_FETCH_NOT_PROVEN'
  )
})
