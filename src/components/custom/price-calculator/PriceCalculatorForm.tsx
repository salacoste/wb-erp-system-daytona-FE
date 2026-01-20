'use client'

import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FulfillmentTypeSelector } from './FulfillmentTypeSelector'
import { CategorySelector } from './CategorySelector'
import { TaxConfigurationSection } from './TaxConfigurationSection'
import { TargetMarginSection } from './TargetMarginSection'
import { FixedCostsSection } from './FixedCostsSection'
import { PercentageCostsFormSection } from './PercentageCostsFormSection'
import { AdvancedOptionsSection } from './AdvancedOptionsSection'
import { FormActionsSection } from './FormActionsSection'
import { ResetConfirmDialog } from './ResetConfirmDialog'
import { isFormEmpty, toTwoLevelFormData, toApiRequest } from './priceCalculatorUtils'
import type { CategoryCommission } from '@/types/tariffs'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { PriceCalculatorRequest, TaxType, TwoLevelPricingFormData } from '@/types/price-calculator'
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
 * Price Calculator input form - Story 44.2-FE, 44.5-FE
 * Composed of extracted sub-components for maintainability
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryCommission | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors, isValid }, watch, control } =
    useForm<FormData>({ defaultValues: defaultFormValues, mode: 'onChange' })

  const fulfillmentType = watch('fulfillment_type')

  useEffect(() => {
    if (fulfillmentType === 'FBS') setValue('storage_rub', 0)
    if (selectedCategory) {
      const commission = fulfillmentType === 'FBO'
        ? selectedCategory.paidStorageKgvp : selectedCategory.kgvpMarketplace
      setValue('commission_pct', commission, { shouldValidate: true })
    }
  }, [fulfillmentType, setValue, selectedCategory])

  useEffect(() => {
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current) }
  }, [])

  const performCalculation = useCallback((data: FormData) => {
    if (!isValid || isFormEmpty(data)) return
    onFormDataChange?.(toTwoLevelFormData(data))
    onSubmit(toApiRequest(data))
  }, [isValid, onSubmit, onFormDataChange])

  const onReset = () => {
    if (hasResults) setShowResetConfirm(true)
    else { reset(defaultFormValues); setSelectedCategory(null) }
  }

  const confirmReset = () => {
    reset(defaultFormValues)
    setSelectedCategory(null)
    setShowResetConfirm(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) onReset()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasResults, disabled])

  const handleCategoryChange = (category: CategoryCommission | null) => {
    setSelectedCategory(category)
    setValue('category_id', category?.parentID ?? null)
    if (category) {
      const commission = fulfillmentType === 'FBO'
        ? category.paidStorageKgvp : category.kgvpMarketplace
      setValue('commission_pct', commission, { shouldValidate: true })
      onCommissionChange?.(commission)
    }
  }

  return (
    <>
      <Card data-testid="price-calculator-form">
        <CardHeader>
          <CardTitle>Калькулятор цены</CardTitle>
          <CardDescription>
            Введите параметры затрат для расчёта оптимальной цены продажи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(performCalculation)} className="space-y-6">
            <FulfillmentTypeSelector
              value={watch('fulfillment_type')}
              onChange={(type) => setValue('fulfillment_type', type, { shouldValidate: true })}
              disabled={disabled}
            />
            <CategorySelector
              value={selectedCategory}
              onChange={handleCategoryChange}
              fulfillmentType={fulfillmentType}
              disabled={disabled}
            />
            <TargetMarginSection
              register={register}
              control={control}
              error={errors.target_margin_pct?.message}
            />
            <FixedCostsSection
              register={register}
              errors={errors}
              disabled={disabled}
              fulfillmentType={fulfillmentType}
            />
            <PercentageCostsFormSection
              register={register}
              control={control}
              buybackValue={watch('buyback_pct')}
              drrValue={watch('drr_pct')}
              sppValue={watch('spp_pct')}
              onDrrChange={(v) => setValue('drr_pct', v, { shouldValidate: true })}
              onSppChange={(v) => { setValue('spp_pct', v, { shouldValidate: true }); onSppChange?.(v) }}
              disabled={disabled}
            />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Налоги</h3>
              <TaxConfigurationSection
                taxRate={watch('tax_rate_pct')}
                taxType={watch('tax_type')}
                onTaxRateChange={(v) => setValue('tax_rate_pct', v, { shouldValidate: true })}
                onTaxTypeChange={(v: TaxType) => setValue('tax_type', v, { shouldValidate: true })}
                disabled={disabled}
              />
            </div>
            <AdvancedOptionsSection
              register={register}
              errors={errors}
              vatValue={watch('vat_pct')}
              onVatChange={(v) => setValue('vat_pct', v, { shouldValidate: true })}
              isOpen={advancedOpen}
              onOpenChange={setAdvancedOpen}
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
