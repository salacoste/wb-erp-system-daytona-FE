import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PM2_PROC_NAME,
  RESTORE_VERIFY_URL,
  buildPlan,
  classifyPort3100,
  parseIsolatedArgv,
  resolvePins,
  teardownSteps,
} from './lib/e2e-isolated-plan.mjs'

const DEFAULTS = {
  defaultBase: 'abc1234',
  defaultWorktreeDir: '/private/tmp/e2e-isolated-frontend-abc1234-4242',
}

const PLAN_INPUT = {
  base: 'abc1234',
  worktreeDir: '/private/tmp/e2e-isolated-frontend-abc1234-4242',
  primaryRoot: '/repo/frontend',
  envFiles: ['.env.local', '.env.e2e'],
  pm2ProcName: PM2_PROC_NAME,
  pm2ProcNames: [PM2_PROC_NAME, 'other-proc'],
  portState: 'pm2-owned',
  readyTimeoutSeconds: 180,
}

test('parseIsolatedArgv applies documented defaults when no flags are given', () => {
  const parsed = parseIsolatedArgv([], DEFAULTS)
  assert.deepEqual(parsed, {
    base: 'abc1234',
    worktreeDir: '/private/tmp/e2e-isolated-frontend-abc1234-4242',
    keepWorktree: false,
    readyTimeoutSeconds: 180,
    forwarded: [],
  })
})

test('parseIsolatedArgv accepts space and equals flag forms before --', () => {
  const parsed = parseIsolatedArgv(
    ['--base', 'def5678', '--worktree-dir=/tmp/wt', '--keep-worktree', '--ready-timeout-seconds=90'],
    DEFAULTS
  )
  assert.equal(parsed.base, 'def5678')
  assert.equal(parsed.worktreeDir, '/tmp/wt')
  assert.equal(parsed.keepWorktree, true)
  assert.equal(parsed.readyTimeoutSeconds, 90)
  assert.deepEqual(parsed.forwarded, [])
})

test('parseIsolatedArgv forwards everything after the first bare -- verbatim', () => {
  const forwarded = ['--grep', 'orders flow', '--grep', 'orders flow', '--', 'not a flag', '']
  const parsed = parseIsolatedArgv(['--base', 'def5678', '--', ...forwarded], { ...DEFAULTS })
  assert.deepEqual(parsed.forwarded, forwarded)
  assert.equal(parsed.base, 'def5678')
  assert.equal(parsed.keepWorktree, false)
})

test('parseIsolatedArgv treats flags spelled after -- as forwarded, never parsed', () => {
  const parsed = parseIsolatedArgv(['--', '--keep-worktree', '--base', 'zzz'], DEFAULTS)
  assert.deepEqual(parsed.forwarded, ['--keep-worktree', '--base', 'zzz'])
  assert.equal(parsed.keepWorktree, false)
  assert.equal(parsed.base, 'abc1234')
})

test('parseIsolatedArgv throws with usage on an unknown flag before --', () => {
  assert.throws(() => parseIsolatedArgv(['--wat'], DEFAULTS), /Usage:/)
  assert.doesNotThrow(() => parseIsolatedArgv(['--', 'x', '--wat'], DEFAULTS))
})

test('parseIsolatedArgv rejects a non-integer or non-positive ready timeout', () => {
  assert.throws(() => parseIsolatedArgv(['--ready-timeout-seconds', '0'], DEFAULTS))
  assert.throws(() => parseIsolatedArgv(['--ready-timeout-seconds', 'soon'], DEFAULTS))
})

test('parseIsolatedArgv forwards npm-style argv where npm stripped the single --', () => {
  // Live repro: `npm run test:e2e:isolated -- e2e/box-types-page.spec.ts
  // --grep "renders page heading" --retries=0` reaches the parser with the
  // spec as the FIRST argument and no bare `--` anywhere.
  const argv = ['e2e/box-types-page.spec.ts', '--grep', 'renders page heading', '--retries=0']
  const parsed = parseIsolatedArgv(argv, DEFAULTS)
  assert.deepEqual(parsed.forwarded, argv)
  assert.equal(parsed.keepWorktree, false)
  assert.equal(parsed.base, 'abc1234')
})

test('parseIsolatedArgv starts forwarding at the first bare positional, keeping earlier flags', () => {
  const parsed = parseIsolatedArgv(
    ['--keep-worktree', 'e2e/x.spec.ts', '--grep', 'y', '--retries=0'],
    DEFAULTS
  )
  assert.equal(parsed.keepWorktree, true)
  assert.deepEqual(parsed.forwarded, ['e2e/x.spec.ts', '--grep', 'y', '--retries=0'])
})

