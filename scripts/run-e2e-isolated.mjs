#!/usr/bin/env node

/**
 * Isolated restart-per-run E2E orchestrator: tmp worktree + own dev server on
 * :3100 per run, with a guaranteed PM2 restore. Generalizes the documented
 * protocol (handoff FINAL §8; ORCHESTRATOR-PROMPT V10 §L111 / V18 §L101;
 * live precedent debt-p3-cabinet-browser-02-repin.md) into executable form.
 * Composes scripts/e2e-preflight.mjs via `npm run test:e2e:full` (read-only
 * reference; never modified). Pure planning + injected-seam execution units
 * (executeTeardown, killProcessGroup) live in scripts/lib/e2e-isolated-plan.mjs.
 *
 * Pin seams (precedent STORY_174_3_NPM_CLI): RUN_E2E_ISOLATED_PM2 / _LSOF /
 * _GIT / _PS / _NPM.
 *
 * Signal semantics: Ctrl+C (SIGINT/SIGTERM) is recorded and handled at phase
 * boundaries — during the e2e suite it is deferred until spawnSync returns
 * (safe: the suite finishes or fails on its own), then the guaranteed teardown
 * runs and the signal is re-raised. SIGKILL of this runner cannot run teardown
 * and orphans the detached worktree dev server; containment is structural —
 * the next runner run classifies :3100 as 'foreign' (the orphan is outside
 * the pm2 process tree) and aborts fail-closed.
 *
 * Restore semantics: teardown's `pm2 restart` restores the shared dev server
 * to ONLINE even when it was 'stopped' before the run (restore-to-online, not
 * restore-to-pre-state). restoreVerified requires ALL of: HTTP 200 on /login,
 * pm2 jlist status 'online', and :3100 classified 'pm2-owned' via a fresh
 * process table — HTTP-200-alone can be a false positive.
 */

import { spawn, spawnSync } from 'node:child_process'
import { existsSync as defaultExists, openSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  E2E_PORT,
  PM2_PROC_NAME,
  RESTORE_VERIFY_URL,
  buildPlan,
  classifyPort3100,
  executeTeardown,
  killProcessGroup,
  parseIsolatedArgv,
  resolvePins,
  teardownSteps,
} from './lib/e2e-isolated-plan.mjs'

const PRIMARY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILES = ['.env.local', '.env.e2e']

function probeOnce(url) {
  return new Promise(resolve => {
    const request = http.get(url, { timeout: 2000 }, response => {
      response.resume()
      resolve(response.statusCode ?? 0)
    })
    request.on('timeout', () => {
      request.destroy()
      resolve(null)
    })
    request.on('error', () => resolve(null))
  })
}

function parsePidTable(psOutput) {
  return psOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [pid, ppid] = line.split(/\s+/)
      return { pid, ppid }
    })
    .filter(entry => entry.pid !== undefined && entry.ppid !== undefined)
}

/**
 * Run the isolated e2e flow. Every effect sits behind an injected seam so unit
 * tests can exercise the full flow (including failure paths) without pm2,
 * ports, worktrees, or a live dev server. Returns { exitCode, interrupted }.
 */
