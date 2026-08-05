#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

import ts from 'typescript'

const execFileAsync = promisify(execFile)

export const STORY_162_5_BASELINE_FILES = [
  'e2e/liquidity.spec.ts',
  'e2e/unit-economics.spec.ts',
  'e2e/unit-economics-waterfall.spec.ts',
]

export const STORY_162_5_E2E_FILES = [
  ...STORY_162_5_BASELINE_FILES,
  'e2e/fixtures/story-162-5-analytics.ts',
]

export const STORY_162_5_BASE_REVISION = '5c88e30785396b5c0a0284afdd9782c9e9e510f4'
export const STORY_162_5_CANONICAL_WAIT_COUNT = 58
export const STORY_162_5_CURRENT_BASE_WAIT_COUNT = 55
export const STORY_162_5_CURRENT_BASE_TIMER_COUNT = 2

const PROHIBITED_CALLS = new Map([
  [
    'waitForTimeout',
    {
      kind: 'browser-wait',
      message: 'waitForTimeout() is elapsed-time synchronization',
    },
  ],
  [
    'setTimeout',
    {
      kind: 'timer',
      message: 'setTimeout()/setInterval() is timer-backed synchronization',
    },
  ],
  [
    'setInterval',
    {
      kind: 'timer',
      message: 'setTimeout()/setInterval() is timer-backed synchronization',
    },
  ],
  ...['sleep', 'delay', 'pause'].map(name => [
    name,
    {
      kind: 'sleep-helper',
      message: 'sleep/delay/pause helper calls are arbitrary waits',
    },
  ]),
])

const INVOCATION_WRAPPERS = new Set(['call', 'apply'])

function unwrapExpression(expression) {
  let node = ts.skipOuterExpressions(expression)
  while (ts.isAwaitExpression(node) || ts.isYieldExpression(node)) {
    if (!node.expression) break
    node = ts.skipOuterExpressions(node.expression)
  }
  return node
}

function propertyName(expression) {
  const node = unwrapExpression(expression)
  if (ts.isPropertyAccessExpression(node)) return node.name.text
  if (!ts.isElementAccessExpression(node)) return null

  const argument = node.argumentExpression && ts.skipOuterExpressions(node.argumentExpression)
  return argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))
    ? argument.text
    : null
}

function propertyReceiver(expression) {
  const node = unwrapExpression(expression)
  return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
    ? node.expression
    : null
}

