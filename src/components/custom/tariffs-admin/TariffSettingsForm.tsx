'use client'

// ============================================================================
// Tariff Settings Form
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Main form container for editing tariff settings
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Edit2, Save, X, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTariffSettings } from '@/hooks/useTariffSettings'
import { useUpdateTariffSettings } from '@/hooks/useUpdateTariffSettings'
import { AcceptanceRatesSection } from './AcceptanceRatesSection'
import { LogisticsRatesSection } from './LogisticsRatesSection'
import { ReturnsRatesSection } from './ReturnsRatesSection'
import { CommissionRatesSection } from './CommissionRatesSection'
import { StorageSettingsSection } from './StorageSettingsSection'
import { FbsSettingsSection } from './FbsSettingsSection'
import { SaveConfirmDialog } from './SaveConfirmDialog'
import {
  tariffSettingsSchema,
  getDefaultFormValues,
  getChangedFields,
  type TariffSettingsFormData,
} from './tariffSettingsSchema'

type SectionKey =
  | 'acceptance'
  | 'logistics'
  | 'returns'
  | 'commission'
  | 'storage'
  | 'fbs'

/**
 * Main tariff settings edit form
 *
 * Features:
 * - Loads current settings via useTariffSettings
 * - 6 collapsible sections (AC2)
 * - Zod validation (AC3)
 * - PUT/PATCH save behavior (AC5)
 * - Confirmation dialog before save (AC8)
 * - Success/error toasts (AC6, AC7)
 */
export function TariffSettingsForm() {
  const { data: settings, isLoading, error: fetchError } = useTariffSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateTariffSettings()

  // Section open/close state - first section open by default
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    acceptance: true,
    logistics: true,
    returns: false,
    commission: false,
    storage: false,
    fbs: false,
  })

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)

  // Original settings for change detection
  const [originalValues, setOriginalValues] = useState<TariffSettingsFormData | null>(
    null
  )

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<TariffSettingsFormData>({
    resolver: zodResolver(tariffSettingsSchema),
    mode: 'onChange',
  })

  // Watch volume tiers for LogisticsRatesSection
  const volumeTiers = useWatch({ control, name: 'logisticsVolumeTiers' })
  const fbsTiers = useWatch({ control, name: 'logisticsFbsVolumeTiers' })
  const notes = useWatch({ control, name: 'notes' })

  // Load settings into form when data arrives
  useEffect(() => {
    if (settings) {
      const formValues = getDefaultFormValues(settings)
      reset(formValues)
      setOriginalValues(formValues)
    }
  }, [settings, reset])

  // Toggle section open/close
  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Handle save button click - show confirmation
  const handleSaveClick = () => {
    if (!isValid) return
    setShowConfirm(true)
  }

  // Handle confirmed save
  const handleConfirmSave = handleSubmit((data: TariffSettingsFormData) => {
    if (!originalValues) return

    const changedFields = getChangedFields(originalValues, data)
    const changedCount = Object.keys(changedFields).length

    // AC5: Use PATCH for partial changes, PUT for full replacement
    // If more than half the fields changed, use PUT
    const usePut = changedCount > 10

    updateSettings(
      {
        data: usePut ? data : changedFields,
        method: usePut ? 'PUT' : 'PATCH',
      },
      {
        onSuccess: () => {
          setShowConfirm(false)
          setOriginalValues(data)
        },
        onError: () => {
          setShowConfirm(false)
        },
      }
    )
  })

  // Handle cancel button
  const handleCancel = () => {
    if (originalValues) {
      reset(originalValues)
    }
  }

  // Loading skeleton
  if (isLoading) {
    return <FormSkeleton />
  }

  // Error state
  if (fetchError) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки настроек тарифов. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Редактирование тарифов</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Section: Acceptance */}
            <AcceptanceRatesSection
              register={register}
              errors={errors}
              disabled={isSaving}
              isOpen={openSections.acceptance}
              onToggle={() => toggleSection('acceptance')}
            />

            {/* Section: Logistics */}
            <LogisticsRatesSection
              register={register}
              errors={errors}
              control={control}
              setValue={setValue}
              volumeTiers={volumeTiers ?? []}
              disabled={isSaving}
              isOpen={openSections.logistics}
              onToggle={() => toggleSection('logistics')}
            />

            {/* Section: Returns */}
            <ReturnsRatesSection
              register={register}
              errors={errors}
              disabled={isSaving}
              isOpen={openSections.returns}
              onToggle={() => toggleSection('returns')}
            />

            {/* Section: Commission */}
            <CommissionRatesSection
              register={register}
              errors={errors}
              disabled={isSaving}
              isOpen={openSections.commission}
              onToggle={() => toggleSection('commission')}
            />

            {/* Section: Storage */}
            <StorageSettingsSection
              register={register}
              errors={errors}
              disabled={isSaving}
              isOpen={openSections.storage}
              onToggle={() => toggleSection('storage')}
            />

            {/* Section: FBS */}
            <FbsSettingsSection
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              fbsTiers={fbsTiers}
              disabled={isSaving}
              isOpen={openSections.fbs}
              onToggle={() => toggleSection('fbs')}
            />

            {/* Notes textarea */}
            <div className="space-y-2 pt-4">
              <Label htmlFor="notes" className="text-sm font-medium">
                Заметки
              </Label>
              <Textarea
                id="notes"
                placeholder="Причина изменения тарифов..."
                disabled={isSaving}
                value={notes ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setValue('notes', e.target.value)
                }
                className="resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes?.length ?? 0}/500
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving || !isDirty}
              >
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving || !isValid || !isDirty}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Сохранить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation dialog (AC8) */}
      <SaveConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmSave}
        isPending={isSaving}
      />
    </>
  )
}

/**
 * Loading skeleton for form
 */
function FormSkeleton() {
  return (
    <Card data-testid="form-skeleton">
      <CardHeader className="border-b">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}
