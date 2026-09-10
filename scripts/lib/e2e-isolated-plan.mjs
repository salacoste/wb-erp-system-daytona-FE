import { existsSync as defaultExists } from 'node:fs'

/**
 * Pure planning logic for scripts/run-e2e-isolated.mjs (restart-per-run e2e
 * protocol: tmp worktree + own dev server per run). No side effects here —
 * the orchestrator executes these plans. Protocol canon: handoff FINAL §8,
 * ORCHESTRATOR-PROMPT V10 §L111 / V18 §L101,
 * debt-p3-cabinet-browser-02-repin.md (live precedent).
 */

export const PM2_PROC_NAME = 'wb-repricer-frontend-dev'
export const E2E_PORT = '3100'
export const RESTORE_VERIFY_URL = `http://localhost:${E2E_PORT}/login`
export const DEV_COMMAND = ['npx', 'next', 'dev', '--webpack', '-p', E2E_PORT]

const USAGE = `Usage: node scripts/run-e2e-isolated.mjs [--base <sha>] [--worktree-dir <path>]
       [--keep-worktree] [--ready-timeout-seconds <n>] [-- PLAYWRIGHT_ARGS...]`

const KNOWN_FLAGS = new Set(['--base', '--worktree-dir', '--keep-worktree', '--ready-timeout-seconds'])

/**
 * Pin seams (precedent STORY_174_3_NPM_CLI): env-overridable command names so
 * tests and hardened environments can redirect tool lookups.
 */
export function resolvePins(env = process.env) {
  return {
    pm2: env.RUN_E2E_ISOLATED_PM2 ?? 'pm2',
    lsof: env.RUN_E2E_ISOLATED_LSOF ?? 'lsof',
    git: env.RUN_E2E_ISOLATED_GIT ?? 'git',
  }
}

export function parseIsolatedArgv(argv, { defaultBase, defaultWorktreeDir }) {
  const separator = argv.indexOf('--')
  const flagArgs = separator === -1 ? [...argv] : argv.slice(0, separator)
  const forwarded = separator === -1 ? [] : argv.slice(separator + 1)

  const parsed = {
    base: defaultBase,
    worktreeDir: defaultWorktreeDir,
    keepWorktree: false,
    readyTimeoutSeconds: 180,
    forwarded,
  }

  for (let index = 0; index < flagArgs.length; index += 1) {
    const arg = flagArgs[index]
    const [flag, inlineValue] = splitInline(arg)
    if (!KNOWN_FLAGS.has(flag)) {
      throw new Error(`Unknown flag: ${arg}\n${USAGE}`)
    }
    if (flag === '--keep-worktree') {
      parsed.keepWorktree = true
      continue
    }
    const value = inlineValue ?? flagArgs[++index]
    if (value === undefined) {
      throw new Error(`Missing value for ${flag}\n${USAGE}`)
    }
    if (flag === '--base') parsed.base = value
    if (flag === '--worktree-dir') parsed.worktreeDir = value
    if (flag === '--ready-timeout-seconds') {
      const seconds = Number(value)
      if (!Number.isInteger(seconds) || seconds <= 0) {
        throw new Error(`Invalid --ready-timeout-seconds: ${value}\n${USAGE}`)
      }
      parsed.readyTimeoutSeconds = seconds
    }
  }

  return parsed
}

function splitInline(arg) {
  const equals = arg.indexOf('=')
  if (equals === -1) return [arg, undefined]
  return [arg.slice(0, equals), arg.slice(equals + 1)]
}

/**
 * Classify who owns :3100 before any state change.
 * 'foreign' blocks the run; 'free' is allowed (swap stop becomes a no-op).
 */
export function classifyPort3100({ pm2Pid, listenerPids }) {
  if (listenerPids.length === 0) return 'free'
  if (pm2Pid !== null && listenerPids.some(pid => pid === String(pm2Pid))) return 'pm2-owned'
  return 'foreign'
}

const DEFAULT_PINS = { ...resolvePins({}), npm: 'npm' }

