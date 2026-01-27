'use client'

import { useForm, useWatch } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'
import { FulfillmentTypeSelector } from './FulfillmentTypeSelector'
import { WarehouseSection } from './WarehouseSection'
import { ProductSearchSelect } from './ProductSearchSelect'
import { CategorySelector } from './CategorySelector'
import { TargetMarginSection } from './TargetMarginSection'
import { FixedCostsSection } from './FixedCostsSection'
import { PercentageCostsFormSection } from './PercentageCostsFormSection'
import { TaxConfigurationSection } from './TaxConfigurationSection'
import { FormActionsSection } from './FormActionsSection'
import { ResetConfirmDialog } from './ResetConfirmDialog'
import { DimensionInputSection } from './DimensionInputSection'
import { AutoFillWarning } from './AutoFillWarning'
// Story 44.32: Missing Price Calculator Fields
import { BoxTypeSelector } from './BoxTypeSelector'
import { WeightThresholdCheckbox } from './WeightThresholdCheckbox'
import { LocalizationIndexInput } from './LocalizationIndexInput'
import { TurnoverDaysInput } from './TurnoverDaysInput'
// Story 44.38: Units Per Package
import { UnitsPerPackageInput } from './UnitsPerPackageInput'
import { isFormEmpty, toTwoLevelFormData, toApiRequest } from './priceCalculatorUtils'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useProductAutoFill } from '@/hooks/useProductAutoFill'
import { useWarehouseFormState } from './useWarehouseFormState'
import { useTariffSettings } from '@/hooks/useTariffSettings'
import { useCommissions } from '@/hooks/useCommissions'
import type { PriceCalculatorRequest, TwoLevelPricingFormData, TaxType, CategoryHierarchy } from '@/types/price-calculator'
import type { CategoryCommission } from '@/types/tariffs'
import type { ProductWithDimensions } from '@/types/product'
import { type FormData, defaultFormValues } from './usePriceCalculatorForm'

export interface PriceCalculatorFormProps {
  onSubmit: (data: PriceCalculatorRequest) => void
  loading?: boolean
  disabled?: boolean
  hasResults?: boolean
  onSppChange?: (sppPct: number) => void
  onFormDataChange?: (data: TwoLevelPricingFormData) => void
  onCommissionChange?: (commission: number) => void
}

/**
 * Price Calculator input form
 * Story 44.2-FE: Input Form Component
 */
