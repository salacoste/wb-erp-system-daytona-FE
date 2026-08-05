import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { E2E_PREFLIGHT_HELP, REQUIRED_E2E_VARIABLES, runE2EPreflight } from './e2e-preflight.mjs'
import {
  assertLocalE2EPreflightHandshake,
  assertPlaywrightDependenciesEnabled,
  createE2EPreflightHandshake,
  establishHistoricalSppExecution,
  HANDSHAKE_FILE_VARIABLE,
  HANDSHAKE_TOKEN_VARIABLE,
  HANDSHAKE_VERIFIED_VARIABLE,
  HISTORICAL_SPP_COMMAND_VARIABLE,
  isHistoricalSppExactCommand,
  isCIEnvironment,
  requiresLocalE2EPreflight,
} from './e2e-preflight-handshake.mjs'

const SECRET_EMAIL = 'owner-secret@example.test'
const SECRET_PASSWORD = 'owner-secret-password'
const MUTATION_ACK = 'I_UNDERSTAND_THIS_MUTATES_TEST_DATA'

function validEnvironment(overrides = {}) {
  return {
    E2E_BASE_URL: 'http://localhost:3100',
    E2E_API_URL: 'http://127.0.0.1:3000',
    E2E_TEST_EMAIL: SECRET_EMAIL,
    E2E_TEST_PASSWORD: SECRET_PASSWORD,
    ...overrides,
  }
}

function serializeEnvironment(environment) {
  return `${Object.entries(environment)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}\n`
}

async function withTemporaryRoot(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'e2e-preflight-'))
  try {
    await mkdir(path.join(root, 'e2e', '.auth'), { recursive: true })
    await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

async function writeEnvironment(root, environment = validEnvironment()) {
  await writeFile(path.join(root, '.env.e2e'), serializeEnvironment(environment), 'utf8')
}

function createHarness(root, overrides = {}) {
  const stdout = []
  const stderr = []
  const probes = []
  const removals = []
  const launches = []
  const runnerOptions = []
  const events = []

  const fetchFn =
    overrides.fetchFn ??
    (async (url, options) => {
      probes.push({ url: String(url), options })
      events.push(`probe:${new URL(url).port}`)
      return { ok: true, status: 200 }
    })
  const removeFile =
    overrides.removeFile ??
    (async file => {
      removals.push(file)
      events.push(`remove:${path.basename(file)}`)
    })
  const runCommand =
    overrides.runCommand ??
    (async (command, args, options) => {
      launches.push({ command, args })
      runnerOptions.push(options)
      events.push('launch')
      return { code: 0, signal: null }
    })

  return {
    stdout,
    stderr,
    probes,
    removals,
    launches,
    runnerOptions,
    events,
    run(args = [], environment = {}) {
      return runE2EPreflight({
        cwd: root,
        args,
        environment,
        createHandshake: overrides.createHandshake,
        fetchFn,
        removeFile,
        runCommand,
        timeoutMs: 25,
        writeStdout: message => stdout.push(String(message)),
        writeStderr: message => stderr.push(String(message)),
      })
    },
  }
}

function combinedOutput(harness, result) {
  return [harness.stdout.join('\n'), harness.stderr.join('\n'), JSON.stringify(result)].join('\n')
}

test('--help is deterministic and performs no filesystem, network, or runner work', async () => {
  await withTemporaryRoot(async root => {
    const harness = createHarness(root)
    const result = await harness.run(['--help'])

    assert.equal(result.exitCode, 0)
    assert.equal(harness.stdout.join('\n'), E2E_PREFLIGHT_HELP)
    assert.deepEqual(harness.probes, [])
    assert.deepEqual(harness.removals, [])
    assert.deepEqual(harness.launches, [])
  })
})

test('an absent .env.e2e fails with actionable local setup guidance', async () => {
  await withTemporaryRoot(async root => {
    const harness = createHarness(root)
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    assert.match(output, /\.env\.e2e/)
    assert.match(output, /\.env\.e2e\.example/)
    assert.match(output, /cp \.env\.e2e\.example \.env\.e2e/)
    for (const variable of REQUIRED_E2E_VARIABLES) assert.match(output, new RegExp(variable))
    assert.deepEqual(harness.probes, [])
    assert.deepEqual(harness.launches, [])
  })
})

test('whitespace-only values report every required variable together', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(
      root,
      Object.fromEntries(REQUIRED_E2E_VARIABLES.map(variable => [variable, '   ']))
    )
    const harness = createHarness(root)
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    for (const variable of REQUIRED_E2E_VARIABLES) assert.match(output, new RegExp(variable))
    assert.match(output, /\.env\.e2e\.example/)
    assert.deepEqual(harness.probes, [])
  })
})

