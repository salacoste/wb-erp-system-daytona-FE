import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const TABLES_ROOT = path.resolve(__dirname, '..')
const CANONICAL_FILES = [
  'ResponsiveTable.tsx',
  'ResponsiveTableHeader.tsx',
  'TablePagination.tsx',
  'TableState.tsx',
  'VirtualizedTableFrame.tsx',
  'contracts.ts',
  'index.ts',
]
const CANONICAL_TEST_FILES = [
  'ResponsiveTable.test.tsx',
  'ResponsiveTableHeader.test.tsx',
  'TableContracts.test.ts',
  'TablePagination.test.tsx',
  'TableState.test.tsx',
  'VirtualizedTableFrame.test.tsx',
  'table-composition-source-contracts.test.ts',
]
const ALLOWED_MODULES = new Set([
  'react',
  'lucide-react',
  '@/components/ui/button',
  '@/components/ui/table',
  '@/lib/utils',
])

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

describe('Story 166.6 table composition source contracts', () => {
  it('scans only the exact Story-owned production manifest', () => {
    expect(
      CANONICAL_FILES.every(relativePath => existsSync(path.join(TABLES_ROOT, relativePath)))
    ).toBe(true)
    expect(
      readdirSync(TABLES_ROOT)
        .filter(relativePath => /\.(?:ts|tsx)$/.test(relativePath))
        .sort()
    ).toEqual([...CANONICAL_FILES].sort())
  })

  it('keeps the exact Story-owned direct test manifest', () => {
    expect(
      readdirSync(path.join(TABLES_ROOT, '__tests__'))
        .filter(relativePath => /\.(?:test|spec)\.(?:ts|tsx)$/.test(relativePath))
        .sort()
    ).toEqual([...CANONICAL_TEST_FILES].sort())
  })

  it('allows only presentation-safe imports and no table dependency', () => {
    for (const relativePath of CANONICAL_FILES) {
      const filePath = path.join(TABLES_ROOT, relativePath)
      if (!existsSync(filePath)) continue
      const source = readFileSync(filePath, 'utf8')

      for (const moduleName of moduleSources(source, filePath)) {
        const localImport = moduleName === '.' || moduleName.startsWith('./')
        expect(
          ALLOWED_MODULES.has(moduleName) || localImport,
          `${relativePath} imports ${moduleName}`
        ).toBe(true)
        expect(moduleName).not.toMatch(/tanstack|react-window/i)
        expect(moduleName).not.toMatch(
          /(?:^|[/_.-])(?:app|routes?|api|hooks?|stores?|queries?|query|router|navigation|contexts?|domains?)(?:$|[/_.-])/i
        )
      }
    }
  })

  it('owns no route, query, persistence, calculation, palette, or visual reordering', () => {
    const forbiddenOwnership =
      /\b(?:fetch|axios|useRouter|usePathname|useSearchParams|useQuery|useMutation|queryKey|router\s*\.|history\s*\.|window\.location|location\.search|document\.cookie|indexedDB|localStorage|sessionStorage|calculate|aggregate|debounce)\b/i
    const rawPalette =
      /\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/i
    const visualReordering =
      /\b(?:order-(?:first|last|none|\d+|\[[^\]]+\])|flex-(?:row|col)-reverse|grid-flow-(?:dense|row-dense|col-dense))\b/i

    for (const relativePath of CANONICAL_FILES) {
      const filePath = path.join(TABLES_ROOT, relativePath)
      if (!existsSync(filePath)) continue
      const source = executableSource(readFileSync(filePath, 'utf8'))
      expect(source, relativePath).not.toMatch(forbiddenOwnership)
      expect(source, relativePath).not.toMatch(rawPalette)
      expect(source, relativePath).not.toMatch(/#(?:[\da-f]{3,8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/i)
      expect(source, relativePath).not.toMatch(visualReordering)
    }
  })

  it('keeps only the controlled pagination callback leaf client-side', () => {
    for (const relativePath of CANONICAL_FILES) {
      const filePath = path.join(TABLES_ROOT, relativePath)
      if (!existsSync(filePath)) continue
      const source = executableSource(readFileSync(filePath, 'utf8'))
      const clientComponent = /^\s*['"]use client['"]/m.test(source)
      expect(clientComponent, relativePath).toBe(relativePath === 'TablePagination.tsx')
    }
  })
})