export function PriceCalculatorForm({
  onSubmit,
  loading = false,
  disabled = false,
  hasResults = false,
  onSppChange,
  onFormDataChange,
  onCommissionChange,
}: PriceCalculatorFormProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDimensions | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryCommission | null>(null)
  const [drrValue, setDrrValue] = useState(defaultFormValues.drr_pct)
  const [sppValue, setSppValue] = useState(0)
  const [taxRate, setTaxRate] = useState(6)
  const [taxType, setTaxType] = useState<TaxType>('income')
  // Story 44.XX: VAT configuration state (ОСН payers only)
  const [isVatPayer, setIsVatPayer] = useState(false)
  const [vatRate, setVatRate] = useState(20)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { handleSubmit, reset, setValue, register, formState: { isValid, errors }, control } =
    useForm<FormData>({ defaultValues: defaultFormValues, mode: 'onChange' })

  // Story 44.XX: Load global tariff settings for acceptance rates
  // Fallback to defaults if API fails (500 error handling)
  const { data: tariffSettings, error: tariffSettingsError } = useTariffSettings()

  // Story 44.26b: Load commissions for category auto-fill from product
  const { data: commissionsData } = useCommissions()

  // Log tariff settings error but continue with defaults
  useEffect(() => {
    if (tariffSettingsError) {
      console.warn('[PriceCalculator] Tariff settings API error, using defaults:', tariffSettingsError)
    }
  }, [tariffSettingsError])

  // Story 44.XX: Create acceptance tariff object for useWarehouseFormState
  // Use defaults if tariff settings fail to load
  const DEFAULT_ACCEPTANCE_BOX_RATE = 1.7
  const DEFAULT_ACCEPTANCE_PALLET_RATE = 500

  const acceptanceTariff = useMemo(() => {
    return {
      boxRatePerLiter: tariffSettings?.acceptanceBoxRatePerLiter ?? DEFAULT_ACCEPTANCE_BOX_RATE,
      palletRate: tariffSettings?.acceptancePalletRate ?? DEFAULT_ACCEPTANCE_PALLET_RATE,
    }
  }, [tariffSettings])

  // Story 44.26b: Find CategoryCommission by CategoryHierarchy from product
  const findCategoryByHierarchy = useCallback(
    (hierarchy: CategoryHierarchy): CategoryCommission | null => {
      if (!commissionsData?.commissions) return null

      // Match by subjectID (primary) and optionally parentID
      const result = commissionsData.commissions.find(
        (c) => c.subjectID === hierarchy.subject_id &&
               (hierarchy.parent_id === null || c.parentID === hierarchy.parent_id)
      ) ?? null

      // Debug: Log category lookup result
      console.info('[PriceCalculatorForm] findCategoryByHierarchy:', {
        hierarchy,
        found: result ? `${result.parentName} → ${result.subjectName}` : 'not found',
        commission: result ? `FBO: ${result.paidStorageKgvp}% / FBS: ${result.kgvpMarketplace}%` : 'N/A',
      })

      return result
    },
    [commissionsData]
  )

  // Auto-fill hook for dimensions and category (Story 44.26b)
  const {
    dimensionAutoFill, categoryAutoFill, handleProductSelect,
    markDimensionsModified, restoreDimensions, productHasDimensions, productHasCategory,
  } = useProductAutoFill({ setValue, setSelectedCategory, findCategoryByHierarchy })

  // Watch form values
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' })
  const lengthCm = useWatch({ control, name: 'length_cm' }) ?? 0
  const widthCm = useWatch({ control, name: 'width_cm' }) ?? 0
  const heightCm = useWatch({ control, name: 'height_cm' }) ?? 0
  const dimensions = { length_cm: lengthCm, width_cm: widthCm, height_cm: heightCm }

  // Story 44.35: Move useWatch hooks to top level to fix FBO/FBS toggle crash
  // These MUST be called unconditionally to satisfy React's Rules of Hooks
  const boxType = useWatch({ control, name: 'box_type' })
  const turnoverDays = useWatch({ control, name: 'turnover_days' })
  const weightExceeds25kg = useWatch({ control, name: 'weight_exceeds_25kg' })
  const localizationIndex = useWatch({ control, name: 'localization_index' })
  // Story 44.38: Units per package for acceptance cost division
  const unitsPerPackage = useWatch({ control, name: 'units_per_package' })

  // Story 44.27: Warehouse form state hook
  // Story 44.XX: Added logistics auto-fill and acceptance cost calculation
  const {
    warehouseId, dailyStorageCost,
    logisticsForwardRub, isLogisticsAutoFilled,
    logisticsReverseRub, isLogisticsReverseAutoFilled,
    acceptanceCost,
    handleWarehouseChange, handleStorageRubChange,
    handleLogisticsForwardChange, handleLogisticsReverseChange,
    handleDeliveryDateChange,
    // Story 44.40: Two Tariff Systems
    tariffSystem,
    effectiveTariffs,
  } = useWarehouseFormState({
    setValue,
    lengthCm,
    widthCm,
    heightCm,
    boxType: boxType ?? 'box',
    unitsPerPackage: unitsPerPackage ?? 1,
    acceptanceTariff,
  })

  useEffect(() => {
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [])

  // Story 44.38: Reset units_per_package when box_type or fulfillment_type changes
  useEffect(() => {
    setValue('units_per_package', 1, { shouldValidate: true })
  }, [boxType, fulfillmentType, setValue])

  // Story 44.XX: Auto-fill acceptance cost when calculated
  useEffect(() => {
    if (acceptanceCost.perUnitCost > 0) {
      setValue('acceptance_cost', acceptanceCost.perUnitCost)
    }
  }, [acceptanceCost.perUnitCost, setValue])

  // Story 44.19: Propagate SPP changes to parent for results display
  // Story 44.18: Sync SPP value with form field for API/calculations
  const handleSppChange = useCallback((value: number) => {
    setSppValue(value)
    setValue('spp_pct', value)
    onSppChange?.(value)
  }, [onSppChange, setValue])

  // Story 44.18: Sync DRR value with form fields for API request and two-level pricing
  // Both drr_pct (for TwoLevelPricingFormData) and advertising_pct (for API) need to be updated
  const handleDrrChange = useCallback((value: number) => {
    setDrrValue(value)
    setValue('drr_pct', value)
    setValue('advertising_pct', value)
  }, [setValue])

  // Story 44.XX: Sync tax rate with form field for calculations
  const handleTaxRateChange = useCallback((value: number) => {
    setTaxRate(value)
    setValue('tax_rate_pct', value)
  }, [setValue])

  // Story 44.XX: Sync tax type with form field for calculations
  const handleTaxTypeChange = useCallback((value: TaxType) => {
    setTaxType(value)
    setValue('tax_type', value)
  }, [setValue])

  // Story 44.XX: Sync VAT payer status with form field for calculations
  const handleVatPayerChange = useCallback((isPayer: boolean) => {
    setIsVatPayer(isPayer)
    setValue('is_vat_payer', isPayer)
  }, [setValue])

  // Story 44.XX: Sync VAT rate with form field for calculations
  const handleVatRateChange = useCallback((rate: number) => {
    setVatRate(rate)
    setValue('vat_pct', rate)
  }, [setValue])

  // Story 44.20: Propagate commission changes to parent for two-level pricing
  // Story 44.16: Get commission based on fulfillment type
  // BUG FIX: Also set commission_pct in form data for API request
  useEffect(() => {
    if (selectedCategory) {
      const fboCommission = selectedCategory.paidStorageKgvp
      const fbsCommission = selectedCategory.kgvpMarketplace
      const commission = fulfillmentType === 'FBO' ? fboCommission : fbsCommission

      // Debug: Log FBO vs FBS commission comparison
      console.info('[PriceCalculatorForm] Commission update:', {
        category: `${selectedCategory.parentName} → ${selectedCategory.subjectName}`,
        fulfillmentType,
        FBO_commission: fboCommission,
        FBS_commission: fbsCommission,
        activeCommission: commission,
        difference: fbsCommission - fboCommission,
      })

      // BUG FIX: Set commission_pct in form data so it gets sent to API
      setValue('commission_pct', commission)
      onCommissionChange?.(commission)
    }
  }, [selectedCategory, fulfillmentType, onCommissionChange, setValue])

  const performCalculation = useCallback((data: FormData) => {
    if (!isValid || isFormEmpty(data)) return
    onFormDataChange?.(toTwoLevelFormData(data))
    onSubmit(toApiRequest(data))
  }, [isValid, onSubmit, onFormDataChange])

  const onReset = useCallback(() => {
    if (hasResults) setShowResetConfirm(true)
    else reset(defaultFormValues)
  }, [hasResults, reset])

  const confirmReset = () => {
    reset(defaultFormValues)
    setShowResetConfirm(false)
  }

  // Story 44.30: Fixed Escape key - check if event was already handled by modal/popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if already handled (e.g., by Dialog/Popover)
      if (e.defaultPrevented) return

      // Skip if focus is inside a dialog, popover, or modal
      const activeElement = document.activeElement
      const isInModal = activeElement?.closest(
        '[role="dialog"], [data-radix-popover-content], [data-radix-dropdown-content]'
      )

      if (e.key === 'Escape' && !disabled && !isInModal) {
        onReset()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, onReset])

  return (
    <>
      <Card
        data-testid="price-calculator-form"
        className="shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl"
      >
        <CardHeader className="border-b-4 border-b-primary bg-muted/30 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-xl">Калькулятор цены</CardTitle>
              <CardDescription className="mt-1">
                Рассчитайте оптимальную цену на основе затрат и желаемой маржи
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(performCalculation)} className="space-y-6">
            {/* FBO/FBS selection */}
            <FulfillmentTypeSelector
              value={fulfillmentType}
              disabled={disabled}
              onChange={(type) => setValue('fulfillment_type', type, { shouldValidate: true })}
            />
            {/* Warehouse & Coefficients - Story 44.27 */}
            {/* Story 44.40: Pass tariff system data for SUPPLY/INVENTORY display */}
            <WarehouseSection
              warehouseId={warehouseId}
              onWarehouseChange={handleWarehouseChange}
              disabled={disabled}
              onDeliveryDateChange={handleDeliveryDateChange}
              tariffSystem={tariffSystem}
              effectiveTariffs={effectiveTariffs}
            />
            {/* Story 44.32: FBO-only fields */}
            {/* Story 44.35: useWatch hooks moved to top level to fix toggle crash */}
            {fulfillmentType === 'FBO' && (
              <>
                <BoxTypeSelector
                  value={boxType}
                  onValueChange={(value) => setValue('box_type', value, { shouldValidate: true })}
                  disabled={disabled}
                />
                {/* Story 44.38: Units per package for acceptance cost division */}
                <UnitsPerPackageInput
                  value={unitsPerPackage}
                  onValueChange={(value) => setValue('units_per_package', value, { shouldValidate: true })}
                  boxType={boxType}
                  disabled={disabled}
                />
                <TurnoverDaysInput
                  value={turnoverDays}
                  onChange={(value) => setValue('turnover_days', value, { shouldValidate: true })}
                  dailyStorageCost={dailyStorageCost}
                  onStorageRubChange={handleStorageRubChange}
                  disabled={disabled}
                />
              </>
            )}
            {/* Story 44.32: Weight threshold (both FBO and FBS) */}
            <WeightThresholdCheckbox
              checked={weightExceeds25kg}
              onChange={(checked) => setValue('weight_exceeds_25kg', checked, { shouldValidate: true })}
              disabled={disabled}
            />
            {/* Story 44.32: Localization index (both FBO and FBS) */}
            <LocalizationIndexInput
              value={localizationIndex}
              onChange={(value) => setValue('localization_index', value, { shouldValidate: true })}
              warehouseId={warehouseId}
              disabled={disabled}
            />
            {/* Product search (optional) - Story 44.26a-FE */}
            <ProductSearchSelect
              value={selectedProduct?.nm_id ?? null}
              selectedProductName={selectedProduct?.sa_name}
              onChange={(_nmId: string | null, product: ProductWithDimensions | null) => {
                setSelectedProduct(product)
                handleProductSelect(product)
              }}
              disabled={disabled}
            />
            {/* Auto-fill warnings (Story 44.26b) */}
            {selectedProduct && !productHasDimensions && <AutoFillWarning type="dimensions" />}
            {selectedProduct && !productHasCategory && <AutoFillWarning type="category" />}
            {/* Product category with commission */}
            <CategorySelector
              value={selectedCategory}
              onChange={setSelectedCategory}
              fulfillmentType={fulfillmentType}
              disabled={disabled}
              autoFillState={categoryAutoFill}
            />
            {/* Warning if category not selected AND no product category available */}
            {!selectedCategory && (!selectedProduct || !productHasCategory) && (
              <p className="text-xs text-muted-foreground mt-1">
                Выберите категорию для точной комиссии. Без категории используется 15%.
              </p>
            )}
            {/* Product dimensions with auto-fill (Story 44.26b) */}
            <DimensionInputSection
              register={register}
              errors={errors}
              disabled={disabled}
              dimensions={dimensions}
              autoFillState={dimensionAutoFill}
              onRestore={restoreDimensions}
              onDimensionChange={markDimensionsModified}
            />
            {/* Target margin slider */}
            <TargetMarginSection control={control} />
            {/* Fixed costs: COGS, logistics, storage */}
            <FixedCostsSection
              register={register}
              errors={errors}
              disabled={disabled}
              fulfillmentType={fulfillmentType}
              logisticsForwardValue={logisticsForwardRub}
              isLogisticsAutoFilled={isLogisticsAutoFilled}
              onLogisticsForwardChange={handleLogisticsForwardChange}
              logisticsReverseValue={logisticsReverseRub}
              isLogisticsReverseAutoFilled={isLogisticsReverseAutoFilled}
              onLogisticsReverseChange={handleLogisticsReverseChange}
            />
            {/* Percentage costs: buyback, DRR, SPP */}
            <PercentageCostsFormSection
              control={control}
              drrValue={drrValue}
              sppValue={sppValue}
              onDrrChange={handleDrrChange}
              onSppChange={handleSppChange}
              disabled={disabled}
            />
            {/* Tax configuration */}
            <TaxConfigurationSection
              taxRate={taxRate}
              taxType={taxType}
              onTaxRateChange={handleTaxRateChange}
              onTaxTypeChange={handleTaxTypeChange}
              isVatPayer={isVatPayer}
              vatRate={vatRate}
              onVatPayerChange={handleVatPayerChange}
              onVatRateChange={handleVatRateChange}
              disabled={disabled}
            />
            <FormActionsSection loading={loading} disabled={disabled} isValid={isValid} onReset={onReset} />
          </form>
        </CardContent>
      </Card>
      <ResetConfirmDialog open={showResetConfirm} onOpenChange={setShowResetConfirm} onConfirm={confirmReset} />
    </>
  )
}