export function scanSource(source, file = '<source>') {
  const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind)
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0]
    const detail = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    throw new Error(`Fixed-wait scan could not parse ${file}: ${detail}`)
  }

  let nextBindingId = 1
  const nodeScopes = new WeakMap()
  const functionScopes = new WeakMap()
  const pendingAssignments = []
  const propertyCallableExpressions = new Map()
  const findings = []

  const createScope = (kind, parent) => ({
    kind,
    parent,
    bindings: new Map(),
    executionPositions: [],
    returnExpressions: [],
  })
  const sourceScope = createScope('source', null)

  const ensureBinding = (scope, name, initialCategory = null) => {
    if (!scope.bindings.has(name)) {
      scope.bindings.set(name, {
        id: nextBindingId,
        scope,
        initialCategory,
        events: [],
        callableScopes: new Set(),
        callableExpressions: [],
      })
      nextBindingId += 1
    }
    return scope.bindings.get(name)
  }

  const lookupBinding = (scope, name) => {
    for (let current = scope; current; current = current.parent) {
      if (current.bindings.has(name)) return current.bindings.get(name)
    }
    return null
  }

  const nearestFunctionScope = scope => {
    for (let current = scope; current; current = current.parent) {
      if (current.kind === 'function' || current.kind === 'source') return current
    }
    return sourceScope
  }

  const declarePattern = (name, scope, event) => {
    if (ts.isIdentifier(name)) {
      const binding = ensureBinding(scope, name.text)
      if (event) binding.events.push(event)
      return binding
    }

    if (ts.isObjectBindingPattern(name)) {
      for (const element of name.elements) {
        const key = element.propertyName ?? element.name
        const keyName = ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : null
        declarePattern(element.name, scope, {
          position: event?.position ?? Number.NEGATIVE_INFINITY,
          scope: event?.scope ?? scope,
          fixedCategory: keyName ? (PROHIBITED_CALLS.get(keyName) ?? null) : null,
        })
      }
    } else if (ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) {
          declarePattern(element.name, scope, {
            position: event?.position ?? Number.NEGATIVE_INFINITY,
            scope: event?.scope ?? scope,
            fixedCategory: null,
          })
        }
      }
    }
    return null
  }

  const collect = (node, scope) => {
    nodeScopes.set(node, scope)

    if (ts.isFunctionLike(node)) {
      const outerName = ts.isFunctionDeclaration(node) && node.name ? node.name : null
      const outerBinding = outerName ? ensureBinding(scope, outerName.text) : null
      const functionScope = createScope('function', scope)
      functionScopes.set(node, functionScope)

      if (ts.isFunctionExpression(node) && node.name) ensureBinding(functionScope, node.name.text)
      for (const parameter of node.parameters) {
        const event = parameter.initializer
          ? {
              position: Number.NEGATIVE_INFINITY,
              scope: functionScope,
              expression: parameter.initializer,
            }
          : null
        declarePattern(parameter.name, functionScope, event)
        if (parameter.initializer) collect(parameter.initializer, functionScope)
      }
      if (node.body) collect(node.body, functionScope)
      if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) {
        functionScope.returnExpressions.push({ expression: node.body, scope: functionScope })
      }
      if (outerBinding) outerBinding.callableScopes.add(functionScope)
      return
    }

    if (ts.isBlock(node)) {
      const blockScope = createScope('block', scope)
      nodeScopes.set(node, blockScope)
      ts.forEachChild(node, child => collect(child, blockScope))
      return
    }

    if (ts.isCatchClause(node)) {
      const catchScope = createScope('catch', scope)
      nodeScopes.set(node, catchScope)
      if (node.variableDeclaration) declarePattern(node.variableDeclaration.name, catchScope, null)
      collect(node.block, catchScope)
      return
    }

    if (ts.isImportSpecifier(node)) {
      const importedName = (node.propertyName ?? node.name).text
      declarePattern(node.name, scope, {
        position: Number.NEGATIVE_INFINITY,
        scope,
        fixedCategory: PROHIBITED_CALLS.get(importedName) ?? null,
      })
    } else if (ts.isVariableDeclaration(node)) {
      const declarationList = node.parent
      const blockScoped =
        ts.isVariableDeclarationList(declarationList) &&
        (declarationList.flags & ts.NodeFlags.BlockScoped) !== 0
      const targetScope = blockScoped ? scope : nearestFunctionScope(scope)
      const event = {
        position: node.end,
        scope,
        ...(node.initializer ? { expression: node.initializer } : { fixedCategory: null }),
      }
      const binding = declarePattern(node.name, targetScope, event)
      if (node.initializer) {
        collect(node.initializer, scope)
        const initializer = unwrapExpression(node.initializer)
        if (binding && ts.isFunctionLike(initializer)) {
          const callableScope = functionScopes.get(initializer)
          if (callableScope) binding.callableScopes.add(callableScope)
        }
        if (binding) binding.callableExpressions.push({ expression: node.initializer, scope })
      }
      return
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      pendingAssignments.push({
        left: node.left,
        scope,
        expression: node.right,
        position: node.end,
      })
    } else if (ts.isReturnStatement(node) && node.expression) {
      const functionScope = nearestFunctionScope(scope)
      if (functionScope.kind === 'function') {
        functionScope.returnExpressions.push({ expression: node.expression, scope })
      }
    }

    ts.forEachChild(node, child => collect(child, scope))
  }

  collect(sourceFile, sourceScope)

  const propertyIdentity = (expression, scope) => {
    const node = unwrapExpression(expression)
    if (!ts.isPropertyAccessExpression(node) && !ts.isElementAccessExpression(node)) return null

    const name = propertyName(node)
    if (!name) return null
    const receiver = unwrapExpression(node.expression)
    if (ts.isIdentifier(receiver)) {
      const binding = lookupBinding(scope, receiver.text)
      return `${binding ? `binding:${binding.id}` : `global:${receiver.text}`}.${name}`
    }

    const parentIdentity = propertyIdentity(receiver, scope)
    return parentIdentity ? `${parentIdentity}.${name}` : null
  }

  for (const assignment of pendingAssignments) {
    const left = unwrapExpression(assignment.left)
    if (ts.isIdentifier(left)) {
      let binding = lookupBinding(assignment.scope, left.text)
      if (!binding) {
        binding = ensureBinding(
          assignment.scope,
          left.text,
          PROHIBITED_CALLS.get(left.text) ?? null
        )
      }
      binding.events.push({
        position: assignment.position,
        scope: assignment.scope,
        expression: assignment.expression,
      })
      binding.callableExpressions.push({
        expression: assignment.expression,
        scope: assignment.scope,
      })
    } else {
      const identity = propertyIdentity(left, assignment.scope)
      if (identity) {
        const expressions = propertyCallableExpressions.get(identity) ?? []
        expressions.push({ expression: assignment.expression, scope: assignment.scope })
        propertyCallableExpressions.set(identity, expressions)
      }
    }
  }

  const callNodes = []
  const collectCalls = node => {
    if (ts.isCallExpression(node)) callNodes.push(node)
    ts.forEachChild(node, collectCalls)
  }
  collectCalls(sourceFile)

  const resolveCallableScopes = (expression, scope, seen = new Set()) => {
    const node = unwrapExpression(expression)
    if (ts.isFunctionLike(node)) {
      const functionScope = functionScopes.get(node)
      return functionScope ? [functionScope] : []
    }

    if (ts.isIdentifier(node)) {
      const binding = lookupBinding(scope, node.text)
      if (!binding || seen.has(`binding:${binding.id}`)) return []
      const nextSeen = new Set(seen).add(`binding:${binding.id}`)
      return [
        ...binding.callableScopes,
        ...binding.callableExpressions.flatMap(candidate =>
          resolveCallableScopes(candidate.expression, candidate.scope, nextSeen)
        ),
      ]
    }

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const identity = propertyIdentity(node, scope)
      if (!identity || seen.has(identity)) return []
      const nextSeen = new Set(seen).add(identity)
      return (propertyCallableExpressions.get(identity) ?? []).flatMap(candidate =>
        resolveCallableScopes(candidate.expression, candidate.scope, nextSeen)
      )
    }

    if (ts.isCallExpression(node)) {
      return resolveCallableScopes(node.expression, scope, seen).flatMap(callableScope =>
        callableScope.returnExpressions.flatMap(candidate =>
          resolveCallableScopes(candidate.expression, candidate.scope, seen)
        )
      )
    }

    return []
  }

  for (const call of callNodes) {
    const scope = nodeScopes.get(call) ?? sourceScope
    const currentFunction = (() => {
      for (let candidate = scope; candidate; candidate = candidate.parent) {
        if (candidate.kind === 'function') return candidate
      }
      return null
    })()
    for (const callableScope of new Set(resolveCallableScopes(call.expression, scope))) {
      if (callableScope !== currentFunction) {
        callableScope.executionPositions.push(call.getStart(sourceFile))
      }
    }
  }

  const cutoffCandidates = (bindingScope, referenceScope, referencePosition) => {
    let cutoffs = [referencePosition]
    let hasDeferredExecutionContext = false
    for (let scope = referenceScope; scope && scope !== bindingScope; scope = scope.parent) {
      if (scope.kind === 'function' && !hasDeferredExecutionContext) {
        cutoffs =
          scope.executionPositions.length > 0
            ? scope.executionPositions
            : [Number.POSITIVE_INFINITY]
        hasDeferredExecutionContext = true
      }
    }
    return cutoffs
  }

  const resolveBindingAt = (binding, cutoff, seen) => {
    const key = `${binding.id}:${cutoff}`
    if (seen.has(key)) return null
    seen.add(key)

    const event = [...binding.events]
      .sort((left, right) => left.position - right.position)
      .findLast(candidate => candidate.position <= cutoff)
    if (!event) return binding.initialCategory
    if ('fixedCategory' in event) return event.fixedCategory
    return resolveReference(event.expression, event.scope, event.position, seen)
  }

  const resolveIdentifier = (name, scope, position, seen) => {
    const binding = lookupBinding(scope, name)
    if (!binding) return PROHIBITED_CALLS.get(name) ?? null

    for (const cutoff of cutoffCandidates(binding.scope, scope, position)) {
      const category = resolveBindingAt(binding, cutoff, new Set(seen))
      if (category) return category
    }
    return null
  }

  const resolveReference = (expression, scope, position, seen = new Set()) => {
    const node = unwrapExpression(expression)

    if (ts.isIdentifier(node)) return resolveIdentifier(node.text, scope, position, seen)

    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      return PROHIBITED_CALLS.get(propertyName(node)) ?? null
    }

    if (ts.isCallExpression(node) && propertyName(node.expression) === 'bind') {
      const receiver = propertyReceiver(node.expression)
      return receiver ? resolveReference(receiver, scope, position, seen) : null
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'await' &&
      node.arguments.length === 1
    ) {
      return resolveReference(node.arguments[0], scope, position, seen)
    }

    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) {
      return resolveReference(node.right, scope, position, seen)
    }

    return null
  }

  const resolveInvocation = (expression, scope, position) => {
    const wrapper = propertyName(expression)
    if (!INVOCATION_WRAPPERS.has(wrapper)) {
      return resolveReference(expression, scope, position)
    }

    const receiver = propertyReceiver(expression)
    return receiver ? resolveReference(receiver, scope, position) : null
  }

  for (const call of callNodes) {
    const position = call.getStart(sourceFile)
    const prohibited = resolveInvocation(
      call.expression,
      nodeScopes.get(call) ?? sourceScope,
      position
    )
    if (prohibited) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(position)
      findings.push({ file, line: line + 1, ...prohibited })
    }
  }

  return findings.sort(
    (left, right) => left.line - right.line || left.kind.localeCompare(right.kind)
  )
}