test('each required variable is independently enforced', async t => {
  for (const variable of REQUIRED_E2E_VARIABLES) {
    await t.test(variable, async () => {
      await withTemporaryRoot(async root => {
        const environment = validEnvironment()
        delete environment[variable]
        await writeEnvironment(root, environment)
        const harness = createHarness(root)
        const result = await harness.run()

        assert.equal(result.exitCode, 1)
        assert.match(combinedOutput(harness, result), new RegExp(variable))
        assert.deepEqual(harness.probes, [])
      })
    })
  }
})

test('frontend-only failure is service-specific and blocks Playwright', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async url =>
        new URL(url).port === '3100' ? { ok: false, status: 503 } : { ok: true, status: 200 },
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 1)
    assert.match(harness.stderr.join('\n'), /Frontend.*unavailable/i)
    assert.doesNotMatch(harness.stderr.join('\n'), /Backend.*unavailable/i)
    assert.deepEqual(harness.launches, [])
    assert.deepEqual(harness.removals, [])
  })
})

test('backend-only failure is service-specific and blocks Playwright', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async url =>
        new URL(url).port === '3000' ? { ok: false, status: 500 } : { ok: true, status: 200 },
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 1)
    assert.match(harness.stderr.join('\n'), /Backend.*unavailable/i)
    assert.doesNotMatch(harness.stderr.join('\n'), /Frontend.*unavailable/i)
    assert.deepEqual(harness.launches, [])
  })
})

test('timeouts are unhealthy without retaining the thrown message', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async url => {
        if (new URL(url).port === '3100') {
          throw Object.assign(new Error(`timed out with ${SECRET_PASSWORD}`), {
            name: 'AbortError',
          })
        }
        return { ok: true, status: 200 }
      },
    })
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    assert.match(output, /Frontend.*timed out/i)
    assert.doesNotMatch(output, new RegExp(SECRET_PASSWORD))
  })
})

test('manual redirects are rejected and never followed', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async (url, options) => {
        assert.equal(options.redirect, 'manual')
        return new URL(url).port === '3000' ? { ok: false, status: 302 } : { ok: true, status: 200 }
      },
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 1)
    assert.match(harness.stderr.join('\n'), /Backend.*redirect/i)
    assert.deepEqual(harness.launches, [])
  })
})

test('service failures are aggregated into one actionable result', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async url => ({
        ok: false,
        status: new URL(url).port === '3100' ? 404 : 503,
      }),
    })
    const result = await harness.run()
    const output = harness.stderr.join('\n')

    assert.equal(result.exitCode, 1)
    assert.equal(result.errors.length, 2)
    assert.match(output, /Frontend.*unavailable/i)
    assert.match(output, /Backend.*unavailable/i)
  })
})

test('configured credential values never appear in output or returned errors', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async () => {
        throw new Error(`${SECRET_EMAIL}:${SECRET_PASSWORD}`)
      },
    })
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    assert.doesNotMatch(output, new RegExp(SECRET_EMAIL))
    assert.doesNotMatch(output, new RegExp(SECRET_PASSWORD))
    assert.match(output, /Frontend/)
    assert.match(output, /Backend/)
  })
})

