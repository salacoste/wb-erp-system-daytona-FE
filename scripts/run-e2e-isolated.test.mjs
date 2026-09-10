import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PM2_PROC_NAME,
  RESTORE_VERIFY_URL,
  buildPlan,
  classifyPort3100,
  collectDescendantPids,
  executeTeardown,
  killProcessGroup,
  parseIsolatedArgv,
  resolvePins,
  teardownSteps,
} from './lib/e2e-isolated-plan.mjs'
import { runIsolatedE2E } from './run-e2e-isolated.mjs'

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
    [
      '--base',
      'def5678',
      '--worktree-dir=/tmp/wt',
      '--keep-worktree',
      '--ready-timeout-seconds=90',
    ],
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
  assert.throws(
    () => parseIsolatedArgv(['--wat', 'e2e/x.spec.ts'], DEFAULTS),
    /Unknown flag: --wat/
  )
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

const PM2_TREE = [
  { pid: '80620', ppid: '1' },
  { pid: '80724', ppid: '80620' },
  { pid: '80725', ppid: '80724' },
]

test('collectDescendantPids returns every descendant excluding the root', () => {
  const table = [...PM2_TREE, { pid: 99999, ppid: '80725' }]
  assert.deepEqual([...collectDescendantPids('80620', table)].sort(), ['80724', '80725', '99999'])
})

test('collectDescendantPids accepts a Map table and numeric pids', () => {
  const table = new Map([
    ['80620', { pid: '80620', ppid: '1' }],
    ['80724', { pid: '80724', ppid: 80620 }],
    ['80725', { pid: 80725, ppid: '80724' }],
  ])
  assert.deepEqual([...collectDescendantPids(80620, table)].sort(), ['80724', '80725'])
})

test('collectDescendantPids terminates on ppid self-loops and ancestor cycles', () => {
  const table = [
    { pid: 'selfloop', ppid: 'selfloop' },
    { pid: 'root', ppid: '1' },
    { pid: 'a', ppid: 'root' },
    { pid: 'b', ppid: 'a' },
    { pid: 'c', ppid: 'b' },
    { pid: 'a', ppid: 'c' }, // second parent link closes an ancestor cycle a→b→c→a
  ]
  assert.deepEqual([...collectDescendantPids('root', table)].sort(), ['a', 'b', 'c'])
})

test('classifyPort3100 recognizes next-server owning :3100 as a pm2 grandchild', () => {
  // Live shape (proof-run #2): pm2 fork 80620 → next dev 80724 →
  // next-server 80725 holds the listening socket.
  assert.equal(
    classifyPort3100({ pm2Pid: 80620, listenerPids: ['80725'], pidTable: PM2_TREE }),
    'pm2-owned'
  )
})

test('classifyPort3100 still matches the direct pm2 pid and stays foreign otherwise', () => {
  assert.equal(classifyPort3100({ pm2Pid: 42, listenerPids: ['42'], pidTable: [] }), 'pm2-owned')
  assert.equal(
    classifyPort3100({ pm2Pid: 80620, listenerPids: ['80725'], pidTable: [] }),
    'foreign',
    'an empty pid table cannot vouch for a child listener'
  )
  assert.equal(
    classifyPort3100({ pm2Pid: 80620, listenerPids: ['777'], pidTable: PM2_TREE }),
    'foreign'
  )
  assert.equal(
    classifyPort3100({ pm2Pid: null, listenerPids: ['80725'], pidTable: PM2_TREE }),
    'foreign'
  )
})

// Happy-path default: env files exist in the primary checkout, the worktree
// path does not. Overrides carrying their own `exists` win (fail-closed tests).
function planWith(overrides = {}) {
  const merged = { ...PLAN_INPUT, ...overrides }
  const exists =
    merged.exists ??
    (target => target !== PLAN_INPUT.worktreeDir && !target.endsWith('/node_modules'))
  return buildPlan({ ...merged, exists })
}

