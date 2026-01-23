'use client'

/**
 * ScheduleVersionModal Component
 * Story 52-FE.3: Schedule Future Version
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * Modal dialog for scheduling future tariff versions
 * Wraps ScheduleVersionForm with Dialog component
 */

import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { ScheduleVersionForm } from './ScheduleVersionForm'
import { useScheduleTariffVersion } from '@/hooks/useScheduleTariffVersion'
import { getTariffSettings } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from '@/hooks/tariff-query-keys'
import type { ScheduleTariffVersionDto } from '@/types/tariffs-admin'

export interface ScheduleVersionModalProps {
  /** Whether modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
}

/**
 * Loading skeleton for form
 */
function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function ScheduleVersionModal({
  isOpen,
  onClose,
}: ScheduleVersionModalProps) {
  // Fetch current settings for pre-filling form
  const {
    data: currentSettings,
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: tariffQueryKeys.settings(),
    queryFn: getTariffSettings,
    enabled: isOpen,
    staleTime: 30000, // 30 seconds
  })

  // Schedule mutation
  const { mutate, isPending } = useScheduleTariffVersion({
    onSuccess: () => {
      onClose()
    },
  })

  // Handle form submit
  const handleSubmit = (values: {
    effective_from: string
    acceptanceBoxRatePerLiter: number
    acceptancePalletRate: number
    storageFreeDays: number
    fixationClothingDays: number
    fixationOtherDays: number
    defaultCommissionFboPct: number
    defaultCommissionFbsPct: number
    notes?: string
  }) => {
    // Build full payload including current settings not in form
    const payload: ScheduleTariffVersionDto = {
      effective_from: values.effective_from,
      acceptanceBoxRatePerLiter: values.acceptanceBoxRatePerLiter,
      acceptancePalletRate: values.acceptancePalletRate,
      storageFreeDays: values.storageFreeDays,
      fixationClothingDays: values.fixationClothingDays,
      fixationOtherDays: values.fixationOtherDays,
      defaultCommissionFboPct: values.defaultCommissionFboPct,
      defaultCommissionFbsPct: values.defaultCommissionFbsPct,
      // Include unchanged fields from current settings
      logisticsVolumeTiers: currentSettings?.logisticsVolumeTiers,
      logisticsLargeFirstLiterRate: currentSettings?.logisticsLargeFirstLiterRate,
      logisticsLargeAdditionalLiterRate: currentSettings?.logisticsLargeAdditionalLiterRate,
      returnLogisticsFboRate: currentSettings?.returnLogisticsFboRate,
      returnLogisticsFbsRate: currentSettings?.returnLogisticsFbsRate,
      fbsUsesFboLogisticsRates: currentSettings?.fbsUsesFboLogisticsRates,
      notes: values.notes,
    }

    mutate(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Запланировать новую версию тарифов
          </DialogTitle>
          <DialogDescription>
            Создайте новую версию тарифов с датой начала действия в будущем
          </DialogDescription>
        </DialogHeader>

        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        {isLoadingSettings ? (
          <FormSkeleton />
        ) : (
          <ScheduleVersionForm
            currentSettings={currentSettings}
            isLoading={isPending}
            disabled={isPending}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