test('shell overrides are the exact effective values probed and passed to Playwright', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const shellEnvironment = validEnvironment({
      E2E_BASE_URL: 'http://127.0.0.1:3100',
      E2E_API_URL: 'http://localhost:3000',
      E2E_TEST_EMAIL: 'shell-owner@example.test',
      E2E_TEST_PASSWORD: 'shell-owner-password',
      E2E_ENABLE_MUTATIONS: 'true',
      E2E_MUTATION_TARGET: 'sandbox',
      E2E_MUTATION_ACK: MUTATION_ACK,
    })
    const harness = createHarness(root)
    const result = await harness.run([], shellEnvironment)
    const childEnvironment = harness.runnerOptions[0].env
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 0)
    assert.deepEqual(
      harness.probes.map(probe => probe.url),
      ['http://127.0.0.1:3100/login', 'http://localhost:3000/v1/health']
    )
    for (const variable of [
      ...REQUIRED_E2E_VARIABLES,
      'E2E_ENABLE_MUTATIONS',
      'E2E_MUTATION_TARGET',
      'E2E_MUTATION_ACK',
    ]) {
      assert.equal(childEnvironment[variable], shellEnvironment[variable])
    }
    assert.equal(result.mutationsEnabled, true)
    assert.equal(childEnvironment.E2E_PREFLIGHT_PASSED, undefined)
    assert.match(childEnvironment.E2E_PREFLIGHT_HANDSHAKE_FILE, /wb-e2e-preflight-/)
    assert.match(childEnvironment.E2E_PREFLIGHT_HANDSHAKE_TOKEN, /^[a-f0-9]{64}$/)
    assert.doesNotMatch(output, /owner-secret@example\.test|owner-secret-password/)
    assert.doesNotMatch(output, /shell-owner@example\.test|shell-owner-password/)
  })
})

test('.env.e2e required values cannot be supplied only by shell overrides', async () => {
  await withTemporaryRoot(async root => {
    await writeFile(path.join(root, '.env.e2e'), '', 'utf8')
    const harness = createHarness(root)
    const result = await harness.run([], validEnvironment())
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    for (const variable of REQUIRED_E2E_VARIABLES) assert.match(output, new RegExp(variable))
    assert.deepEqual(harness.probes, [])
    assert.deepEqual(harness.launches, [])
  })
})

test('blank shell overrides fail before probes even when .env.e2e is complete', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root)
    const result = await harness.run([], { E2E_TEST_PASSWORD: '   ' })

    assert.equal(result.exitCode, 1)
    assert.match(combinedOutput(harness, result), /E2E_TEST_PASSWORD/)
    assert.deepEqual(harness.probes, [])
    assert.deepEqual(harness.launches, [])
  })
})

test('rejects malformed, credentialed, non-loopback, and wrong-port URLs before I/O', async t => {
  const scenarios = [
    ['malformed', { E2E_BASE_URL: 'not a url' }],
    ['credentialed', { E2E_BASE_URL: 'http://user:pass@localhost:3100' }],
    ['non-loopback', { E2E_API_URL: 'https://example.test:3000' }],
    ['frontend port', { E2E_BASE_URL: 'http://localhost:3000' }],
    ['backend port', { E2E_API_URL: 'http://localhost:3100' }],
  ]

  for (const [name, override] of scenarios) {
    await t.test(name, async () => {
      await withTemporaryRoot(async root => {
        await writeEnvironment(root, validEnvironment(override))
        const harness = createHarness(root)
        const result = await harness.run()

        assert.equal(result.exitCode, 1)
        assert.deepEqual(harness.probes, [])
        assert.deepEqual(harness.launches, [])
        assert.doesNotMatch(combinedOutput(harness, result), /user:pass/)
      })
    })
  }
})