test('parseIsolatedArgv consumes flag values that look like non-flags, then forwards', () => {
  const parsed = parseIsolatedArgv(['--base', 'abc123', 'e2e/x.spec.ts'], DEFAULTS)
  assert.equal(parsed.base, 'abc123')
  assert.deepEqual(parsed.forwarded, ['e2e/x.spec.ts'])
})

test('parseIsolatedArgv still throws with usage on an unknown flag before any positional', () => {
  assert.throws(() => parseIsolatedArgv(['--wat', 'e2e/x.spec.ts'], DEFAULTS), /Unknown flag: --wat/)
  assert.throws(() => parseIsolatedArgv(['--keep-worktree', '--wat', 'e2e/x'], DEFAULTS), /Usage:/)
})

test('parseIsolatedArgv explicit bare -- form still forwards verbatim', () => {
  const parsed = parseIsolatedArgv(['--', 'e2e/x.spec.ts', '--grep', 'y'], DEFAULTS)
  assert.deepEqual(parsed.forwarded, ['e2e/x.spec.ts', '--grep', 'y'])
  assert.deepEqual(
    parseIsolatedArgv(['--'], DEFAULTS).forwarded,
    [],
    'a trailing bare -- forwards nothing (valid no-playwright-args case)'
  )
})

test('classifyPort3100 returns pm2-owned when a listener pid matches the pm2 pid', () => {
  assert.equal(classifyPort3100({ pm2Pid: 42, listenerPids: ['42'] }), 'pm2-owned')
  assert.equal(classifyPort3100({ pm2Pid: 42, listenerPids: ['7', '42'] }), 'pm2-owned')
})

test('classifyPort3100 returns free only when no listeners are present', () => {
  assert.equal(classifyPort3100({ pm2Pid: 42, listenerPids: [] }), 'free')
  assert.equal(classifyPort3100({ pm2Pid: null, listenerPids: [] }), 'free')
})

test('classifyPort3100 returns foreign for unknown listeners, including a null pm2 pid', () => {
  assert.equal(classifyPort3100({ pm2Pid: 42, listenerPids: ['7'] }), 'foreign')
  assert.equal(classifyPort3100({ pm2Pid: null, listenerPids: ['7', '8'] }), 'foreign')
})

// Happy-path default: env files exist in the primary checkout, the worktree
// path does not. Overrides carrying their own `exists` win (fail-closed tests).
function planWith(overrides = {}) {
  const merged = { ...PLAN_INPUT, ...overrides }
  const exists =
    merged.exists ?? (target => target !== PLAN_INPUT.worktreeDir && !target.endsWith('/node_modules'))
  return buildPlan({ ...merged, exists })
}

test('buildPlan emits the five phases in documented order', () => {
  const phases = planWith()
  assert.deepEqual(
    phases.map(phase => phase.phase),
    ['provision', 'swap', 'run', 'restore', 'cleanup']
  )
})

test('buildPlan provision phase attaches the worktree, node_modules symlink, and env copies', () => {
  const provision = planWith().find(phase => phase.phase === 'provision')
  const commands = provision.commands
  assert.deepEqual(commands[0], [
    'git',
    'worktree',
    'add',
    '--detach',
    PLAN_INPUT.worktreeDir,
    PLAN_INPUT.base,
  ])
  assert.deepEqual(commands[1], [
    'ln',
    '-s',
    `${PLAN_INPUT.primaryRoot}/node_modules`,
    `${PLAN_INPUT.worktreeDir}/node_modules`,
  ])
  for (const envFile of PLAN_INPUT.envFiles) {
    assert.ok(
      commands.some(
        command =>
          command[0] === 'cp' &&
          command[1] === `${PLAN_INPUT.primaryRoot}/${envFile}` &&
          command[2] === `${PLAN_INPUT.worktreeDir}/${envFile}`
      ),
      `missing env copy for ${envFile}`
    )
  }
})

test('buildPlan swap stops pm2 only when the port is pm2-owned; free is a no-op stop', () => {
  const owned = planWith().find(phase => phase.phase === 'swap')
  assert.deepEqual(owned.commands, [['pm2', 'stop', PM2_PROC_NAME]])
  const free = planWith({ portState: 'free' }).find(phase => phase.phase === 'swap')
  assert.deepEqual(free.commands, [])
  assert.equal(free.stopIsNoOp, true)
})

test('buildPlan run phase invokes test:e2e:full inside the worktree', () => {
  const run = planWith().find(phase => phase.phase === 'run')
  assert.deepEqual(run.commands, [['npm', 'run', 'test:e2e:full', '--']])
  assert.equal(run.cwd, PLAN_INPUT.worktreeDir)
})

test('buildPlan restore restarts pm2 and carries the restore-verify probe in both port states', () => {
  for (const portState of ['pm2-owned', 'free']) {
    const restore = planWith({ portState }).find(phase => phase.phase === 'restore')
    assert.deepEqual(restore.commands, [['pm2', 'restart', PM2_PROC_NAME]])
    assert.equal(restore.verify.url, RESTORE_VERIFY_URL)
    assert.equal(restore.verify.expectedStatus, 200)
  }
})

