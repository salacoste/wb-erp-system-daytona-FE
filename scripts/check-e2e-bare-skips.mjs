#!/usr/bin/env node

// Story 162.9 — E2E bare-skip static regression gate.
//
// A bare `test.skip()` (no arguments) disappears from local results without a
// reason. This scanner fails the build whenever a Playwright spec introduces
// one, while still allowing the explicit conditional forms
// `test.skip(condition, reason)` and `test.skip(true, '<reason>')` (any call
// with at least one argument is acceptable — those carry reviewable intent).
//
// The detector masks comments, strings, template literals, and regular
// expressions before scanning (same masking technique as the vacuous-assertion
// scanner), so doc-comment mentions such as `* test.skip(condition, reason)`
// or commented-out `// test.skip()` are not counted as violations.

import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export const E2E_SPEC_GLOBS = ['e2e']

// Mirrors check-e2e-vacuous-assertions.mjs: mask every comment, string,
// template, and regex to spaces (preserving length + newlines) so only literal
// code tokens remain. This prevents doc-comment or commented-out `test.skip()`
// mentions from registering as violations.
function maskCommentsAndStrings(source) {
  const masked = [...source]
  let state = 'code'

  const startsRegularExpression = index => {
    const prefix = source.slice(0, index).trimEnd()
    return prefix.length === 0 || '=(:,[!&|?{};'.includes(prefix.at(-1))
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

function isWordBoundary(char) {
  return char === undefined || !/[A-Za-z0-9_$]/.test(char)
}

// A violation is `test.skip(` followed by ONLY optional whitespace then `)`
// (zero arguments). Any token before the closing paren — a condition, `true`,
// or a string literal — makes the skip explicit and is allowed.
export function scanSource(source, file = '<source>') {
  const code = maskCommentsAndStrings(source)
  const findings = []

  const callPattern = /\btest\s*\.\s*skip\s*\(/g
  for (const match of code.matchAll(callPattern)) {
    const callEnd = match.index + match[0].length
    // Walk forward from the '(' : every character until ')' must be whitespace
    // for this to be a bare (zero-argument) skip.
    let cursor = callEnd
    while (cursor < code.length && (code[cursor] === ' ' || code[cursor] === '\t')) {
      cursor += 1
    }
    if (cursor >= code.length || code[cursor] !== ')') {
      continue // has at least one argument -> explicit skip, allowed
    }

    // Confirm the `test` token is not part of a longer identifier
    // (e.g. `mytest.skip(`), which the \b boundary already rejects; this is a
    // defensive backstop.
    const before = match.index - 1
    if (!isWordBoundary(code[before])) continue

    findings.push({
      file,
      line: lineAt(source, match.index),
      message: 'bare test.skip() has no reason — use test.skip(condition, reason)',
    })
  }

  return findings.sort((left, right) => left.line - right.line)
}

export async function scanFiles(files, root = process.cwd()) {
  const findings = []
  for (const file of files) {
    const absolutePath = isAbsolute(file) ? file : resolve(root, file)
    let source
    try {
      source = await readFile(absolutePath, 'utf8')
    } catch (error) {
      throw new Error(`E2E bare-skip scan target is missing or unreadable: ${file}`, {
        cause: error,
      })
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

async function discoverSpecFiles(root = process.cwd()) {
  const { stdout } = await execFileAsync('git', ['ls-files', '-z', 'e2e'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  const files = stdout
    .split('\0')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0 && entry.endsWith('.spec.ts'))
  files.sort()
  return files
}

export async function resolveScanTargets(args, root = process.cwd()) {
  if (args.length > 0) return args
  return discoverSpecFiles(root)
}

async function main(args = process.argv.slice(2)) {
  try {
    const files = await resolveScanTargets(args)
    const findings = await scanFiles(files)
    if (findings.length === 0) {
      console.log(`E2E bare-skip scan passed: 0 bare skips`)
      return
    }

    console.error(`E2E bare-skip scan failed with ${findings.length} bare skip(s):`)
    for (const finding of findings) {
      console.error(`${finding.file}:${finding.line} ${finding.message}`)
    }
    process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main()
}
