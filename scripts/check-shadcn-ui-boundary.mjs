#!/usr/bin/env node
// Story 174.2 — design-system boundary enforcement over production source.
// Scans src/**/*.{ts,tsx} (tests, __tests__, .d.ts, src/test excluded) for
// legacy Tailwind palette classes and contextual hex/color-function literals,
// reports per-file/per-route/total counts, and ratchets the total against
// scripts/.shadcn-ui-boundary-baseline.txt (single integer; --init writes it).
// Regex canon: monitoring 172.12 guard (169.11 canon) extended with the
// ring-offset prefix, a trailing `;` in the hex lookahead class, and a
// color-function branch (rgba?/hsla?/oklch + digit/# within ~40 chars).
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const BASELINE_FILE = 'scripts/.shadcn-ui-boundary-baseline.txt'
const SKIP_SELF_TESTS_ENV = 'STORY_174_2_SKIP_SELF_TESTS'
const TEST_FILE = './__tests__/check-shadcn-ui-boundary.test.mjs'

// Widest route-guard form (monitoring 172.12 / 169.11 canon) + ring-offset.
export const LEGACY_PALETTE =
  /\b(?:text|bg|border|ring-offset|ring|fill|stroke|from|to|via|divide|outline|accent|caret|decoration|shadow|inset-shadow|text-shadow)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone|indigo|violet|teal|cyan|pink|fuchsia|emerald)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g

// Hex anchored to quote/backtick or arbitrary-value `-[` contexts with a
// trailing quote/backtick/`]`/`;` lookahead, OR a color function whose first
// ~40 chars contain a digit or `#` (catches rgb/hsl/hsla/oklch literals while
// ignoring prose mentions and var()-only calls).
export const CONTEXTUAL_HEX =
  /(?:['"\x60]\s*|-\[)#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})(?=['"\x60\];])|\b(?:rgba?|hsla?|oklch)\(.{0,40}?[\d#]/g

// Single source of truth for suppressed files. Each entry must carry an
// owner/debt ID and be mirrored 1:1 in the classification manifest
// (_bmad-output/planning-artifacts/shadcn-ui-boundary-classification-manifest.md).
export const BOUNDARY_EXCEPTIONS = new Map([
  // F-10 (TECH-DEBT ledger): WCAG 1.4.3 contrast exception, documented inline
  // at the call site — text-green-700 (#15803d) measures ~6.5:1.
  [
    'src/components/custom/ai/FeedbackButtons.tsx',
    'F-10 WCAG 1.4.3 documented contrast exception (text-green-700 ≈6.5:1)',
  ],
  // C5 (debt registry §3.2): waterfall double-color-source — categorical hex
  // stays until the chart-palette owner decides the canon source.
  [
    'src/app/(dashboard)/analytics/unit-economics/components/waterfall-chart-config.ts',
    'C5 waterfall categorical hex — registered chart exception until chart-palette owner decision',
  ],
  // 170.x carry-out: historical #7C3AED chart mark, classified not migrated.
  [
    'src/app/(dashboard)/analytics/pricing/components/PriceHistorySheet.tsx',
    'historical #7C3AED chart mark — 170.x carry-out, classified not migrated',
  ],
  [
    'src/app/(dashboard)/analytics/product/[nmId]/components/FunnelTab.tsx',
    'historical #7C3AED chart mark — 170.x carry-out, classified not migrated',
  ],
])

export function paletteMatches(source) {
  return [...source.matchAll(LEGACY_PALETTE)].map(match => match[0])
}

export function hexMatches(source) {
  return [...source.matchAll(CONTEXTUAL_HEX)].map(match => match[0])
}

function lineOf(source, index) {
  let line = 1
  for (let position = 0; position < index; position += 1) if (source[position] === '\n') line += 1
  return line
}

// Pure per-file scan: every match with its 1-based line and detection class.
export function scanSource(source) {
  return [
    ...[...source.matchAll(LEGACY_PALETTE)].map(match => ({
      line: lineOf(source, match.index),
      text: match[0],
      kind: 'legacy-palette',
    })),
    ...[...source.matchAll(CONTEXTUAL_HEX)].map(match => ({
      line: lineOf(source, match.index),
      text: match[0],
      kind: 'contextual-hex',
    })),
  ].sort((left, right) => left.line - right.line || left.kind.localeCompare(right.kind))
}

// Production source enumeration with relative-first discipline (171.8 canon):
// filter RELATIVE readdir entries BEFORE joining, so joined absolute paths of
// unrelated worktrees can never re-enter via substring collisions.
export function collectProductionFiles(root = process.cwd()) {
  const sourceRoot = path.join(root, 'src')
  const excludedTestTree = path.join(sourceRoot, 'test')
  const files = []
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const relative = entry.name
      if (entry.isDirectory()) {
        if (relative === '__tests__' || relative === 'node_modules') continue
        if (path.join(directory, relative) === excludedTestTree) continue
        visit(path.join(directory, relative))
      } else if (
        /\.(?:ts|tsx)$/.test(relative) &&
        !/(?:^|\.)(?:test|spec)\.[^.]+$/.test(relative) &&
        !/\.d\.ts$/.test(relative)
      ) {
        files.push(path.relative(root, path.join(directory, relative)).split(path.sep).join('/'))
      }
    }
  }
  visit(sourceRoot)
  return files.sort()
}

