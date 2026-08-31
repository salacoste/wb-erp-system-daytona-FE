// Story 174.2 self-suite for scripts/check-shadcn-ui-boundary.mjs.
// Runs under node:test only (excluded from vitest). Static imports of the
// validator's pure functions — this file must never import node:child_process
// or node:module (playwright-static-boundary flags them in .test.* surfaces),
// and must never use dynamic import().
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  BOUNDARY_EXCEPTIONS,
  collectProductionFiles,
  collectViolations,
  compareBaseline,
  hexMatches,
  paletteMatches,
  readBaseline,
  routeGroup,
  run,
  scanSource,
} from '../check-shadcn-ui-boundary.mjs'

function assertDetected(source, expected) {
  assert.deepEqual(paletteMatches(source).concat(hexMatches(source)), expected)
}

test('legacy palette: positive classes are detected, semantic tokens are not', () => {
  assertDetected('bg-red-500', ['bg-red-500'])
  assertDetected('ring-offset-blue-500', ['ring-offset-blue-500'])
  assertDetected('ring-red-500', ['ring-red-500'])
  assertDetected('inset-shadow-indigo-500', ['inset-shadow-indigo-500'])
  assertDetected('text-gray-900', ['text-gray-900'])
  assertDetected('from-violet-100', ['from-violet-100'])
  assertDetected('bg-red-500 text-status-error', ['bg-red-500'])
  // Status/financial/chart token vocabulary must never match.
  assertDetected('bg-status-error', [])
  assertDetected('text-status-success', [])
  assertDetected('text-financial-positive', [])
  assertDetected('text-chart-3', [])
  assertDetected('bg-popover text-muted-foreground', [])
  assertDetected('border-status-warning/40', [])
})

test('contextual hex: quoted, pure-digit, bracketed, and semicolon forms are detected', () => {
  assertDetected("const mark = '#EF4444'", ["'#EF4444"])
  assertDetected('className="bg-[#EF4444]"', ['-[#EF4444'])
  assertDetected("const dim = '#333333'", ["'#333333"])
  assertDetected("const css = '#22C55E;'", ["'#22C55E"])
  assertDetected('style="border-[#22C55E]; padding: 2px"', ['-[#22C55E'])
  assertDetected('fill: `#7C3AED`', ['`#7C3AED'])
  // Prose tickets and story numbers must not match (C14 pure-digit fix keeps
  // digit-only hexes detectable only in anchored contexts).
  assertDetected('see ticket #197 for details', [])
  assertDetected('Story 173.3 shipped the parity validator', [])
  assertDetected('request #197 and #198 remain open', [])
})

test('color functions: rgba/rgb/hsl/hsla/oklch literals are detected, prose is not', () => {
  assertDetected('rgba(31, 41, 55, 0.5)', ['rgba(3'])
  assertDetected('rgb(0 0 0 / 50%)', ['rgb(0'])
  assertDetected('hsl(120 50% 45%)', ['hsl(1'])
  assertDetected('hsla(0, 0%, 100%, 0.5)', ['hsla(0'])
  assertDetected('oklch(0.7 0.1 20)', ['oklch(0'])
  assertDetected('oklch(from var(--brand) calc(l + 0.1) c h)', [
    'oklch(from var(--brand) calc(l + 0',
  ])
  assertDetected('rgb', [])
  assertDetected('oklch without a call', [])
  assertDetected('rgba(var(--a), var(--b))', [])
  assertDetected('color: rgb(var(--fg))', [])
  assertDetected('xrgba(1, 2, 3)', [])
})

test('scanSource reports 1-based lines and detection classes per match', () => {
  const source = `const a = 'ok'\nconst badge = 'bg-red-500'\nconst tint = '#333333'\n`
  assert.deepEqual(scanSource(source), [
    { line: 2, text: 'bg-red-500', kind: 'legacy-palette' },
    { line: 3, text: "'#333333", kind: 'contextual-hex' },
  ])
})

test('routeGroup maps app files to the first src/app segment, others to src/<tree>', () => {
  assert.equal(routeGroup('src/app/(dashboard)/analytics/page.tsx'), 'src/app/(dashboard)')
  assert.equal(routeGroup('src/app/(auth)/login/page.tsx'), 'src/app/(auth)')
  assert.equal(routeGroup('src/components/custom/MarginBadge.tsx'), 'src/components')
  assert.equal(routeGroup('src/lib/analytics-utils.ts'), 'src/lib')
})

