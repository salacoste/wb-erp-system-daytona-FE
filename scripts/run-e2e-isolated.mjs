#!/usr/bin/env node

/**
 * Isolated restart-per-run E2E orchestrator: tmp worktree + own dev server on
 * :3100 per run, with a guaranteed PM2 restore. Generalizes the documented
 * protocol (handoff FINAL §8; ORCHESTRATOR-PROMPT V10 §L111 / V18 §L101;
 * live precedent debt-p3-cabinet-browser-02-repin.md) into executable form.
 * Composes scripts/e2e-preflight.mjs via `npm run test:e2e:full` (read-only
 * reference; never modified). Pure planning lives in scripts/lib/e2e-isolated-plan.mjs.
 *
 * Pin seams (precedent STORY_174_3_NPM_CLI): RUN_E2E_ISOLATED_PM2 / _LSOF / _GIT / _PS.
 */

import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, openSync, rmSync, symlinkSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  E2E_PORT,
  PM2_PROC_NAME,
  RESTORE_VERIFY_URL,
  buildPlan,
  classifyPort3100,
  parseIsolatedArgv,
  resolvePins,
  teardownSteps,
} from './lib/e2e-isolated-plan.mjs'

const PRIMARY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILES = ['.env.local', '.env.e2e']

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function sh(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options })
}

function pm2List(pins) {
  const result = sh(pins.pm2, ['jlist'])
  if (result.status !== 0 || !result.stdout.trim()) return []
  try {
    return JSON.parse(result.stdout)
  } catch {
    return []
  }
}

function listenerPids(pins) {
  const result = sh(pins.lsof, ['-ti', `tcp:${E2E_PORT}`])
  if (result.status !== 0) return []
  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
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

function probe(url) {
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

async function waitFor(url, predicate, timeoutSeconds, intervalMs = 500) {
  const deadline = Date.now() + timeoutSeconds * 1000
  while (Date.now() < deadline) {
    const status = await probe(url)
    if (predicate(status)) return true
    await sleep(intervalMs)
  }
  return false
}

async function waitForPortFreed(seconds) {
  const deadline = Date.now() + seconds * 1000
  while (Date.now() < deadline) {
    if (listenerPids(pins).length === 0) return true
    await sleep(500)
  }
  return false
}

function killProcessGroup(pid, graceMs) {
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    return
  }
  const deadline = Date.now() + graceMs
  while (Date.now() < deadline) {
    try {
      process.kill(-pid, 0)
    } catch {
      return
    }
    const wait = Math.min(200, deadline - Date.now())
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait)
  }
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    /* already gone */
  }
}

let pins = resolvePins()
let devChild = null
let interrupted = null

async function teardown({ worktreeDir, keepWorktree, summary }) {
  for (const step of teardownSteps({ keepWorktree, worktreeDir })) {
    if (step.step === 'stop-dev-kill' && devChild?.pid) {
      killProcessGroup(devChild.pid, step.graceMs)
      devChild = null
      await waitForPortFreed(10)
    }
    if (step.step === 'pm2-restart') {
      summary.phases.pm2RestartMs = Date.now() - (summary.startedAtMs ?? Date.now())
      sh(pins.pm2, ['restart', PM2_PROC_NAME])
    }
    if (step.step === 'restore-verify') {
      summary.restoreVerified = await waitFor(
        step.url,
        status => status === step.expectedStatus,
        step.timeoutSeconds
      )
    }
    if (step.step === 'worktree-remove') {
      const gitRemove = sh(pins.git, ['worktree', 'remove', '--force', worktreeDir], {
        cwd: PRIMARY_ROOT,
      })
      sh(pins.git, ['worktree', 'prune'], { cwd: PRIMARY_ROOT })
      if (gitRemove.status !== 0 && existsSync(worktreeDir)) {
        // Fallback: rmSync unlinks the node_modules symlink without following it.
        rmSync(worktreeDir, { recursive: true, force: true })
      }
      summary.worktreeRemoved = !existsSync(worktreeDir)
    }
    if (step.step === 'artifacts-cleanup' && existsSync(worktreeDir)) {
      for (const relativePath of step.paths) {
        rmSync(path.join(worktreeDir, relativePath), { recursive: true, force: true })
      }
    }
  }
}

