/**
 * TaxSettingsForm — Tax & VAT Settings Form
 * Story 66.3-FE: Tax & VAT Settings Page
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * P1 fixes: toast feedback, vatRate validation, Cancel button
 * P2 fixes: loading/error states, spinner, button layout, isDirty
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'
import type { TaxSystem, VatRate } from '@/types/cabinet'
import { TaxSystemSection, VatSection } from './tax-settings-sections'

interface TaxSettingsFormProps {
  cabinetId: string
}

export function TaxSettingsForm({ cabinetId }: TaxSettingsFormProps) {
  const { data, isLoading, isError } = useCabinetTaxSettings(cabinetId)
  const mutation = useUpdateTaxSettings(cabinetId)

  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(null)
  const [taxRate, setTaxRate] = useState('')
  const [vatPayer, setVatPayer] = useState(false)
  const [vatRate, setVatRate] = useState<VatRate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vatError, setVatError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!data) return
    setTaxSystem(data.taxSystem ?? null)
    setTaxRate(data.taxRate != null ? String(data.taxRate) : '')
    setVatPayer(data.vatPayer ?? false)
    setVatRate(data.vatRate != null ? (data.vatRate as VatRate) : null)
    setIsDirty(false)
  }, [data])

  const markDirty = () => setIsDirty(true)

  const handleSubmit = () => {
    setError(null)
    setVatError(null)

    if (taxSystem === 'manual' && !taxRate.trim()) {
      setError('Укажите ставку налога')
      return
    }
    if (vatPayer && vatRate == null) {
      setVatError('Выберите ставку НДС')
      return
    }

    mutation.mutate(
      {
        taxSystem,
        taxRate: taxSystem === 'manual' ? Number(taxRate) : null,
        vatPayer,
        vatRate: vatPayer ? vatRate : null,
      },
      {
        onSuccess: () => {
          toast.success('Налоговые настройки сохранены')
          setIsDirty(false)
        },
        onError: () => {
          toast.error('Не удалось сохранить настройки')
        },
      }
    )
  }

  const handleCancel = () => {
    if (!data) return
    setTaxSystem(data.taxSystem ?? null)
    setTaxRate(data.taxRate != null ? String(data.taxRate) : '')
    setVatPayer(data.vatPayer ?? false)
    setVatRate(data.vatRate != null ? (data.vatRate as VatRate) : null)
    setError(null)
    setVatError(null)
    setIsDirty(false)
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Ошибка загрузки настроек. Попробуйте обновить страницу.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />

  return (
    <div className="space-y-6">
      <TaxSystemSection
        taxSystem={taxSystem}
        taxRate={taxRate}
        error={error}
        onTaxSystemChange={v => {
          setTaxSystem(v)
          setError(null)
          markDirty()
        }}
        onTaxRateChange={v => {
          setTaxRate(v)
          markDirty()
        }}
      />
      <VatSection
        vatPayer={vatPayer}
        vatRate={vatRate}
        vatError={vatError}
        onVatPayerChange={v => {
          setVatPayer(v)
          setVatError(null)
          markDirty()
        }}
        onVatRateChange={v => {
          setVatRate(v)
          setVatError(null)
          markDirty()
        }}
      />
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={mutation.isPending || !isDirty}
        >
          <X className="mr-2 h-4 w-4" />
          Отменить
        </Button>
        <Button onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>
    </div>
  )
}
