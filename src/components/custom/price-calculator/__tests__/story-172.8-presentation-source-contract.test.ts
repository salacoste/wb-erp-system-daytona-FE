import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const MUTABLE_PRESENTATION_MANIFEST = [
  'src/app/(dashboard)/cogs/price-calculator/page.tsx',
  'src/components/custom/price-calculator/AcceptanceStatusBadge.tsx',
  'src/components/custom/price-calculator/AutoFillBadge.tsx',
  'src/components/custom/price-calculator/AutoFillWarning.tsx',
  'src/components/custom/price-calculator/BoxTypeSelectItem.tsx',
  'src/components/custom/price-calculator/BoxTypeSelector.tsx',
  'src/components/custom/price-calculator/BuybackSlider.tsx',
  'src/components/custom/price-calculator/CategoryCommandList.tsx',
  'src/components/custom/price-calculator/CategorySelector.tsx',
  'src/components/custom/price-calculator/CategorySelectorStates.tsx',
  'src/components/custom/price-calculator/CoefficientCalendar.tsx',
  'src/components/custom/price-calculator/CoefficientCalendarCells.tsx',
  'src/components/custom/price-calculator/CoefficientField.tsx',
  'src/components/custom/price-calculator/CoefficientsLoadingSkeleton.tsx',
  'src/components/custom/price-calculator/CostBreakdownChart.tsx',
  'src/components/custom/price-calculator/CostChartParts.tsx',
  'src/components/custom/price-calculator/DeliveryDatePicker.tsx',
  'src/components/custom/price-calculator/DeliveryDatePickerParts.tsx',
  'src/components/custom/price-calculator/DimensionDisplay.tsx',
  'src/components/custom/price-calculator/DimensionInputSection.tsx',
  'src/components/custom/price-calculator/DrrSlider.tsx',
  'src/components/custom/price-calculator/ErrorMessage.tsx',
  'src/components/custom/price-calculator/FieldTooltip.tsx',
  'src/components/custom/price-calculator/FixedCostField.tsx',
  'src/components/custom/price-calculator/FixedCostLogisticsField.tsx',
  'src/components/custom/price-calculator/FixedCostsBreakdown.tsx',
  'src/components/custom/price-calculator/FixedCostsSection.tsx',
  'src/components/custom/price-calculator/FormActionsSection.tsx',
  'src/components/custom/price-calculator/FulfillmentTypeSelector.tsx',
  'src/components/custom/price-calculator/HighRateWarning.tsx',
  'src/components/custom/price-calculator/LocalizationIndexInput.tsx',
  'src/components/custom/price-calculator/MarginProgressBar.tsx',
  'src/components/custom/price-calculator/MarginSection.tsx',
  'src/components/custom/price-calculator/MarginSlider.tsx',
  'src/components/custom/price-calculator/PercentageCostsBreakdown.tsx',
  'src/components/custom/price-calculator/PercentageCostsFormSection.tsx',
  'src/components/custom/price-calculator/PresetActions.tsx',
  'src/components/custom/price-calculator/PresetIndicator.tsx',
  'src/components/custom/price-calculator/PriceCalculatorForm.tsx',
  'src/components/custom/price-calculator/PriceCalculatorFormFields.tsx',
  'src/components/custom/price-calculator/PriceCalculatorResults.tsx',
  'src/components/custom/price-calculator/PriceSummaryFooter.tsx',
  'src/components/custom/price-calculator/ProductSearchComponents.tsx',
  'src/components/custom/price-calculator/ProductSearchPopover.tsx',
  'src/components/custom/price-calculator/ProductSearchResults.tsx',
  'src/components/custom/price-calculator/ProductSearchSelect.tsx',
  'src/components/custom/price-calculator/RateLimitWarning.tsx',
  'src/components/custom/price-calculator/RecommendedPriceCard.tsx',
  'src/components/custom/price-calculator/ResetConfirmDialog.tsx',
  'src/components/custom/price-calculator/ResultsSkeleton.tsx',
  'src/components/custom/price-calculator/SppInput.tsx',
  'src/components/custom/price-calculator/SupplyTariffInfo.tsx',
  'src/components/custom/price-calculator/TargetMarginSection.tsx',
  'src/components/custom/price-calculator/TaxConfigurationSection.tsx',
  'src/components/custom/price-calculator/TaxImpactPreview.tsx',
  'src/components/custom/price-calculator/TaxPresetGrid.tsx',
  'src/components/custom/price-calculator/TaxRateInput.tsx',
  'src/components/custom/price-calculator/TaxVatSection.tsx',
  'src/components/custom/price-calculator/TurnoverDaysInput.tsx',
  'src/components/custom/price-calculator/TwoLevelPriceHeader.tsx',
  'src/components/custom/price-calculator/TwoLevelPricingDisplay.tsx',
  'src/components/custom/price-calculator/UnitsPerPackageInput.tsx',
  'src/components/custom/price-calculator/VariableCostsBreakdown.tsx',
  'src/components/custom/price-calculator/WarehouseCommandList.tsx',
  'src/components/custom/price-calculator/WarehouseSection.tsx',
  'src/components/custom/price-calculator/WarehouseSelect.tsx',
  'src/components/custom/price-calculator/WarehouseTariffsByBoxType.tsx',
  'src/components/custom/price-calculator/WarningsDisplay.tsx',
  'src/components/custom/price-calculator/WeightThresholdCheckbox.tsx',
  'src/components/custom/price-calculator/cost-breakdown-types.ts',
  'src/components/custom/price-calculator/margin-status-helpers.ts',
] as const

const RAW_PALETTE_CLASS =
  /(?:bg|text|border|from|via|to|ring|fill|stroke)-(?:(?:black|white)\b|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)\b)/g
const RAW_HEX_COLOR = /#[\da-fA-F]{3,8}\b/g

function presentationViolations(path: string): string[] {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')

  return source.split('\n').flatMap((line, index) => {
    const matches = [...line.matchAll(RAW_PALETTE_CLASS), ...line.matchAll(RAW_HEX_COLOR)]
    return matches.map(match => `${path}:${index + 1} ${match[0]}`)
  })
}

describe('Story 172.8 mutable presentation source contract', () => {
  it('keeps the exact Story-owned live mutable catalog explicit', () => {
    expect(MUTABLE_PRESENTATION_MANIFEST).toHaveLength(71)
    expect(new Set(MUTABLE_PRESENTATION_MANIFEST).size).toBe(71)
  })

  it('uses semantic roles instead of raw palette or hex colors in every mutable file', () => {
    const violations = MUTABLE_PRESENTATION_MANIFEST.flatMap(presentationViolations)

    expect(violations, violations.join('\n')).toEqual([])
  })

  it('rejects raw black, white, and 950 utilities that bypass semantic roles', () => {
    expect('bg-black/5 text-white border-slate-950'.match(RAW_PALETTE_CLASS)).toEqual([
      'bg-black',
      'text-white',
      'border-slate-950',
    ])
  })

  it('pins the narrow-width reflow contract for live calculator controls', () => {
    const dimensions = readFileSync(
      resolve(process.cwd(), 'src/components/custom/price-calculator/DimensionInputSection.tsx'),
      'utf8'
    )
    const warehouse = readFileSync(
      resolve(process.cwd(), 'src/components/custom/price-calculator/WarehouseSelect.tsx'),
      'utf8'
    )

    expect(dimensions).toContain('grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3')
    expect(warehouse).toContain('w-[min(400px,calc(100vw-2rem))]')
  })
})
