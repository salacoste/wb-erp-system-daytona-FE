'use client'

/**
 * InstalledRuleEditor (Story 163.3-FE) — container for editing one installed rule.
 *
 * Owns: independent load/error states (AC #1), form population from normalized
 * detail (AC #2), client validation with RU messages (AC #3), WRITEBACK_PRICE
 * safety acknowledgement (AC #4), editable-only PATCH + cache refresh (AC #5),
 * error preservation of unsaved input (AC #6), unsaved-changes navigation guard
 * (AC #7), and accessible status feedback (AC #8).
 *
 * Read-only fields (id/cabinetId/timestamps/category) are surfaced read-only and
 * NEVER sent on PATCH (diffEditorForm enforces this). Raw backend never reaches
 * this component — useInstalledRule returns a normalized AutomationRuleDetail.
 *
 * Migrated Story 172.4-FE: success alert on status-success tokens; back
 * affordance on the Button primitive; double page padding removed (the
 * dashboard layout provides outer padding).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInstalledRule, useUpdateInstalledRule } from '@/hooks/useAutomation'
import { ROUTES } from '@/lib/routes'
import { isWritebackRule, triggerLabel, actionLabel } from '@/types/automation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditorFields } from './EditorFields'
import { WritebackSafetyAcknowledgement } from './WritebackSafetyAcknowledgement'
import { UnsavedChangesGuard } from './UnsavedChangesGuard'
import { EditorErrorState, mutationErrorMessage } from './editor-states'
import {
  diffEditorForm,
  isActivatingWriteback,
  toEditorFormValues,
  validateEditorForm,
  type EditorFormErrors,
  type EditorFormValues,
} from './validation'

interface InstalledRuleEditorProps {
  ruleId: string
}

export function InstalledRuleEditor({ ruleId }: InstalledRuleEditorProps) {
  const router = useRouter()
  const { data: rule, isLoading, isError, error, refetch } = useInstalledRule(ruleId)
  const updateMutation = useUpdateInstalledRule()

  const [values, setValues] = useState<EditorFormValues | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(false)

  // Populate the form once the normalized rule arrives. Reset ack on rule change.
  useEffect(() => {
    if (rule) {
      setValues(toEditorFormValues(rule))
      setShowErrors(false)
      setAcknowledged(false)
    }
  }, [rule])

  const handleChange = useCallback(
    <K extends keyof EditorFormValues>(field: K, value: EditorFormValues[K]) => {
      setValues(prev => (prev ? { ...prev, [field]: value } : prev))
      // A value edit invalidates a prior ack for an activating change.
      setAcknowledged(false)
    },
    []
  )

  const errors: EditorFormErrors = useMemo(
    () => (values ? validateEditorForm(values) : {}),
    [values]
  )
  const patch = useMemo(
    () => (rule && values ? diffEditorForm(rule, values) : undefined),
    [rule, values]
  )
  const dirty = patch !== undefined

  // AC #7 (Pass-1 FIX 2): intercept BROWSER-level leave (tab close / reload /
  // external nav) while there are unsaved edits. jsdom does not actually prompt,
  // but registering the listener is observable and standard. The handler must
  // call preventDefault to make Chrome/Firefox surface the native confirmation.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Legacy cross-browser signal (Chrome ignores the string; FF still reads it).
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const activating = useMemo(
    () => (rule && values ? isActivatingWriteback(rule, values) : false),
    [rule, values]
  )
  const canSave =
    dirty &&
    Object.keys(errors).length === 0 &&
    // AC #4: explicit ack required when the save could activate writeback.
    (!activating || acknowledged) &&
    !updateMutation.isPending

  const handleSave = useCallback(() => {
    if (!rule || !values || !patch) return
    setShowErrors(true)
    if (Object.keys(errors).length > 0) return
    if (activating && !acknowledged) return
    updateMutation.mutate({ id: rule.id, patch })
  }, [rule, values, patch, errors, activating, acknowledged, updateMutation])

  const requestBack = useCallback(() => {
    if (dirty) setPendingNavigation(true)
    else router.push(ROUTES.AUTOMATION.INSTALLED_RULES)
  }, [dirty, router])

  const confirmLeave = useCallback(() => {
    setPendingNavigation(false)
    router.push(ROUTES.AUTOMATION.INSTALLED_RULES)
  }, [router])

  // Loading state (AC #1) — independent, never crashes on partial data.
  if (isLoading) {
    return (
      <EditorShell>
        <p className="text-muted-foreground" data-testid="editor-loading">
          Загрузка правила…
        </p>
      </EditorShell>
    )
  }

  // Error states (AC #1): not-found / authorization / retryable / malformed.
  if (isError || !rule || !values) {
    return (
      <EditorShell onBack={requestBack}>
        <EditorErrorState error={error} refetch={refetch} onBack={requestBack} />
      </EditorShell>
    )
  }

  return (
    <EditorShell onBack={requestBack}>
      <header className="mb-4 space-y-1">
        <h1 className="text-2xl font-semibold" data-testid="editor-title">
          {rule.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Триггер: {triggerLabel(rule.trigger)} · Действие: {actionLabel(rule.action)}
        </p>
      </header>

      {/* AC #8: status feedback announced without focus moves. */}
      <div aria-live="polite" data-testid="editor-status">
        {updateMutation.isError && (
          <Alert variant="destructive" className="mb-4" data-testid="editor-update-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{mutationErrorMessage(updateMutation.error)}</AlertDescription>
          </Alert>
        )}
        {updateMutation.isSuccess && (
          <Alert
            className="mb-4 border-status-success/40 bg-status-success/10 text-status-success"
            data-testid="editor-update-success"
          >
            <AlertDescription>Правило обновлено.</AlertDescription>
          </Alert>
        )}
      </div>

      <EditorFields values={values} errors={showErrors ? errors : {}} onChange={handleChange} />

      {isWritebackRule(rule) && (
        <div className="mt-4">
          <WritebackSafetyAcknowledgement
            activating={activating}
            acknowledged={acknowledged}
            onAcknowledgementChange={setAcknowledged}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={!canSave} data-testid="editor-save">
          {updateMutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
        <Button variant="outline" onClick={requestBack} data-testid="editor-cancel">
          Назад к списку
        </Button>
      </div>

      <UnsavedChangesGuard
        open={pendingNavigation}
        onConfirmLeave={confirmLeave}
        onCancelStay={() => setPendingNavigation(false)}
      />
    </EditorShell>
  )
}

/** Page shell with an optional back affordance. */
function EditorShell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="container">
      {onBack && (
        <div className="mb-6">
          <Button
            variant="link"
            size="sm"
            onClick={onBack}
            className="px-0 text-muted-foreground hover:text-foreground"
            data-testid="editor-back"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Назад к списку
          </Button>
        </div>
      )}
      {children}
    </div>
  )
}
