import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const OWNER_DECLARATION_SOURCES = [
  'e2e/fixtures/story-174-3/state-scenarios.ts',
  'e2e/fixtures/story-174-3/state-scenarios-additional.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-a.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-a-additional.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-b.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-b-additional.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-c.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-c-requirements.ts',
  'e2e/fixtures/story-174-3/owner-state-evidence-c-variants.ts',
  'e2e/fixtures/story-174-3-surface-contracts.ts',
  'e2e/fixtures/story-174-3/chart-inventory.ts',
  'e2e/fixtures/story-174-3/table-inventory.ts',
  'e2e/fixtures/story-174-3/dedicated-route-scenarios.ts',
]
const STORY_RUNNER_SOURCE = 'e2e/shadcn-migration-visual-accessibility.spec.ts'
const LEDGER_SOURCE = '_bmad-output/planning-artifacts/shadcn-route-ledger.md'
const OWNER_VARIANT_HELPERS = new Set(['bind', 'binding', 'scenario'])

export const story1743ExecutionKey = (source, scenarioId) => JSON.stringify([source, scenarioId])

const sha256 = (repositoryRoot, source) =>
  createHash('sha256')
    .update(readFileSync(resolve(repositoryRoot, source)))
    .digest('hex')

export function story1743ExactOwnerExecutions(repositoryRoot = process.cwd()) {
  const declarations = new Map()

  const append = (source, scenarioId, runner) => {
    const resolvedRunner = runner ?? (source.startsWith('e2e/') ? 'playwright' : 'vitest')
    if (resolvedRunner !== 'vitest' && resolvedRunner !== 'playwright') {
      throw new Error(
        'Story 174.3 owner declaration has unsupported runner: ' +
          source +
          ' :: ' +
          scenarioId +
          ' :: ' +
          resolvedRunner
      )
    }
    const declarationKey = story1743ExecutionKey(source, scenarioId)
    const existing = declarations.get(declarationKey)
    if (existing && existing.runner !== resolvedRunner) {
      throw new Error(
        'Story 174.3 owner declaration has conflicting runners: ' + source + ' :: ' + scenarioId
      )
    }
    declarations.set(declarationKey, {
      source,
      sourceSha256: sha256(repositoryRoot, source),
      scenarioId,
      runner: resolvedRunner,
    })
  }

  const propertyName = property => {
    if (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) {
      return property.name.text
    }
    return undefined
  }

  const stringProperty = (object, name) => {
    const property = object.properties.find(
      candidate => ts.isPropertyAssignment(candidate) && propertyName(candidate) === name
    )
    return property &&
      ts.isPropertyAssignment(property) &&
      ts.isStringLiteralLike(property.initializer)
      ? property.initializer.text
      : undefined
  }

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      OWNER_VARIANT_HELPERS.has(node.expression.text)
    ) {
      const runnerArgument = node.arguments[5]
      if (
        node.arguments.length < 5 ||
        !ts.isStringLiteralLike(node.arguments[3]) ||
        !ts.isStringLiteralLike(node.arguments[4]) ||
        (runnerArgument &&
          !ts.isStringLiteralLike(runnerArgument) &&
          !(ts.isIdentifier(runnerArgument) && runnerArgument.text === 'undefined'))
      ) {
        throw new Error(
          'Story 174.3 owner variant helper must use literal source/scenarioId and runner in ' +
            node.getSourceFile().fileName
        )
      }
      const runner =
        runnerArgument && ts.isStringLiteralLike(runnerArgument) ? runnerArgument.text : undefined
      append(node.arguments[3].text, node.arguments[4].text, runner)
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'exact' &&
      node.arguments.length >= 2 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ts.isStringLiteralLike(node.arguments[1])
    ) {
      append(node.arguments[0].text, node.arguments[1].text)
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'owner' &&
      node.arguments.length >= 2 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ts.isStringLiteralLike(node.arguments[1])
    ) {
      const runner =
        node.arguments[2] && ts.isStringLiteralLike(node.arguments[2])
          ? node.arguments[2].text
          : undefined
      append(node.arguments[0].text, node.arguments[1].text, runner)
    }
    if (
      ts.isPropertyAssignment(node) &&
      (propertyName(node) === 'tooltipOwnerTest' ||
        propertyName(node) === 'interactionOwnerTest') &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      const source = stringProperty(node.initializer, 'source')
      const scenarioId = stringProperty(node.initializer, 'scenarioId')
      const runner = stringProperty(node.initializer, 'runner')
      if (!source || !scenarioId || (runner !== 'vitest' && runner !== 'playwright')) {
        throw new Error(
          'Story 174.3 surface owner declaration must use literal runner/source/scenarioId in ' +
            node.getSourceFile().fileName
        )
      }
      append(source, scenarioId, runner)
    }
    ts.forEachChild(node, visit)
  }

  for (const scenariosSource of OWNER_DECLARATION_SOURCES) {
    const text = readFileSync(resolve(repositoryRoot, scenariosSource), 'utf8')
    const sourceFile = ts.createSourceFile(
      scenariosSource,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    )
    visit(sourceFile)
  }
  return [...declarations.values()]
}

export function story1743DefaultExecutions(repositoryRoot = process.cwd()) {
  const ledger = readFileSync(resolve(repositoryRoot, LEDGER_SOURCE), 'utf8')
  const routes = [...ledger.matchAll(/^\| \d+\.\d+ \| \x60([^\x60]+)\x60 \|/gm)].map(
    match => match[1]
  )
  const sourceSha256 = sha256(repositoryRoot, STORY_RUNNER_SOURCE)
  return routes.map(route => ({
    source: STORY_RUNNER_SOURCE,
    sourceSha256,
    scenarioId: route + ' has privacy-safe width/theme/axe/focus evidence',
    runner: 'playwright',
  }))
}

export function story1743MergeReadyExecutions(repositoryRoot = process.cwd()) {
  return [
    ...story1743ExactOwnerExecutions(repositoryRoot),
    ...story1743DefaultExecutions(repositoryRoot),
  ]
}
