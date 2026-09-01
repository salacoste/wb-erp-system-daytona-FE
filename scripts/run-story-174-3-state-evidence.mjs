import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { readStory1743Manifest } from './lib/story-174-3-manifest.mjs'
import {
  story1743DefaultExecutions,
  story1743ExactOwnerExecutions,
  story1743ExecutionKey,
  story1743MergeReadyExecutions,
} from './lib/story-174-3-execution-requirements.mjs'

const ROOT = process.cwd()
const STORY_RUNNER_SOURCE = 'e2e/shadcn-migration-visual-accessibility.spec.ts'
const MANIFEST_PATH = 'e2e/fixtures/story-174-3/execution-manifest.json'
const NPM_CLI = process.env.STORY_174_3_NPM_CLI
const mode = process.argv[2] ?? '--all'
const allowedModes = new Set([
  '--owner-units',
  '--owner-browsers',
  '--dedicated-routes',
  '--owners',
  '--defaults',
  '--all',
])

if (!allowedModes.has(mode)) {
  throw new Error(
    'Usage: node scripts/run-story-174-3-state-evidence.mjs ' +
      '[--owner-units|--owner-browsers|--dedicated-routes|--owners|--defaults|--all]'
  )
}

const key = story1743ExecutionKey
const exactOwnerExecutions = () => story1743ExactOwnerExecutions(ROOT)
const defaultExecutions = () => story1743DefaultExecutions(ROOT)

function run(command, args, options = {}) {
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...options.env },
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  return {
    command: [command, ...args].join(' '),
    exitCode: result.status ?? 1,
    startedAt,
    durationMs: Date.now() - startedMs,
  }
}

function runNpm(args, options = {}) {
  return NPM_CLI ? run(process.execPath, [NPM_CLI, ...args], options) : run('npm', args, options)
}

function vitestOutcomes(report) {
  const outcomes = new Map()
  for (const suite of report.testResults ?? []) {
    const source = relative(ROOT, suite.name).replaceAll('\\', '/')
    for (const assertion of suite.assertionResults ?? []) {
      outcomes.set(key(source, assertion.title), assertion.status)
    }
  }
  return outcomes
}

function playwrightOutcomes(report) {
  const outcomes = new Map()
  const testRoot = report.config?.rootDir ?? resolve(ROOT, 'e2e')
  const canonicalSource = source => {
    if (!source) return ''
    const absoluteSource = source.startsWith('/') ? source : resolve(testRoot, source)
    return relative(ROOT, absoluteSource).replaceAll('\\', '/')
  }

  function visitSuite(suite, inheritedFile) {
    // network-test wraps Playwright's test declaration, so nested suites/specs
    // report the fixture file. The top-level suite retains the actual spec file;
    // keep that identity throughout the subtree instead of letting wrappers
    // substitute fixtures/network-test.ts in the execution manifest.
    const suiteFile = inheritedFile ?? suite.file
    for (const spec of suite.specs ?? []) {
      const source = canonicalSource(suiteFile ?? spec.file)
      const results = (spec.tests ?? []).flatMap(test => test.results ?? [])
      const lastResult = results.at(-1)
      const result =
        lastResult?.status === 'passed'
          ? 'passed'
          : lastResult?.status === 'skipped'
            ? 'skipped'
            : 'failed'
      outcomes.set(key(source, spec.title), result)
      if (source === STORY_RUNNER_SOURCE) {
        const defaultScenario = spec.title.match(
          /^\d+\.\d+\s+(\/.* has privacy-safe width\/theme\/axe\/focus evidence)$/
        )?.[1]
        if (defaultScenario) outcomes.set(key(source, defaultScenario), result)
      }
    }
    for (const child of suite.suites ?? []) visitSuite(child, suiteFile)
  }

  for (const suite of report.suites ?? []) visitSuite(suite)
  return outcomes
}

function executeVitest(required, tempRoot) {
  if (required.length === 0) return []
  const sources = [...new Set(required.map(item => item.source))].sort()
  const output = resolve(tempRoot, 'vitest.json')
  const invocation = runNpm([
    'test',
    '--',
    '--run',
    '--reporter=json',
    '--outputFile=' + output,
    ...sources,
  ])
  if (invocation.exitCode !== 0 || !existsSync(output)) {
    throw new Error('Vitest evidence command failed with exit code ' + invocation.exitCode)
  }
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const outcomes = vitestOutcomes(report)
  return materializeEntries(required, outcomes, invocation)
}

function executePlaywright(required, tempRoot, recordingDefaults) {
  if (required.length === 0) return []
  const sources = [...new Set(required.map(item => item.source))].sort()
  const output = resolve(tempRoot, recordingDefaults ? 'defaults.json' : 'owners.json')
  const invocation = runNpm(['run', 'test:e2e:full', '--', ...sources, '--reporter=json'], {
    env: {
      PLAYWRIGHT_JSON_OUTPUT_FILE: output,
      ...(recordingDefaults ? { STORY_174_3_RECORDING_DEFAULTS: '1' } : {}),
    },
  })
  if (invocation.exitCode !== 0 || !existsSync(output)) {
    throw new Error('Playwright evidence command failed with exit code ' + invocation.exitCode)
  }
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const outcomes = playwrightOutcomes(report)
  return materializeEntries(required, outcomes, invocation)
}

