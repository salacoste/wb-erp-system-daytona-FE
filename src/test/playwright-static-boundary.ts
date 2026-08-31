import { execFileSync } from 'node:child_process'
import path from 'node:path'

import ts from 'typescript'
import { createStaticInvocationAnalysis } from './playwright-static-dataflow'
const SELF_TEST_MODULES = new Set([
  'scripts/check-privacy-console.test.mjs',
  // Story 174.2 carry-in fix: this node:test self-suite legitimately imports
  // node:child_process to spawn the parity validator CLI (same precedent as
  // the check-privacy-console.test.mjs entry above).
  'scripts/__tests__/check-shadcn-migration-parity.test.mjs',
  'src/test/anti-pattern-8-rule.test.ts',
  'src/test/outbound-network-guard.test.ts',
  'src/test/outbound-node-network-guard.ts',
  'src/test/playwright-network-guard.test.ts',
  'src/test/playwright-object-graph-guard.test.ts',
  'src/test/playwright-facade-security.test.ts',
  'src/test/playwright-static-boundary.test.ts',
  'src/test/playwright-static-boundary.ts',
])
const APPROVED_RUNTIME_MODULES = new Set([
  'e2e/outbound-network-guard.spec.ts',
  'e2e/fixtures/playwright-network-guard.ts',
  'e2e/fixtures/network-test.ts',
  'playwright.config.ts',
  ...SELF_TEST_MODULES,
])
const PLAYWRIGHT_MODULES = new Set([
  '@playwright/test',
  'playwright',
  'playwright/test',
  'playwright-core',
])
const NODE_MODULE_LOADER_MODULES = new Set(['module', 'node:module'])
const CODE_EXECUTION_MODULES = new Set([
  'child_process',
  'cluster',
  'dgram',
  'http2',
  'inspector',
  'inspector/promises',
  'node:child_process',
  'node:cluster',
  'node:dgram',
  'node:http2',
  'node:inspector',
  'node:inspector/promises',
  'node:vm',
  'node:worker_threads',
  'node:repl',
  'repl',
  'vm',
  'worker_threads',
])
export const RUNTIME_SOURCE_PATTERNS = '*.ts *.tsx *.mts *.cts *.js *.jsx *.mjs *.cjs'.split(' ')
const DYNAMIC_CODE_NAMES = new Set(
  'eval Function AsyncFunction GeneratorFunction AsyncGeneratorFunction'.split(' ')
)
const REFLECTIVE_OBJECT_METHODS = new Set([
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'getPrototypeOf',
])
const SERIALIZED_BROWSER_METHODS = new Set('evaluate evaluateAll evaluateHandle'.split(' '))
const BROWSER_TYPES = new Set('chromium firefox webkit'.split(' '))
const BROWSER_TYPE_METHODS = new Set(
  'connect connectOverCDP launch launchPersistentContext launchServer'.split(' ')
)
const FORBIDDEN_GUARDED_TEST_SURFACES = new Set([
  'chromium',
  'defineConfig',
  'expect',
  'firefox',
  'mergeExpects',
  'mergeTests',
  'request',
  'selectors',
  'webkit',
])
const PROCESS_INTERNAL_METHODS = new Set([
  '_linkedBinding',
  'binding',
  'dlopen',
  'getBuiltinModule',
])

function isPlaywrightRuntimeSpecifier(relativePath: string, specifier: string): boolean {
  const normalizedSpecifier = specifier.replaceAll('\\', '/')
  if (
    [...PLAYWRIGHT_MODULES].some(
      moduleName =>
        normalizedSpecifier === moduleName || normalizedSpecifier.startsWith(`${moduleName}/`)
    ) ||
    /(?:^|\/)node_modules\/(?:@playwright\/test|playwright(?:-core)?)(?:\/|$)/.test(
      normalizedSpecifier
    )
  ) {
    return true
  }
  if (!specifier.startsWith('.')) return false

  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(relativePath), normalizedSpecifier)
  )
  return /(?:^|\/)node_modules\/(?:@playwright\/test|playwright(?:-core)?)(?:\/|$)/.test(resolved)
}

