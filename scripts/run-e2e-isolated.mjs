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
 * _GIT / _PS / _NPM / _NPX.
 *
 * Signal semantics: Ctrl+C (SIGINT/SIGTERM) is recorded and handled promptly
 * at phase boundaries AND inside the dev-boot readiness poll (an interrupt
 * during readiness throws into guaranteed teardown within one poll tick).
 * During the e2e suite it is deferred until spawnSync returns (safe: the suite
 * finishes or fails on its own), then the guaranteed teardown runs and the
 * signal is re-raised. A SECOND Ctrl+C while teardown itself is running is
 * deliberately swallowed: killing mid-teardown would skip pm2 restart /
 * restore — the exact state this runner exists to prevent. SIGKILL of this
 * runner cannot run teardown and orphans the detached worktree dev server;
 * containment is structural — the next runner run classifies :3100 as
 * 'foreign' (the orphan is outside the pm2 process tree) and aborts
 * fail-closed.
 *
 * Restore semantics: when the swap stopped pm2 (summary.swapped), teardown's
 * `pm2 restart` brings the shared dev server back ONLINE and restoreVerified
 * requires ALL of: HTTP 200 on /login, pm2 jlist status 'online', and :3100
 * classified 'pm2-owned' via a fresh process table — HTTP-200-alone can be a
 * false positive. When NOTHING was swapped (provision failed / port already
 * free), the restart step is skipped: pm2 was never touched, so its pre-run
 * state is preserved as-is.
 *
 * Summary contract: the JSON summary is printed only after provisioning has
 * begun (pre-provision fail-closed aborts print nothing); `exitCode` reflects
 * the run result + restore attestation, not cleanup errors (those surface as
 * `teardownErrors[]` + stderr), and `interrupted` reports the pending signal
 * the CLI layer re-raises after the summary is drained.
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
  RUN_COMMAND,
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
  envFiles = ENV_FILES,
  registerSignals = onSignal => {
    process.on('SIGINT', onSignal)
    process.on('SIGTERM', onSignal)
    return () => {
      process.off('SIGINT', onSignal)
      process.off('SIGTERM', onSignal)
    }
  },
  restoreTimeoutSeconds = null,
  // Drain-aware defaults: resolve on the write callback, so awaiting the
  // FINAL summary and the CRITICAL stderr warnings guarantees they are
  // flushed before the CLI layer calls process.exit (piped streams would
  // otherwise risk dropping the attestation JSON).
  writeStdout = message => new Promise(resolve => process.stdout.write(`${message}\n`, resolve)),
  writeStderr = message => new Promise(resolve => process.stderr.write(`${message}\n`, resolve)),
} = {}) {
  function listenerPidsNow() {
    // Argv order is load-bearing (darwin lsof getopt): the address token MUST
    // immediately follow -i and -sTCP:LISTEN must come LAST — putting the
    // filter between them makes getopt bind -i to '-sTCP:LISTEN' and parse
    // 'tcp:3100' as a bare filename (lsof exits 1, port reads as free).
    // -sTCP:LISTEN restricts to LISTEN-state sockets: without it lsof also
    // matches established CLIENT connections to :3100 (e.g. the probe's own
    // socket), which would misclassify a busy port as 'foreign'.
    const result = sh(pins.lsof, ['-ti', `tcp:${E2E_PORT}`, '-sTCP:LISTEN'])
    if (result.status === 1) {
      // Exit 1 is lsof's clean "no match" — no listener on the port.
      return []
    }
    if (result.status !== 0) {
      // Spawn failure (status null) or an unexpected exit code is NOT
      // "no listeners": conflating it would fail open and skip the pm2 stop.
      throw new Error(
        `Unable to read :${E2E_PORT} listeners (${pins.lsof} exited ${result.status ?? 'signal'}); refusing to guess port ownership.`
      )
    }
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

  async function waitFor(predicate, timeoutSeconds, intervalMs = 500, shouldAbort = null) {
    const deadline = Date.now() + timeoutSeconds * 1000
    while (Date.now() < deadline) {
      if (shouldAbort?.()) {
        throw new Error(`Interrupted (${interrupted}); entering guaranteed teardown.`)
      }
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
  // The worktree checks out COMMITTED code. A dirty working tree is the
  // natural pre-commit use case, so warn (non-fatal) instead of aborting.
  const dirtyStatus = sh(pins.git, ['status', '--porcelain'], { cwd: PRIMARY_ROOT })
  if (dirtyStatus.status === 0 && dirtyStatus.stdout.trim()) {
    writeStderr(
      `[run-e2e-isolated] NOTE: the working tree is dirty — the isolated worktree checks out ` +
        `HEAD (${baseSha.slice(0, 7)}), NOT your uncommitted changes. Commit or stash first ` +
        `if this run must test working-tree code.`
    )
  }
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
  let portState
  try {
    portState = classifyPort3100({
      pm2Pid: proc?.pid ?? null,
      listenerPids: listenerPidsNow(),
      pidTable,
    })
  } catch (error) {
    // lsof spawn failure / unexpected exit: fail closed BEFORE any state
    // change instead of conflating the failure with "no listeners".
    writeStderr(`[run-e2e-isolated] Aborting before any state change:\n${error.message}`)
    return { exitCode: 1 }
  }

  // Fail-closed BEFORE any state change: buildPlan aggregates every problem.
  // pins/exists/envFiles flow through so the seams hold at plan build time.
  let plan
  try {
    plan = buildPlan({
      base: parsed.base,
      worktreeDir: parsed.worktreeDir,
      primaryRoot: PRIMARY_ROOT,
      envFiles,
      pm2ProcName: PM2_PROC_NAME,
      pm2ProcNames: proc ? [proc.name] : [],
      portState,
      readyTimeoutSeconds: parsed.readyTimeoutSeconds,
      exists,
      pins,
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
    portFreed: false,
    swapped: false,
    worktreeKept: parsed.keepWorktree,
    startedAtMs: Date.now(),
  }
  let devPid = null
  let finalExitCode = 1
  let interrupted = null
  let teardownInProgress = false
  const unregisterSignals = registerSignals(signal => {
    // A second Ctrl+C DURING teardown is swallowed on purpose: the teardown
    // must not be killed between pm2 restart and restore-verify.
    if (teardownInProgress) return
    interrupted = signal
  })

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
    // Recorded ONLY after a successful stop so teardown knows whether pm2
    // was actually touched (no swap → no restart, see executeTeardown).
    summary.swapped = plan.find(phase => phase.phase === 'swap').commands.length > 0
    if (!(await waitFor(async () => listenerPidsNow().length === 0, 15))) {
      throw new Error(`Port ${E2E_PORT} did not free within the swap window.`)
    }
    const logFile = openLog(`${worktreeDir}/.e2e-isolated-dev.log`)
    // devCommand[0] is 'npx' from DEV_COMMAND (single source of truth; a bare
    // 'next' spawn would emit ENOENT). The async 'error' event is recorded so
    // the finally teardown still runs.
    const devCommand = plan.find(phase => phase.phase === 'swap').devCommand
    const child = spawnDev(devCommand[0], devCommand.slice(1), {
      cwd: worktreeDir,
      detached: true,
      stdio: ['ignore', logFile, logFile],
    })
    child.unref?.()
    child.on?.('error', error => {
      summary.devSpawnError = error instanceof Error ? error.message : String(error)
    })
    devPid = child.pid ?? null
    // Readiness intentionally accepts ANY HTTP status (including 404/500):
    // next dev compiles lazily and can answer non-2xx while warming up, so
    // socket-alive is the only requirement here. Deeper health checking is
    // the preflight wrapper's job (SERVICE_CONFIGURATION probes + handshake).
    // shouldAbort makes Ctrl+C exit the poll into teardown immediately.
    const ready = await waitFor(
      async () => (await probeUrl(RESTORE_VERIFY_URL)) !== null,
      parsed.readyTimeoutSeconds,
      500,
      () => interrupted !== null
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
    const runResult = sh(pins.npm, [...RUN_COMMAND, ...parsed.forwarded], {
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
    // Handlers stay registered THROUGH teardown (teardownInProgress swallows
    // further Ctrl+C) so a second interrupt cannot kill mid-restore; they are
    // unregistered only after the summary is drained, right before returning.
    teardownInProgress = true
    await executeTeardown({
      steps: teardownSteps({ keepWorktree: parsed.keepWorktree, worktreeDir, pins }),
      devPid,
      summary,
      sh,
      killGroup,
      waitForPortFreed: seconds => waitFor(async () => listenerPidsNow().length === 0, seconds),
      verifyRestore: step => verifyPm2Restored(restoreTimeoutSeconds ?? step.timeoutSeconds),
      exists,
    })
    if (!summary.restoreVerified) {
      // Awaited so a piped stderr cannot truncate the CRITICAL attestation
      // warning before exit.
      await writeStderr(
        `[run-e2e-isolated] CRITICAL: PM2 restore NOT verified (HTTP 200 on ${RESTORE_VERIFY_URL} + pm2 'online' + :3100 'pm2-owned'). ` +
          `Inspect pm2 and :3100 manually; your shared dev server may be down.`
      )
      finalExitCode = 1
    }
    if (summary.teardownErrors.length > 0) {
      await writeStderr(
        `[run-e2e-isolated] Teardown step errors:\n${summary.teardownErrors.join('\n')}`
      )
    }
    summary.durationMs = Date.now() - summary.startedAtMs
    // Attestation override BEFORE printing so the JSON exitCode matches the
    // process exit even when the run itself passed but restore failed.
    // Awaited so piped stdout drains before the CLI re-raise / process.exit.
    // try/finally keeps unregisterSignals running even if a destroyed stdout
    // throws mid-write — signal hygiene must never be skipped.
    try {
      const printed = { ...summary, exitCode: finalExitCode, interrupted }
      if (parsed.keepWorktree) delete printed.worktreeRemoved
      await writeStdout(JSON.stringify(printed))
    } catch (error) {
      writeStderr(
        `[run-e2e-isolated] Unable to print the summary JSON: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      unregisterSignals()
    }
  }

  return { exitCode: finalExitCode, interrupted }
}

// CLI gating compares URL strings, not realpaths: a symlinked bin alias
// pointing at this file would NOT match and would not auto-run — a known gap,
// accepted for a repo-local script (documented, not a security boundary).
const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isCli) {
  const { exitCode, interrupted } = await runIsolatedE2E()
  if (interrupted) process.kill(process.pid, interrupted)
  process.exit(exitCode)
}
