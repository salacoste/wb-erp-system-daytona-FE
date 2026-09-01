import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  findStory1743Execution,
  indexStory1743ExecutionManifest,
  type Story1743ExecutionManifest,
  type Story1743RequiredExecution,
} from './execution-manifest'
import { STORY_174_3_STATES, type Story1743StateEvidence } from './route-contracts'
import { STORY_174_3_OWNER_VARIANT_SCENARIOS } from './owner-state-scenarios'
import { STORY_174_3_NOT_APPLICABLE_A } from './not-applicable-a'
import { STORY_174_3_NOT_APPLICABLE_B } from './not-applicable-b'
import {
  STORY_174_3_EXACT_STATE_SCENARIOS,
  type Story1743ExactStateScenario,
  type Story1743NonDefaultState,
} from './state-scenarios'
import { story1743CanonicalOwnerStateLabels } from './owner-state-reconciliation'
import { requireStory1743OwnerStateException } from './owner-state-exceptions'

const REPOSITORY_ROOT = '.'
const LEDGER_PATH = '_bmad-output/planning-artifacts/shadcn-route-ledger.md'
const MANIFEST_PATH = 'e2e/fixtures/story-174-3/execution-manifest.json'
const STORY_RUNNER_SOURCE = 'e2e/shadcn-migration-visual-accessibility.spec.ts'
const SOURCE_LINE_CACHE = new Map<string, readonly string[]>()
const RECORDING_DEFAULTS = process.env.STORY_174_3_RECORDING_DEFAULTS === '1'

export const STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES = Object.freeze({
  ...STORY_174_3_NOT_APPLICABLE_A,
  ...STORY_174_3_NOT_APPLICABLE_B,
})

const NOT_APPLICABLE_RATIONALES: Readonly<Record<Story1743NonDefaultState, string>> = {
  loading: 'has no route-owned asynchronous loading surface distinct from its default surface',
  refresh: 'has no route-owned background refresh transition',
  empty: 'has no route-owned unfiltered empty-data terminal',
  'filtered-empty': 'has no route-owned filtered-empty terminal distinct from empty',
  error: 'has no route-owned recoverable request-error terminal',
  stale: 'has no route-owned stale-data presentation after a failed refresh',
  partial: 'has no route-owned partial-data terminal',
  permission: 'has no route-owned permission-denied terminal',
  pending: 'has no route-owned pending mutation transition',
  'partial-success': 'has no route-owned partial-success mutation terminal',
  'not-found': 'has no route-owned entity-not-found terminal',
}

const NON_DEFAULT_STATES = STORY_174_3_STATES.filter(
  (state): state is Story1743NonDefaultState => state !== 'default'
)

export function validateStory1743ExplicitStateContract(
  route: string,
  executed: Readonly<Partial<Record<Story1743NonDefaultState, Story1743ExactStateScenario>>>,
  notApplicableStates: readonly Story1743NonDefaultState[]
): void {
  const knownStates = new Set<string>(NON_DEFAULT_STATES)
  const executedStates = Object.keys(executed)
  const notApplicableSet = new Set(notApplicableStates)

  for (const state of [...executedStates, ...notApplicableStates]) {
    if (!knownStates.has(state)) {
      throw new Error(route + ' declares unsupported Story 174.3 state: ' + state)
    }
  }
  if (notApplicableSet.size !== notApplicableStates.length) {
    throw new Error(route + ' has duplicate explicit not-applicable state declarations')
  }
  for (const state of NON_DEFAULT_STATES) {
    const count = Number(Object.hasOwn(executed, state)) + Number(notApplicableSet.has(state))
    if (count !== 1) {
      throw new Error(
        route +
          '/' +
          state +
          ' must have exactly one explicit disposition (executed or not-applicable); found ' +
          count
      )
    }
  }
}

export function story1743Sha256(source: string): string {
  return createHash('sha256')
    .update(readFileSync(join(REPOSITORY_ROOT, source)))
    .digest('hex')
}