test('all shared truthy aliases enable mutations case-insensitively', async t => {
  for (const alias of ['1', 'true', 'yes', 'on', 'TRUE', 'YeS', 'ON', ' true ']) {
    await t.test(alias, async () => {
      await withTemporaryRoot(async root => {
        await writeEnvironment(root)
        const harness = createHarness(root)
        const result = await harness.run(['--check-only'], {
          E2E_ENABLE_MUTATIONS: alias,
          E2E_MUTATION_TARGET: 'sandbox',
          E2E_MUTATION_ACK: MUTATION_ACK,
        })

        assert.equal(result.exitCode, 0)
        assert.equal(result.mutationsEnabled, true)
        assert.match(harness.stdout.join('\n'), /MUTATIONS ENABLED/)
      })
    })
  }
})

test('mutation target and acknowledgement remain exact', async t => {
  const scenarios = [
    ['target case', { E2E_MUTATION_TARGET: 'Sandbox' }],
    ['target whitespace', { E2E_MUTATION_TARGET: ' sandbox' }],
    ['ack case', { E2E_MUTATION_ACK: MUTATION_ACK.toLowerCase() }],
    ['ack whitespace', { E2E_MUTATION_ACK: `${MUTATION_ACK} ` }],
  ]

  for (const [name, override] of scenarios) {
    await t.test(name, async () => {
      await withTemporaryRoot(async root => {
        await writeEnvironment(root)
        const harness = createHarness(root)
        const result = await harness.run(['--check-only'], {
          E2E_ENABLE_MUTATIONS: 'true',
          E2E_MUTATION_TARGET: 'sandbox',
          E2E_MUTATION_ACK: MUTATION_ACK,
          ...override,
        })

        assert.equal(result.exitCode, 0)
        assert.equal(result.mutationsEnabled, false)
        assert.match(harness.stdout.join('\n'), /READ-ONLY/)
      })
    })
  }
})

test('incomplete mutation acknowledgement stays read-only', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root)
    const result = await harness.run(['--check-only'], {
      E2E_ENABLE_MUTATIONS: 'true',
      E2E_MUTATION_TARGET: 'sandbox',
    })

    assert.equal(result.exitCode, 0)
    assert.equal(result.mutationsEnabled, false)
    assert.match(harness.stdout.join('\n'), /READ-ONLY/)
  })
})

test('an incomplete optional Manager pair warns without blocking Owner smoke', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root, validEnvironment({ E2E_MANAGER_EMAIL: 'manager@example.test' }))
    const harness = createHarness(root)
    const result = await harness.run(['--check-only'])
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 0)
    assert.match(output, /Manager.*skip/i)
    assert.match(output, /E2E_MANAGER_PASSWORD/)
    assert.doesNotMatch(output, /manager@example\.test/)
  })
})

test('fresh auth cleanup is allowlisted, ordered after probes, and before launch', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root)
    const result = await harness.run()

    assert.equal(result.exitCode, 0)
    assert.deepEqual(
      harness.removals.map(file => path.relative(root, file)),
      ['e2e/.auth/user.json', 'e2e/.auth/manager.json']
    )
    assert.deepEqual(harness.events, [
      'probe:3100',
      'probe:3000',
      'remove:user.json',
      'remove:manager.json',
      'launch',
    ])
  })
})

test('symlinked auth directory fails closed without touching its target', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const outsideAuth = path.join(root, 'outside-auth')
    const authDirectory = path.join(root, 'e2e', '.auth')
    await mkdir(outsideAuth)
    await writeFile(path.join(outsideAuth, 'user.json'), 'owner-state', 'utf8')
    await writeFile(path.join(outsideAuth, 'manager.json'), 'manager-state', 'utf8')
    await rm(authDirectory, { recursive: true })
    await symlink(outsideAuth, authDirectory)

    const harness = createHarness(root)
    const result = await harness.run()

    assert.equal(result.exitCode, 1)
    assert.match(combinedOutput(harness, result), /auth.*symlink/i)
    assert.deepEqual(harness.removals, [])
    assert.deepEqual(harness.launches, [])
    assert.equal(await readFile(path.join(outsideAuth, 'user.json'), 'utf8'), 'owner-state')
    assert.equal(await readFile(path.join(outsideAuth, 'manager.json'), 'utf8'), 'manager-state')
  })
})