test('buildPlan emits the five phases in documented order', () => {
  // Documented semantics (see buildPlan): provision/swap are executed as data
  // by runIsolatedE2E; run/restore/cleanup are DESCRIPTIVE — their execution
  // is owned by runIsolatedE2E (run) and executeTeardown (restore + cleanup).
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
  const pinned = resolvePins({
    RUN_E2E_ISOLATED_GIT: '/custom/git',
    RUN_E2E_ISOLATED_PM2: '/custom/pm2',
  })
  const phases = planWith({ pins: pinned })
  const provision = phases.find(phase => phase.phase === 'provision')
  assert.equal(provision.commands[0][0], '/custom/git')
  const restore = phases.find(phase => phase.phase === 'restore')
  assert.equal(restore.commands[0][0], '/custom/pm2')
})

test('resolvePins defaults to plain command names and respects each env override', () => {
  assert.deepEqual(resolvePins({}), {
    pm2: 'pm2',
    lsof: 'lsof',
    git: 'git',
    ps: 'ps',
    npm: 'npm',
  })
  assert.deepEqual(
    resolvePins({
      RUN_E2E_ISOLATED_PM2: '/x/pm2',
      RUN_E2E_ISOLATED_LSOF: '/x/lsof',
      RUN_E2E_ISOLATED_GIT: '/x/git',
      RUN_E2E_ISOLATED_PS: '/x/ps',
      RUN_E2E_ISOLATED_NPM: '/x/npm',
    }),
    { pm2: '/x/pm2', lsof: '/x/lsof', git: '/x/git', ps: '/x/ps', npm: '/x/npm' }
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
    artifacts.paths.every(
      relativePath => relativePath.startsWith('e2e/') || !relativePath.includes('/')
    )
  )
})

test('teardownSteps skips worktree removal AND artifacts cleanup when keepWorktree is set', () => {
  const steps = teardownSteps({ keepWorktree: true, worktreeDir: PLAN_INPUT.worktreeDir })
  const names = steps.map(step => step.step)
  assert.deepEqual(names, ['stop-dev-kill', 'pm2-restart', 'restore-verify'])
  assert.ok(!names.includes('worktree-remove'))
  assert.ok(!names.includes('artifacts-cleanup'), 'the kept worktree IS the evidence (L9)')
  assert.ok(names.indexOf('pm2-restart') < names.indexOf('restore-verify'))
})

test('parseIsolatedArgv rejects an inline value on the boolean --keep-worktree flag', () => {
  assert.throws(
    () => parseIsolatedArgv(['--keep-worktree=false'], DEFAULTS),
    /does not take a value/
  )
  assert.throws(() => parseIsolatedArgv(['--keep-worktree=1'], DEFAULTS), /--keep-worktree/)
})

test('buildPlan locks the dev command shape: executed under npx, never bare next', () => {
  const swap = planWith().find(phase => phase.phase === 'swap')
  assert.deepEqual(swap.devCommand, ['npx', 'next', 'dev', '--webpack', '-p', '3100'])
  assert.equal(swap.devCommand[0], 'npx')
})

test('killProcessGroup returns early for an already-dead group', () => {
  const signals = []
  const delivered = killProcessGroup(4242, 50, {
    kill: (target, signal) => {
      signals.push(signal)
      throw new Error('ESRCH')
    },
    waitMs: () => {},
  })
  assert.deepEqual(delivered, [])
  assert.deepEqual(signals, ['SIGTERM'])
})

test('killProcessGroup escalates SIGTERM to SIGKILL when the group survives the grace window', () => {
  const signals = []
  const delivered = killProcessGroup(4242, 20, {
    kill: (target, signal) => {
      signals.push(signal)
    },
    waitMs: () => {},
  })
  assert.deepEqual(delivered, ['SIGTERM', 'SIGKILL'])
  assert.equal(signals[0], 'SIGTERM')
  assert.equal(signals.at(-1), 'SIGKILL')
})

test('killProcessGroup stops after SIGTERM when the group exits during the grace window', () => {
  const signals = []
  let alive = true
  const delivered = killProcessGroup(4242, 500, {
    kill: (target, signal) => {
      signals.push(signal)
      if (signal === 'SIGTERM') alive = false
      if (signal === 0 && !alive) throw new Error('ESRCH')
    },
    waitMs: () => {},
  })
  assert.deepEqual(delivered, ['SIGTERM'])
  assert.ok(!signals.includes('SIGKILL'))
})