function materializeEntries(required, outcomes, invocation) {
  const entries = required.map(item => {
    const outcome = outcomes.get(key(item.source, item.scenarioId))
    if (!outcome) {
      throw new Error(
        'Runner output is missing exact scenario: ' + item.source + ' :: ' + item.scenarioId
      )
    }
    return {
      ...item,
      command: invocation.command,
      result: outcome,
      exitCode: invocation.exitCode,
      startedAt: invocation.startedAt,
      durationMs: invocation.durationMs,
    }
  })
  const failed = entries.filter(entry => entry.result !== 'passed' || entry.exitCode !== 0)
  if (failed.length > 0) {
    throw new Error(
      'Story 174.3 evidence run failed closed for ' +
        failed.map(entry => basename(entry.source) + ' :: ' + entry.scenarioId).join(', ')
    )
  }
  return entries
}

function npmVersion() {
  const result = NPM_CLI
    ? spawnSync(process.execPath, [NPM_CLI, '--version'], { cwd: ROOT, encoding: 'utf8' })
    : spawnSync('npm', ['--version'], { cwd: ROOT, encoding: 'utf8' })
  if (result.status !== 0) throw new Error('Unable to read npm version')
  return result.stdout.trim()
}

function writeManifest(entries) {
  const seen = new Set()
  for (const entry of entries) {
    const entryKey = key(entry.source, entry.scenarioId)
    if (seen.has(entryKey)) {
      throw new Error('Refusing to write duplicate execution entry: ' + entryKey)
    }
    seen.add(entryKey)
  }
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    runtime: { node: process.version, npm: npmVersion() },
    entries: [...entries].sort(
      (left, right) =>
        left.source.localeCompare(right.source) || left.scenarioId.localeCompare(right.scenarioId)
    ),
  }
  writeFileSync(resolve(ROOT, MANIFEST_PATH), JSON.stringify(manifest, null, 2) + '\n')
}

function assertMergeReadyEntries(entries) {
  const required = story1743MergeReadyExecutions(ROOT)
  const requiredByKey = new Map(required.map(item => [key(item.source, item.scenarioId), item]))
  const entriesByKey = new Map(entries.map(item => [key(item.source, item.scenarioId), item]))

  if (entriesByKey.size !== entries.length) {
    throw new Error('Story 174.3 merge-ready manifest contains duplicate execution keys')
  }
  for (const [entryKey, entry] of entriesByKey) {
    const expectation = requiredByKey.get(entryKey)
    if (!expectation) {
      throw new Error('Story 174.3 merge-ready manifest contains unexpected execution: ' + entryKey)
    }
    if (
      entry.sourceSha256 !== expectation.sourceSha256 ||
      entry.runner !== expectation.runner ||
      entry.result !== 'passed' ||
      entry.exitCode !== 0 ||
      !entry.command ||
      !entry.startedAt ||
      entry.durationMs < 0
    ) {
      throw new Error('Story 174.3 merge-ready execution is stale or incomplete: ' + entryKey)
    }
  }
  for (const requiredKey of requiredByKey.keys()) {
    if (!entriesByKey.has(requiredKey)) {
      throw new Error('Story 174.3 merge-ready manifest is missing execution: ' + requiredKey)
    }
  }
}

const tempRoot = mkdtempSync(resolve(tmpdir(), 'story-174-3-state-evidence-'))
try {
  let entries = readStory1743Manifest(resolve(ROOT, MANIFEST_PATH)).entries
  const owners = exactOwnerExecutions()
  if (mode === '--owner-units' || mode === '--owners' || mode === '--all') {
    entries = [
      ...entries.filter(entry => entry.runner !== 'vitest'),
      ...executeVitest(
        owners.filter(item => item.runner === 'vitest'),
        tempRoot
      ),
    ]
    writeManifest(entries)
  }
  if (mode === '--owner-browsers' || mode === '--owners' || mode === '--all') {
    const browserKeys = new Set(
      owners
        .filter(item => item.runner === 'playwright')
        .map(item => key(item.source, item.scenarioId))
    )
    entries = [
      ...entries.filter(entry => !browserKeys.has(key(entry.source, entry.scenarioId))),
      ...executePlaywright(
        owners.filter(item => item.runner === 'playwright'),
        tempRoot,
        false
      ),
    ]
    writeManifest(entries)
  }
  if (mode === '--dedicated-routes') {
    const dedicated = owners.filter(
      item => item.source === 'e2e/story-174-3-dedicated-route-evidence.spec.ts'
    )
    const dedicatedKeys = new Set(dedicated.map(item => key(item.source, item.scenarioId)))
    entries = [
      ...entries.filter(entry => !dedicatedKeys.has(key(entry.source, entry.scenarioId))),
      ...executePlaywright(dedicated, tempRoot, false),
    ]
    writeManifest(entries)
  }
  if (mode === '--defaults' || mode === '--all') {
    const defaults = defaultExecutions()
    const ownerKeys = new Set(owners.map(item => key(item.source, item.scenarioId)))
    const ownerEntries = entries.filter(entry => ownerKeys.has(key(entry.source, entry.scenarioId)))
    if (ownerEntries.length !== ownerKeys.size) {
      throw new Error(
        'Run --owners first; the existing manifest does not cover every owner scenario'
      )
    }
    entries = [...ownerEntries, ...executePlaywright(defaults, tempRoot, true)]
    assertMergeReadyEntries(entries)
    writeManifest(entries)
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
