import { spawn } from 'node:child_process'
import { readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'

import networkPolicy from '../test-utils/network-policy.json' with { type: 'json' }
import {
  createE2EPreflightHandshake,
  HANDSHAKE_FILE_VARIABLE,
  HANDSHAKE_TOKEN_VARIABLE,
  HANDSHAKE_VERIFIED_VARIABLE,
} from './e2e-preflight-handshake.mjs'

const require = createRequire(import.meta.url)
const { isMutatingE2EEnabled } = require('../e2e/fixtures/mutation-guard.ts')

export const REQUIRED_E2E_VARIABLES = [
  'E2E_BASE_URL',
  'E2E_API_URL',
  'E2E_TEST_EMAIL',
  'E2E_TEST_PASSWORD',
]

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const ALLOWED_PROTOCOLS = new Set(
  networkPolicy.allowedProtocols.filter(protocol => protocol === 'http:' || protocol === 'https:')
)
const SERVICE_CONFIGURATION = [
  { label: 'Frontend', variable: 'E2E_BASE_URL', port: '3100', path: '/login' },
  { label: 'Backend', variable: 'E2E_API_URL', port: '3000', path: '/v1/health' },
]

export const E2E_PREFLIGHT_HELP = `Local E2E preflight

Usage:
  node scripts/e2e-preflight.mjs [--full] [--check-only] [-- PLAYWRIGHT_ARGS...]

Modes:
  default       Check localhost prerequisites, refresh auth state, then run
                npx playwright test e2e/orders.spec.ts --project=chromium
  --full        Check prerequisites, refresh auth state, then run the full suite
  --check-only  Check prerequisites and print the exact next command
  --help, -h    Show this help

Setup: copy .env.e2e.example to .env.e2e and follow e2e/README.md.`

function normalizeHostname(hostname) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '')
}

function parseEnvironmentFile(source) {
  // Node's parseEnv treats a whitespace-only unquoted assignment as a
  // continuation. Normalize that one case so blank-value validation is exact.
  const normalized = source.replace(/^(\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=)[ \t]+$/gm, '$1')
  return parseEnv(normalized)
}

function validateServiceUrl(value, service) {
  let url
  try {
    url = new URL(value)
  } catch {
    return { error: `${service.variable} must be a valid localhost URL.` }
  }

  const hostname = normalizeHostname(url.hostname)
  if (
    !ALLOWED_PROTOCOLS.has(url.protocol) ||
    !LOOPBACK_HOSTS.has(hostname) ||
    url.username !== '' ||
    url.password !== '' ||
    url.port !== service.port ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    return {
      error: `${service.variable} must be an uncredentialed HTTP(S) loopback origin on port ${service.port}.`,
    }
  }
  return { url }
}

function parseArguments(args) {
  const separator = args.indexOf('--')
  const preflightArgs = separator === -1 ? args : args.slice(0, separator)
  const playwrightArgs = separator === -1 ? [] : args.slice(separator + 1)
  const unknown = preflightArgs.filter(
    argument => !['--full', '--check-only', '--help', '-h'].includes(argument)
  )
  if (unknown.length > 0) {
    return { error: `Unknown preflight option: ${unknown[0]}` }
  }
  if (playwrightArgs.includes('--no-deps')) {
    return {
      error: 'Playwright --no-deps is not allowed because authentication setup is required.',
    }
  }
  return {
    checkOnly: preflightArgs.includes('--check-only'),
    full: preflightArgs.includes('--full'),
    help: preflightArgs.some(argument => argument === '--help' || argument === '-h'),
    playwrightArgs,
  }
}

function commandFor({ full, playwrightArgs }) {
  const args = ['playwright', 'test']
  if (!full) args.push('e2e/orders.spec.ts', '--project=chromium')
  args.push(...playwrightArgs)
  return { command: 'npx', args }
}

function printableCommand(command) {
  return [command.command, ...command.args].join(' ')
}

