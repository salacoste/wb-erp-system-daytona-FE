#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const OWNED_E2E_FILES = [
  'e2e/liquidity.spec.ts',
  'e2e/analytics/fbs-orders-analytics.spec.ts',
  'e2e/margin-analytics.spec.ts',
  'e2e/dashboard-metrics.spec.ts',
  'e2e/financial-summary.spec.ts',
  'e2e/unit-economics.spec.ts',
  'e2e/analytics/analytics-hub.spec.ts',
  'e2e/returns-analytics.spec.ts',
]

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

function findClosingParenthesis(source, openingIndex) {
  let depth = 0
  for (let index = openingIndex; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1
    if (source[index] === ')') depth -= 1
    if (depth === 0) return index
  }
  return -1
}

function findExpressionEnd(source, startIndex) {
  let depth = 0

  const continuesAfterNewline = newlineIndex => {
    const before = source.slice(startIndex, newlineIndex).trimEnd()
    const after = source.slice(newlineIndex + 1).trimStart()

    if (before.length === 0) return true

    const previous = before.at(-1)
    return (
      '=<>!&|?+-*/%,.([{'.includes(previous) ||
      /^(?:>=|<=|===?|!==?|&&|\|\||\?|:|\+|-|\*|\/|%|,|\.)/.test(after)
    )
  }

  for (let index = startIndex; index < source.length; index += 1) {
    const current = source[index]
    if ('([{'.includes(current)) depth += 1
    if (')]}'.includes(current)) depth -= 1
    if (depth === 0 && current === ';') return index
    if (depth === 0 && current === '\n' && !continuesAfterNewline(index)) return index
  }

  return source.length
}

function stripOuterParentheses(expression) {
  let result = expression.trim()

  while (result.startsWith('(') && findClosingParenthesis(result, 0) === result.length - 1) {
    result = result.slice(1, -1).trim()
  }

  return result
}

function hasTopLevelCompoundOperator(expression) {
  let depth = 0

  for (let index = 0; index < expression.length; index += 1) {
    const current = expression[index]
    const next = expression[index + 1]
    if ('([{'.includes(current)) depth += 1
    if (')]}'.includes(current)) depth -= 1
    if (depth !== 0) continue

    if (
      current === '?' ||
      current === ':' ||
      current === ',' ||
      current === '=' ||
      (current === '&' && next === '&') ||
      (current === '|' && next === '|')
    ) {
      return true
    }
  }

  return false
}

function isUnconditionalNonnegativeComparison(expression) {
  const normalized = stripOuterParentheses(expression)
  const match = normalized.match(/^(.+?)>=\s*0$/s)
  if (!match) return false

  const leftOperand = match[1].trim()
  return leftOperand.length > 0 && !hasTopLevelCompoundOperator(leftOperand)
}

function isLocatorCountNonnegativeComparison(expression) {
  if (!isUnconditionalNonnegativeComparison(expression)) return false

  const normalized = stripOuterParentheses(expression)
  const leftOperand = normalized.match(/^(.+?)>=\s*0$/s)?.[1] ?? ''
  return /\.count\s*\(\s*\)/s.test(leftOperand)
}

function isLocatorCountValue(expression) {
  const normalized = stripOuterParentheses(expression)
  return /^(?:await\s+)?[\s\S]*\.count\s*\(\s*\)$/.test(normalized)
}

function hasUnconditionalLocatorCountDisjunction(expression) {
  const normalized = stripOuterParentheses(expression)
  let depth = 0
  let operandStart = 0
  const operands = []

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index]
    const next = normalized[index + 1]
    if ('([{'.includes(current)) depth += 1
    if (')]}'.includes(current)) depth -= 1

    if (depth === 0 && current === '|' && next === '|') {
      operands.push(normalized.slice(operandStart, index))
      operandStart = index + 2
      index += 1
    }
  }

  if (operands.length === 0) return false
  operands.push(normalized.slice(operandStart))
  return operands.some(isLocatorCountNonnegativeComparison)
}

