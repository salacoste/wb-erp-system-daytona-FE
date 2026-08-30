'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ContextBar } from '@/components/product'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import type { TaxSystem, UpdateCabinetTaxRequest, VatRate } from '@/types/cabinet'
import { TaxSettingsWarningDialog } from './TaxSettingsWarningDialog'
import {
  EMPTY_TAX_DRAFT,
  draftFromCabinet,
  draftsMatch,
  requestFromDraft,
  taxSettingsContext,
  validateTaxDraft,
} from './tax-settings-form-model'
import type { TaxSettingsDraft, TaxSettingsErrors } from './tax-settings-form-model'
import { TaxSettingsActions, TaxSettingsLoadState } from './TaxSettingsFormStates'
import { TaxSystemSection, VatSection } from './tax-settings-sections'

interface TaxSettingsFormProps {
  cabinetId: string
}

type SaveResult = 'idle' | 'success' | 'error'

interface TaxSettingsFormState {
  draft: TaxSettingsDraft
  baseline: TaxSettingsDraft
}

export function TaxSettingsForm({ cabinetId }: TaxSettingsFormProps) {
  const { data, isLoading, isError, isFetching, refetch } = useCabinetTaxSettings(cabinetId)
  const mutation = useUpdateTaxSettings(cabinetId)
  const role = useAuthStore(state => state.user?.role)
  const canManage = canManageOperationalData(role)
  const [{ draft, baseline }, setFormState] = useState<TaxSettingsFormState>({
    draft: EMPTY_TAX_DRAFT,
    baseline: EMPTY_TAX_DRAFT,
  })
  const [errors, setErrors] = useState<TaxSettingsErrors>({})
  const [saveResult, setSaveResult] = useState<SaveResult>('idle')
  const [warningOpen, setWarningOpen] = useState(false)
  const [failedPayload, setFailedPayload] = useState<UpdateCabinetTaxRequest | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const taxRateRef = useRef<HTMLInputElement>(null)
  const vatGroupRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!data) return
    const next = draftFromCabinet(data)
    setFormState(current => ({
      baseline: next,
      draft: draftsMatch(current.draft, current.baseline) ? next : current.draft,
    }))
    setErrors({})
  }, [data])

  const isDirty = !draftsMatch(draft, baseline)
  const disabled = !canManage || mutation.isPending
  const context = taxSettingsContext({ data, isError, isLoading, isFetching })

  const updateDraft = (patch: Partial<TaxSettingsDraft>) => {
    setFormState(current => ({
      ...current,
      draft: { ...current.draft, ...patch },
    }))
    setErrors({})
    setSaveResult('idle')
    setFailedPayload(null)
  }

  const focusFirstError = (nextErrors: TaxSettingsErrors) => {
    queueMicrotask(() => {
      if (nextErrors.taxRate) taxRateRef.current?.focus()
      else if (nextErrors.vatRate) vatGroupRef.current?.focus()
    })
  }

  const runMutation = (payload: UpdateCabinetTaxRequest) => {
    const submittedDraft = { ...draft }
    setSaveResult('idle')
    mutation.mutate(payload, {
      onSuccess: () => {
        if (!isMountedRef.current) return
        toast.success('Налоговые настройки сохранены')
        setFormState(current => ({ ...current, baseline: submittedDraft }))
        setFailedPayload(null)
        setSaveResult('success')
        setWarningOpen(false)
        queueMicrotask(() => formRef.current?.focus())
      },
      onError: () => {
        if (!isMountedRef.current) return
        toast.error('Не удалось сохранить настройки')
        setFailedPayload(payload)
        setSaveResult('error')
        if (!warningOpen) queueMicrotask(() => saveButtonRef.current?.focus())
      },
    })
  }

  const requestSave = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!canManage || mutation.isPending) return
    if (saveResult === 'error' && failedPayload) {
      runMutation(failedPayload)
      return
    }
    if (!isDirty) return
    const nextErrors = validateTaxDraft(draft)
    setErrors(nextErrors)
    if (nextErrors.taxRate || nextErrors.vatRate) {
      setSaveResult('idle')
      focusFirstError(nextErrors)
      return
    }

    const payload = requestFromDraft(draft)
    if (draft.taxSystem == null) {
      setFailedPayload(payload)
      setWarningOpen(true)
      return
    }
    runMutation(payload)
  }

  const resetDraft = () => {
    setFormState(current => ({ ...current, draft: current.baseline }))
    setErrors({})
    setSaveResult('idle')
    setFailedPayload(null)
  }

  return (
    <div className="space-y-6">
      <ContextBar scope="Система налогообложения и НДС" {...context} />

      {isError || isLoading || !data ? (
        <TaxSettingsLoadState
          isError={isError}
          isLoading={isLoading || !data}
          onRetry={() => void refetch()}
        />
      ) : (
        <form
          ref={formRef}
          noValidate
          aria-label="Налоговые настройки"
          aria-busy={mutation.isPending || undefined}
          tabIndex={-1}
          className="space-y-6 outline-none"
          onSubmit={requestSave}
        >
          {(errors.taxRate || errors.vatRate) && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>Исправьте ошибки в форме</AlertTitle>
              <AlertDescription>
                Проверьте ставку налога и обязательную ставку НДС перед сохранением.
              </AlertDescription>
            </Alert>
          )}

          <TaxSystemSection
            taxSystem={draft.taxSystem}
            taxRate={draft.taxRate}
            error={errors.taxRate}
            disabled={disabled}
            inputRef={taxRateRef}
            onTaxSystemChange={(taxSystem: TaxSystem | null) => updateDraft({ taxSystem })}
            onTaxRateChange={taxRate => updateDraft({ taxRate })}
          />
          <VatSection
            vatPayer={draft.vatPayer}
            vatRate={draft.vatRate}
            error={errors.vatRate}
            disabled={disabled}
            groupRef={vatGroupRef}
            onVatPayerChange={vatPayer => updateDraft({ vatPayer })}
            onVatRateChange={(vatRate: VatRate) => updateDraft({ vatRate })}
          />

          <TaxSettingsActions
            canManage={canManage}
            isPending={mutation.isPending}
            isDirty={isDirty}
            saveResult={saveResult}
            warningOpen={warningOpen}
            saveButtonRef={saveButtonRef}
            onReset={resetDraft}
          />

          <TaxSettingsWarningDialog
            open={warningOpen}
            isPending={mutation.isPending}
            hasError={saveResult === 'error'}
            onOpenChange={setWarningOpen}
            onReturnFocus={() =>
              saveResult === 'success' ? formRef.current?.focus() : saveButtonRef.current?.focus()
            }
            onConfirm={() => failedPayload && runMutation(failedPayload)}
          />
        </form>
      )}
    </div>
  )
}