test('executeTeardown falls back to rmSync only when git remove fails, after pm2-restart', async () => {
  const calls = []
  let dirExists = true
  const summary = { phases: {}, restoreVerified: false }
  const result = await executeTeardown({
    steps: teardownSteps({ keepWorktree: false, worktreeDir: '/tmp/wt' }),
    devPid: 900,
    summary,
    sh: (command, args) => {
      calls.push([command, ...args].join(' '))
      if (command === 'git' && args[1] === 'remove')
        return { status: 1, stdout: '', stderr: 'nope' }
      return { status: 0, stdout: '', stderr: '' }
    },
    killGroup: pid => calls.push(`kill:${pid}`),
    waitForPortFreed: async () => true,
    verifyRestore: async () => true,
    exists: () => dirExists,
    removePath: path => {
      calls.push(`rmSync:${path}`)
      dirExists = false
    },
  })
  assert.ok(calls.indexOf('kill:900') < calls.indexOf('pm2 restart wb-repricer-frontend-dev'))
  assert.ok(
    calls.indexOf('pm2 restart wb-repricer-frontend-dev') <
      calls.indexOf('git worktree remove --force /tmp/wt')
  )
  assert.deepEqual(
    calls.filter(call => call.startsWith('rmSync:')),
    ['rmSync:/tmp/wt']
  )
  assert.equal(result.worktreeRemoved, true)
  assert.equal(result.restoreVerified, true)
  assert.ok(result.phases.pm2RestartMs >= 0)
  assert.deepEqual(summary.teardownErrors, [])
})

test('executeTeardown skips the rmSync fallback when git worktree remove succeeds', async () => {
  const calls = []
  let removed = false
  const summary = { phases: {}, restoreVerified: false }
  const result = await executeTeardown({
    steps: teardownSteps({ keepWorktree: false, worktreeDir: '/tmp/wt' }),
    devPid: null,
    summary,
    sh: (command, args) => {
      calls.push([command, ...args].join(' '))
      if (command === 'git' && args[1] === 'remove') removed = true
      return { status: 0, stdout: '', stderr: '' }
    },
    killGroup: () => {},
    waitForPortFreed: async () => true,
    verifyRestore: async () => true,
    exists: () => !removed,
    removePath: path => calls.push(`rmSync:${path}`),
  })
  assert.deepEqual(
    calls.filter(call => call.startsWith('rmSync:')),
    []
  )
  assert.equal(result.worktreeRemoved, true)
  assert.deepEqual(summary.teardownErrors, [])
})

test('executeTeardown records a failing step and still runs the remaining invariant', async () => {
  const calls = []
  const summary = { phases: {}, restoreVerified: false }
  const result = await executeTeardown({
    steps: teardownSteps({ keepWorktree: false, worktreeDir: '/tmp/wt' }),
    devPid: null,
    summary,
    sh: (command, args) => {
      calls.push([command, ...args].join(' '))
      if (command === 'pm2') return { status: 1, stdout: '', stderr: 'daemon down' }
      return { status: 0, stdout: '', stderr: '' }
    },
    killGroup: () => {},
    waitForPortFreed: async () => false,
    verifyRestore: async () => false,
    exists: () => false,
    removePath: () => calls.push('rmSync'),
  })
  assert.equal(result.restoreVerified, false)
  assert.ok(summary.teardownErrors.some(message => message.startsWith('pm2-restart:')))
  assert.ok(
    calls.includes('git worktree remove --force /tmp/wt'),
    'worktree removal still ran after the failed restart'
  )
})