export function staticBoundaryViolations(relativePath: string, source: string): string[] {
  if (APPROVED_RUNTIME_MODULES.has(relativePath)) return []

  const sourceFile = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true)
  const violations: string[] = []
  const isE2eRuntimeSource =
    relativePath.startsWith('e2e/') ||
    relativePath.startsWith('tests/e2e/') ||
    relativePath.startsWith('test-utils/')
  const isRestrictedTestRuntimeSource =
    isE2eRuntimeSource ||
    relativePath.startsWith('src/test/') ||
    relativePath.includes('/__tests__/') ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath)
  const isForbiddenRuntimeModule = (moduleName: string): boolean =>
    (isE2eRuntimeSource && NODE_MODULE_LOADER_MODULES.has(moduleName)) ||
    (isRestrictedTestRuntimeSource && CODE_EXECUTION_MODULES.has(moduleName))
  const guardedTestFixtureNames = new Set(['test'])
  const constantDeclarations = new Map<string, ts.VariableDeclaration[]>()
  const identifierDeclarations = new Map<string, ts.Node[]>()
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.endsWith('fixtures/network-test')
    ) {
      continue
    }
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    for (const element of bindings.elements) {
      if ((element.propertyName ?? element.name).text === 'test') {
        guardedTestFixtureNames.add(element.name.text)
      }
    }
  }
  function declarationScope(node: ts.Node): ts.Node {
    let current = node.parent
    while (
      current &&
      !ts.isSourceFile(current) &&
      !ts.isBlock(current) &&
      !ts.isFunctionLike(current)
    ) {
      current = current.parent
    }
    return current ?? sourceFile
  }
  function scopeContains(scope: ts.Node, node: ts.Node): boolean {
    let current: ts.Node | undefined = node
    while (current) {
      if (current === scope) return true
      current = current.parent
    }
    return false
  }
  function resolveConstantIdentifier(
    identifier: ts.Identifier,
    seen: Set<ts.VariableDeclaration>
  ): string | undefined {
    const declarations = constantDeclarations.get(identifier.text) ?? []
    const candidate = declarations
      .filter(
        declaration =>
          Boolean(declaration.initializer) &&
          declaration.getStart(sourceFile) < identifier.getStart(sourceFile) &&
          scopeContains(declarationScope(declaration), identifier)
      )
      .sort((left, right) => right.getStart(sourceFile) - left.getStart(sourceFile))[0]
    if (!candidate?.initializer || seen.has(candidate)) return undefined
    seen.add(candidate)
    const value = constantStringExpression(candidate.initializer, seen)
    seen.delete(candidate)
    return value
  }
  function constantStringExpression(
    expression: ts.Expression,
    seen = new Set<ts.VariableDeclaration>()
  ): string | undefined {
    if (ts.isStringLiteralLike(expression)) return expression.text
    if (ts.isIdentifier(expression)) return resolveConstantIdentifier(expression, seen)
    if (
      ts.isParenthesizedExpression(expression) ||
      ts.isAsExpression(expression) ||
      ts.isTypeAssertionExpression(expression) ||
      ts.isNonNullExpression(expression) ||
      ts.isSatisfiesExpression(expression)
    ) {
      return constantStringExpression(expression.expression)
    }
    if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const left = constantStringExpression(expression.left)
      const right = constantStringExpression(expression.right)
      return left === undefined || right === undefined ? undefined : left + right
    }
    if (ts.isTemplateExpression(expression)) {
      let result = expression.head.text
      for (const span of expression.templateSpans) {
        const value = constantStringExpression(span.expression)
        if (value === undefined) return undefined
        result += value + span.literal.text
      }
      return result
    }
    return undefined
  }
  const collectConstantDeclarations = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0
    ) {
      const declarations = constantDeclarations.get(node.name.text) ?? []
      declarations.push(node)
      constantDeclarations.set(node.name.text, declarations)
    }
    const declaredIdentifier =
      (ts.isVariableDeclaration(node) || ts.isParameter(node)) && ts.isIdentifier(node.name)
        ? node.name
        : ts.isBindingElement(node) && ts.isIdentifier(node.name)
          ? node.name
          : undefined
    if (declaredIdentifier) {
      const declarations = identifierDeclarations.get(declaredIdentifier.text) ?? []
      declarations.push(node)
      identifierDeclarations.set(declaredIdentifier.text, declarations)
    }
    ts.forEachChild(node, collectConstantDeclarations)
  }
  collectConstantDeclarations(sourceFile)
  const propertyNameText = (name: ts.PropertyName | undefined): string | undefined => {
    if (!name) return undefined
    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
    if (ts.isComputedPropertyName(name)) return constantStringExpression(name.expression)
    return undefined
  }
  const expressionPropertyName = (expression: ts.Expression): string | undefined => {
    if (ts.isPropertyAccessExpression(expression)) return expression.name.text
    if (ts.isElementAccessExpression(expression) && expression.argumentExpression) {
      return constantStringExpression(expression.argumentExpression)
    }
    return undefined
  }
  const unwrapExpression = (expression: ts.Expression): ts.Expression => {
    let current = expression
    while (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current)
    ) {
      current = current.expression
    }
    return current
  }
  const isPropertyNameOnly = (node: ts.Identifier): boolean =>
    (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) ||
    (ts.isPropertyAssignment(node.parent) && node.parent.name === node) ||
    (ts.isMethodDeclaration(node.parent) && node.parent.name === node)
  const isProcessReference = (node: ts.Node): node is ts.Expression =>
    (ts.isIdentifier(node) && node.text === 'process' && !isPropertyNameOnly(node)) ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      expressionPropertyName(node) === 'process')
  const isAllowedProcessEnvReference = (node: ts.Expression): boolean =>
    (ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent)) &&
    node.parent.expression === node &&
    expressionPropertyName(node.parent) === 'env'
  const isGuardedTestExpression = (expression: ts.Expression): boolean => {
    if (ts.isIdentifier(expression)) return guardedTestFixtureNames.has(expression.text)
    if (
      (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) &&
      expressionPropertyName(expression) === 'test'
    ) {
      return isGuardedTestExpression(expression.expression)
    }
    return false
  }
  const isAssignmentLeft = (expression: ts.ObjectLiteralExpression): boolean => {
    let current: ts.Expression = expression
    while (ts.isParenthesizedExpression(current.parent)) current = current.parent
    return (
      ts.isBinaryExpression(current.parent) &&
      current.parent.left === current &&
      current.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
    )
  }
  const isTestFixtureBinding = (binding: ts.BindingElement): boolean => {
    if (!ts.isObjectBindingPattern(binding.parent)) return false
    const parameter = binding.parent.parent
    if (!ts.isParameter(parameter)) return false
    const callback = parameter.parent
    if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) return false
    const call = callback.parent
    if (!ts.isCallExpression(call) || !call.arguments.includes(callback)) return false

    let expression: ts.Expression = call.expression
    while (ts.isPropertyAccessExpression(expression)) expression = expression.expression
    return ts.isIdentifier(expression) && guardedTestFixtureNames.has(expression.text)
  }
  const guardedPageFixtureBindings: ts.BindingElement[] = []
  const collectGuardedPageFixtures = (node: ts.Node): void => {
    if (
      ts.isBindingElement(node) &&
      isTestFixtureBinding(node) &&
      (propertyNameText(node.propertyName) === 'page' ||
        (!node.propertyName && ts.isIdentifier(node.name) && node.name.text === 'page')) &&
      ts.isIdentifier(node.name)
    ) {
      guardedPageFixtureBindings.push(node)
    }
    ts.forEachChild(node, collectGuardedPageFixtures)
  }
  collectGuardedPageFixtures(sourceFile)
  const resolvedDeclaration = (identifier: ts.Identifier): ts.Node | undefined =>
    (identifierDeclarations.get(identifier.text) ?? [])
      .filter(declaration => {
        const scope = declarationScope(declaration)
        return (
          declaration.getStart(sourceFile) < identifier.getStart(sourceFile) &&
          scopeContains(scope, identifier)
        )
      })
      .sort((left, right) => {
        const leftScope = declarationScope(left)
        const rightScope = declarationScope(right)
        const spanDifference =
          leftScope.getEnd() -
          leftScope.getStart(sourceFile) -
          (rightScope.getEnd() - rightScope.getStart(sourceFile))
        return spanDifference || right.getStart(sourceFile) - left.getStart(sourceFile)
      })[0]
  const {
    assignedTargetIsInvoked,
    computedAccessIsInvoked,
    declarationIsInvoked,
    isFunctionValuedExpression,
  } = createStaticInvocationAnalysis({
    sourceFile,
    unwrapExpression,
    resolvedDeclaration,
    expressionPropertyName,
    propertyNameText,
    constantStringExpression,
  })
  const isInsideSerializedBrowserCallback = (node: ts.Node): boolean => {
    let current: ts.Node | undefined = node
    while (current?.parent) {
      if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
        const call: ts.Node = current.parent
        const member = ts.isCallExpression(call) ? call.expression : undefined
        const receiver =
          member && (ts.isPropertyAccessExpression(member) || ts.isElementAccessExpression(member))
            ? member.expression
            : undefined
        if (
          ts.isCallExpression(call) &&
          call.arguments.includes(current) &&
          member !== undefined &&
          (ts.isPropertyAccessExpression(member) || ts.isElementAccessExpression(member)) &&
          SERIALIZED_BROWSER_METHODS.has(expressionPropertyName(member) ?? '') &&
          receiver !== undefined &&
          ts.isIdentifier(receiver) &&
          guardedPageFixtureBindings.some(binding => {
            const parameter = binding.parent.parent
            const callback = ts.isParameter(parameter) ? parameter.parent : undefined
            return (
              callback !== undefined &&
              ts.isIdentifier(binding.name) &&
              binding.name.text === receiver.text &&
              resolvedDeclaration(receiver) === binding &&
              scopeContains(callback, call)
            )
          })
        ) {
          return true
        }
      }
      current = current.parent
    }
    return false
  }

  const visit = (node: ts.Node) => {
    const dynamicMemberName =
      ts.isIdentifier(node) && !isPropertyNameOnly(node)
        ? node.text
        : ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
          ? expressionPropertyName(node)
          : ts.isBindingElement(node)
            ? (propertyNameText(node.propertyName) ??
              (ts.isIdentifier(node.name) ? node.name.text : undefined))
            : undefined
    if (
      isE2eRuntimeSource &&
      (DYNAMIC_CODE_NAMES.has(dynamicMemberName ?? '') || dynamicMemberName === 'constructor')
    ) {
      violations.push(`${relativePath}: dynamic code execution capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      constantStringExpression(node.argumentExpression) === undefined &&
      (isFunctionValuedExpression(node.expression) || computedAccessIsInvoked(node))
    ) {
      violations.push(`${relativePath}: unresolved computed function capability`)
    }
    const unresolvedComputedDestructuringIsInvoked =
      (ts.isBindingElement(node) &&
        node.propertyName !== undefined &&
        ts.isComputedPropertyName(node.propertyName) &&
        constantStringExpression(node.propertyName.expression) === undefined &&
        ts.isIdentifier(node.name) &&
        declarationIsInvoked(node)) ||
      (ts.isPropertyAssignment(node) &&
        ts.isComputedPropertyName(node.name) &&
        constantStringExpression(node.name.expression) === undefined &&
        ts.isObjectLiteralExpression(node.parent) &&
        isAssignmentLeft(node.parent) &&
        assignedTargetIsInvoked(node.initializer))
    if (isE2eRuntimeSource && unresolvedComputedDestructuringIsInvoked) {
      violations.push(`${relativePath}: unresolved computed function capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isIdentifier(node) &&
      (node.text === 'globalThis' || node.text === 'global') &&
      !isPropertyNameOnly(node)
    ) {
      violations.push(`${relativePath}: global runtime capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isIdentifier(node) &&
      node.text === 'module' &&
      !isPropertyNameOnly(node)
    ) {
      violations.push(`${relativePath}: CommonJS module capability`)
    }
    if (isE2eRuntimeSource && isProcessReference(node) && !isAllowedProcessEnvReference(node)) {
      violations.push(`${relativePath}: forbidden process capability`)
    }
    if (
      isRestrictedTestRuntimeSource &&
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      isProcessReference(node.expression) &&
      PROCESS_INTERNAL_METHODS.has(expressionPropertyName(node) ?? '')
    ) {
      violations.push(`${relativePath}: forbidden process capability`)
    }
    if (
      isE2eRuntimeSource &&
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      expressionPropertyName(node) === 'createRequire'
    ) {
      violations.push(`${relativePath}: runtime module loader capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isIdentifier(node) &&
      node.text === 'Reflect' &&
      !isPropertyNameOnly(node) &&
      !isInsideSerializedBrowserCallback(node)
    ) {
      violations.push(`${relativePath}: reflective runtime capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isIdentifier(node) &&
      node.text === 'Object' &&
      !isPropertyNameOnly(node) &&
      !(
        (ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent)) &&
        node.parent.expression === node
      ) &&
      !isInsideSerializedBrowserCallback(node)
    ) {
      violations.push(`${relativePath}: reflective runtime capability`)
    }
    if (
      isE2eRuntimeSource &&
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'Object' &&
      REFLECTIVE_OBJECT_METHODS.has(expressionPropertyName(node) ?? '') &&
      !isInsideSerializedBrowserCallback(node)
    ) {
      violations.push(`${relativePath}: reflective runtime capability`)
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      isForbiddenRuntimeModule(node.moduleSpecifier.text) &&
      !node.importClause?.isTypeOnly
    ) {
      violations.push(`${relativePath}: runtime module loader capability`)
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const moduleName = node.moduleReference.expression
      if (!moduleName || !ts.isStringLiteral(moduleName)) {
        violations.push(`${relativePath}: unresolved runtime module loader`)
      } else if (isPlaywrightRuntimeSpecifier(relativePath, moduleName.text)) {
        violations.push(`${relativePath}: runtime Playwright import`)
      } else if (isForbiddenRuntimeModule(moduleName.text)) {
        violations.push(`${relativePath}: runtime module loader capability`)
      }
    }
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      isPlaywrightRuntimeSpecifier(relativePath, node.moduleSpecifier.text) &&
      !node.importClause?.isTypeOnly
    ) {
      violations.push(`${relativePath}: runtime Playwright import`)
    }
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.isTypeOnly
    ) {
      if (isPlaywrightRuntimeSpecifier(relativePath, node.moduleSpecifier.text)) {
        violations.push(`${relativePath}: runtime Playwright export`)
      } else if (isForbiddenRuntimeModule(node.moduleSpecifier.text)) {
        violations.push(`${relativePath}: runtime module loader capability`)
      }
    }
    if (ts.isCallExpression(node)) {
      const isRuntimeLoader =
        node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require') ||
        ((ts.isPropertyAccessExpression(node.expression) ||
          ts.isElementAccessExpression(node.expression)) &&
          expressionPropertyName(node.expression) === 'require')
      if (isRuntimeLoader) {
        const moduleName = node.arguments[0]
        if (!moduleName || !ts.isStringLiteral(moduleName)) {
          violations.push(`${relativePath}: unresolved runtime module loader`)
        } else if (isPlaywrightRuntimeSpecifier(relativePath, moduleName.text)) {
          violations.push(`${relativePath}: runtime Playwright import`)
        } else if (isForbiddenRuntimeModule(moduleName.text)) {
          violations.push(`${relativePath}: runtime module loader capability`)
        }
      }
    }

    const isExtractedRequireMember =
      ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        expressionPropertyName(node) === 'require' &&
        !(ts.isCallExpression(node.parent) && node.parent.expression === node)) ||
      (ts.isBindingElement(node) && propertyNameText(node.propertyName) === 'require')
    if (isE2eRuntimeSource && isExtractedRequireMember) {
      violations.push(`${relativePath}: runtime module loader capability`)
    }
    if (
      isE2eRuntimeSource &&
      ts.isIdentifier(node) &&
      node.text === 'require' &&
      !isPropertyNameOnly(node) &&
      !(ts.isBindingElement(node.parent) && node.parent.propertyName === node) &&
      !(ts.isCallExpression(node.parent) && node.parent.expression === node)
    ) {
      violations.push(`${relativePath}: runtime module loader capability`)
    }

    if (
      isE2eRuntimeSource &&
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'extend' &&
      isGuardedTestExpression(node.expression.expression)
    ) {
      violations.push(`${relativePath}: guarded test fixture extension`)
    }

    if (
      isE2eRuntimeSource &&
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      isGuardedTestExpression(node.expression) &&
      FORBIDDEN_GUARDED_TEST_SURFACES.has(expressionPropertyName(node) ?? '')
    ) {
      violations.push(`${relativePath}: forbidden guarded test runtime surface`)
    }

    if (
      isE2eRuntimeSource &&
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(sourceFile) === 'Object' &&
      node.expression.name.text === 'getOwnPropertyDescriptor' &&
      node.arguments.length >= 2 &&
      isGuardedTestExpression(node.arguments[0]) &&
      ts.isStringLiteral(node.arguments[1]) &&
      FORBIDDEN_GUARDED_TEST_SURFACES.has(node.arguments[1].text)
    ) {
      violations.push(`${relativePath}: reflective guarded test runtime surface`)
    }

    if (
      isE2eRuntimeSource &&
      ((ts.isPropertyAccessExpression(node) && node.name.text === 'fetch') ||
        (ts.isElementAccessExpression(node) &&
          ts.isStringLiteral(node.argumentExpression) &&
          node.argumentExpression.text === 'fetch') ||
        (ts.isBindingElement(node) &&
          (propertyNameText(node.propertyName) === 'fetch' ||
            (!node.propertyName && ts.isIdentifier(node.name) && node.name.text === 'fetch'))) ||
        (ts.isPropertyAssignment(node) && propertyNameText(node.name) === 'fetch'))
    ) {
      violations.push(`${relativePath}: direct Route.fetch`)
    }

    const isPageMemberAccess =
      (ts.isPropertyAccessExpression(node) && node.name.text === 'page') ||
      (ts.isElementAccessExpression(node) &&
        ts.isStringLiteral(node.argumentExpression) &&
        node.argumentExpression.text === 'page')
    const isPageVariableBinding =
      ts.isBindingElement(node) &&
      (propertyNameText(node.propertyName) === 'page' ||
        (!node.propertyName && ts.isIdentifier(node.name) && node.name.text === 'page')) &&
      ts.isObjectBindingPattern(node.parent) &&
      !isTestFixtureBinding(node)
    const isPageDestructuringAssignment =
      ((ts.isPropertyAssignment(node) && propertyNameText(node.name) === 'page') ||
        (ts.isShorthandPropertyAssignment(node) && node.name.text === 'page')) &&
      ts.isObjectLiteralExpression(node.parent) &&
      isAssignmentLeft(node.parent)
    if (
      isE2eRuntimeSource &&
      (isPageMemberAccess || isPageVariableBinding || isPageDestructuringAssignment)
    ) {
      violations.push(`${relativePath}: raw Page escape via wrapper.page`)
    }

    const isPrivatePlaywrightMember =
      (ts.isPropertyAccessExpression(node) && node.name.text.startsWith('_')) ||
      (ts.isElementAccessExpression(node) &&
        ts.isStringLiteral(node.argumentExpression) &&
        node.argumentExpression.text.startsWith('_'))
    if (isE2eRuntimeSource && isPrivatePlaywrightMember) {
      violations.push(`${relativePath}: private Playwright runtime access`)
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text
      const receiver = node.expression.expression
      const isDirectBrowserType = ts.isIdentifier(receiver) && BROWSER_TYPES.has(receiver.text)
      const isPlaywrightBrowserType =
        ts.isPropertyAccessExpression(receiver) && BROWSER_TYPES.has(receiver.name.text)
      if (BROWSER_TYPE_METHODS.has(method) && (isDirectBrowserType || isPlaywrightBrowserType)) {
        violations.push(`${relativePath}: direct BrowserType.${method}`)
      }
      if (method === 'continue') violations.push(`${relativePath}: direct Route.continue`)
      if (method === 'unroute' || method === 'unrouteAll') {
        violations.push(`${relativePath}: route guard removal via ${method}`)
      }
      if (method === 'opener') violations.push(`${relativePath}: raw Page escape via opener`)
      const eventName = node.arguments[0]
      if (
        method === 'waitForEvent' &&
        ts.isStringLiteral(eventName) &&
        (eventName.text === 'popup' || eventName.text === 'page')
      ) {
        violations.push(`${relativePath}: raw Page escape via waitForEvent(${eventName.text})`)
      }
      if (
        (method === 'on' ||
          method === 'once' ||
          method === 'addListener' ||
          method === 'prependListener' ||
          method === 'prependOnceListener') &&
        ts.isStringLiteral(eventName) &&
        (eventName.text === 'popup' || eventName.text === 'page')
      ) {
        violations.push(`${relativePath}: raw Page escape via ${method}(${eventName.text})`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return violations
}

export function trackedRuntimeSourceFiles(root: string): string[] {
  return execFileSync(
    'git',
    [
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
      '-z',
      '--',
      ...RUNTIME_SOURCE_PATTERNS,
    ],
    { cwd: root, encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)
}
