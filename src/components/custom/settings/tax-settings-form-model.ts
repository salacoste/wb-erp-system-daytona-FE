import { TAX_SYSTEM_LABELS, VAT_RATES, VAT_RATE_LABELS } from '@/types/cabinet'
import type { Cabinet, TaxSystem, UpdateCabinetTaxRequest, VatRate } from '@/types/cabinet'

export interface TaxSettingsDraft {
  taxSystem: TaxSystem | null
  taxRate: string
  vatPayer: boolean
  vatRate: number | null
}

export interface TaxSettingsErrors {
  taxRate?: string
  vatRate?: string
}

export const EMPTY_TAX_DRAFT: TaxSettingsDraft = {
  taxSystem: null,
  taxRate: '',
  vatPayer: false,
  vatRate: null,
}

function isSupportedVatRate(value: number | null): value is VatRate {
  return value != null && VAT_RATES.some(rate => rate === value)
}

function savedVatRateLabel(value: number | null) {
  if (value == null) return 'Не применяется'
  return isSupportedVatRate(value)
    ? VAT_RATE_LABELS[value]
    : `${value}% — сохранённая ставка недоступна для выбора`
}

interface TaxSettingsContextOptions {
  data: Cabinet | undefined
  isError: boolean
  isLoading: boolean
  isFetching: boolean
}

export function taxSettingsContext({
  data,
  isError,
  isLoading,
  isFetching,
}: TaxSettingsContextOptions) {
  const pending = isLoading || isFetching
  return {
    state: isError
      ? 'unavailable'
      : pending
        ? 'refreshing'
        : data?.taxSystem == null
          ? 'partial'
          : 'fresh',
    stateLabel: isError
      ? 'Налоговые настройки недоступны'
      : pending
        ? 'Получаем налоговые настройки'
        : data?.taxSystem == null
          ? 'Система налогообложения не настроена'
          : 'Налоговые настройки получены',
    items: data
      ? [
          {
            id: 'tax-system',
            label: 'Налоговая система',
            value: data.taxSystem ? TAX_SYSTEM_LABELS[data.taxSystem] : 'Не настроена',
          },
          {
            id: 'vat-rate',
            label: 'НДС',
            value: data.vatPayer ? savedVatRateLabel(data.vatRate) : 'Не применяется',
          },
        ]
      : [],
  } as const
}

export function draftFromCabinet(data: Cabinet): TaxSettingsDraft {
  return {
    taxSystem: data.taxSystem ?? null,
    taxRate: data.taxRate == null ? '' : String(data.taxRate),
    vatPayer: data.vatPayer ?? false,
    vatRate: data.vatRate,
  }
}

export function draftsMatch(left: TaxSettingsDraft, right: TaxSettingsDraft) {
  return (
    left.taxSystem === right.taxSystem &&
    left.taxRate === right.taxRate &&
    left.vatPayer === right.vatPayer &&
    left.vatRate === right.vatRate
  )
}

export function validateTaxDraft(draft: TaxSettingsDraft): TaxSettingsErrors {
  const errors: TaxSettingsErrors = {}

  if (draft.taxSystem === 'manual') {
    const value = Number(draft.taxRate)
    if (!draft.taxRate.trim()) errors.taxRate = 'Укажите ставку налога'
    else if (!Number.isFinite(value) || value < 0 || value > 100) {
      errors.taxRate = 'Укажите ставку от 0 до 100 процентов'
    }
  }

  if (draft.vatPayer && draft.vatRate == null) {
    errors.vatRate = 'Выберите ставку НДС'
  } else if (draft.vatPayer && !isSupportedVatRate(draft.vatRate)) {
    errors.vatRate = 'Сохранённая ставка недоступна — выберите поддерживаемую ставку НДС'
  }
  return errors
}

export function requestFromDraft(draft: TaxSettingsDraft): UpdateCabinetTaxRequest {
  return {
    taxSystem: draft.taxSystem,
    taxRate: draft.taxSystem === 'manual' ? Number(draft.taxRate) : null,
    vatPayer: draft.vatPayer,
    // BD-FE-004: the backend rejects null here and canonicalizes 0 to null for non-payers.
    vatRate: draft.vatPayer ? draft.vatRate : 0,
  }
}