export async function runIsolatedE2E({
  argv = process.argv.slice(2),
  pins = resolvePins(),
  sh = (command, args, options = {}) => spawnSync(command, args, { encoding: 'utf8', ...options }),
  spawnDev = (command, args, options) => spawn(command, args, options),
  probeUrl = probeOnce,
  waitMs = ms => new Promise(resolve => setTimeout(resolve, ms)),
  killGroup = killProcessGroup,
  exists = defaultExists,
  openLog = logPath => openSync(logPath, 'a'),
  restoreTimeoutSeconds = null,
  writeStdout = message => process.stdout.write(`${message}\n`),
  writeStderr = message => process.stderr.write(`${message}\n`),
} = {}) {
  function listenerPidsNow() {
    const result = sh(pins.lsof, ['-ti', `tcp:${E2E_PORT}`])
    if (result.status !== 0) return []
    return result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  }

  function pm2ProcNow() {
    const result = sh(pins.pm2, ['jlist'])
    if (result.status !== 0 || !result.stdout.trim()) return null
    try {
      return JSON.parse(result.stdout).find(entry => entry?.name === PM2_PROC_NAME) ?? null
    } catch {
      return null
    }
  }

  function pidTableNow() {
    const result = sh(pins.ps, ['-axo', 'pid=,ppid='])
    if (result.status !== 0) return null
    return parsePidTable(result.stdout)
  }

  async function waitFor(predicate, timeoutSeconds, intervalMs = 500) {
    const deadline = Date.now() + timeoutSeconds * 1000
    while (Date.now() < deadline) {
      if (await predicate()) return true
      await waitMs(intervalMs)
    }
    return false
  }

  // Restore attestation: HTTP 200 AND pm2 'online' AND :3100 pm2-owned,
  // re-read fresh on every poll (all three must hold simultaneously).
  async function verifyPm2Restored(timeoutSeconds) {
    return waitFor(async () => {
      if ((await probeUrl(RESTORE_VERIFY_URL)) !== 200) return false
      const proc = pm2ProcNow()
      if (proc?.pm2_env?.status !== 'online' || proc?.pid == null) return false
      const table = pidTableNow()
      if (table === null) return false
      return (
        classifyPort3100({ pm2Pid: proc.pid, listenerPids: listenerPidsNow(), pidTable: table }) ===
        'pm2-owned'
      )
    }, timeoutSeconds)
  }

  const headSha = sh(pins.git, ['rev-parse', 'HEAD'], { cwd: PRIMARY_ROOT })
  if (headSha.status !== 0) {
    writeStderr('Unable to resolve HEAD sha; run inside the frontend repository.')
    return { exitCode: 1 }
  }
  const baseSha = headSha.stdout.trim()
  const defaultWorktreeDir = `/private/tmp/e2e-isolated-${path.basename(PRIMARY_ROOT)}-${baseSha.slice(0, 7)}-${process.pid}`
  let parsed
  try {
    parsed = parseIsolatedArgv(argv, { defaultBase: baseSha, defaultWorktreeDir })
  } catch (error) {
    writeStderr(error instanceof Error ? error.message : String(error))
    return { exitCode: 1 }
  }

  const proc = pm2ProcNow()
  // next dev owns :3100 through CHILD processes (live: pm2 fork → next dev →
  // next-server), so ownership matching needs the full process table — direct
  // pid equality never matches. Fail closed when the table cannot be read.
  let pidTable = []
  if (proc?.pid != null) {
    const table = pidTableNow()
    if (table === null) {
      writeStderr(
        '[run-e2e-isolated] Aborting before any state change: unable to read the process table (ps -axo pid=,ppid=) needed to match the :3100 listener against the pm2 process tree.'
      )
      return { exitCode: 1 }
    }
    pidTable = table
  }
  const portState = classifyPort3100({
    pm2Pid: proc?.pid ?? null,
    listenerPids: listenerPidsNow(),
    pidTable,
  })

  // Fail-closed BEFORE any state change: buildPlan aggregates every problem.
  let plan
  try {
    plan = buildPlan({
      base: parsed.base,
      worktreeDir: parsed.worktreeDir,
      primaryRoot: PRIMARY_ROOT,
      envFiles: ENV_FILES,
      pm2ProcName: PM2_PROC_NAME,
      pm2ProcNames: proc ? [proc.name] : [],
      portState,
      readyTimeoutSeconds: parsed.readyTimeoutSeconds,
    })
  } catch (error) {
    writeStderr(`[run-e2e-isolated] Aborting before any state change:\n${error.message}`)
    return { exitCode: 1 }
  }

  const worktreeDir = parsed.worktreeDir
  const summary = {
    exitCode: 1,
    durationMs: 0,
    phases: {},
    restoreVerified: false,
    worktreeKept: parsed.keepWorktree,
    startedAtMs: Date.now(),
  }
  let devPid = null
  let finalExitCode = 1
  let interrupted = null
  const onSignal = signal => {
    interrupted = signal
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  try {
    const provisionStart = Date.now()
    for (const command of plan.find(phase => phase.phase === 'provision').commands) {
      const result = sh(command[0], command.slice(1), { cwd: PRIMARY_ROOT })
      if (result.status !== 0) {
        throw new Error(`Provision step failed (${command.join(' ')}):\n${result.stderr ?? ''}`)
      }
    }
    summary.phases.provisionMs = Date.now() - provisionStart

    const swapStart = Date.now()
    if (interrupted) throw new Error(`Interrupted (${interrupted}); entering guaranteed teardown.`)
    for (const command of plan.find(phase => phase.phase === 'swap').commands) {
      const result = sh(command[0], command.slice(1))
      if (result.status !== 0) {
        throw new Error(`Swap step failed (${command.join(' ')}):\n${result.stderr ?? ''}`)
      }
    }
    if (!(await waitFor(async () => listenerPidsNow().length === 0, 15))) {
      throw new Error(`Port ${E2E_PORT} did not free within the swap window.`)
    }
    const logFile = openLog(`${worktreeDir}/.e2e-isolated-dev.log`)
    const devArgs = plan.find(phase => phase.phase === 'swap').devCommand.slice(1)
    // Execute under npx (PATH-independent); a bare 'next' spawn emits ENOENT.
    // The async 'error' event is recorded so the finally teardown still runs.
    const child = spawnDev('npx', devArgs, {
      cwd: worktreeDir,
      detached: true,
      stdio: ['ignore', logFile, logFile],
    })
    child.unref?.()
    child.on?.('error', error => {
      summary.devSpawnError = error instanceof Error ? error.message : String(error)
    })
    devPid = child.pid ?? null
    const ready = await waitFor(
      async () => (await probeUrl(RESTORE_VERIFY_URL)) !== null,
      parsed.readyTimeoutSeconds
    )
    if (!ready) {
      throw new Error(
        `Dev server did not answer ${RESTORE_VERIFY_URL} within ${parsed.readyTimeoutSeconds}s. ` +
          `Log: ${worktreeDir}/.e2e-isolated-dev.log`
      )
    }
    if (interrupted) throw new Error(`Interrupted (${interrupted}); entering guaranteed teardown.`)
    summary.phases.swapMs = Date.now() - swapStart

    const runStart = Date.now()
    const runResult = sh(pins.npm, ['run', 'test:e2e:full', '--', ...parsed.forwarded], {
      cwd: worktreeDir,
      stdio: 'inherit',
    })
    summary.phases.runMs = Date.now() - runStart
    summary.exitCode = runResult.status ?? 1
    finalExitCode = summary.exitCode
  } catch (error) {
    writeStderr(`[run-e2e-isolated] ${error instanceof Error ? error.message : String(error)}`)
    finalExitCode = 1
  } finally {
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    await executeTeardown({
      steps: teardownSteps({ keepWorktree: parsed.keepWorktree, worktreeDir }),
      devPid,
      summary,
      sh,
      killGroup,
      waitForPortFreed: seconds => waitFor(async () => listenerPidsNow().length === 0, seconds),
      verifyRestore: step => verifyPm2Restored(restoreTimeoutSeconds ?? step.timeoutSeconds),
      exists,
    })
    if (!summary.restoreVerified) {
      writeStderr(
        `[run-e2e-isolated] CRITICAL: PM2 restore NOT verified (HTTP 200 on ${RESTORE_VERIFY_URL} + pm2 'online' + :3100 'pm2-owned'). ` +
          `Inspect pm2 and :3100 manually; your shared dev server may be down.`
      )
      finalExitCode = 1
    }
    if (summary.teardownErrors.length > 0) {
      writeStderr(`[run-e2e-isolated] Teardown step errors:\n${summary.teardownErrors.join('\n')}`)
    }
    summary.durationMs = Date.now() - summary.startedAtMs
    // Attestation override BEFORE printing so the JSON exitCode matches the
    // process exit even when the run itself passed but restore failed.
    const printed = { ...summary, exitCode: finalExitCode }
    if (parsed.keepWorktree) delete printed.worktreeRemoved
    writeStdout(JSON.stringify(printed))
  }

  return { exitCode: finalExitCode, interrupted }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isCli) {
  const { exitCode, interrupted } = await runIsolatedE2E()
  if (interrupted) process.kill(process.pid, interrupted)
  process.exit(exitCode)
}
