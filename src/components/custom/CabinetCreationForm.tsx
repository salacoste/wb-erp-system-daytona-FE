'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'

import {
  CabinetCreationFormPresentation,
  type CabinetFormData,
} from './CabinetCreationFormPresentation'
import type { RecoveryMarker } from './cabinetCreationRecovery'
import { cabinetFormSchema, type WorkflowPhase } from './cabinetCreationSubmission'
import { useCabinetCreateMutation } from './useCabinetCreateMutation'
import { useCabinetCreationRecovery } from './useCabinetCreationRecovery'
import { useCabinetCreationSubmission } from './useCabinetCreationSubmission'

export function CabinetCreationForm() {
  const router = useRouter()
  const currentUser = useAuthStore(state => state.user)
  const activeCabinetId = useAuthStore(state => state.cabinetId)
  const canCreateCabinet = canManageOperationalData(currentUser?.role)
  const existingCabinet = useCabinetTaxSettings(activeCabinetId ?? '')
  const updateExistingCabinet = useUpdateTaxSettings(activeCabinetId ?? '')
  const localOperationIds = useRef(new Set<string>())
  const form = useForm<CabinetFormData>({
    resolver: zodResolver(cabinetFormSchema),
    defaultValues: { name: '', targetMarginPct: '20' },
    mode: 'onBlur',
  })
  const recovery = useCabinetCreationRecovery({
    activeCabinetId,
    currentUserId: currentUser?.id,
    existingCabinetData: existingCabinet.data,
    form,
    isMarginDirty: Boolean(form.formState.dirtyFields.targetMarginPct),
    localOperationIds: localOperationIds.current,
  })
  const showRecoveryError = (message: string, phase: WorkflowPhase) => {
    recovery.setPhase(phase)
    recovery.setRecoveryError(message)
    toast.error(message)
  }
  const createMutation = useCabinetCreateMutation({
    router,
    setPhase: recovery.setPhase,
    showRecoveryError,
  })
  const startCreate = (data: CabinetFormData, marker: RecoveryMarker) => {
    const auth = useAuthStore.getState()
    createMutation.mutate({
      data,
      marker,
      attempt: { userId: auth.user?.id ?? null, cabinetId: auth.cabinetId, token: auth.token },
    })
  }
  const submission = useCabinetCreationSubmission({
    activeCabinetId,
    canCreateCabinet,
    createIsPending: createMutation.isPending,
    currentUserId: currentUser?.id,
    form,
    localOperationIds: localOperationIds.current,
    phase: recovery.phase,
    router,
    setPhase: recovery.setPhase,
    showRecoveryError,
    startCreate,
    updateExistingCabinet,
  })
  const isHydrating =
    Boolean(activeCabinetId) && existingCabinet.isLoading && recovery.phase === 'idle'

  return (
    <CabinetCreationFormPresentation
      form={form}
      onSubmit={submission.onSubmit}
      recoveryError={recovery.recoveryError}
      recoveryErrorRef={recovery.recoveryErrorRef}
      isExistingCabinet={Boolean(activeCabinetId)}
      isHydratingExistingCabinet={isHydrating}
      isSubmitting={createMutation.isPending || updateExistingCabinet.isPending}
      canCreateCabinet={canCreateCabinet && !submission.isCreateBlocked}
    />
  )
}