test('runIsolatedE2E records devSpawnError, still tears down, and exits non-zero', async () => {
  const calls = []
  let pm2Stopped = false
  let pm2Restarted = false
  const sh = (command, args = []) => {
    calls.push([command, ...args].join(' '))
    if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'abc1234def\n' }
    if (command === 'pm2' && args[0] === 'jlist') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { name: PM2_PROC_NAME, pid: 80620, pm2_env: { status: 'online' } },
        ]),
      }
    }
    if (command === 'lsof') {
      return { status: 0, stdout: pm2Stopped && !pm2Restarted ? '' : '80725\n' }
    }
    if (command === 'ps') {
      return { status: 0, stdout: ' 80620     1\n 80724  80620\n 80725  80724\n' }
    }
    if (command === 'pm2' && args[0] === 'stop') {
      pm2Stopped = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === 'pm2' && args[0] === 'restart') {
      pm2Restarted = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === 'git' && args[1] === 'remove') {
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 0, stdout: '', stderr: '' }
  }
  const stdout = []
  const stderr = []
  const result = await runIsolatedE2E({
    argv: ['--ready-timeout-seconds', '1'],
    sh,
    spawnDev: (command, args) => {
      calls.push(`spawnDev:${command} ${args.join(' ')}`)
      return {
        pid: 4242,
        unref() {},
        on(event, callback) {
          if (event === 'error') callback(new Error('spawn npx ENOENT'))
        },
      }
    },
    probeUrl: async () => (pm2Restarted ? 200 : null),
    waitMs: async () => {},
    killGroup: pid => calls.push(`kill:${pid}`),
    openLog: () => 3,
    // Fake filesystem: env files exist; the fake worktree path NEVER does.
    // buildPlan's exists(worktreeDir) must be false pre-run, and after a
    // successful removal it stays false, so executeTeardown's !exists holds.
    exists: target => {
      if (target.endsWith('.env.local') || target.endsWith('.env.e2e')) return true
      return !target.startsWith('/private/tmp/e2e-isolated-')
    },
    restoreTimeoutSeconds: 2,
    writeStdout: message => stdout.push(message),
    writeStderr: message => stderr.push(message),
  })
  assert.equal(result.exitCode, 1)
  assert.ok(calls.includes('spawnDev:npx next dev --webpack -p 3100'), 'dev runs under npx (H1a)')
  assert.ok(calls.includes('kill:4242'), 'teardown killed the dev process group')
  assert.ok(!calls.some(call => call.startsWith('npm run test:e2e:full')), 'run never started')
  const summary = JSON.parse(stdout.at(-1))
  assert.match(summary.devSpawnError, /ENOENT/)
  assert.equal(summary.exitCode, 1)
  assert.equal(summary.restoreVerified, true)
  assert.equal(summary.portFreed, true)
  assert.equal(summary.worktreeRemoved, true)
  assert.equal(summary.worktreeKept, false)
  assert.deepEqual(summary.teardownErrors, [])
  assert.ok(summary.phases.pm2RestartMs >= 0)
  assert.ok(stderr.join('\n').length > 0, 'readiness failure is reported')
})

test('runIsolatedE2E failed restore overrides exitCode in JSON and process exit (M7/M3)', async () => {
  let pm2Stopped = false
  const sh = (command, args = []) => {
    if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'abc1234def\n' }
    if (command === 'pm2' && args[0] === 'jlist') {
      return {
        status: 0,
        stdout: JSON.stringify([
          {
            name: PM2_PROC_NAME,
            pid: 80620,
            pm2_env: { status: pm2Stopped ? 'stopped' : 'online' },
          },
        ]),
      }
    }
    if (command === 'lsof') return { status: 0, stdout: pm2Stopped ? '' : '80725\n' }
    if (command === 'ps') {
      return { status: 0, stdout: ' 80620     1\n 80724  80620\n 80725  80724\n' }
    }
    if (command === 'pm2' && args[0] === 'stop') {
      pm2Stopped = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === 'pm2' && args[0] === 'restart') {
      return { status: 1, stdout: '', stderr: 'daemon down' }
    }
    if (command === 'git' && args[1] === 'remove') {
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 0, stdout: '', stderr: '' }
  }
  const stdout = []
  const stderr = []
  const result = await runIsolatedE2E({
    argv: ['--ready-timeout-seconds', '1'],
    sh,
    spawnDev: () => ({ pid: 4242, unref() {}, on() {} }),
    probeUrl: async () => null,
    waitMs: async () => {},
    killGroup: () => {},
    openLog: () => 3,
    // Fake filesystem: env files exist; the fake worktree path NEVER does.
    // buildPlan's exists(worktreeDir) must be false pre-run, and after a
    // successful removal it stays false, so executeTeardown's !exists holds.
    exists: target => {
      if (target.endsWith('.env.local') || target.endsWith('.env.e2e')) return true
      return !target.startsWith('/private/tmp/e2e-isolated-')
    },
    restoreTimeoutSeconds: 0.2,
    writeStdout: message => stdout.push(message),
    writeStderr: message => stderr.push(message),
  })
  assert.equal(result.exitCode, 1)
  const summary = JSON.parse(stdout.at(-1))
  assert.equal(summary.exitCode, 1, 'JSON exitCode matches the process exit (M7)')
  assert.equal(summary.restoreVerified, false)
  assert.equal(summary.worktreeRemoved, true, 'removal still ran after the failed restart (M5)')
  assert.ok(stderr.join('\n').includes('CRITICAL: PM2 restore NOT verified'))
  assert.ok(summary.teardownErrors.some(message => message.startsWith('pm2-restart:')))
})