function collectVariableAssignments(code) {
  const declarations = code.matchAll(
    /\b(?:const|let|var)[^\S\r\n]+([A-Za-z_$][\w$]*)(?:[^\S\r\n]*:[^=\r\n]+)?[^\S\r\n]*=/g
  )
  const assignments = new Map()

  for (const declaration of declarations) {
    const variable = declaration[1]
    if (assignments.has(variable)) continue

    const assignmentPattern = new RegExp(
      `(?<![\\w$.])${variable}(?:[^\\S\\r\\n]*:[^=\\r\\n]+)?[^\\S\\r\\n]*=(?!=|>)`,
      'g'
    )
    const events = []

    for (const assignment of code.matchAll(assignmentPattern)) {
      if (assignment.index < declaration.index) continue
      const expressionStart = assignment.index + assignment[0].length
      const expressionEnd = findExpressionEnd(code, expressionStart)
      events.push({
        index: assignment.index,
        isUnconditional: isLocatorCountNonnegativeComparison(
          code.slice(expressionStart, expressionEnd)
        ),
        isLocatorCountValue: isLocatorCountValue(code.slice(expressionStart, expressionEnd)),
      })
    }

    assignments.set(variable, events)
  }

  return assignments
}

function latestAssignmentBefore(variableAssignments, variable, index) {
  return variableAssignments.get(variable)?.findLast(assignment => assignment.index < index)
}

function isTrackedLocatorCountNonnegativeComparison(
  expression,
  variableAssignments,
  assertionIndex
) {
  if (!isUnconditionalNonnegativeComparison(expression)) return false

  const normalized = stripOuterParentheses(expression)
  const leftOperand = normalized.match(/^(.+?)>=\s*0$/s)?.[1].trim() ?? ''
  if (!/^[A-Za-z_$][\w$]*$/.test(leftOperand)) return false

  return Boolean(
    latestAssignmentBefore(variableAssignments, leftOperand, assertionIndex)?.isLocatorCountValue
  )
}

function lineAt(source, index) {
  return source.slice(0, index).split('\n').length
}

function finding(file, source, index, message) {
  return { file, line: lineAt(source, index), message }
}

export function scanSource(source, file = '<source>') {
  const code = maskCommentsAndStrings(source)
  const findings = []
  const variableAssignments = collectVariableAssignments(code)

  const expectPattern = /\bexpect\s*\(/g
  for (const match of code.matchAll(expectPattern)) {
    const openingIndex = code.indexOf('(', match.index)
    const closingIndex = findClosingParenthesis(code, openingIndex)
    if (closingIndex < 0) continue

    const argument = code.slice(openingIndex + 1, closingIndex).trim()
    const matcher = code.slice(closingIndex + 1, closingIndex + 80)
    let message = null

    if (argument === 'true') {
      message = 'direct expect(true) cannot prove behavior'
    } else if (/\|\|\s*true\b/.test(argument)) {
      message = '`|| true` makes this assertion unconditional'
    } else if (
      isLocatorCountNonnegativeComparison(argument) ||
      hasUnconditionalLocatorCountDisjunction(argument) ||
      isTrackedLocatorCountNonnegativeComparison(argument, variableAssignments, match.index)
    ) {
      message = 'a nonnegative count assertion is unconditional'
    } else if (/^\.toBeGreaterThanOrEqual\s*\(\s*0\s*\)/.test(matcher)) {
      message = 'toBeGreaterThanOrEqual(0) cannot prove content exists'
    } else if (
      latestAssignmentBefore(variableAssignments, argument, match.index)?.isUnconditional
    ) {
      message = `\`${argument}\` was derived from an unconditional >= 0 comparison`
    }

    if (message) findings.push(finding(file, source, match.index, message))
  }

  return findings
}

export async function scanFiles(files = OWNED_E2E_FILES, root = process.cwd()) {
  const findings = []

  for (const file of files) {
    const absolutePath = isAbsolute(file) ? file : resolve(root, file)
    let source
    try {
      source = await readFile(absolutePath, 'utf8')
    } catch (error) {
      throw new Error(`Configured E2E assertion file is missing or unreadable: ${file}`, {
        cause: error,
      })
    }
    const displayPath = isAbsolute(file) ? relative(root, file) : file
    findings.push(...scanSource(source, displayPath))
  }

  return findings
}

export function resolveScanTargets(args) {
  return args.length > 0 ? args : OWNED_E2E_FILES
}

async function main(args = process.argv.slice(2)) {
  try {
    const files = resolveScanTargets(args)
    const findings = await scanFiles(files)
    if (findings.length === 0) {
      console.log(`E2E vacuous assertion check passed (${files.length} files).`)
      return
    }

    console.error(`Found ${findings.length} vacuous E2E assertion site(s):`)
    for (const item of findings) {
      console.error(`${item.file}:${item.line} ${item.message}`)
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
