// ============================================================================
// Tariff Settings Form Schema
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Zod schema and types for tariff settings form validation
// ============================================================================

import { z } from 'zod'

/**
 * Volume tier schema for logistics pricing
 * Backend stores tiers sorted by fromLiters ascending
 */
export const volumeTierSchema = z.object({
  fromLiters: z.number().positive('От (л) должно быть больше 0'),
  toLiters: z.number().positive('До (л) должно быть больше 0'),
  rateRub: z.number().positive('Тариф должен быть больше 0'),
})

/**
 * Main tariff settings form schema
 * AC3: Validation rules match backend
 */
export const tariffSettingsSchema = z.object({
  // Acceptance (2 fields) - positive numbers
  acceptanceBoxRatePerLiter: z.number().positive('Должно быть больше 0'),
  acceptancePalletRate: z.number().positive('Должно быть больше 0'),

  // Logistics (3 fields + volume tiers)
  logisticsVolumeTiers: z
    .array(volumeTierSchema)
    .min(1, 'Минимум 1 тарифный уровень'),
  logisticsLargeFirstLiterRate: z.number().positive('Должно быть больше 0'),
  logisticsLargeAdditionalLiterRate: z.number().positive('Должно быть больше 0'),

  // Returns (2 fields) - positive numbers
  returnLogisticsFboRate: z.number().positive('Должно быть больше 0'),
  returnLogisticsFbsRate: z.number().positive('Должно быть больше 0'),

  // Commission (2 fields) - percentages 0-100
  defaultCommissionFboPct: z
    .number()
    .min(0, 'Минимум 0%')
    .max(100, 'Максимум 100%'),
  defaultCommissionFbsPct: z
    .number()
    .min(0, 'Минимум 0%')
    .max(100, 'Максимум 100%'),

  // Storage (3 fields) - non-negative integers
  storageFreeDays: z.number().int('Должно быть целое число').min(0, 'Минимум 0'),
  fixationClothingDays: z
    .number()
    .int('Должно быть целое число')
    .min(0, 'Минимум 0'),
  fixationOtherDays: z
    .number()
    .int('Должно быть целое число')
    .min(0, 'Минимум 0'),

  // FBS-specific (4+ fields)
  fbsUsesFboLogisticsRates: z.boolean(),
  logisticsFbsVolumeTiers: z.array(volumeTierSchema).optional(),
  logisticsFbsLargeFirstLiterRate: z
    .number()
    .positive('Должно быть больше 0')
    .optional(),
  logisticsFbsLargeAdditionalLiterRate: z
    .number()
    .positive('Должно быть больше 0')
    .optional(),
  clothingCategories: z.array(z.string()).optional(),

  // Meta fields
  effectiveFrom: z.string().optional(),
  source: z.enum(['manual', 'api']),
  notes: z.string().max(500, 'Максимум 500 символов').optional(),
})

/** Form data type inferred from schema */
export type TariffSettingsFormData = z.infer<typeof tariffSettingsSchema>

/** Volume tier type */
export type VolumeTierFormData = z.infer<typeof volumeTierSchema>

/**
 * Get default form values from existing settings
 * Used to populate form on load
 */
export function getDefaultFormValues(
  settings: Partial<TariffSettingsFormData> | null
): TariffSettingsFormData {
  return {
    // Acceptance
    acceptanceBoxRatePerLiter: settings?.acceptanceBoxRatePerLiter ?? 1.8,
    acceptancePalletRate: settings?.acceptancePalletRate ?? 520,

    // Logistics
    logisticsVolumeTiers: settings?.logisticsVolumeTiers ?? [
      { fromLiters: 0.001, toLiters: 0.2, rateRub: 24 },
    ],
    logisticsLargeFirstLiterRate: settings?.logisticsLargeFirstLiterRate ?? 48,
    logisticsLargeAdditionalLiterRate:
      settings?.logisticsLargeAdditionalLiterRate ?? 15,

    // Returns
    returnLogisticsFboRate: settings?.returnLogisticsFboRate ?? 50,
    returnLogisticsFbsRate: settings?.returnLogisticsFbsRate ?? 60,

    // Commission
    defaultCommissionFboPct: settings?.defaultCommissionFboPct ?? 15,
    defaultCommissionFbsPct: settings?.defaultCommissionFbsPct ?? 12,

    // Storage
    storageFreeDays: settings?.storageFreeDays ?? 30,
    fixationClothingDays: settings?.fixationClothingDays ?? 14,
    fixationOtherDays: settings?.fixationOtherDays ?? 7,

    // FBS
    fbsUsesFboLogisticsRates: settings?.fbsUsesFboLogisticsRates ?? true,
    logisticsFbsVolumeTiers: settings?.logisticsFbsVolumeTiers,
    logisticsFbsLargeFirstLiterRate: settings?.logisticsFbsLargeFirstLiterRate,
    logisticsFbsLargeAdditionalLiterRate:
      settings?.logisticsFbsLargeAdditionalLiterRate,
    clothingCategories: settings?.clothingCategories,

    // Meta
    effectiveFrom: settings?.effectiveFrom,
    source: 'manual',
    notes: settings?.notes ?? '',
  }
}

/**
 * Get changed fields between original and current form data
 * Used to determine PUT vs PATCH and create minimal payload
 */
export function getChangedFields(
  original: TariffSettingsFormData,
  current: TariffSettingsFormData
): Partial<TariffSettingsFormData> {
  const changed: Partial<TariffSettingsFormData> = {}
  const keys = Object.keys(current) as (keyof TariffSettingsFormData)[]

  for (const key of keys) {
    const origValue = original[key]
    const currValue = current[key]

    // Deep compare for arrays
    if (Array.isArray(origValue) && Array.isArray(currValue)) {
      if (JSON.stringify(origValue) !== JSON.stringify(currValue)) {
        ;(changed as Record<string, unknown>)[key] = currValue
      }
    } else if (origValue !== currValue) {
      ;(changed as Record<string, unknown>)[key] = currValue
    }
  }

  return changed
}
