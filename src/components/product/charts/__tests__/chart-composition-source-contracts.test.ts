import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const CHARTS_ROOT = path.resolve(__dirname, '..')
const CANONICAL_FILES = [
  'ChartEvidence.tsx',
  'ChartFrame.tsx',
  'ChartLegend.tsx',
  'ChartState.tsx',
  'ChartTooltipContent.tsx',
  'contracts.ts',
  'index.ts',
]
const CANONICAL_TEST_FILES = [
  'ChartContracts.test.ts',
  'ChartEvidence.test.tsx',
  'ChartFrame.test.tsx',
  'ChartLegend.test.tsx',
  'ChartState.test.tsx',
  'ChartTooltipContent.test.tsx',
  'chart-composition-source-contracts.test.ts',
]
const ALLOWED_MODULES = new Set(['react', 'lucide-react', '@/lib/utils'])

function executableSource(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function moduleSources(source: string, filePath: string): string[] {
  const modules = new Set<string>()
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      modules.add(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      modules.add('<dynamic-import>')
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return [...modules]
}

describe('Story 166.7 chart composition source contracts', () => {
  it('scans only the exact Story-owned production manifest', () => {
    expect(
      CANONICAL_FILES.every(relativePath => existsSync(path.join(CHARTS_ROOT, relativePath)))
    ).toBe(true)
    expect(
      readdirSync(CHARTS_ROOT)
        .filter(relativePath => /\.(?:ts|tsx)$/.test(relativePath))
        .sort()
    ).toEqual([...CANONICAL_FILES].sort())
  })

  it('keeps the exact Story-owned direct test manifest', () => {
    expect(
      readdirSync(path.join(CHARTS_ROOT, '__tests__'))
        .filter(relativePath => /\.(?:test|spec)\.(?:ts|tsx)$/.test(relativePath))
        .sort()
    ).toEqual([...CANONICAL_TEST_FILES].sort())
  })

  it('allows only presentation-safe imports with no chart library or route ownership', () => {
    for (const relativePath of CANONICAL_FILES) {
      const filePath = path.join(CHARTS_ROOT, relativePath)
      if (!existsSync(filePath)) continue
      const source = readFileSync(filePath, 'utf8')

      for (const moduleName of moduleSources(source, filePath)) {
        const localImport = moduleName === '.' || moduleName.startsWith('./')
        expect(
          ALLOWED_MODULES.has(moduleName) || localImport,
          `${relativePath} imports ${moduleName}`
        ).toBe(true)
        expect(moduleName).not.toMatch(/recharts|visx|chart\.js|echarts|d3/i)
        expect(moduleName).not.toMatch(
          /(?:^|[/_.-])(?:app|routes?|api|hooks?|stores?|queries?|query|router|navigation|contexts?|domains?|formatters?)(?:$|[/_.-])/i
        )
      }
    }
  })

  it('owns no client state raw data formatting calculation palette or visual reordering', () => {
    const forbiddenOwnership =
      /\b(?:useState|useEffect|useReducer|useContext|useSyncExternalStore|matchMedia|fetch|axios|useRouter|usePathname|useSearchParams|useQuery|useMutation|queryKey|router\s*\.|history\s*\.|window\.|document\.|localStorage|sessionStorage|indexedDB|setTimeout|setInterval|calculate|aggregate|sort\s*\(|Intl\.|toLocaleString|formatValue|dataKey|xKey|yKey|cloneElement|Children\.|isValidElement)\b/i
    const rawPalette =
      /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/i
    const visualReordering =
      /\b(?:order-(?:first|last|none|\d+|\[[^\]]+\])|flex-(?:row|col)-reverse|grid-flow-(?:dense|row-dense|col-dense))\b/i

    for (const relativePath of CANONICAL_FILES) {
      const filePath = path.join(CHARTS_ROOT, relativePath)
      if (!existsSync(filePath)) continue
      const source = executableSource(readFileSync(filePath, 'utf8'))
      expect(source, relativePath).not.toMatch(/^\s*['"]use client['"]/m)
      expect(source, relativePath).not.toMatch(forbiddenOwnership)
      expect(source, relativePath).not.toMatch(rawPalette)
      expect(source, relativePath).not.toMatch(/#(?:[\da-f]{3,8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/i)
      expect(source, relativePath).not.toMatch(visualReordering)
      expect(source, relativePath).not.toMatch(/recharts/i)
    }
  })

  it('uses registered chart semantic tokens for every series role', () => {
    const sources = CANONICAL_FILES.filter(relativePath =>
      existsSync(path.join(CHARTS_ROOT, relativePath))
    ).map(relativePath => readFileSync(path.join(CHARTS_ROOT, relativePath), 'utf8'))
    const combined = sources.join('\n')

    for (const token of [
      'chart-positive',
      'chart-negative',
      'chart-reference',
      'chart-target',
      'chart-forecast',
      'chart-confidence-band',
      'chart-selection',
    ]) {
      expect(combined).toContain(token)
    }
  })
})