test('parseIsolatedArgv rejects empty inline values for value flags (L10)', () => {
  assert.throws(() => parseIsolatedArgv(['--base='], DEFAULTS), /Missing value for --base/)
  assert.throws(() => parseIsolatedArgv(['--worktree-dir='], DEFAULTS), /Missing value/)
  assert.throws(() => parseIsolatedArgv(['--ready-timeout-seconds='], DEFAULTS), /Missing value/)
})

test('teardownSteps embeds injected pin seams in pm2/git commands (M1)', () => {
  const steps = teardownSteps({
    keepWorktree: false,
    worktreeDir: '/tmp/wt',
    pins: resolvePins({ RUN_E2E_ISOLATED_PM2: '/custom/pm2', RUN_E2E_ISOLATED_GIT: '/custom/git' }),
  })
  assert.deepEqual(steps.find(step => step.step === 'pm2-restart').command, [
    '/custom/pm2',
    'restart',
    PM2_PROC_NAME,
  ])
  const removal = steps.find(step => step.step === 'worktree-remove')
  assert.deepEqual(removal.commands, [
    ['/custom/git', 'worktree', 'remove', '--force', '/tmp/wt'],
    ['/custom/git', 'worktree', 'prune'],
  ])
})

test('runIsolatedE2E green path executes the full lifecycle with pin seams (M1/M5)', async () => {
  const calls = []
  let spawned = false
  let pm2Stopped = false
  let pm2Restarted = false
  const pins = resolvePins({
    RUN_E2E_ISOLATED_PM2: '/custom/pm2',
    RUN_E2E_ISOLATED_LSOF: '/custom/lsof',
    RUN_E2E_ISOLATED_GIT: '/custom/git',
    RUN_E2E_ISOLATED_PS: '/custom/ps',
    RUN_E2E_ISOLATED_NPM: '/custom/npm',
  })
  const sh = (command, args = []) => {
    calls.push([command, ...args].join(' '))
    if (command === '/custom/git' && args[0] === 'rev-parse') {
      return { status: 0, stdout: 'abc1234def\n' }
    }
    if (command === '/custom/pm2' && args[0] === 'jlist') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { name: PM2_PROC_NAME, pid: 80620, pm2_env: { status: 'online' } },
        ]),
      }
    }
    if (command === '/custom/lsof') {
      return { status: 0, stdout: pm2Stopped && !pm2Restarted ? '' : '80725\n' }
    }
    if (command === '/custom/ps') {
      return { status: 0, stdout: ' 80620     1\n 80724  80620\n 80725  80724\n' }
    }
    if (command === '/custom/pm2' && args[0] === 'stop') {
      pm2Stopped = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === '/custom/npm') {
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === '/custom/pm2' && args[0] === 'restart') {
      pm2Restarted = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === '/custom/git' && args[1] === 'remove') {
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 0, stdout: '', stderr: '' }
  }
  const stdout = []
  const result = await runIsolatedE2E({
    argv: [],
    pins,
    sh,
    spawnDev: (command, args) => {
      spawned = true
      calls.push(`spawnDev:${command} ${args.join(' ')}`)
      return { pid: 4242, unref() {}, on() {} }
    },
    probeUrl: async () => (spawned ? 200 : null),
    waitMs: async () => {},
    killGroup: pid => calls.push(`kill:${pid}`),
    openLog: () => 3,
    // Fake filesystem: env files exist; the fake worktree path NEVER does.
    // buildPlan's exists(worktreeDir) must be false pre-run, and after a
    // successful removal it stays false, so executeTeardown's !exists holds.
    exists: target => {
      if (target.endsWith('.env.local') || target.endsWith('.env.e2e')) return true
      return !target.startsWith('/private/tmp/e2e-isolated-')
    },
    restoreTimeoutSeconds: 2,
    writeStdout: message => stdout.push(message),
    writeStderr: () => {},
  })
  // Full happy-path ordering: provision → stop → spawn → ready → run →
  // kill → restart → verify → removal.
  const indexOf = prefix => calls.findIndex(call => call.startsWith(prefix))
  for (const [earlier, later] of [
    ['/custom/git worktree add', 'ln -s'],
    ['ln -s', 'cp '],
    ['cp ', '/custom/pm2 stop'],
    ['/custom/pm2 stop', 'spawnDev:npx'],
    ['spawnDev:npx', '/custom/npm run test:e2e:full'],
    ['/custom/npm run test:e2e:full', 'kill:4242'],
    ['kill:4242', '/custom/pm2 restart'],
    ['/custom/pm2 restart', '/custom/git worktree remove'],
  ]) {
    assert.ok(indexOf(earlier) !== -1 && indexOf(earlier) < indexOf(later), `${earlier} < ${later}`)
  }
  assert.ok(calls.includes('/custom/lsof -ti tcp:3100'), 'lsof pin reaches port probes')
  assert.ok(calls.includes('/custom/ps -axo pid=,ppid='), 'ps pin reaches pid-table reads')
  assert.equal(result.exitCode, 0)
  const summary = JSON.parse(stdout.at(-1))
  assert.equal(summary.exitCode, 0)
  assert.equal(summary.restoreVerified, true)
  assert.equal(summary.portFreed, true)
  assert.equal(summary.worktreeRemoved, true)
  assert.ok(summary.phases.runMs >= 0)
  assert.deepEqual(summary.teardownErrors, [])
})