test('preflight failure leaves stale auth untouched and never launches Playwright', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      fetchFn: async () => ({ ok: false, status: 503 }),
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 1)
    assert.deepEqual(harness.removals, [])
    assert.deepEqual(harness.launches, [])
  })
})

test('success launches the exact bounded authenticated Chromium smoke', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root)
    const result = await harness.run()

    assert.equal(result.exitCode, 0)
    assert.deepEqual(harness.launches, [
      {
        command: 'npx',
        args: ['playwright', 'test', 'e2e/orders.spec.ts', '--project=chromium'],
      },
    ])
    assert.equal(result.launched, true)
  })
})

test('full-suite mode and Playwright CLI arguments are forwarded without --no-deps', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root)
    const result = await harness.run([
      '--full',
      '--',
      '--project=chromium',
      '--grep',
      'orders',
      '--list',
    ])

    assert.equal(result.exitCode, 0)
    assert.deepEqual(harness.launches[0], {
      command: 'npx',
      args: ['playwright', 'test', '--project=chromium', '--grep', 'orders', '--list'],
    })
    assert.equal(harness.launches[0].args.includes('--no-deps'), false)
  })
})

test('child non-zero exit code is propagated', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      runCommand: async () => ({ code: 7, signal: null }),
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 7)
    assert.equal(result.launched, true)
  })
})

test('handshake cleanup failure turns a successful Playwright run into a redacted failure', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const sensitivePath = '/tmp/wb-e2e-preflight-sensitive/handshake.json'
    const sensitiveToken = 'b'.repeat(64)
    const harness = createHarness(root, {
      createHandshake: async () => ({
        environment: {
          [HANDSHAKE_FILE_VARIABLE]: sensitivePath,
          [HANDSHAKE_TOKEN_VARIABLE]: sensitiveToken,
        },
        cleanup: async () => {
          throw new Error(`raw cleanup failure: ${sensitivePath} ${sensitiveToken}`)
        },
      }),
    })
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 1)
    assert.equal(result.launched, true)
    assert.match(output, /clean up.*handshake/i)
    assert.doesNotMatch(output, /raw cleanup failure/)
    assert.doesNotMatch(output, new RegExp(sensitivePath))
    assert.doesNotMatch(output, new RegExp(sensitiveToken))
  })
})

test('handshake cleanup failure preserves a non-zero Playwright exit with a redacted warning', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const sensitivePath = '/tmp/wb-e2e-preflight-sensitive/handshake.json'
    const sensitiveToken = 'c'.repeat(64)
    const harness = createHarness(root, {
      createHandshake: async () => ({
        environment: {
          [HANDSHAKE_FILE_VARIABLE]: sensitivePath,
          [HANDSHAKE_TOKEN_VARIABLE]: sensitiveToken,
        },
        cleanup: async () => {
          throw new Error(`raw cleanup failure: ${sensitivePath} ${sensitiveToken}`)
        },
      }),
      runCommand: async () => ({ code: 7, signal: null }),
    })
    const result = await harness.run()
    const output = combinedOutput(harness, result)

    assert.equal(result.exitCode, 7)
    assert.equal(result.launched, true)
    assert.match(output, /Playwright exited non-zero \(7\)/)
    assert.match(output, /clean up.*handshake/i)
    assert.doesNotMatch(output, /raw cleanup failure/)
    assert.doesNotMatch(output, new RegExp(sensitivePath))
    assert.doesNotMatch(output, new RegExp(sensitiveToken))
  })
})

test('child signal termination is propagated as a non-zero shell exit', async () => {
  await withTemporaryRoot(async root => {
    await writeEnvironment(root)
    const harness = createHarness(root, {
      runCommand: async () => ({ code: null, signal: 'SIGTERM' }),
    })
    const result = await harness.run()

    assert.equal(result.exitCode, 143)
    assert.equal(result.launched, true)
  })
})

