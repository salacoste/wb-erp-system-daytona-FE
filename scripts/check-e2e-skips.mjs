#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { readFile, stat as statFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// Story 162.9 — Make E2E skips explicit and fixture-aware.
//
// Reasoned `test.skip(condition, reason)` calls are the intended pattern
// (~95 sites across the E2E tree): the condition is checked and a concrete
// reason is recorded for the Playwright report. The remaining bare
// `test.skip()` calls (no arguments) are ambiguous: the enclosing `if` has
// already evaluated the condition, but the skip itself carries no reason,
// so a yellow skip in the report gives no diagnostic. This scanner forbids
// bare `test.skip()` so every skip is self-describing.
//
// The scan walks `e2e/**/*.spec.ts` plus the Playwright setup files. It
// masks comments, strings, template literals, and regular expressions
// before matching, so a `test.skip()` mentioned in a doc comment or string
// is never flagged. `test.describe.skip(...)` is structurally distinct
// (different member expression) and is never a violation.

export const E2E_FILE_GLOBS = ['e2e']
export const E2E_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js'])

// Setup files live outside the `e2e/` tree but participate in the Playwright
// run (global setup, fixtures bootstrap). Keep them in scope so a bare skip
// in setup surfaces here rather than in a silent yellow report row.
export const E2E_SETUP_FILES = ['e2e/auth.setup.ts', 'e2e/auth-manager.setup.ts']

async function walkDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      files.push(...(await walkDirectory(fullPath)))
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.')
      const ext = dot >= 0 ? entry.name.slice(dot) : ''
      if (E2E_FILE_EXTENSIONS.has(ext)) files.push(fullPath)
    }
  }
  return files
}

export async function collectScanFiles(root = process.cwd()) {
  const directories = E2E_FILE_GLOBS.map(glob => resolve(root, glob))
  const walked = (await Promise.all(directories.map(walkDirectory))).flat()
  // A walk that auto-includes a hard-coded setup list must not fail-closed at
  // collection time when a setup file is absent from the walked root (it may
  // live only in the canonical repo). scanFiles remains the fail-closed gate
  // for explicit CLI targets; here we keep only the setup files that exist.
  const setupPaths = []
  for (const file of E2E_SETUP_FILES) {
    const absolute = resolve(root, file)
    if (await fileExists(absolute)) setupPaths.push(absolute)
  }
  const unique = new Set([...walked, ...setupPaths])
  return [...unique]
    .filter(path => !path.includes(`${sep}node_modules${sep}`))
    .map(path => relative(root, path))
    .sort()
}

async function fileExists(absolutePath) {
  try {
    const stat = await statFile(absolutePath)
    return stat.isFile()
  } catch {
    return false
  }
}

// Character-by-character state machine that replaces every comment, string,
// template literal, and regular expression with spaces (preserving newlines
// so line numbers stay accurate). Mirrors the proven masking in the
// Story 162.3 vacuous-assertion scanner.
function maskCommentsAndStrings(source) {
  const masked = [...source]
  let state = 'code'

  const startsRegularExpression = index => {
    const prefix = source.slice(0, index).trimEnd()
    return prefix.length === 0 || '=(:,[!&|?{};+-*'.includes(prefix.at(-1))
  }

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index]
    const next = source[index + 1]

    if (state === 'code' && current === '/' && next === '/') {
      masked[index] = masked[index + 1] = ' '
      state = 'line-comment'
      index += 1
    } else if (state === 'code' && current === '/' && next === '*') {
      masked[index] = masked[index + 1] = ' '
      state = 'block-comment'
      index += 1
    } else if (state === 'code' && current === '/' && startsRegularExpression(index)) {
      masked[index] = ' '
      state = 'regular-expression'
    } else if (state === 'code' && ['"', "'", '`'].includes(current)) {
      masked[index] = ' '
      state = current
    } else if (state === 'line-comment') {
      if (current === '\n') state = 'code'
      else masked[index] = ' '
    } else if (state === 'block-comment') {
      if (current === '*' && next === '/') {
        masked[index] = masked[index + 1] = ' '
        state = 'code'
        index += 1
      } else if (current !== '\n') masked[index] = ' '
    } else if (state === 'regular-expression') {
      if (current === '\\') {
        masked[index] = masked[index + 1] = ' '
        index += 1
      } else if (current === '/') {
        masked[index] = ' '
        state = 'code'
      } else if (current !== '\n') masked[index] = ' '
    } else if (state !== 'code') {
      if (current === '\\') {
        masked[index] = ' '
        if (source[index + 1] !== '\n') masked[index + 1] = ' '
        index += 1
      } else if (current === state) {
        masked[index] = ' '
        state = 'code'
      } else if (current !== '\n') masked[index] = ' '
    }
  }

  return masked.join('')
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length
}

// A bare skip is `test.skip` (member access) followed by `(` and only
// whitespace until the closing `)` — i.e. zero arguments. We anchor on
// `test.skip(` and scan forward to its matching close, requiring the entire
// argument span to be blank. This deliberately ignores `test.describe.skip`
// (different property chain), `test.skip(condition, reason)` (non-blank
// span), and `test.skip.fixme(...)`-style variants.
const SKIP_OPEN_PATTERN = /\btest\s*\.\s*skip\s*\(/g

function findClosingParenthesis(source, openingIndex) {
  let depth = 0
  for (let index = openingIndex; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1
    if (source[index] === ')') depth -= 1
    if (depth === 0) return index
  }
  return -1
}

export function scanSource(source, file = '<source>') {
  const code = maskCommentsAndStrings(source)
  const findings = []

  for (const match of code.matchAll(SKIP_OPEN_PATTERN)) {
    const openingIndex = code.indexOf('(', match.index)
    const closingIndex = findClosingParenthesis(code, openingIndex)
    if (closingIndex < 0) continue

    const argumentsSpan = code.slice(openingIndex + 1, closingIndex)
    if (argumentsSpan.trim().length === 0) {
      findings.push({
        file,
        line: lineAt(source, match.index),
        message: 'bare test.skip() — pass a concrete reason: test.skip(true, "<reason>")',
      })
    }
  }

  return findings
}

export async function scanFiles(files, root = process.cwd()) {
  const targets = files ?? (await collectScanFiles(root))
  const findings = []
  for (const file of targets) {
    const absolutePath = isAbsolute(file) ? file : resolve(root, file)
    let source
    try {
      source = await readFile(absolutePath, 'utf8')
    } catch (error) {
      throw new Error(`E2E skip scan target is missing or unreadable: ${file}`, { cause: error })
    }
    const displayPath = isAbsolute(file) ? relative(root, file) : file
    findings.push(...scanSource(source, displayPath))
  }
  return findings
}

export async function scanGitRevision(files, revision, root = process.cwd()) {
  return Promise.all(
    files.map(async file => {
      const { stdout } = await execFileAsync('git', ['show', `${revision}:${file}`], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })
      return scanSource(stdout, file)
    })
  )
}

export function resolveScanTargets(args, root = process.cwd()) {
  return args.length > 0 ? args : collectScanFiles(root)
}

async function main() {
  const files = await resolveScanTargets(process.argv.slice(2))
  const findings = await scanFiles(files)
  if (findings.length === 0) {
    console.log(`E2E skip scan passed: ${files.length} owned targets have no bare skips`)
    return
  }

  console.error(`E2E skip scan failed with ${findings.length} finding(s):`)
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.message}`)
  }
  process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