test('runIsolatedE2E aborts promptly when interrupted during readiness (M3/M5b)', async () => {
  const calls = []
  let pm2Stopped = false
  let pm2Restarted = false
  let signalHandler = null
  let readinessPolls = 0
  let interruptFired = false
  const sh = (command, args = []) => {
    calls.push([command, ...args].join(' '))
    if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'abc1234def\n' }
    if (command === 'pm2' && args[0] === 'jlist') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { name: PM2_PROC_NAME, pid: 80620, pm2_env: { status: 'online' } },
        ]),
      }
    }
    if (command === 'lsof') {
      return { status: 0, stdout: pm2Stopped && !pm2Restarted ? '' : '80725\n' }
    }
    if (command === 'ps') {
      return { status: 0, stdout: ' 80620     1\n 80724  80620\n 80725  80724\n' }
    }
    if (command === 'pm2' && args[0] === 'stop') {
      pm2Stopped = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === 'pm2' && args[0] === 'restart') {
      pm2Restarted = true
      return { status: 0, stdout: '', stderr: '' }
    }
    if (command === 'git' && args[1] === 'remove') {
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 0, stdout: '', stderr: '' }
  }
  const stdout = []
  const stderr = []
  const result = await runIsolatedE2E({
    // 30s readiness budget — the interrupt must cut the poll off long before.
    argv: ['--ready-timeout-seconds', '30'],
    sh,
    spawnDev: () => ({ pid: 4242, unref() {}, on() {} }),
    probeUrl: async () => {
      // Count READINESS polls only — after the interrupt fires, the teardown
      // restore-verify keeps busy-polling this probe for its own 0.2s budget,
      // which must not contaminate the readiness-abort measurement.
      if (!interruptFired) {
        readinessPolls += 1
        if (readinessPolls === 2) {
          interruptFired = true
          signalHandler('SIGINT') // Ctrl+C lands mid-readiness
        }
      }
      return null
    },
    waitMs: async () => {},
    killGroup: pid => calls.push(`kill:${pid}`),
    openLog: () => 3,
    // Fake filesystem: env files exist; the fake worktree path NEVER does.
    // buildPlan's exists(worktreeDir) must be false pre-run, and after a
    // successful removal it stays false, so executeTeardown's !exists holds.
    exists: target => {
      if (target.endsWith('.env.local') || target.endsWith('.env.e2e')) return true
      return !target.startsWith('/private/tmp/e2e-isolated-')
    },
    registerSignals: handler => {
      signalHandler = handler
      return () => {}
    },
    restoreTimeoutSeconds: 0.2,
    writeStdout: message => stdout.push(message),
    writeStderr: message => stderr.push(message),
  })
  assert.equal(result.exitCode, 1)
  assert.equal(result.interrupted, 'SIGINT', 're-raise is reported to the CLI layer only')
  assert.ok(
    readinessPolls <= 4 && interruptFired,
    `readiness aborted after ${readinessPolls} polls, not the 30s budget`
  )
  assert.ok(calls.includes('kill:4242'), 'guaranteed teardown still killed the dev group')
  assert.ok(calls.includes('pm2 restart wb-repricer-frontend-dev'))
  assert.ok(
    calls.some(call => call.startsWith('git worktree remove --force /private/tmp/e2e-isolated-'))
  )
  assert.ok(stderr.join('\n').includes('Interrupted (SIGINT)'))
  const summary = JSON.parse(stdout.at(-1))
  assert.equal(summary.exitCode, 1)
  assert.equal(summary.restoreVerified, false, 'probe stays down, so attestation stays false')
})

