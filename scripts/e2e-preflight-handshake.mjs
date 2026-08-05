import { randomBytes, timingSafeEqual } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export const HANDSHAKE_FILE_VARIABLE = 'E2E_PREFLIGHT_HANDSHAKE_FILE'
export const HANDSHAKE_TOKEN_VARIABLE = 'E2E_PREFLIGHT_HANDSHAKE_TOKEN'
export const HANDSHAKE_VERIFIED_VARIABLE = 'E2E_PREFLIGHT_HANDSHAKE_VERIFIED'
export const HISTORICAL_SPP_COMMAND_VARIABLE = 'HISTORICAL_SPP_EXACT_COMMAND_VERIFIED'

const HANDSHAKE_VERSION = 1
const HANDSHAKE_MAX_AGE_MS = 60_000
const TOKEN_PATTERN = /^[a-f0-9]{64}$/
const CI_TRUE_VALUES = new Set(['1', 'true'])
const HISTORICAL_SPP_SPEC = 'e2e/historical-spp-analytics.spec.ts'
const HISTORICAL_SPP_OUTPUT_PATTERN =
  /^--output=(?:\.\.\/|\.\/)?\.omx\/ultragoal\/evidence\/story-128-27\/frontend\/test-results$/

function handshakeError() {
  return new Error(
    'Local Playwright runs require a fresh E2E preflight handshake. Run npm run test:e2e or npm run test:e2e:full.'
  )
}

function tokensMatch(left, right) {
  if (!TOKEN_PATTERN.test(left) || !TOKEN_PATTERN.test(right)) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function isCIEnvironment(environment = process.env) {
  return CI_TRUE_VALUES.has(
    String(environment.CI ?? '')
      .trim()
      .toLowerCase()
  )
}

export function isHistoricalSppExactCommand(args = process.argv) {
  const testIndex = args.lastIndexOf('test')
  if (testIndex === -1) return false

  const commandArgs = args.slice(testIndex + 1)
  return (
    commandArgs.length === 3 &&
    commandArgs[0] === HISTORICAL_SPP_SPEC &&
    commandArgs[1] === '--reporter=html' &&
    HISTORICAL_SPP_OUTPUT_PATTERN.test(commandArgs[2])
  )
}

export function establishHistoricalSppExecution(args = process.argv, environment = process.env) {
  if (isHistoricalSppExactCommand(args)) {
    environment[HISTORICAL_SPP_COMMAND_VARIABLE] = '1'
    return true
  }

  return (
    environment[HISTORICAL_SPP_COMMAND_VARIABLE] === '1' &&
    environment.TEST_WORKER_INDEX !== undefined
  )
}

export function requiresLocalE2EPreflight(args = process.argv, environment = process.env) {
  return !isCIEnvironment(environment) && !establishHistoricalSppExecution(args, environment)
}

export function assertPlaywrightDependenciesEnabled(args = process.argv) {
  if (args.some(argument => argument === '--no-deps' || argument.startsWith('--no-deps='))) {
    throw new Error(
      'Playwright --no-deps is not allowed because fresh authentication setup is required.'
    )
  }
}

export function assertLocalE2EPreflightHandshake({
  cwd = process.cwd(),
  environment = process.env,
  now = Date.now(),
} = {}) {
  const handshakeFile = environment[HANDSHAKE_FILE_VARIABLE]
  const handshakeToken = environment[HANDSHAKE_TOKEN_VARIABLE]
  if (!handshakeFile || !handshakeToken) throw handshakeError()
  const previouslyVerified = tokensMatch(
    environment[HANDSHAKE_VERIFIED_VARIABLE] ?? '',
    handshakeToken
  )

  const temporaryRoot = `${path.resolve(os.tmpdir())}${path.sep}`
  const resolvedFile = path.resolve(handshakeFile)
  if (
    !resolvedFile.startsWith(`${temporaryRoot}wb-e2e-preflight-`) ||
    path.basename(resolvedFile) !== 'handshake.json'
  ) {
    throw handshakeError()
  }

  let record
  try {
    const fileStats = lstatSync(resolvedFile)
    if (fileStats.isSymbolicLink() || !fileStats.isFile()) throw handshakeError()
    record = JSON.parse(readFileSync(resolvedFile, 'utf8'))
  } catch {
    throw handshakeError()
  }

  const age = now - record.createdAt
  if (
    record.version !== HANDSHAKE_VERSION ||
    path.resolve(record.cwd ?? '') !== path.resolve(cwd) ||
    !Number.isFinite(age) ||
    age < 0 ||
    (!previouslyVerified && age > HANDSHAKE_MAX_AGE_MS) ||
    !tokensMatch(record.token ?? '', handshakeToken)
  ) {
    throw handshakeError()
  }

  environment[HANDSHAKE_VERIFIED_VARIABLE] = handshakeToken
}

export async function createE2EPreflightHandshake(cwd = process.cwd()) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wb-e2e-preflight-'))
  const file = path.join(directory, 'handshake.json')
  const token = randomBytes(32).toString('hex')
  try {
    await writeFile(
      file,
      JSON.stringify({
        version: HANDSHAKE_VERSION,
        createdAt: Date.now(),
        cwd: path.resolve(cwd),
        token,
      }),
      { encoding: 'utf8', flag: 'wx', mode: 0o600 }
    )
  } catch (error) {
    await rm(directory, { recursive: true, force: true })
    throw error
  }

  return {
    environment: {
      [HANDSHAKE_FILE_VARIABLE]: file,
      [HANDSHAKE_TOKEN_VARIABLE]: token,
    },
    async cleanup() {
      await rm(directory, { recursive: true, force: true })
    },
  }
}
