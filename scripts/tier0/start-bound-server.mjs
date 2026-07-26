#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { finished } from 'node:stream/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  assertPortFree,
  verifyBuildBinding,
  verifyBuiltPublicApiBinding,
  verifyDescriptorAuthority,
  verifyImmutableFetchReceipt,
  verifyNextRouting,
  verifyNoRuntimeEnvFiles,
  verifyRuntime,
} from './preflight.mjs'
import {
  declaredTier0SecretEntries,
  loadEnvironmentDescriptor,
  redactTier0EvidenceText,
} from './runtime-safety.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function buildBoundServerChildEnv(env = process.env) {
  const childEnv = {}
  for (const key of ['PATH', 'HOME', 'TMPDIR']) {
    if (typeof env[key] === 'string' && env[key] !== '') childEnv[key] = env[key]
  }
  childEnv.NODE_ENV = 'production'
  childEnv.NEXT_TELEMETRY_DISABLED = '1'
  return childEnv
}

export function createSanitizedLineWriter(write, prefix, declaredSecrets = []) {
  let pending = ''
  const emit = line => write(`${prefix}${redactTier0EvidenceText(line, declaredSecrets)}`)
  return {
    write(chunk) {
      pending += chunk.toString('utf8')
      let newlineIndex = pending.indexOf('\n')
      while (newlineIndex >= 0) {
        emit(pending.slice(0, newlineIndex + 1))
        pending = pending.slice(newlineIndex + 1)
        newlineIndex = pending.indexOf('\n')
      }
    },
    flush() {
      if (pending) emit(pending)
      pending = ''
    },
  }
}

function declaredSecretValues(env) {
  return declaredTier0SecretEntries(env).map(({ value }) => value)
}

export async function startBoundServer(env = process.env) {
  const receiptPath = env.TIER0_PREFLIGHT_RECEIPT
  const identityPath = env.TIER0_SERVER_IDENTITY
  const serverLogPath = env.TIER0_SERVER_LOG
  if (!receiptPath || !identityPath || !serverLogPath) {
    throw new Error('Bound Tier-0 server requires preflight receipt, identity, and log paths')
  }

  const receiptBytes = await readFile(receiptPath)
  const receiptSha256 = createHash('sha256').update(receiptBytes).digest('hex')
  const receipt = JSON.parse(receiptBytes.toString('utf8'))
  const receiptStat = await stat(receiptPath)
  const receiptExpiry = Date.parse(receipt.expires_at)
  if (
    receipt.status !== 'READY' ||
    !Number.isFinite(receiptExpiry) ||
    receiptExpiry <= Date.now()
  ) {
    throw new Error('Bound Tier-0 server refused an invalid or expired preflight receipt')
  }
  if (env.TIER0_EXPECTED_PREFLIGHT_RECEIPT_SHA256 !== receiptSha256) {
    throw new Error('Bound Tier-0 server refused a substituted preflight receipt')
  }
  if (receiptStat.mode & 0o077) {
    throw new Error('Bound Tier-0 server refused a non-private preflight receipt')
  }
  const loadedDescriptor = await loadEnvironmentDescriptor(receipt.descriptor_path)
  if (loadedDescriptor.sha256 !== receipt.descriptor_sha256) {
    throw new Error('Bound Tier-0 server refused a changed environment descriptor')
  }
  const descriptor = loadedDescriptor.descriptor
  const descriptorAuthority = await verifyDescriptorAuthority(
    receipt.descriptor_path,
    receipt.descriptor_authority?.signature_path,
    receipt.descriptor_authority?.public_key_path,
    descriptor,
    {
      issuer: env.TIER0_TRUSTED_DESCRIPTOR_ISSUER,
      publicKeySha256: env.TIER0_TRUSTED_DESCRIPTOR_PUBLIC_KEY_SHA256,
    }
  )
  if (
    descriptorAuthority.signature_sha256 !== receipt.descriptor_authority?.signature_sha256 ||
    descriptorAuthority.public_key_sha256 !== receipt.descriptor_authority?.public_key_sha256 ||
    descriptorAuthority.trusted_issuer !== receipt.descriptor_authority?.trusted_issuer ||
    descriptorAuthority.pinned_public_key_sha256 !==
      receipt.descriptor_authority?.pinned_public_key_sha256 ||
    descriptor.rcsmSha256 !== receipt.artifact?.rcsm_sha256 ||
    (await verifyImmutableFetchReceipt(descriptor, receipt.artifact?.fetch_receipt_path, ROOT)) !==
      receipt.artifact?.fetch_receipt_sha256
  ) {
    throw new Error('Bound Tier-0 server refused a changed immutable fetch binding')
  }
  await verifyNoRuntimeEnvFiles(ROOT)
  await verifyNextRouting(ROOT)
  await verifyBuiltPublicApiBinding(descriptor, ROOT)
  await verifyBuildBinding(descriptor, ROOT)
  await verifyRuntime(descriptor)
  const buildId = (await readFile(path.join(ROOT, '.next/BUILD_ID'), 'utf8')).trim()
  if (buildId !== receipt.artifact?.build_id) {
    throw new Error('Bound Tier-0 server refused a mismatched BUILD_ID')
  }
  await assertPortFree('127.0.0.1', 3100)

  const nextBin = path.join(ROOT, 'node_modules/next/dist/bin/next')
  const startedAt = new Date().toISOString()
  const child = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', '3100'], {
    cwd: ROOT,
    env: buildBoundServerChildEnv(env),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!child.pid) throw new Error('Bound Tier-0 server failed to obtain a child PID')

  const serverLog = createWriteStream(serverLogPath, { flags: 'wx', mode: 0o600 })
  const declaredSecrets = declaredSecretValues(env)
  const stdout = createSanitizedLineWriter(
    chunk => serverLog.write(chunk),
    '[stdout] ',
    declaredSecrets
  )
  const stderr = createSanitizedLineWriter(
    chunk => serverLog.write(chunk),
    '[stderr] ',
    declaredSecrets
  )
  child.stdout.on('data', chunk => stdout.write(chunk))
  child.stderr.on('data', chunk => stderr.write(chunk))

  await writeFile(
    identityPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        wrapper_pid: process.pid,
        server_pid: child.pid,
        started_at: startedAt,
        host: '127.0.0.1',
        port: 3100,
        build_id: buildId,
        rcsm_sha256: receipt.artifact.rcsm_sha256,
        preflight_receipt_sha256: createHash('sha256').update(receiptBytes).digest('hex'),
      },
      null,
      2
    )}\n`,
    { flag: 'wx', mode: 0o600 }
  )

  const forward = signal => {
    if (!child.killed) child.kill(signal)
  }
  process.once('SIGTERM', () => forward('SIGTERM'))
  process.once('SIGINT', () => forward('SIGINT'))

  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve(signal ? 1 : (code ?? 1)))
  })
  stdout.flush()
  stderr.flush()
  serverLog.end()
  await finished(serverLog)
  return exitCode
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = await startBoundServer()
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ status: 'SERVER_RUNNER_FAILURE', message: error.message })}\n`
    )
    process.exitCode = 1
  }
}