// Per-route grouping: the first src/app segment for app files (route group),
// otherwise the first src segment (components/lib/hooks trees).
export function routeGroup(relativePath) {
  const segments = relativePath.split('/')
  if (segments[0] === 'src' && segments[1] === 'app') return `src/app/${segments[2]}`
  return segments.slice(0, 2).join('/')
}

export function scanFile(relativePath, source) {
  const violations = scanSource(source)
  return {
    path: relativePath,
    route: routeGroup(relativePath),
    suppressed: BOUNDARY_EXCEPTIONS.has(relativePath),
    violations,
  }
}

export function collectViolations(root = process.cwd()) {
  const scanned = collectProductionFiles(root).map(relative => {
    const source = fs.readFileSync(path.join(root, relative), 'utf8')
    return scanFile(relative, source)
  })
  const flagged = scanned.filter(file => file.violations.length > 0)
  const active = flagged.filter(file => !file.suppressed)
  const suppressed = flagged.filter(file => file.suppressed)
  const routeCounts = {}
  for (const file of active)
    routeCounts[file.route] = (routeCounts[file.route] ?? 0) + file.violations.length
  return {
    root,
    scannedFiles: scanned.length,
    files: active,
    suppressed,
    routeCounts,
    total: active.reduce((sum, file) => sum + file.violations.length, 0),
  }
}

export function readBaseline(root = process.cwd()) {
  const file = path.join(root, BASELINE_FILE)
  if (!fs.existsSync(file)) return null
  const value = Number.parseInt(fs.readFileSync(file, 'utf8').trim(), 10)
  return Number.isInteger(value) ? value : null
}

// Pure ratchet comparison: greater fails, equal passes, less ratchets down.
export function compareBaseline(current, baseline) {
  if (current > baseline) return { status: 'fail', delta: current - baseline }
  if (current < baseline) return { status: 'ratchet-down', delta: current - baseline }
  return { status: 'pass', delta: 0 }
}

function humanLines(scan, baseline, verdict) {
  const topRoutes = Object.entries(scan.routeCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([route, count]) => `${route}:${count}`)
    .join(', ')
  return [
    `HUMAN: boundary total = ${scan.total} (baseline = ${baseline ?? 'ABSENT'}, verdict = ${verdict?.status ?? 'init'})`,
    `HUMAN: per-route top = ${topRoutes || 'none'}`,
    `HUMAN: exceptions = ${BOUNDARY_EXCEPTIONS.size} registered, ${scan.suppressed.length} suppressing live matches`,
  ]
}

export function run(root = process.cwd(), options = {}) {
  const write = options.write ?? (line => console.log(line))
  if (options.selfTest !== false) {
    const testPath = fileURLToPath(new URL(TEST_FILE, import.meta.url))
    const tests = (options.spawn ?? spawnSync)(process.execPath, ['--test', testPath], {
      stdio: options.testStdio ?? 'inherit',
      env: { ...process.env, [SKIP_SELF_TESTS_ENV]: '1' },
    })
    if (tests.status !== 0) return { status: 1, reason: 'self-test-failed' }
  }
  const scan = options.scan ?? collectViolations(root)
  for (const file of scan.files)
    for (const violation of file.violations)
      write(`${file.path}:${violation.line}: ${violation.text} [${violation.kind}]`)
  for (const [route, count] of Object.entries(scan.routeCounts).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
  ))
    write(`${route}: ${count}`)
  write(`total: ${scan.total}`)
  const baselinePath = path.join(root, BASELINE_FILE)
  if (options.init) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
    fs.writeFileSync(baselinePath, `${scan.total}\n`)
    for (const line of humanLines(scan, scan.total, { status: 'init' })) write(line)
    write(`HUMAN: baseline written to ${BASELINE_FILE} — commit it with this change`)
    return { status: 0, scan, baseline: scan.total }
  }
  const baseline = options.baseline ?? readBaseline(root)
  if (baseline === null) {
    write(
      `${BASELINE_FILE} is absent or not a single integer. Initialize the ratchet explicitly: node scripts/check-shadcn-ui-boundary.mjs --init (writes the current total), then commit the baseline in the same change.`
    )
    return { status: 1, scan, baseline: null }
  }
  const verdict = compareBaseline(scan.total, baseline)
  if (verdict.status === 'fail') {
    write(
      `boundary ratchet FAIL: ${scan.total} > baseline ${baseline} (+${verdict.delta}); offending files: ${scan.files.map(file => `${file.path} (${file.violations.length})`).join(', ')}`
    )
  } else if (verdict.status === 'ratchet-down') {
    write('ratchet down: lower scripts/.shadcn-ui-boundary-baseline.txt in the same commit')
  } else {
    write(`boundary ratchet PASS: ${scan.total} = baseline ${baseline}`)
  }
  for (const line of humanLines(scan, baseline, verdict)) write(line)
  return { status: verdict.status === 'fail' ? 1 : 0, scan, baseline, verdict }
}

function cli() {
  const args = process.argv.slice(2)
  const rootIndex = args.indexOf('--root')
  const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : process.cwd()
  const result = run(root, {
    init: args.includes('--init'),
    selfTest: !process.env[SKIP_SELF_TESTS_ENV],
  })
  process.exitCode = result.status
}

if (process.argv[1] === fileURLToPath(import.meta.url)) cli()