function literalScenarios(source: string): Array<{ line: number; title: string }> {
  const text = readFileSync(join(REPOSITORY_ROOT, source), 'utf8')
  const pattern = /\b(?:test|it)(?:\.(?:skip|only|todo))?\s*\(\s*(['"\x60])([^\n]*?)\1/g
  return [...text.matchAll(pattern)].map(match => ({
    line: text.slice(0, match.index).split(/\r?\n/).length,
    title: match[2],
  }))
}

function ledgerRoutes(): string[] {
  const ledger = readFileSync(join(REPOSITORY_ROOT, LEDGER_PATH), 'utf8')
  const pattern = /^\| \d+\.\d+ \| \x60([^\x60]+)\x60 \|/gm
  return [...ledger.matchAll(pattern)].map(match => match[1])
}

function exactRequirements(): Story1743RequiredExecution[] {
  const requirements: Story1743RequiredExecution[] = []
  const append = (
    declaration: Story1743ExactStateScenario & { runner?: 'vitest' | 'playwright' }
  ) => {
    requirements.push({
      source: declaration.source,
      sourceSha256: story1743Sha256(declaration.source),
      scenarioId: declaration.scenarioId,
      runner: declaration.runner ?? (declaration.source.startsWith('e2e/') ? 'playwright' : 'vitest'),
    })
    declaration.supportingScenarios?.forEach(append)
  }
  for (const declarations of Object.values(STORY_174_3_EXACT_STATE_SCENARIOS)) {
    for (const declaration of Object.values(declarations)) {
      if (!declaration) continue
      append(declaration)
    }
  }
  STORY_174_3_OWNER_VARIANT_SCENARIOS.forEach(scenario => append(scenario.evidence))
  return requirements
}

function defaultRequirement(route: string): Story1743RequiredExecution {
  return {
    source: STORY_RUNNER_SOURCE,
    sourceSha256: story1743Sha256(STORY_RUNNER_SOURCE),
    scenarioId: route + ' has privacy-safe width/theme/axe/focus evidence',
    runner: 'playwright',
  }
}

let executionIndex: ReadonlyMap<string, Story1743ExecutionManifest['entries'][number]> | undefined

function getExecutionIndex() {
  if (executionIndex) return executionIndex
  const manifest = JSON.parse(
    readFileSync(join(REPOSITORY_ROOT, MANIFEST_PATH), 'utf8')
  ) as Story1743ExecutionManifest
  const required = exactRequirements()
  if (!RECORDING_DEFAULTS) {
    required.push(...ledgerRoutes().map(defaultRequirement))
  }
  executionIndex = indexStory1743ExecutionManifest(manifest, required)
  return executionIndex
}

function notApplicableAnchor(route: string, state: Story1743NonDefaultState) {
  const sources = [
    'e2e/fixtures/story-174-3/not-applicable-a.ts',
    'e2e/fixtures/story-174-3/not-applicable-b.ts',
  ]
  for (const source of sources) {
    const lines =
      SOURCE_LINE_CACHE.get(source) ??
      readFileSync(join(REPOSITORY_ROOT, source), 'utf8').split(/\r?\n/)
    SOURCE_LINE_CACHE.set(source, lines)
    const routeLine = lines.findIndex(line => line.trimStart().startsWith("'" + route + "':"))
    if (routeLine < 0) continue
    const nextRouteLine = lines.findIndex(
      (line, index) => index > routeLine && /^\s*'[^']+':/.test(line)
    )
    const stateLine = lines.findIndex(
      (line, index) =>
        index >= routeLine &&
        (nextRouteLine < 0 || index < nextRouteLine) &&
        line.includes("'" + state + "'")
    )
    if (stateLine >= 0) return { source, line: stateLine + 1 }
  }
  throw new Error('Missing explicit not-applicable declaration anchor for ' + route + '/' + state)
}

function executedEvidence(
  route: string,
  state: Story1743NonDefaultState,
  declaration: Story1743ExactStateScenario
): Story1743StateEvidence {
  const resolve = (candidate: Story1743ExactStateScenario) => {
    const matches = literalScenarios(candidate.source).filter(
      scenario => scenario.title === candidate.scenarioId
    )
    if (matches.length !== 1) {
      throw new Error(
        route +
          '/' +
          state +
          ' exact scenario must resolve once: ' +
          candidate.source +
          ' :: ' +
          candidate.scenarioId
      )
    }
    const required: Story1743RequiredExecution = {
      source: candidate.source,
      sourceSha256: story1743Sha256(candidate.source),
      scenarioId: candidate.scenarioId,
      runner: candidate.source.startsWith('e2e/') ? 'playwright' : 'vitest',
    }
    return { line: matches[0].line, result: findStory1743Execution(getExecutionIndex(), required) }
  }
  const primary = resolve(declaration)
  const supportingExecutions = declaration.supportingScenarios?.map(candidate => {
    const supporting = resolve(candidate)
    return {
      source: supporting.result.source,
      sourceSha256: supporting.result.sourceSha256,
      line: supporting.line,
      scenarioId: supporting.result.scenarioId,
      command: supporting.result.command,
      kind:
        supporting.result.runner === 'playwright'
          ? ('owner-browser-executable' as const)
          : ('owner-unit-executable' as const),
      runner: supporting.result.runner,
      exitCode: supporting.result.exitCode,
      startedAt: supporting.result.startedAt,
      durationMs: supporting.result.durationMs,
    }
  })
  const result = primary.result
  return {
    route,
    state,
    disposition: 'executed',
    rationale: route + ': exact owner scenario proves the declared ' + state + ' state',
    result: 'passed',
    source: result.source,
    sourceSha256: result.sourceSha256,
    line: primary.line,
    scenarioId: result.scenarioId,
    command: result.command,
    kind: result.runner === 'playwright' ? 'owner-browser-executable' : 'owner-unit-executable',
    runner: result.runner,
    exitCode: result.exitCode,
    startedAt: result.startedAt,
    durationMs: result.durationMs,
    ...(supportingExecutions?.length ? { supportingExecutions } : {}),
  }
}

function defaultEvidence(route: string): Story1743StateEvidence {
  const required = defaultRequirement(route)
  if (RECORDING_DEFAULTS) {
    return {
      route,
      state: 'default',
      disposition: 'executed',
      rationale: route + ': recording mode executes the consolidated Story route scenario',
      result: 'passed',
      source: required.source,
      sourceSha256: required.sourceSha256,
      scenarioId: required.scenarioId,
      command: 'npm run evidence:story-174-3:states',
      kind: 'story-runner',
      runner: 'playwright',
      exitCode: 0,
      startedAt: 'recording',
      durationMs: 0,
    }
  }
  const result = findStory1743Execution(getExecutionIndex(), required)
  return {
    route,
    state: 'default',
    disposition: 'executed',
    rationale: route + ': consolidated Story runner result is recorded in the execution manifest',
    result: 'passed',
    source: result.source,
    sourceSha256: result.sourceSha256,
    scenarioId: result.scenarioId,
    command: result.command,
    kind: 'story-runner',
    runner: result.runner,
    exitCode: result.exitCode,
    startedAt: result.startedAt,
    durationMs: result.durationMs,
  }
}

export function resolveStory1743StateEvidence(route: string): Story1743StateEvidence[] {
  const declarations = STORY_174_3_EXACT_STATE_SCENARIOS[route] ?? {}
  if (!Object.hasOwn(STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES, route)) {
    throw new Error('Missing explicit not-applicable state manifest for ' + route)
  }
  const notApplicableStates = STORY_174_3_EXPLICIT_NOT_APPLICABLE_STATES[route]
  validateStory1743ExplicitStateContract(route, declarations, notApplicableStates)
  const notApplicableSet = new Set(notApplicableStates)

  return STORY_174_3_STATES.map(state => {
    if (state === 'default') return defaultEvidence(route)
    const declaration = declarations[state]
    if (declaration) return executedEvidence(route, state, declaration)
    if (!notApplicableSet.has(state)) {
      throw new Error(route + '/' + state + ' has no explicit state disposition')
    }
    const anchor = notApplicableAnchor(route, state)
    const ownerStateLabels = story1743CanonicalOwnerStateLabels(route, state)
    const ownerExceptions = ownerStateLabels.map(rawOwnerState =>
      requireStory1743OwnerStateException(route, rawOwnerState, state)
    )
    return {
      route,
      state,
      disposition: 'not-applicable',
      rationale:
        route +
        ': ' +
        (ownerExceptions.length > 0
          ? 'typed owner decisions [' +
            ownerExceptions.map(exception => exception.canonicalOwnerDecision).join('; ') +
            '] independently establish that this route ' +
            NOT_APPLICABLE_RATIONALES[state]
          : NOT_APPLICABLE_RATIONALES[state]),
      declarationSource: anchor.source,
      declarationSha256: story1743Sha256(anchor.source),
      declarationLine: anchor.line,
      declarationId: route + ':' + state + ':not-applicable',
    }
  })
}
