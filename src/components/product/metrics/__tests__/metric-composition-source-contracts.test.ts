import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const METRICS_ROOT = path.resolve(__dirname, '..')
const PRODUCT_ROOT = path.resolve(METRICS_ROOT, '..')
const CANONICAL_FILES = [
  'DataAvailability.tsx',
  'FinancialValue.tsx',
  'MetricCard.tsx',
  'MetricGroup.tsx',
  'StatusBadge.tsx',
  'StatusStrip.tsx',
  'index.ts',
  'presentation.ts',
]
const ALLOWED_MODULES = new Set([
  'react',
  'lucide-react',
  '@/components/ui/card',
  '@/components/ui/skeleton',
  '@/lib/duration-utils',
  '@/lib/formatters',
  '@/lib/utils',
])

function productionSources(): Array<{ relativePath: string; source: string }> {
  return CANONICAL_FILES.map(relativePath => ({
    relativePath,
    source: readFileSync(path.join(METRICS_ROOT, relativePath), 'utf8'),
  }))
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

function executableSource(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('Story 166.4 metric composition source contracts', () => {
  it('scans only the explicit Story-owned production manifest', () => {
    expect(
      CANONICAL_FILES.every(relativePath => existsSync(path.join(METRICS_ROOT, relativePath)))
    ).toBe(true)
    expect(
      existsSync(path.join(PRODUCT_ROOT, '__tests__/product-composition-source-contracts.test.ts'))
    ).toBe(true)
    expect(
      readdirSync(METRICS_ROOT)
        .filter(relativePath => /\.(?:ts|tsx)$/.test(relativePath))
        .sort()
    ).toEqual([...CANONICAL_FILES].sort())
  })

  it('keeps production server-compatible and presentation-only', () => {
    const routePathLiteral = /(['"`])\/(?![/*])[^'"`\n]*\1/
    const visualReordering =
      /\b(?:order-(?:first|last|none|\d+|\[[^\]]+\])|flex-(?:row|col)-reverse|grid-flow-(?:dense|row-dense|col-dense))\b/i

    for (const { relativePath, source } of productionSources()) {
      const executable = executableSource(source)
      expect(executable, relativePath).not.toMatch(/^\s*['"]use client['"]/m)
      expect(executable, relativePath).not.toMatch(
        /\b(?:useState|useEffect|useReducer|useContext|useQuery|useMutation|fetch|axios|window|document|localStorage|sessionStorage|indexedDB)\b/
      )
      expect(executable, relativePath).not.toMatch(
        /\b(?:calculate|aggregate|queryKey|router|useRouter|usePathname|useSearchParams|href|onClick)\b/
      )
      expect(executable, relativePath).not.toMatch(routePathLiteral)
      expect(executable, relativePath).not.toMatch(visualReordering)

      for (const moduleName of moduleSources(source, path.join(METRICS_ROOT, relativePath))) {
        const isLocal =
          moduleName === '.' || moduleName.startsWith('./') || moduleName.startsWith('../')
        expect(
          ALLOWED_MODULES.has(moduleName) || isLocal,
          `${relativePath} imports ${moduleName}`
        ).toBe(true)
        expect(moduleName).not.toMatch(
          /(?:^|[/_.-])(?:api|hooks?|stores?|queries?|query|routes?|app)(?:$|[/_.-])/i
        )
      }
    }
  })

  it('uses registered semantic roles instead of raw palette or collapsed meanings', () => {
    const sources = productionSources()
    const combined = sources.map(({ source }) => executableSource(source)).join('\n')
    const rawPalette =
      /\b(?:bg|text|border|ring|from|via|to)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/i

    expect(combined).not.toMatch(rawPalette)
    expect(combined).not.toMatch(/#(?:[\da-f]{3,8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/i)
    expect(combined).toContain('financial-positive')
    expect(combined).toContain('financial-negative')
    expect(combined).toContain('financial-neutral')
    expect(combined).toContain('status-error')
    expect(combined).toContain('availability-unknown')
    expect(combined).not.toMatch(/\b(?:bg|text)-(?:brand|primary|destructive)\b/)
  })

  it('adds the canonical metrics API without changing Story 166.3 exports', () => {
    const productBarrel = readFileSync(path.join(PRODUCT_ROOT, 'index.ts'), 'utf8')
    expect(productBarrel).toContain("from './PageHeader'")
    expect(productBarrel).toContain("from './ContextBar'")
    expect(productBarrel).toContain("from './metrics'")
  })
})