async function probeService(service, url, fetchFn, timeoutMs) {
  const endpoint = new URL(service.path, url)
  try {
    const response = await fetchFn(endpoint, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (response.status >= 300 && response.status < 400) {
      return `${service.label} redirect rejected; expected a healthy localhost response.`
    }
    if (!response.ok) {
      return `${service.label} unavailable (HTTP ${response.status}).`
    }
    return null
  } catch (error) {
    const timedOut = error?.name === 'AbortError' || error?.name === 'TimeoutError'
    return timedOut
      ? `${service.label} probe timed out.`
      : `${service.label} unavailable; start it on localhost port ${service.port}.`
  }
}

function baseResult(overrides = {}) {
  return {
    exitCode: 1,
    errors: [],
    launched: false,
    mutationsEnabled: false,
    ...overrides,
  }
}

function missingVariablesMessage(location, variables) {
  return `Missing or blank variables in ${location}: ${variables.join(', ')}. Copy values from .env.e2e.example and follow e2e/README.md.`
}

export async function runE2EPreflight({
  cwd = process.cwd(),
  args = [],
  environment = process.env,
  createHandshake = createE2EPreflightHandshake,
  fetchFn = fetch,
  removeFile = file => rm(file, { force: true }),
  runCommand = spawnCommand,
  timeoutMs = 5_000,
  writeStdout = message => process.stdout.write(`${message}\n`),
  writeStderr = message => process.stderr.write(`${message}\n`),
} = {}) {
  const parsedArguments = parseArguments(args)
  if (parsedArguments.error) {
    writeStderr(parsedArguments.error)
    return baseResult({ errors: [parsedArguments.error] })
  }
  if (parsedArguments.help) {
    writeStdout(E2E_PREFLIGHT_HELP)
    return baseResult({ exitCode: 0 })
  }

  const environmentFile = path.join(cwd, '.env.e2e')
  let fileEnvironment
  try {
    fileEnvironment = parseEnvironmentFile(await readFile(environmentFile, 'utf8'))
  } catch (error) {
    const message =
      error?.code === 'ENOENT'
        ? `Missing .env.e2e with required variables: ${REQUIRED_E2E_VARIABLES.join(', ')}. Run: cp .env.e2e.example .env.e2e, then follow e2e/README.md.`
        : 'Unable to read .env.e2e; check its local file permissions and format.'
    writeStderr(message)
    return baseResult({ errors: [message] })
  }

  const missing = REQUIRED_E2E_VARIABLES.filter(
    variable => !String(fileEnvironment[variable] ?? '').trim()
  )
  const configurationErrors = []
  if (missing.length > 0) {
    configurationErrors.push(missingVariablesMessage('.env.e2e', missing))
  }

  const effectiveEnvironment = { ...fileEnvironment, ...environment }
  const missingEffective = REQUIRED_E2E_VARIABLES.filter(
    variable => !String(effectiveEnvironment[variable] ?? '').trim()
  )
  if (missingEffective.length > 0) {
    configurationErrors.push(
      missingVariablesMessage('the effective E2E environment', missingEffective)
    )
  }
  const serviceUrls = new Map()
  if (missing.length === 0 && missingEffective.length === 0) {
    for (const service of SERVICE_CONFIGURATION) {
      const validation = validateServiceUrl(effectiveEnvironment[service.variable], service)
      if (validation.error) configurationErrors.push(validation.error)
      else serviceUrls.set(service.variable, validation.url)
    }
  }
  if (configurationErrors.length > 0) {
    configurationErrors.forEach(writeStderr)
    return baseResult({ errors: configurationErrors })
  }

  const managerEmail = String(effectiveEnvironment.E2E_MANAGER_EMAIL ?? '').trim()
  const managerPassword = String(effectiveEnvironment.E2E_MANAGER_PASSWORD ?? '').trim()
  if (Boolean(managerEmail) !== Boolean(managerPassword)) {
    const missingManagerVariable = managerEmail ? 'E2E_MANAGER_PASSWORD' : 'E2E_MANAGER_EMAIL'
    writeStdout(
      `Manager coverage will skip: optional credential pair is incomplete (${missingManagerVariable} is blank).`
    )
  } else if (!managerEmail) {
    writeStdout('Manager coverage will skip: optional Manager credentials are not configured.')
  }

  const mutationsEnabled = isMutatingE2EEnabled(effectiveEnvironment)
  writeStdout(
    mutationsEnabled
      ? 'E2E mode: MUTATIONS ENABLED for the acknowledged sandbox target.'
      : 'E2E mode: READ-ONLY; @mutating tests remain excluded.'
  )

  const probeErrors = (
    await Promise.all(
      SERVICE_CONFIGURATION.map(service =>
        probeService(service, serviceUrls.get(service.variable), fetchFn, timeoutMs)
      )
    )
  ).filter(Boolean)
  if (probeErrors.length > 0) {
    probeErrors.forEach(writeStderr)
    return baseResult({ errors: probeErrors, mutationsEnabled })
  }

  const command = commandFor(parsedArguments)
  if (parsedArguments.checkOnly) {
    const nextCommand = parsedArguments.full ? 'npm run test:e2e:full' : 'npm run test:e2e'
    writeStdout(`Preflight passed. Next safe command: ${nextCommand}`)
    return baseResult({ exitCode: 0, mutationsEnabled, command })
  }

  // Auth-state files (e2e/.auth/{user,manager}.json) are NOT removed here.
  // The auth setup (e2e/auth.setup.ts, e2e/auth-manager.setup.ts) overwrites
  // them atomically every run (temp + rename), so freshness is preserved
  // without a preflight rm. The rm previously opened a storageState ENOENT
  // race under concurrent invocations + --repeat-each: Playwright reads
  // `storageState: '<path>'` lazily per newContext(), so one run's preflight
  // rm could delete the file mid-read during another run's chromium phase.
  // Leave any stale auth files in place; the setup supersedes them atomically.
  // removeFile is retained as a dependency-injection seam for the test harness.
  writeStdout(`Preflight passed. Launching: ${printableCommand(command)}`)
  let handshake
  let child
  let launchError
  try {
    handshake = await createHandshake(cwd)
    const childEnvironment = { ...effectiveEnvironment }
    delete childEnvironment.E2E_PREFLIGHT_PASSED
    delete childEnvironment[HANDSHAKE_FILE_VARIABLE]
    delete childEnvironment[HANDSHAKE_TOKEN_VARIABLE]
    delete childEnvironment[HANDSHAKE_VERIFIED_VARIABLE]
    Object.assign(childEnvironment, handshake.environment)
    child = await runCommand(command.command, command.args, {
      cwd,
      env: childEnvironment,
    })
  } catch {
    launchError = 'Unable to create or execute the local E2E preflight handshake.'
    writeStderr(launchError)
  }

  const childExitCode = child ? (child.code ?? signalExitCode(child.signal)) : null
  const errors = launchError ? [launchError] : []
  if (childExitCode !== null && childExitCode !== 0) {
    const message = `Playwright exited non-zero (${childExitCode}).`
    writeStderr(message)
    errors.push(message)
  }

  let cleanupFailed = false
  if (handshake) {
    try {
      await handshake.cleanup()
    } catch {
      cleanupFailed = true
      const message = 'Unable to clean up the temporary E2E preflight handshake.'
      writeStderr(message)
      errors.push(message)
    }
  }

  if (launchError) return baseResult({ errors, mutationsEnabled })
  const exitCode = childExitCode === 0 && cleanupFailed ? 1 : childExitCode
  return baseResult({
    exitCode,
    launched: true,
    mutationsEnabled,
    command,
    errors,
  })
}

function signalExitCode(signal) {
  return signal && os.constants.signals[signal] ? 128 + os.constants.signals[signal] : 1
}

function spawnCommand(command, args, options) {
  return new Promise(resolve => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' })
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP']
    const forwarders = new Map(signals.map(signal => [signal, () => child.kill(signal)]))
    for (const [signal, forward] of forwarders) process.once(signal, forward)
    const finish = (code, signal) => {
      for (const [name, forward] of forwarders) process.off(name, forward)
      resolve({ code, signal })
    }
    child.once('error', () => finish(1, null))
    child.once('exit', finish)
  })
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isCli) {
  const result = await runE2EPreflight({ args: process.argv.slice(2) })
  process.exitCode = result.exitCode
}
