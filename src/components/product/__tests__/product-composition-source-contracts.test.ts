import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const PRODUCT_ROOT = path.resolve(__dirname, '..')
const CANONICAL_FILES = [
  'ContextBar.tsx',
  'PageHeader.tsx',
  'examples/PageContextCompositionsExample.tsx',
  'index.ts',
]
const ALLOWED_MODULES = new Set([
  'react',
  'next/link',
  'lucide-react',
  '@/components/ui/button',
  '@/lib/utils',
])
const FORBIDDEN_DOMAIN_KNOWLEDGE =
  /(?<![\p{L}\p{N}_])(?:seller|sku|cogs|margin|shipment|campaign|revenue|profit|roas|calculate|computed|aggregate|продавец|артикул|себестоимость|маржа|поставка|кампания|выручка|прибыль)(?![\p{L}\p{N}_])/iu

function moduleSources(source: string, filePath: string): string[] {
  const sources = new Set<string>()
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )

  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      sources.add(node.moduleSpecifier.text)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [specifier] = node.arguments
      sources.add(
        specifier && ts.isStringLiteralLike(specifier) ? specifier.text : '<dynamic-import>'
      )
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return [...sources]
}

function readProductionSources(): Array<{ filePath: string; source: string }> {
  return CANONICAL_FILES.map(relativePath => path.join(PRODUCT_ROOT, relativePath)).map(
    filePath => ({
      filePath,
      source: readFileSync(filePath, 'utf8'),
    })
  )
}

function relativeFile(filePath: string): string {
  return path.relative(PRODUCT_ROOT, filePath)
}

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('product composition source contracts', () => {
  it('scans the complete canonical production surface', () => {
    const files = readProductionSources().map(({ filePath }) => relativeFile(filePath))

    expect(files).toEqual(CANONICAL_FILES)
    for (const file of files) expect(statSync(path.join(PRODUCT_ROOT, file)).isFile()).toBe(true)
  })

  it('allows only presentation-safe imports in production compositions', () => {
    for (const { filePath, source } of readProductionSources()) {
      for (const moduleName of moduleSources(source, filePath)) {
        const isLocalCompositionImport =
          moduleName === '.' ||
          moduleName === '..' ||
          moduleName.startsWith('./') ||
          moduleName.startsWith('../')

        expect(
          ALLOWED_MODULES.has(moduleName) || isLocalCompositionImport,
          `${relativeFile(filePath)} imports ${moduleName}`
        ).toBe(true)
        expect(moduleName).not.toMatch(
          /(?:^|[/_.-])(?:api|apis|hooks?|stores?|queries?|query)(?:$|[/_.-])/i
        )
      }
    }
  })

  it('does not encode palette values, routing, query ownership, or visual reordering', () => {
    const rawPaletteUtility =
      /\b(?:bg|text|border|ring|from|via|to|decoration|divide|outline|shadow|accent|fill|stroke)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/i
    const rawColorValue = /#(?:[\da-f]{3,8})\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/i
    const routePathLiteral = /(['"`])\/(?![/*])[^'"`\n]*\1/
    const routeOwnership =
      /\b(?:fetch|axios|useRouter|usePathname|useSearchParams|useQuery|useMutation|router\s*\.|history\s*\.|window\.location|location\.search|document\.cookie|indexedDB|localStorage|sessionStorage)\b/i
    const visualReordering =
      /\b(?:order-(?:first|last|none|\d+|\[[^\]]+\])|flex-(?:row|col)-reverse|grid-flow-(?:dense|row-dense|col-dense))\b/i

    for (const { filePath, source } of readProductionSources()) {
      const executableSource = withoutComments(source)
      expect(executableSource, relativeFile(filePath)).not.toMatch(rawPaletteUtility)
      expect(executableSource, relativeFile(filePath)).not.toMatch(rawColorValue)
      expect(executableSource, relativeFile(filePath)).not.toMatch(routePathLiteral)
      expect(executableSource, relativeFile(filePath)).not.toMatch(routeOwnership)
      expect(executableSource, relativeFile(filePath)).not.toMatch(visualReordering)
    }
  })

  it('keeps generic compositions free of product-domain calculations and terminology', () => {
    for (const { filePath, source } of readProductionSources()) {
      const searchableSource = withoutComments(source).replace(/([a-zа-яё\d])([A-ZА-ЯЁ])/g, '$1 $2')
      expect(searchableSource, relativeFile(filePath)).not.toMatch(FORBIDDEN_DOMAIN_KNOWLEDGE)
    }
  })

  it.each(['seller', 'calculateMargin', 'продавец', 'маржа', 'прибыль'])(
    'rejects the forbidden domain sentinel %s',
    sentinel => {
      const searchableSource = sentinel.replace(/([a-zа-яё\d])([A-ZА-ЯЁ])/g, '$1 $2')
      expect(searchableSource).toMatch(FORBIDDEN_DOMAIN_KNOWLEDGE)
    }
  )

  it('preserves visible refresh meaning when motion is reduced', () => {
    const source = readFileSync(path.join(PRODUCT_ROOT, 'ContextBar.tsx'), 'utf8')

    expect(source).toContain('motion-reduce:animate-none')
    expect(source).toContain("refreshing: 'Обновление данных'")
  })
})
