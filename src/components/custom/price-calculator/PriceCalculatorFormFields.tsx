'use client'

/**
 * Form field sections for PriceCalculatorForm
 * Extracted from PriceCalculatorForm.tsx for modularity (Story 74.1)
 * Pure presentational: renders form fields from state + handlers.
 */

import { FulfillmentTypeSelector } from './FulfillmentTypeSelector'
import { WarehouseSection } from './WarehouseSection'
import { ProductSearchSelect } from './ProductSearchSelect'
import { CategorySelector } from './CategorySelector'
import { TargetMarginSection } from './TargetMarginSection'
import { FixedCostsSection } from './FixedCostsSection'
import { PercentageCostsFormSection } from './PercentageCostsFormSection'
import { TaxConfigurationSection } from './TaxConfigurationSection'
import { FormActionsSection } from './FormActionsSection'
import { DimensionInputSection } from './DimensionInputSection'
import { AutoFillWarning } from './AutoFillWarning'
import { BoxTypeSelector } from './BoxTypeSelector'
import { WeightThresholdCheckbox } from './WeightThresholdCheckbox'
import { LocalizationIndexInput } from './LocalizationIndexInput'
import { TurnoverDaysInput } from './TurnoverDaysInput'
import { UnitsPerPackageInput } from './UnitsPerPackageInput'
import { PresetActions } from './PresetActions'
import { defaultFormValues } from './usePriceCalculatorForm'
import type { usePriceCalculatorState } from './usePriceCalculatorState'
import type { usePriceCalculatorHandlers } from './usePriceCalculatorHandlers'
import type { ProductWithDimensions } from '@/types/product'

interface FormFieldsProps {
  state: ReturnType<typeof usePriceCalculatorState>
  handlers: ReturnType<typeof usePriceCalculatorHandlers>
  loading: boolean
  disabled: boolean
}

export function PriceCalculatorFormFields({ state, handlers, loading, disabled }: FormFieldsProps) {
  return (
    <form onSubmit={state.handleSubmit(handlers.performCalculation)} className="space-y-6">
      <FulfillmentTypeSelector
        value={state.fulfillmentType}
        disabled={disabled}
        onChange={type => state.setValue('fulfillment_type', type, { shouldValidate: true })}
      />
      <WarehouseSection
        warehouseId={state.warehouseId}
        onWarehouseChange={state.handleWarehouseChange}
        onSetWarehouseById={state.setWarehouseById}
        disabled={disabled}
        onDeliveryDateChange={state.handleDeliveryDateChange}
        tariffSystem={state.tariffSystem}
        effectiveTariffs={state.effectiveTariffs}
      />
      {state.fulfillmentType === 'FBO' && (
        <>
          <BoxTypeSelector
            value={state.boxType}
            onChange={v => state.setValue('box_type', v, { shouldValidate: true })}
            disabled={disabled}
          />
          <UnitsPerPackageInput
            value={state.unitsPerPackage}
            onValueChange={v => state.setValue('units_per_package', v, { shouldValidate: true })}
            boxType={state.boxType}
            disabled={disabled}
          />
          <TurnoverDaysInput
            value={state.turnoverDays}
            onChange={v => state.setValue('turnover_days', v, { shouldValidate: true })}
            dailyStorageCost={state.dailyStorageCost}
            onStorageRubChange={state.handleStorageRubChange}
            disabled={disabled}
          />
        </>
      )}
      <WeightThresholdCheckbox
        checked={state.weightExceeds25kg}
        onChange={c => state.setValue('weight_exceeds_25kg', c, { shouldValidate: true })}
        disabled={disabled}
      />
      <LocalizationIndexInput
        value={state.localizationIndex}
        onChange={v => state.setValue('localization_index', v, { shouldValidate: true })}
        warehouseId={state.warehouseId}
        disabled={disabled}
      />
      <ProductSearchSelect
        value={state.selectedProduct?.nm_id ?? null}
        selectedProductName={state.selectedProduct?.sa_name}
        initialNmId={state.presetNmId}
        onChange={(nmId: string | null, product: ProductWithDimensions | null) => {
          state.setSelectedProduct(product)
          state.setValue('nm_id', nmId ?? undefined)
          state.handleProductSelect(product)
        }}
        disabled={disabled}
      />
      {state.selectedProduct && !state.productHasDimensions && (
        <AutoFillWarning type="dimensions" />
      )}
      {state.selectedProduct && !state.productHasCategory && <AutoFillWarning type="category" />}
      <CategorySelector
        value={state.selectedCategory}
        onChange={state.setSelectedCategory}
        fulfillmentType={state.fulfillmentType}
        disabled={disabled}
        autoFillState={state.categoryAutoFill}
      />
      {!state.selectedCategory && (!state.selectedProduct || !state.productHasCategory) && (
        <p className="text-xs text-muted-foreground mt-1">
          Выберите категорию для точной комиссии. Без категории используется 15%.
        </p>
      )}
      <DimensionInputSection
        register={state.register}
        errors={state.errors}
        disabled={disabled}
        dimensions={state.dimensions}
        autoFillState={state.dimensionAutoFill}
        onRestore={state.restoreDimensions}
        onDimensionChange={state.markDimensionsModified}
      />
      <TargetMarginSection control={state.control} />
      <FixedCostsSection
        register={state.register}
        errors={state.errors}
        disabled={disabled}
        fulfillmentType={state.fulfillmentType}
        logisticsForwardValue={state.logisticsForwardRub}
        isLogisticsAutoFilled={state.isLogisticsAutoFilled}
        onLogisticsForwardChange={state.handleLogisticsForwardChange}
        logisticsReverseValue={state.logisticsReverseRub}
        isLogisticsReverseAutoFilled={state.isLogisticsReverseAutoFilled}
        onLogisticsReverseChange={state.handleLogisticsReverseChange}
      />
      <PercentageCostsFormSection
        control={state.control}
        drrValue={state.drrValue}
        sppValue={state.sppValue}
        onDrrChange={handlers.handleDrrChange}
        onSppChange={handlers.handleSppChange}
        disabled={disabled}
      />
      <TaxConfigurationSection
        taxRate={state.taxRate}
        taxType={state.taxType}
        onTaxRateChange={handlers.handleTaxRateChange}
        onTaxTypeChange={handlers.handleTaxTypeChange}
        isVatPayer={state.isVatPayer}
        vatRate={state.vatRate}
        onVatPayerChange={handlers.handleVatPayerChange}
        onVatRateChange={handlers.handleVatRateChange}
        disabled={disabled}
      />
      <FormActionsSection
        loading={loading}
        disabled={disabled}
        isValid={state.isValid}
        onReset={handlers.onReset}
        presetActions={
          <PresetActions
            getFormValues={state.getValues}
            isFormValid={state.isValid}
            hasPreset={state.hasPreset}
            onSave={state.savePreset}
            onClear={() => {
              state.clearPreset()
              state.reset(defaultFormValues)
            }}
            disabled={disabled}
          />
        }
      />
    </form>
  )
}
