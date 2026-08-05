import { execFile } from 'node:child_process'
import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { parse } from '@typescript-eslint/parser'

const execFileAsync = promisify(execFile)

export const PII_FILES = [
  'src/lib/api/orders/client-info-api.ts',
  'src/lib/api/orders/__tests__/client-info-api.test.ts',
  'src/hooks/useClientInfo.ts',
  'src/hooks/__tests__/useClientInfo.test.ts',
  'src/types/orders-client-info.ts',
  'src/components/custom/orders/__tests__/OrdersTable.client-column.test.tsx',
]

export const PRIVACY_SCAN_ROOTS = [
  'src',
  'e2e',
  'scripts',
  'tests',
  'test-utils',
  '.omx/ultragoal/evidence',
]

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yaml',
  '.yml',
  '.txt',
  '.log',
  '.sh',
  '.css',
  '.svg',
  '.html',
  '.xml',
  '.toml',
  '.graphql',
  '.gql',
])

function isAllowedTextPath(candidate) {
  const basename = path.basename(candidate)
  return (
    ALLOWED_EXTENSIONS.has(path.extname(candidate)) ||
    normalizeRelativePath(candidate) === '.cursorrules' ||
    basename === '.gitkeep' ||
    basename === '.env' ||
    basename.startsWith('.env.')
  )
}
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
])

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

function normalizeRelativePath(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '')
}

function assembled(parts, flags = 'i') {
  return new RegExp(parts.join(''), flags)
}

const SECRET_RULES = [
  {
    id: 'authorization-value',
    pattern: assembled([
      'authoriz',
      'ation',
      '\\s*["\']?\\s*[:=]\\s*(?:["\']\\s*)?(?:bearer\\s+)?[A-Za-z0-9._~+/=-]{12,}',
    ]),
  },
  {
    id: 'cookie-value',
    pattern: assembled([
      '(?:set-',
      'cookie|cookie)',
      '\\s*["\']?\\s*[:=]\\s*(?:(?:["\'](?:[^"\'\\r\\n;=]+=)?|[A-Za-z0-9._-]+=)[A-Za-z0-9._~+/=-]{12,})',
    ]),
  },
  {
    id: 'browser-storage',
    pattern: assembled([
      '(?:local|session|browser)',
      'Storage(?:["\']\\s*:|\\s*=)\\s*(?:["\'`{[])(?=[^\\r\\n]*(?:secret|token|cookie|authorization|fingerprint))',
    ]),
  },
  {
    id: 'fingerprint-material',
    pattern: assembled([
      'finger',
      'print(?:Id|Hash|Material)',
      '\\s*[":=]\\s*["\'][^"\'\\r\\n]{8,}',
    ]),
  },
  {
    id: 'fingerprint-material',
    pattern: assembled(['finger', 'print', '\\s*[":=]\\s*["\'][A-Za-z0-9+/=_-]{24,}']),
  },
  {
    id: 'sensitive-raw-url',
    pattern: assembled([
      'https?://[^\\s"\']+\\?(?:[^\\s"\']*&)?(?:token|auth|cookie|session|key)=',
    ]),
  },
  {
    id: 'unsanitized-payload',
    pattern: assembled([
      '(?:rawHeaders|rawBody|responseBody|unsanitizedPayload)',
      '\\s*[":=]\\s*(?:["\'`{[])',
    ]),
  },
  {
    id: 'token-value',
    pattern: assembled([
      '(?:access|refresh|api|wb)[_-]?',
      'token',
      '\\s*[":=]\\s*["\'][A-Za-z0-9._~+/=-]{12,}',
    ]),
  },
  {
    id: 'raw-browser-capture',
    pattern: assembled(['\\bpage\\s*\\.\\s*screenshot\\s*\\(']),
  },
  {
    id: 'raw-browser-diagnostic',
    pattern: assembled([
      '(?:push|console\\.(?:log|info|warn|error|debug))\\s*\\([^\\r\\n]*(?:msg\\.text\\(\\)|response\\.url\\(\\))',
    ]),
  },
]

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

const SENSITIVE_CONSOLE_MATERIAL = assembled([
  '\\b(?:authoriz',
  'ation|token|cookie|headers?|body|payload|storage|finger',
  'print|url|endpoint|raw|response|email|phone|address|client\\s+name)\\b',
])

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
      const callSource = content.slice(node.range[0], node.range[1])
      SENSITIVE_CONSOLE_MATERIAL.lastIndex = 0
      if (SENSITIVE_CONSOLE_MATERIAL.test(callSource)) calls.push(node)
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'range' || value == null) continue
      if (Array.isArray(value)) {
        pending.push(...value.filter(item => item && typeof item.type === 'string'))
      } else if (typeof value === 'object' && typeof value.type === 'string') {
        pending.push(value)
      }
    }
  }
  return calls.sort((left, right) => left.range[0] - right.range[0])
}