test('local config rejects bypasses and applies one explicit CI truth contract', async () => {
  const configSource = await readFile(
    path.resolve(import.meta.dirname, '..', 'playwright.config.ts'),
    'utf8'
  )

  assert.doesNotMatch(configSource, /E2E_PREFLIGHT_PASSED/)
  assert.match(configSource, /assertLocalE2EPreflightHandshake/)
  assert.match(configSource, /assertPlaywrightDependenciesEnabled/)
  assert.match(configSource, /establishHistoricalSppExecution/)
  assert.match(configSource, /requiresLocalE2EPreflight/)
  assert.match(configSource, /const isCI = isCIEnvironment\(process\.env\)/)
  assert.doesNotMatch(configSource, /(?:!|!!)?process\.env\.CI/)
  assert.match(
    configSource,
    /if \(requiresLocalE2EPreflight\(process\.argv, process\.env\)\) assertLocalE2EPreflightHandshake\(\)/
  )
  assert.match(
    configSource,
    /process\.env\.E2E_BASE_URL \|\| \(isHistoricalSppTarget \? 'http:\/\/localhost:3100' : undefined\)/
  )
  assert.match(configSource, /forbidOnly: isCI/)
  assert.match(configSource, /retries: isCI \? 2 : 0/)
  assert.match(configSource, /workers: isCI \? 1 : undefined/)
  assert.match(configSource, /isCI && !isHistoricalSppTarget/)
})

test('only the literal mocked historical-SPP command bypasses local preflight', () => {
  const exactArgs = [
    '/opt/homebrew/opt/node@24/bin/node',
    'node_modules/.bin/playwright',
    'test',
    'e2e/historical-spp-analytics.spec.ts',
    '--reporter=html',
    '--output=../.omx/ultragoal/evidence/story-128-27/frontend/test-results',
  ]

  const exactEnvironment = {}
  assert.equal(establishHistoricalSppExecution(exactArgs, exactEnvironment), true)
  assert.equal(exactEnvironment[HISTORICAL_SPP_COMMAND_VARIABLE], '1')
  assert.equal(requiresLocalE2EPreflight(exactArgs, {}), false)
  assert.equal(requiresLocalE2EPreflight(exactArgs, { CI: 'false' }), false)
  assert.equal(requiresLocalE2EPreflight(exactArgs, { CI: 'true' }), false)

  assert.equal(
    establishHistoricalSppExecution(['/node', '/playwright'], {
      [HISTORICAL_SPP_COMMAND_VARIABLE]: '1',
    }),
    false
  )
  assert.equal(
    establishHistoricalSppExecution(['/node', '/playwright'], {
      [HISTORICAL_SPP_COMMAND_VARIABLE]: '1',
      TEST_WORKER_INDEX: '0',
    }),
    true
  )

  for (const args of [
    exactArgs.slice(0, -1),
    [...exactArgs, 'e2e/orders.spec.ts'],
    [...exactArgs.slice(0, -1), '--output=test-results'],
    [
      ...exactArgs.slice(0, -1),
      '--output=../.omx/ultragoal/evidence/story-128-27/frontend/test-results',
      '--project=chromium',
    ],
    ['/node', '/playwright', 'test', 'e2e/orders.spec.ts'],
  ]) {
    assert.equal(isHistoricalSppExactCommand(args), false)
    assert.equal(requiresLocalE2EPreflight(args, {}), true)
  }
})

test('CI truth contract recognizes only explicit provider truth values', () => {
  for (const value of ['true', 'TRUE', ' true ', '1', ' 1 ']) {
    assert.equal(isCIEnvironment({ CI: value }), true, value)
  }
  for (const value of ['false', 'FALSE', '0', 'off', 'no', '', ' ', 'provider-name']) {
    assert.equal(isCIEnvironment({ CI: value }), false, value)
  }
  assert.equal(isCIEnvironment({}), false)
})

