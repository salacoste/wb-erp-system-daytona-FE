'use client'

import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MarginSlider } from './MarginSlider'
import { FieldTooltip } from './FieldTooltip'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
import type { PriceCalculatorRequest } from '@/types/price-calculator'

/**
 * Props for PriceCalculatorForm component
 */
export interface PriceCalculatorFormProps {
  /** Callback when form is submitted with valid data */
  onSubmit: (data: PriceCalculatorRequest) => void
  /** Show loading state on submit button */
  loading?: boolean
  /** Disable all form inputs */
  disabled?: boolean
  /** Whether calculation has results (for reset confirmation) */
  hasResults?: boolean
}

/**
 * Form data structure matching PriceCalculatorRequest
 */
interface FormData {
  target_margin_pct: number
  cogs_rub: number
  logistics_forward_rub: number
  logistics_reverse_rub: number
  buyback_pct: number
  advertising_pct: number
  storage_rub: number
  vat_pct: number
  acquiring_pct: number
  commission_pct?: number
  nm_id?: number
}

/**
 * Default form values
 */
const defaultValues: FormData = {
  target_margin_pct: 20,
  cogs_rub: 0,
  logistics_forward_rub: 0,
  logistics_reverse_rub: 0,
  buyback_pct: 98,
  advertising_pct: 5,
  storage_rub: 0,
  vat_pct: 20,
  acquiring_pct: 1.8,
  commission_pct: undefined,
  nm_id: undefined,
}

/**
 * Price Calculator input form with auto-calculation
 * Story 44.2-FE: Input Form Component
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 *
 * Features:
 * - Reset confirmation dialog if results exist
 * - Keyboard shortcut: Esc to reset
 * - Loading state with spinner
 *
 * @example
 * <PriceCalculatorForm
 *   onSubmit={(data) => console.log('Calculate:', data)}
 *   loading={isPending}
 *   hasResults={!!data}
 * />
 */