test('buildPlan cleanup removes and prunes the worktree', () => {
  const cleanup = planWith().find(phase => phase.phase === 'cleanup')
  assert.deepEqual(cleanup.commands, [
    ['git', 'worktree', 'remove', '--force', PLAN_INPUT.worktreeDir],
    ['git', 'worktree', 'prune'],
  ])
})

test('buildPlan aggregates every fail-closed problem into one newline-joined error', () => {
  assert.throws(
    () =>
      buildPlan({
        ...PLAN_INPUT,
        pm2ProcNames: ['other-proc'],
        portState: 'foreign',
        exists: target => target === PLAN_INPUT.worktreeDir,
      }),
    error => {
      const lines = error.message.split('\n')
      return (
        lines.length >= 4 &&
        lines.some(line => line.includes('worktree') && line.includes(PLAN_INPUT.worktreeDir)) &&
        lines.some(line => line.includes('.env.local')) &&
        lines.some(line => line.includes('.env.e2e')) &&
        lines.some(line => line.includes(PM2_PROC_NAME)) &&
        lines.some(line => line.includes('foreign'))
      )
    }
  )
})

test('buildPlan fail-closed branches each block with their own problem', () => {
  assert.throws(
    () => planWith({ exists: target => target === PLAN_INPUT.worktreeDir }),
    /worktree.*exists/s
  )
  for (const envFile of PLAN_INPUT.envFiles) {
    const missingPath = `${PLAN_INPUT.primaryRoot}/${envFile}`
    assert.throws(
      () =>
        planWith({
          exists: target => target !== PLAN_INPUT.worktreeDir && target !== missingPath,
        }),
      new RegExp(envFile.replaceAll('.', '\\.'))
    )
  }
  assert.throws(
    () => planWith({ pm2ProcNames: ['unrelated'] }),
    new RegExp(PM2_PROC_NAME.replaceAll('-', '\\-'))
  )
  assert.throws(() => planWith({ portState: 'foreign' }), /foreign/)
})

test('buildPlan honors pin-seam command overrides in emitted commands', () => {
  const pinned = resolvePins({ RUN_E2E_ISOLATED_GIT: '/custom/git', RUN_E2E_ISOLATED_PM2: '/custom/pm2' })
  const phases = planWith({ pins: pinned })
  const provision = phases.find(phase => phase.phase === 'provision')
  assert.equal(provision.commands[0][0], '/custom/git')
  const restore = phases.find(phase => phase.phase === 'restore')
  assert.equal(restore.commands[0][0], '/custom/pm2')
})

test('resolvePins defaults to plain command names and respects each env override', () => {
  assert.deepEqual(resolvePins({}), { pm2: 'pm2', lsof: 'lsof', git: 'git' })
  assert.deepEqual(
    resolvePins({
      RUN_E2E_ISOLATED_PM2: '/x/pm2',
      RUN_E2E_ISOLATED_LSOF: '/x/lsof',
      RUN_E2E_ISOLATED_GIT: '/x/git',
    }),
    { pm2: '/x/pm2', lsof: '/x/lsof', git: '/x/git' }
  )
})

test('teardownSteps proves the invariant: kill, restart, restore-verify, then removal, then artifacts', () => {
  const steps = teardownSteps({ keepWorktree: false, worktreeDir: PLAN_INPUT.worktreeDir })
  const names = steps.map(step => step.step)
  assert.deepEqual(names, [
    'stop-dev-kill',
    'pm2-restart',
    'restore-verify',
    'worktree-remove',
    'artifacts-cleanup',
  ])
  assert.ok(names.indexOf('restore-verify') < names.indexOf('worktree-remove'))
  const verify = steps.find(step => step.step === 'restore-verify')
  assert.equal(verify.url, RESTORE_VERIFY_URL)
  assert.equal(verify.expectedStatus, 200)
  const artifacts = steps.find(step => step.step === 'artifacts-cleanup')
  assert.deepEqual(artifacts.paths, ['e2e/.auth', 'test-results', 'playwright-report'])
  assert.ok(
    artifacts.paths.every(relativePath => relativePath.startsWith('e2e/') || !relativePath.includes('/'))
  )
})

test('teardownSteps skips worktree removal when keepWorktree is set, keeping restore intact', () => {
  const steps = teardownSteps({ keepWorktree: true, worktreeDir: PLAN_INPUT.worktreeDir })
  const names = steps.map(step => step.step)
  assert.ok(!names.includes('worktree-remove'))
  assert.deepEqual(names, ['stop-dev-kill', 'pm2-restart', 'restore-verify', 'artifacts-cleanup'])
  assert.ok(names.indexOf('pm2-restart') < names.indexOf('restore-verify'))
})