export async function scanFiles(files = STORY_162_5_E2E_FILES, root = process.cwd()) {
  const findings = []
  for (const file of files) {
    const absolutePath = isAbsolute(file) ? file : resolve(root, file)
    let source
    try {
      source = await readFile(absolutePath, 'utf8')
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`Fixed-wait scan target is missing or unreadable: ${file}\n${detail}`)
    }
    findings.push(...scanSource(source, relative(root, absolutePath)))
  }
  return findings
}

export async function scanGitRevision(files, revision, root = process.cwd()) {
  return Promise.all(
    files.map(async file => {
      const { stdout } = await execFileAsync('git', ['show', `${revision}:${file}`], {
        cwd: root,
        maxBuffer: 10 * 1024 * 1024,
      })
      return scanSource(stdout, `${revision}:${file}`)
    })
  )
}

export function resolveScanTargets(args) {
  return args.length > 0 ? args : STORY_162_5_E2E_FILES
}

async function main() {
  const findings = await scanFiles(resolveScanTargets(process.argv.slice(2)))
  if (findings.length === 0) {
    console.log(
      `E2E fixed-wait scan passed: ${STORY_162_5_E2E_FILES.length} owned targets are timer-free`
    )
    return
  }

  console.error(`E2E fixed-wait scan failed with ${findings.length} finding(s):`)
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.kind}] ${finding.message}`)
  }
  process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