async function collectFiles(
  candidate,
  root,
  files,
  errors,
  missing,
  required = false,
  strict = false
) {
  const absolute = path.resolve(root, candidate)
  const relative = path.relative(root, absolute)
  const normalizedRelative = normalizeRelativePath(relative)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`scan path escapes root: ${candidate}`)
    return
  }
  let metadata
  try {
    metadata = await lstat(absolute)
  } catch (error) {
    if (error?.code === 'ENOENT' && required) missing.push(normalizedRelative)
    else if (error?.code !== 'ENOENT') errors.push(`cannot inspect ${normalizedRelative}`)
    return
  }
  if (metadata.isSymbolicLink()) {
    errors.push(`symlink is not allowed in scan scope: ${normalizedRelative}`)
    return
  }
  if (metadata.isDirectory()) {
    for (const entry of await readdir(absolute)) {
      if (!IGNORED_DIRECTORIES.has(entry)) {
        await collectFiles(path.join(candidate, entry), root, files, errors, missing, false, strict)
      }
    }
    return
  }
  if (!metadata.isFile()) return
  if (!isAllowedTextPath(candidate)) {
    if (strict) errors.push(`unsupported file type in scan scope: ${normalizedRelative}`)
    return
  }
  files.push(normalizedRelative)
}

async function gitFileNames(root, args) {
  const { stdout } = await execFileAsync('git', args, {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024,
  })
  return stdout.toString('utf8').split('\0').filter(Boolean)
}

async function collectGitChangeFiles(root, files, errors, missing) {
  try {
    const groups = await Promise.all([
      gitFileNames(root, ['diff', '--name-only', '-z', '--diff-filter=ACMR']),
      gitFileNames(root, ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']),
      gitFileNames(root, ['ls-files', '--others', '--exclude-standard', '-z']),
    ])
    const changed = [...new Set(groups.flat())]
    const candidates =
      changed.length > 0
        ? changed
        : await gitFileNames(root, [
            'diff-tree',
            '--no-commit-id',
            '--name-only',
            '-r',
            '-m',
            '--diff-filter=ACMR',
            '-z',
            'HEAD',
          ])
    for (const candidate of candidates) {
      await collectFiles(candidate, root, files, errors, missing, false, true)
    }
  } catch {
    errors.push('cannot inspect Git change set')
  }
}

export async function scanPrivacyFiles({
  root = process.cwd(),
  files,
  scanRoots = PRIVACY_SCAN_ROOTS,
  includeGitChanges = files === undefined,
} = {}) {
  const absoluteRoot = path.resolve(root)
  const candidates = []
  const errors = []
  const missing = []
  const explicitFiles = files?.map(normalizeRelativePath)

  if (explicitFiles) {
    for (const candidate of explicitFiles) {
      await collectFiles(candidate, absoluteRoot, candidates, errors, missing, true, true)
    }
  } else {
    for (const scanRoot of scanRoots) {
      await collectFiles(scanRoot, absoluteRoot, candidates, errors, missing, false, true)
    }
    for (const piiFile of PII_FILES) {
      await collectFiles(piiFile, absoluteRoot, candidates, errors, missing, true)
    }
    if (includeGitChanges) {
      await collectGitChangeFiles(absoluteRoot, candidates, errors, missing)
    }
  }

  const scanned = [...new Set(candidates)].sort()
  const violations = []
  let binaryFiles = 0

  for (const relativePath of scanned) {
    let buffer
    try {
      buffer = await readFile(path.join(absoluteRoot, relativePath))
    } catch {
      errors.push(`cannot read ${relativePath}`)
      continue
    }
    let content
    try {
      if (buffer.includes(0)) throw new TypeError('NUL byte')
      content = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    } catch {
      binaryFiles += 1
      errors.push(`non-text file is not allowed in scan scope: ${relativePath}`)
      continue
    }
    const seenRuleLocations = new Set()
    for (const rule of SECRET_RULES) {
      const pattern = new RegExp(rule.pattern.source, `${rule.pattern.flags}g`)
      for (const match of content.matchAll(pattern)) {
        const line = 1 + (content.slice(0, match.index).match(/\n/g)?.length ?? 0)
        const key = `${line}:${rule.id}`
        if (!seenRuleLocations.has(key)) {
          seenRuleLocations.add(key)
          violations.push({ file: relativePath, line, rule: rule.id })
        }
      }
    }
    if (['.ts', '.tsx', '.js', '.mjs', '.cjs'].includes(path.extname(relativePath))) {
      try {
        for (const call of findForbiddenConsoleCalls(content, path.extname(relativePath))) {
          violations.push({ file: relativePath, line: call.loc.start.line, rule: 'console-call' })
        }
      } catch {
        errors.push(`cannot parse ${relativePath}`)
      }
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0 && violations.length === 0,
    scanned,
    scannedFiles: scanned.length,
    binaryFiles,
    missing,
    violations,
    errors,
  }
}

export async function runPrivacyCheck(options) {
  const result = await scanPrivacyFiles(options)
  if (!result.valid) {
    console.error('Privacy check failed')
    for (const relativePath of result.missing)
      console.error(`configured file missing: ${relativePath}`)
    for (const violation of result.violations) {
      console.error(`${violation.file}:${violation.line}: ${violation.rule} (value redacted)`)
    }
    for (const error of result.errors) console.error(error)
    return 1
  }
  console.log(
    `Privacy check passed: ${result.scannedFiles} text files, ${result.binaryFiles} binary files`
  )
  return 0
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isCli) process.exitCode = await runPrivacyCheck()