test('runIsolatedE2E keeps portFreed false when no dev server was spawned (L7)', async () => {
  let pm2Restarted = false
  const sh = (command, args = []) => {
    if (command === 'git' && args[0] === 'rev-parse') return { status: 0, stdout: 'abc1234def\n' }
    if (command === 'pm2' && args[0] === 'jlist') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { name: PM2_PROC_NAME, pid: 80620, pm2_env: { status: 'online' } },
        ]),
      }
    }
    if (command === 'lsof') return { status: 0, stdout: pm2Restarted ? '80725\n' : '' }
    if (command === 'ps') {
      return { status: 0, stdout: ' 80620     1\n 80724  80620\n 80725  80724\n' }
    }
    if (command === 'pm2' && args[0] === 'restart') {
      pm2Restarted = true
      return { status: 0, stdout: '', stderr: '' }
    }
    return { status: 0, stdout: '', stderr: '' }
  }
  const stdout = []
  const result = await runIsolatedE2E({
    // Port starts free (portState 'free'): no pm2 stop, and the dev spawn
    // fails immediately with no pid, so the stop-dev-kill step never runs.
    argv: ['--ready-timeout-seconds', '1'],
    sh,
    spawnDev: () => ({ pid: undefined, unref() {}, on() {} }),
    probeUrl: async () => (pm2Restarted ? 200 : null),
    waitMs: async () => {},
    killGroup: () => {},
    openLog: () => 3,
    exists: target => {
      if (target.endsWith('.env.local') || target.endsWith('.env.e2e')) return true
      return !target.startsWith('/private/tmp/e2e-isolated-')
    },
    restoreTimeoutSeconds: 2,
    writeStdout: message => stdout.push(message),
    writeStderr: () => {},
  })
  assert.equal(result.exitCode, 1)
  const summary = JSON.parse(stdout.at(-1))
  assert.equal(summary.restoreVerified, true)
  assert.equal(summary.worktreeRemoved, true)
  // L7: stop-dev-kill never ran (devPid null), so portFreed keeps its
  // initialized false instead of being omitted from the summary.
  assert.equal(summary.portFreed, false)
})