export function PriceCalculatorForm({
  onSubmit,
  loading = false,
  disabled = false,
  hasResults = false,
}: PriceCalculatorFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
    watch: watchForm,
    control,
  } = useForm<FormData>({
    defaultValues,
    mode: 'onChange', // Validate on change for real-time feedback
  })

  // Debounce timer ref (for future auto-calculate feature)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced auto-calculate callback
  const performCalculation = useCallback(
    (data: FormData) => {
      if (!isValid) return

      // Skip auto-calculation if all values are zero (empty form)
      const allZero =
        data.target_margin_pct === 0 &&
        data.cogs_rub === 0 &&
        data.logistics_forward_rub === 0 &&
        data.logistics_reverse_rub === 0 &&
        data.buyback_pct === 0 &&
        data.advertising_pct === 0 &&
        data.storage_rub === 0

      if (allZero) return

      const request: PriceCalculatorRequest = {
        target_margin_pct: data.target_margin_pct,
        cogs_rub: data.cogs_rub,
        logistics_forward_rub: data.logistics_forward_rub,
        logistics_reverse_rub: data.logistics_reverse_rub,
        buyback_pct: data.buyback_pct,
        advertising_pct: data.advertising_pct,
        storage_rub: data.storage_rub,
        vat_pct: data.vat_pct,
        acquiring_pct: data.acquiring_pct,
        ...(data.commission_pct !== undefined && { commission_pct: data.commission_pct }),
        ...(data.nm_id !== undefined && { overrides: { nm_id: data.nm_id } }),
      }

      onSubmit(request)

      // Note: onSettled callback in page will reset isCalculating state
    },
    [isValid, onSubmit],
  )

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Auto-calculate on form value changes (debounced)
  // TEMPORARILY DISABLED to debug infinite reload issue
  // useEffect(() => {
  //   // Skip if form is not valid
  //   if (!isValid) return

  //   // Clear existing timer
  //   if (debounceTimerRef.current) {
  //     clearTimeout(debounceTimerRef.current)
  //   }

  //   // Set new timer
  //   debounceTimerRef.current = setTimeout(() => {
  //     performCalculation(formValues)
  //   }, DEBOUNCE_MS)

  //   return () => {
  //     if (debounceTimerRef.current) {
  //       clearTimeout(debounceTimerRef.current)
  //     }
  //   }
  // // }, [JSON.stringify(formValues), performCalculation])

  // Manual form submission handler
  const onFormSubmit = (data: FormData) => {
    performCalculation(data)
  }

  // Reset handler with confirmation
  const onReset = () => {
    if (hasResults) {
      setShowResetConfirm(true)
    } else {
      reset(defaultValues)
    }
  }

  // Confirm reset
  const confirmReset = () => {
    reset(defaultValues)
    setShowResetConfirm(false)
  }

  // Keyboard shortcut: Esc to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) {
        onReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasResults, disabled])

  return (
    <>
      <Card data-testid="price-calculator-form">
        <CardHeader>
          <CardTitle>Price Calculator</CardTitle>
          <CardDescription>
            Enter your cost parameters to calculate the optimal selling price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Target Margin */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="target_margin_pct" className="flex-1">
                  Target Margin %
                </Label>
                <FieldTooltip content="Desired profit margin as percentage of selling price (0-50%)" />
              </div>
              <MarginSlider
                name="target_margin_pct"
                register={register}
                control={control}
                min={0}
                max={50}
                step={0.5}
                unit="%"
                error={errors.target_margin_pct?.message}
              />
            </div>

            {/* Fixed Costs */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Fixed Costs (₽)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COGS */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cogs_rub" className="flex-1">
                      COGS
                    </Label>
                    <FieldTooltip content="Cost of goods sold - what you paid to acquire or produce the item" />
                  </div>
                  <Input
                    id="cogs_rub"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    disabled={disabled}
                    {...register('cogs_rub', {
                      valueAsNumber: true,
                      required: 'COGS is required',
                      min: { value: 0, message: 'COGS cannot be negative' },
                    })}
                  />
                  {errors.cogs_rub && (
                    <p className="text-sm text-destructive">{errors.cogs_rub.message}</p>
                  )}
                </div>

                {/* Logistics Forward */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="logistics_forward_rub">Logistics Forward</Label>
                    <FieldTooltip content="Delivery cost to warehouse (per unit)" />
                  </div>
                  <Input
                    id="logistics_forward_rub"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    disabled={disabled}
                    {...register('logistics_forward_rub', {
                      valueAsNumber: true,
                      required: 'Required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.logistics_forward_rub && (
                    <p className="text-sm text-destructive">{errors.logistics_forward_rub.message}</p>
                  )}
                </div>

                {/* Logistics Reverse */}
                <div className="space-y-2">
                  <Label htmlFor="logistics_reverse_rub">Logistics Reverse</Label>
                  <Input
                    id="logistics_reverse_rub"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    disabled={disabled}
                    {...register('logistics_reverse_rub', {
                      valueAsNumber: true,
                      required: 'Required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.logistics_reverse_rub && (
                    <p className="text-sm text-destructive">{errors.logistics_reverse_rub.message}</p>
                  )}
                </div>

                {/* Storage */}
                <div className="space-y-2">
                  <Label htmlFor="storage_rub">Storage</Label>
                  <Input
                    id="storage_rub"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    disabled={disabled}
                    {...register('storage_rub', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Percentage Costs */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Percentage Costs (%)</h3>

              <div className="space-y-4">
                {/* Buyback % */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="buyback_pct" className="flex-1">
                      Buyback %
                    </Label>
                    <FieldTooltip content="Expected return rate to customers (typically 95-99%)" />
                  </div>
                  <MarginSlider
                    name="buyback_pct"
                    register={register}
                    control={control}
                    min={90}
                    max={100}
                    step={0.5}
                    unit="%"
                  />
                </div>

                {/* Advertising % */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="advertising_pct" className="flex-1">
                      Advertising %
                    </Label>
                    <FieldTooltip content="Advertising spend as percentage of selling price" />
                  </div>
                  <MarginSlider
                    name="advertising_pct"
                    register={register}
                    control={control}
                    min={0}
                    max={30}
                    step={0.5}
                    unit="%"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between p-0 h-auto text-left hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">Advanced Options</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* VAT % - using shadcn/ui Select */}
                  <div className="space-y-2">
                    <Label htmlFor="vat_pct">VAT %</Label>
                    <Select
                      value={watchForm('vat_pct')?.toString() ?? '20'}
                      onValueChange={(value) => setValue('vat_pct', Number(value), { shouldValidate: true })}
                      disabled={disabled}
                    >
                      <SelectTrigger id="vat_pct">
                        <SelectValue placeholder="Select VAT rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Acquiring % */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="acquiring_pct">Acquiring %</Label>
                      <FieldTooltip content="Payment processing fee (usually 1.5-2%)" />
                    </div>
                    <Input
                      id="acquiring_pct"
                      type="number"
                      step={0.1}
                      min={0}
                      max={10}
                      placeholder="1.8"
                      disabled={disabled}
                      {...register('acquiring_pct', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cannot be negative' },
                        max: { value: 10, message: 'Maximum 10%' },
                      })}
                    />
                  </div>

                  {/* Override Commission % */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="commission_pct">Commission % (override)</Label>
                      <FieldTooltip content="Override default WB commission (optional)" />
                    </div>
                    <Input
                      id="commission_pct"
                      type="number"
                      step={0.1}
                      min={0}
                      max={30}
                      placeholder="Use default"
                      disabled={disabled}
                      {...register('commission_pct', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cannot be negative' },
                        max: { value: 30, message: 'Maximum 30%' },
                      })}
                    />
                  </div>
                </div>

                {/* Override Product ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nm_id">Product ID (override)</Label>
                    <FieldTooltip content="Filter for specific product by WB article number (optional)" />
                  </div>
                  <Input
                    id="nm_id"
                    type="number"
                    min={0}
                    placeholder="Any product"
                    disabled={disabled}
                    {...register('nm_id', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'Must be positive' },
                    })}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating...</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={disabled || loading}
                title="Press Esc to reset (keyboard shortcut)"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={disabled || loading || !isValid}
                className="flex-1"
                title="Press Enter to calculate"
              >
                {loading ? 'Calculating...' : 'Calculate Price'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reset</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the form? All current values will be
              cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              Reset Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