async function main() {
  pins = resolvePins()
  const headSha = sh(pins.git, ['rev-parse', 'HEAD'], { cwd: PRIMARY_ROOT })
  if (headSha.status !== 0) {
    console.error('Unable to resolve HEAD sha; run inside the frontend repository.')
    process.exit(1)
  }
  const baseSha = headSha.stdout.trim()
  const defaultWorktreeDir = `/private/tmp/e2e-isolated-${path.basename(PRIMARY_ROOT)}-${baseSha.slice(0, 7)}-${process.pid}`
  const parsed = parseIsolatedArgv(process.argv.slice(2), {
    defaultBase: baseSha,
    defaultWorktreeDir,
  })

  const pm2Procs = pm2List(pins)
  const proc = pm2Procs.find(entry => entry?.name === PM2_PROC_NAME)
  // next dev owns :3100 through CHILD processes (live: pm2 fork → next dev →
  // next-server), so ownership matching needs the full process table — direct
  // pid equality never matches. Fail closed when the table cannot be read.
  let pidTable = []
  if (proc?.pid != null) {
    const psTable = sh(pins.ps, ['-axo', 'pid=,ppid='])
    if (psTable.status !== 0) {
      console.error(
        '[run-e2e-isolated] Aborting before any state change: unable to read the process table (ps -axo pid=,ppid=) needed to match the :3100 listener against the pm2 process tree.'
      )
      process.exit(1)
    }
    pidTable = parsePidTable(psTable.stdout)
  }
  const portState = classifyPort3100({
    pm2Pid: proc?.pid ?? null,
    listenerPids: listenerPids(pins),
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
      pm2ProcNames: pm2Procs.map(entry => entry?.name).filter(Boolean),
      portState,
      readyTimeoutSeconds: parsed.readyTimeoutSeconds,
    })
  } catch (error) {
    console.error(`[run-e2e-isolated] Aborting before any state change:\n${error.message}`)
    process.exit(1)
  }

  const summary = {
    exitCode: 1,
    durationMs: 0,
    phases: {},
    restoreVerified: false,
    worktreeRemoved: false,
    startedAtMs: Date.now(),
  }
  const worktreeDir = parsed.worktreeDir
  let finalExitCode = 1

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
      sh(command[0], command.slice(1))
    }
    if (!(await waitForPortFreed(plan.find(phase => phase.phase === 'swap').portFreePollSeconds))) {
      throw new Error(`Port ${E2E_PORT} did not free within the swap window.`)
    }
    const logFile = openSync(`${worktreeDir}/.e2e-isolated-dev.log`, 'a')
    const devArgs = plan.find(phase => phase.phase === 'swap').devCommand.slice(1)
    devChild = spawn(devArgs[0], devArgs.slice(1), {
      cwd: worktreeDir,
      detached: true,
      stdio: ['ignore', logFile, logFile],
    })
    devChild.unref()
    const ready = await waitFor(
      RESTORE_VERIFY_URL,
      status => status !== null,
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
    const runResult = spawnSync('npm', ['run', 'test:e2e:full', '--', ...parsed.forwarded], {
      cwd: worktreeDir,
      stdio: 'inherit',
    })
    summary.phases.runMs = Date.now() - runStart
    summary.exitCode = runResult.status ?? 1
    finalExitCode = summary.exitCode
  } catch (error) {
    console.error(`[run-e2e-isolated] ${error instanceof Error ? error.message : String(error)}`)
    finalExitCode = 1
  } finally {
    await teardown({ worktreeDir, keepWorktree: parsed.keepWorktree, summary })
    process.off('SIGINT', onSignal)
    process.off('SIGTERM', onSignal)
    if (!summary.restoreVerified) {
      console.error(
        `[run-e2e-isolated] CRITICAL: PM2 restore NOT verified (${RESTORE_VERIFY_URL} did not return 200). ` +
          `Inspect pm2 and :3100 manually; your shared dev server may be down.`
      )
      finalExitCode = 1
    }
    summary.durationMs = Date.now() - summary.startedAtMs
    console.log(JSON.stringify(summary))
  }

  if (interrupted) process.kill(process.pid, interrupted)
  process.exit(finalExitCode)
}

main()