/**
 * Build the ordered execution plan. Fail-closed: throws ONE Error whose
 * message lists ALL problems, newline-joined, before anything is returned.
 * `exists` is the injected existence probe (purity seam for tests).
 */
export function buildPlan({
  base,
  worktreeDir,
  primaryRoot,
  envFiles,
  pm2ProcName,
  pm2ProcNames = [],
  portState,
  readyTimeoutSeconds,
  exists = defaultExists,
  pins = DEFAULT_PINS,
}) {
  const problems = []
  if (exists(worktreeDir)) {
    problems.push(`Refusing to provision: worktree path already exists: ${worktreeDir}`)
  }
  for (const envFile of envFiles) {
    if (!exists(`${primaryRoot}/${envFile}`)) {
      problems.push(`Missing env file in primary checkout: ${primaryRoot}/${envFile}`)
    }
  }
  if (!pm2ProcNames.includes(pm2ProcName)) {
    problems.push(
      `PM2 process not found: ${pm2ProcName}. Without it the swap cannot guarantee restore.`
    )
  }
  if (portState === 'foreign') {
    problems.push(
      `Port ${E2E_PORT} is in state 'foreign' (held by a non-PM2 process); aborting before any state change.`
    )
  }
  if (problems.length > 0) {
    throw new Error(problems.join('\n'))
  }

  const provisionCommands = [
    [pins.git, 'worktree', 'add', '--detach', worktreeDir, base],
    ['ln', '-s', `${primaryRoot}/node_modules`, `${worktreeDir}/node_modules`],
    ...envFiles.map(envFile => ['cp', `${primaryRoot}/${envFile}`, `${worktreeDir}/${envFile}`]),
  ]

  const portOwned = portState === 'pm2-owned'

  return [
    { phase: 'provision', commands: provisionCommands },
    {
      phase: 'swap',
      commands: portOwned ? [[pins.pm2, 'stop', pm2ProcName]] : [],
      stopIsNoOp: !portOwned,
      portFreePollSeconds: 15,
      devCommand: DEV_COMMAND,
      devLogPath: `${worktreeDir}/.e2e-isolated-dev.log`,
      readinessUrl: RESTORE_VERIFY_URL,
      readyTimeoutSeconds,
    },
    { phase: 'run', commands: [[DEFAULT_PINS.npm, 'run', 'test:e2e:full', '--']], cwd: worktreeDir },
    {
      phase: 'restore',
      commands: [[pins.pm2, 'restart', pm2ProcName]],
      verify: { url: RESTORE_VERIFY_URL, expectedStatus: 200, timeoutSeconds: 60 },
    },
    {
      phase: 'cleanup',
      commands: [
        [pins.git, 'worktree', 'remove', '--force', worktreeDir],
        [pins.git, 'worktree', 'prune'],
      ],
    },
  ]
}

/**
 * The teardown invariant, as ordered data: stop-dev-kill → pm2-restart →
 * restore-verify (HTTP poll) → worktree removal (skippable) → artifacts
 * cleanup. Restore MUST precede worktree removal.
 */
export function teardownSteps({ keepWorktree, worktreeDir }) {
  const steps = [
    { step: 'stop-dev-kill', signals: ['SIGTERM', 'SIGKILL'], graceMs: 5000 },
    { step: 'pm2-restart', command: ['pm2', 'restart', PM2_PROC_NAME], mandatory: true },
    {
      step: 'restore-verify',
      url: RESTORE_VERIFY_URL,
      expectedStatus: 200,
      timeoutSeconds: 60,
    },
  ]
  if (!keepWorktree) {
    steps.push({
      step: 'worktree-remove',
      commands: [
        ['git', 'worktree', 'remove', '--force', worktreeDir],
        ['git', 'worktree', 'prune'],
      ],
      fallback: 'fs.rmSync(recursive, force) — symlink is unlinked, not followed',
    })
  }
  steps.push({
    step: 'artifacts-cleanup',
    paths: ['e2e/.auth', 'test-results', 'playwright-report'],
    relativeTo: worktreeDir,
  })
  return steps
}
