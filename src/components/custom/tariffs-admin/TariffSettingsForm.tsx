'use client'

// ============================================================================
// Tariff Settings Form
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Main form container for editing tariff settings
// Story 74.6: Refactored into slim orchestrator (logic → useTariffSettingsForm,
//   skeleton/error → TariffFormSkeleton, actions → TariffFormActions)
// ============================================================================

import { useRef } from 'react'
import { Edit2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AcceptanceRatesSection } from './AcceptanceRatesSection'
import { LogisticsRatesSection } from './LogisticsRatesSection'
import { ReturnsRatesSection } from './ReturnsRatesSection'
import { CommissionRatesSection } from './CommissionRatesSection'
import { StorageSettingsSection } from './StorageSettingsSection'
import { FbsSettingsSection } from './FbsSettingsSection'
import { SaveConfirmDialog } from './SaveConfirmDialog'
import { TariffFormSkeleton, TariffFormError } from './TariffFormSkeleton'
import { TariffFormActions } from './TariffFormActions'
import { TariffFormStatus } from './TariffFormStatus'
import { useTariffSettingsForm } from './useTariffSettingsForm'

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
  const formRegionRef = useRef<HTMLDivElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const {
    isLoading,
    fetchError,
    isSaving,
    register,
    control,
    setValue,
    watch,
    errors,
    isValid,
    isDirty,
    unavailableFieldLabels,
    saveOutcome,
    volumeTiers,
    fbsTiers,
    notes,
    openSections,
    toggleSection,
    showConfirm,
    setShowConfirm,
    handleSaveClick,
    handleConfirmSave,
    handleCancel,
  } = useTariffSettingsForm()

  if (isLoading) {
    return <TariffFormSkeleton />
  }

  if (fetchError) {
    return <TariffFormError />
  }

  return (
    <>
      <Card
        ref={formRegionRef}
        tabIndex={-1}
        className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Edit2 aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            <CardTitle>
              <h2 id="tariff-form-title" className="text-lg">
                Редактирование тарифов
              </h2>
            </CardTitle>
          </div>
          <CardDescription>
            Все суммы, проценты и периоды сохраняются в указанных рядом единицах.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form
            aria-labelledby="tariff-form-title"
            aria-busy={isSaving}
            onSubmit={event => event.preventDefault()}
            className="space-y-4"
          >
            <TariffFormStatus
              errors={errors}
              unavailableFieldLabels={unavailableFieldLabels}
              saveOutcome={saveOutcome}
            />
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

            {/* Notes + Action buttons */}
            <TariffFormActions
              notes={notes}
              setValue={setValue}
              isSaving={isSaving}
              isValid={isValid}
              isDirty={isDirty}
              onSaveClick={handleSaveClick}
              onCancel={handleCancel}
              saveButtonRef={saveButtonRef}
            />
          </form>
        </CardContent>
      </Card>

      {/* Confirmation dialog (AC8) */}
      <SaveConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmSave}
        isPending={isSaving}
        hasError={saveOutcome === 'error'}
        onReturnFocus={() => {
          const saveButton = saveButtonRef.current
          if (saveButton && !saveButton.disabled) saveButton.focus()
          else formRegionRef.current?.focus()
        }}
      />
    </>
  )
}
