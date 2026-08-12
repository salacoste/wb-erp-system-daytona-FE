import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const FILTER_ROOT = path.resolve(__dirname, '..')
const PRODUCT_ROOT = path.resolve(FILTER_ROOT, '..')
const PRODUCT_BARREL = path.join(PRODUCT_ROOT, 'index.ts')
const CANONICAL_FILES = ['FilterToolbar.tsx', 'FilterToolbar.types.ts', 'index.ts']
const ALLOWED_MODULES = new Set([
  'react',
  'lucide-react',
  '@/components/ui/button',
  '@/components/ui/collapsible',
  '@/lib/utils',
])

function productionFiles(directory = FILTER_ROOT): string[] {
  return readdirSync(directory).flatMap(entry => {
    if (entry === '__tests__') return []
    const absolutePath = path.join(directory, entry)
    const relativePath = path.relative(FILTER_ROOT, absolutePath)
    return statSync(absolutePath).isDirectory() ? productionFiles(absolutePath) : [relativePath]
  })
}

function moduleSources(source: string, filePath: string): string[] {
  const sources = new Set<string>()
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

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('FilterToolbar source contract', () => {
  it('scans the exact Story 166.5 product-filter production manifest', () => {
    expect(productionFiles()).toEqual(CANONICAL_FILES)
    for (const file of CANONICAL_FILES) {
      expect(statSync(path.join(FILTER_ROOT, file)).isFile()).toBe(true)
    }
  })

  it('allows only presentation-safe imports', () => {
    for (const file of CANONICAL_FILES) {
      const filePath = path.join(FILTER_ROOT, file)
      const source = readFileSync(filePath, 'utf8')
      for (const moduleName of moduleSources(source, filePath)) {
        const localImport = moduleName === '.' || moduleName.startsWith('./')
        expect(
          ALLOWED_MODULES.has(moduleName) || localImport,
          `${file} imports ${moduleName}`
        ).toBe(true)
        expect(moduleName).not.toMatch(
          /(?:^|[/_.-])(?:app|api|hooks?|stores?|queries?|query|router|navigation|contexts?)(?:$|[/_.-])/i
        )
      }
    }
  })

  it('does not own palette, routing, persistence, query, calculation, or visual reordering', () => {
    const rawPaletteUtility =
      /\b(?:bg|text|border|ring|from|via|to|decoration|divide|outline|shadow|accent|fill|stroke)-(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d{1,3})?\b/i
    const forbiddenOwnership =
      /\b(?:fetch|axios|useRouter|usePathname|useSearchParams|useQuery|useMutation|router\s*\.|history\s*\.|window\.location|location\.search|document\.cookie|indexedDB|localStorage|sessionStorage|calculate|aggregate|debounce)\b/i
    const visualReordering =
      /\b(?:order-(?:first|last|none|\d+|\[[^\]]+\])|flex-(?:row|col)-reverse|grid-flow-(?:dense|row-dense|col-dense))\b/i

    for (const file of CANONICAL_FILES) {
      const source = withoutComments(readFileSync(path.join(FILTER_ROOT, file), 'utf8'))
      expect(source, file).not.toMatch(rawPaletteUtility)
      expect(source, file).not.toMatch(forbiddenOwnership)
      expect(source, file).not.toMatch(visualReordering)
    }
  })

  it('exports the intentional filter composition from the product barrel', () => {
    expect(withoutComments(readFileSync(PRODUCT_BARREL, 'utf8'))).toMatch(
      /export \* from ['"]\.\/filters['"]/
    )
  })
})
