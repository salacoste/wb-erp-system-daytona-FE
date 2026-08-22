import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const componentsDirectory = join(testDirectory, '..')
const routeDirectory = join(componentsDirectory, '..')

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Flat catalog: every production .ts/.tsx directly under components/ + page.tsx. */
function productionFiles(): string[] {
  const componentFiles = readdirSync(componentsDirectory)
    .filter(file => /\.(?:ts|tsx)$/.test(file))
    .map(file => join(componentsDirectory, file))
  return [join(routeDirectory, 'page.tsx'), ...componentFiles]
}

describe('Story 169.10 route presentation source contracts', () => {
  it('owned production sources contain no legacy Tailwind palette utilities', () => {
    const legacyPalette =
      /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|blue|green|red|amber|orange|indigo|teal|emerald|purple|yellow|lime|rose|sky|slate|zinc|neutral|stone)-\d{2,3}\b/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(legacyPalette)
    }
  })

  it('owned production sources contain no raw CSS hex color literals', () => {
    // Letter-lookahead excludes ticket references like #197 (169.8 lesson).
    const rawHex = /#(?=[0-9A-Fa-f]*[A-Fa-f])[0-9A-Fa-f]{3,8}\b/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(rawHex)
    }
  })

  it('scenario urgency icon carries no inline color style (hex path removed)', () => {
    const source = withoutComments(
      readFileSync(join(componentsDirectory, 'LiquidationScenarioCard.tsx'), 'utf8')
    )
    expect(source).not.toMatch(/style=\{\{\s*color:/)
    expect(source).not.toMatch(/getScenarioUrgencyColor/)
  })

  it('owned sources do not consume lib runtime-hex channels (169.10)', () => {
    // After the 169.10 token fixes, owned components must not read lib legacy
    // hex/text-class channels. (LIQUIDITY_CATEGORY_TOKENS imports and
    // color-mix(var(--color-chart-N)) tinting are legitimate and NOT blocked.)
    const libHexChannels =
      /\b(?:config\.color|config\.bgColor|statusConfig\.color|statusConfig\.textClass|getScenarioUrgencyColor|getFrozenCapitalStatusClass)\b/

    for (const file of productionFiles()) {
      expect(withoutComments(readFileSync(file, 'utf8')), file).not.toMatch(libHexChannels)
    }
  })

  it('table renders a scroll region and a caption (funnel precedent)', () => {
    const source = readFileSync(join(componentsDirectory, 'LiquidityTable.tsx'), 'utf8')
    expect(source).toMatch(/scrollContainerTabIndex/)
    expect(source).toMatch(/scrollContainerAriaLabel/)
    expect(source).toMatch(/<TableCaption>Ликвидность товаров по SKU<\/TableCaption>/)
  })

  it('sortable heads expose aria-sort and real buttons (keyboard access)', () => {
    const source = readFileSync(join(componentsDirectory, 'LiquidityTableHeader.tsx'), 'utf8')
    expect(source).toMatch(/aria-sort/)
    expect(source).not.toMatch(/<TableHead[^>]*onClick/)
  })

  it('numeric table cells are tabular; the SKU id is mono but NOT tabular', () => {
    const cells = readFileSync(join(componentsDirectory, 'LiquidityTableRowCells.tsx'), 'utf8')
    expect(cells).toMatch(/tabular-nums/)
    const expanded = readFileSync(join(componentsDirectory, 'LiquidityExpandedRow.tsx'), 'utf8')
    expect(expanded).toMatch(/font-mono/)
    // Negative pin: the id is not a quantity — no tabular-nums inside the SKU <p>.
    const skuLine = expanded.split('\n').find(line => line.includes('font-mono'))
    expect(skuLine, 'font-mono SKU line present').toBeDefined()
    expect(skuLine).not.toMatch(/tabular-nums/)
  })

  it('trend chart axes/grid use design-system tokens, not hex', () => {
    for (const file of ['LiquidityTrendChart.tsx', 'LiquidityDistributionTrendChart.tsx']) {
      const source = withoutComments(readFileSync(join(componentsDirectory, file), 'utf8'))
      expect(source, file).toMatch(/var\(--color-chart-axis\)/)
      expect(source, file).toMatch(/var\(--color-border\)/)
    }
  })
})