test('production scope excludes tests, __tests__, .d.ts, and src/test', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-2-scope-'))
  const write = (relative, content) => {
    const target = path.join(root, relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  try {
    write('src/app/(dashboard)/live/page.tsx', 'export default function Page() {}\n')
    write('src/app/(dashboard)/live/ignored.test.tsx', 'export const legacy = "bg-red-500"\n')
    write('src/app/(dashboard)/live/ignored.spec.ts', 'export const legacy = "bg-red-500"\n')
    write('src/app/(dashboard)/live/__tests__/ignored.ts', 'export const legacy = "bg-red-500"\n')
    write('src/app/(dashboard)/live/env.d.ts', 'declare const legacy: "bg-red-500"\n')
    write('src/test/fixture.ts', 'export const legacy = "bg-red-500"\n')
    write('src/lib/live.ts', 'export const clean = 1\n')
    assert.deepEqual(collectProductionFiles(root), [
      'src/app/(dashboard)/live/page.tsx',
      'src/lib/live.ts',
    ])
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('exceptions register suppresses flagged files and feeds per-route counts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-2-suppress-'))
  const write = (relative, content) => {
    const target = path.join(root, relative)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  try {
    // Real exception path (F-10) — must be scanned but never counted.
    write('src/components/custom/ai/FeedbackButtons.tsx', 'export const tone = "text-green-700"\n')
    write('src/app/(dashboard)/live/Live.tsx', 'export const tone = "bg-red-500"\n')
    const scan = collectViolations(root)
    assert.equal(scan.total, 1)
    assert.deepEqual(
      scan.files.map(file => file.path),
      ['src/app/(dashboard)/live/Live.tsx']
    )
    assert.deepEqual(scan.routeCounts, { 'src/app/(dashboard)': 1 })
    assert.deepEqual(
      scan.suppressed.map(file => file.path),
      ['src/components/custom/ai/FeedbackButtons.tsx']
    )
    assert.ok(BOUNDARY_EXCEPTIONS.get('src/components/custom/ai/FeedbackButtons.tsx'))
    assert.equal(BOUNDARY_EXCEPTIONS.size, 4)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('ratchet comparison: greater fails, equal passes, less ratchets down', () => {
  assert.deepEqual(compareBaseline(5, 4), { status: 'fail', delta: 1 })
  assert.deepEqual(compareBaseline(4, 4), { status: 'pass', delta: 0 })
  assert.deepEqual(compareBaseline(3, 4), { status: 'ratchet-down', delta: -1 })
})

function fixtureScan(total, route = 'src/components', filePath = 'src/components/Live.tsx') {
  const violations = Array.from({ length: total }, (_, index) => ({
    line: index + 1,
    text: 'bg-red-500',
    kind: 'legacy-palette',
  }))
  return {
    root: '/fixture',
    scannedFiles: 1,
    files: [{ path: filePath, route, suppressed: false, violations }],
    suppressed: [],
    routeCounts: { [route]: total },
    total,
  }
}

test('run without a baseline exits 1 with explicit init instructions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-2-nobaseline-'))
  const lines = []
  try {
    const result = run(root, {
      selfTest: false,
      scan: fixtureScan(1),
      write: line => lines.push(line),
    })
    assert.equal(result.status, 1)
    assert.ok(lines.some(line => line.includes('--init')))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('run enforces the ratchet in all three directions and --init writes the baseline', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-2-ratchet-'))
  const capture = () => {
    const lines = []
    return { lines, write: line => lines.push(line) }
  }
  try {
    const fail = capture()
    assert.equal(
      run(root, { selfTest: false, scan: fixtureScan(5), baseline: 4, ...fail }).status,
      1
    )
    assert.ok(fail.lines.some(line => line.includes('ratchet FAIL') && line.includes('+1')))
    assert.ok(fail.lines.some(line => line.includes('src/components/Live.tsx (5)')))

    const pass = capture()
    assert.equal(
      run(root, { selfTest: false, scan: fixtureScan(4), baseline: 4, ...pass }).status,
      0
    )
    assert.ok(pass.lines.some(line => line.includes('ratchet PASS')))

    const down = capture()
    assert.equal(
      run(root, { selfTest: false, scan: fixtureScan(3), baseline: 4, ...down }).status,
      0
    )
    assert.ok(
      down.lines.some(line =>
        line.includes('ratchet down: lower scripts/.shadcn-ui-boundary-baseline.txt')
      )
    )

    const init = capture()
    assert.equal(
      run(root, { selfTest: false, scan: fixtureScan(4), init: true, ...init }).status,
      0
    )
    assert.equal(readBaseline(root), 4)
    assert.ok(init.lines.some(line => line.includes('baseline written')))
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