test('fresh handshake is cwd-bound, expires before verification, and supports verified reloads', async () => {
  await withTemporaryRoot(async root => {
    const fresh = await createE2EPreflightHandshake(root)
    try {
      const environment = { ...fresh.environment }
      assert.doesNotThrow(() =>
        assertLocalE2EPreflightHandshake({ cwd: root, environment, now: Date.now() })
      )
      assert.equal(
        environment[HANDSHAKE_VERIFIED_VARIABLE],
        environment.E2E_PREFLIGHT_HANDSHAKE_TOKEN
      )
      assert.doesNotThrow(() =>
        assertLocalE2EPreflightHandshake({
          cwd: root,
          environment,
          now: Date.now() + 3_600_000,
        })
      )
      assert.throws(
        () =>
          assertLocalE2EPreflightHandshake({
            cwd: path.join(root, 'different-root'),
            environment: { ...environment },
          }),
        /fresh E2E preflight handshake/
      )
      assert.throws(
        () =>
          assertLocalE2EPreflightHandshake({
            cwd: root,
            environment: { ...fresh.environment },
            now: Date.now() + 61_000,
          }),
        /fresh E2E preflight handshake/
      )
    } finally {
      await fresh.cleanup()
    }
  })
})

test('matching caller-supplied token and verified marker cannot fabricate a handshake', () => {
  const fabricatedToken = 'a'.repeat(64)

  assert.throws(
    () =>
      assertLocalE2EPreflightHandshake({
        environment: {
          [HANDSHAKE_FILE_VARIABLE]: '/tmp/wb-e2e-preflight-fabricated/handshake.json',
          [HANDSHAKE_TOKEN_VARIABLE]: fabricatedToken,
          [HANDSHAKE_VERIFIED_VARIABLE]: fabricatedToken,
        },
      }),
    /fresh E2E preflight handshake/
  )
})

test('legacy marker spoofing and Playwright --no-deps are rejected directly', () => {
  assert.throws(
    () =>
      assertLocalE2EPreflightHandshake({
        environment: { E2E_PREFLIGHT_PASSED: '1' },
      }),
    /fresh E2E preflight handshake/
  )
  assert.throws(
    () => assertPlaywrightDependenciesEnabled(['node', 'playwright', 'test', '--no-deps']),
    /--no-deps is not allowed/
  )
})

test('Manager coverage is collected without checking manager.json at module load', async () => {
  const specSource = await readFile(
    path.resolve(import.meta.dirname, '..', 'e2e', 'orders-client-info.spec.ts'),
    'utf8'
  )

  assert.doesNotMatch(specSource, /existsSync/)
  assert.doesNotMatch(specSource, /test\.skip\([^)]*MANAGER_AUTH_FILE/s)
  assert.match(specSource, /browser\.newContext\(\{\s*storageState: MANAGER_AUTH_FILE/s)
})

test('active orchestration and E2E workflow docs use the preflight-gated full command', async () => {
  const repositoryRoot = path.resolve(import.meta.dirname, '..')
  const surfaces = [
    'scripts/manage-omx-story-plans.mjs',
    'docs/qa/BROWSER-TESTING-WORKFLOW.md',
    ...[3, 4, 5, 6, 7, 8, 9, 10].map(story => {
      const names = {
        3: 'replace-vacuous-analytics-and-finance-e2e-assertions',
        4: 'replace-vacuous-operations-and-settings-e2e-assertions',
        5: 'remove-fixed-waits-from-liquidity-and-unit-economics-e2e',
        6: 'remove-fixed-waits-from-dashboard-and-analytics-e2e',
        7: 'remove-fixed-waits-from-supplies-and-supply-planning-e2e',
        8: 'remove-fixed-waits-from-pricing-backfill-cogs-and-authentication-e2e',
        9: 'make-e2e-skips-explicit-and-fixture-aware',
        10: 'restore-bounded-mobile-critical-route-e2e-coverage',
      }
      return `.omx/plans/story-162-${story}-${names[story]}.md`
    }),
  ]

  for (const surface of surfaces) {
    const source = await readFile(path.join(repositoryRoot, surface), 'utf8')
    assert.doesNotMatch(source, /\bnpx playwright test\b/, surface)
    assert.match(source, /npm run test:e2e:full --/, surface)
  }
})
