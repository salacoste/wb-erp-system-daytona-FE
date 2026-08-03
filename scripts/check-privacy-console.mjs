import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from '@typescript-eslint/parser'

export const PII_FILES = [
  'src/lib/api/orders/client-info-api.ts',
  'src/lib/api/orders/__tests__/client-info-api.test.ts',
  'src/hooks/useClientInfo.ts',
  'src/hooks/__tests__/useClientInfo.test.ts',
  'src/types/orders-client-info.ts',
  'src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx',
]

const FORBIDDEN_CONSOLE_METHODS = new Set([
  'log',
  'info',
  'debug',
  'warn',
  'error',
  'trace',
  'dir',
  'table',
  'count',
  'group',
  'groupEnd',
  'time',
  'timeEnd',
  'timeLog',
  'profile',
  'profileEnd',
])

function getConsoleMethod(memberExpression) {
  if (
    memberExpression.object?.type !== 'Identifier' ||
    memberExpression.object.name !== 'console'
  ) {
    return null
  }

  if (!memberExpression.computed && memberExpression.property?.type === 'Identifier') {
    return memberExpression.property.name
  }

  if (memberExpression.computed && memberExpression.property?.type === 'Literal') {
    return typeof memberExpression.property.value === 'string'
      ? memberExpression.property.value
      : null
  }

  if (
    memberExpression.computed &&
    memberExpression.property?.type === 'TemplateLiteral' &&
    memberExpression.property.expressions.length === 0
  ) {
    return memberExpression.property.quasis[0]?.value.cooked ?? null
  }

  return null
}

function isForbiddenConsoleMember(memberExpression) {
  if (
    memberExpression.object?.type !== 'Identifier' ||
    memberExpression.object.name !== 'console'
  ) {
    return false
  }

  const method = getConsoleMethod(memberExpression)
  return method === null ? memberExpression.computed : FORBIDDEN_CONSOLE_METHODS.has(method)
}

function findForbiddenConsoleCalls(content, extension) {
  const ast = parse(content, {
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: extension === '.tsx' },
    loc: true,
    range: true,
    sourceType: 'module',
  })
  const calls = []
  const pending = [ast]

  while (pending.length > 0) {
    const node = pending.pop()

    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      isForbiddenConsoleMember(node.callee)
    ) {
      calls.push(node)
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'range' || value == null) {
        continue
      }
      if (Array.isArray(value)) {
        pending.push(...value.filter(item => item && typeof item.type === 'string'))
      } else if (typeof value === 'object' && typeof value.type === 'string') {
        pending.push(value)
      }
    }
  }

  return calls.sort((left, right) => left.range[0] - right.range[0])
}

export async function scanPrivacyFiles({ root = process.cwd(), files = PII_FILES } = {}) {
  const violations = []
  const scanned = []
  const missing = []

  for (const relativePath of files) {
    const absolutePath = path.resolve(root, relativePath)
    let content

    try {
      content = await readFile(absolutePath, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') {
        missing.push(relativePath)
        continue
      }
      throw error
    }

    scanned.push(relativePath)
    const sourceLines = content.split('\n')
    for (const call of findForbiddenConsoleCalls(content, path.extname(relativePath))) {
      const line = call.loc.start.line
      violations.push({ file: relativePath, line, source: sourceLines[line - 1].trim() })
    }
  }

  return { scanned, missing, violations }
}

export async function runPrivacyCheck(options) {
  const result = await scanPrivacyFiles(options)

  if (result.missing.length > 0) {
    console.error('Privacy check failed: configured PII file(s) are missing')
    for (const relativePath of result.missing) {
      console.error(relativePath)
    }
    return 1
  }

  if (result.violations.length > 0) {
    console.error('Privacy check failed: forbidden console call(s) found')
    for (const violation of result.violations) {
      console.error(`${violation.file}:${violation.line}: ${violation.source}`)
    }
    return 1
  }

  console.log(`Privacy check passed: ${result.scanned.length} PII files scanned`)
  return 0
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isCli) {
  process.exitCode = await runPrivacyCheck()
}
