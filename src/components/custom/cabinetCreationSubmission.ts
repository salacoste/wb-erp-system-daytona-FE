import { z } from 'zod'

export const cabinetFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  targetMarginPct: z
    .string()
    .trim()
    .min(1, 'Укажите целевую маржу')
    .refine(value => Number.isFinite(Number(value)), 'Введите корректное число')
    .refine(
      value => Number(value) >= 0 && Number(value) <= 100,
      'Целевая маржа должна быть от 0 до 100%'
    ),
})

export type WorkflowPhase =
  | 'restoring'
  | 'idle'
  | 'creating'
  | 'margin-recovery'
  | 'recovery-blocked'
  | 'token-recovery-blocked'

/**
 * Immutable in-flight context of one create attempt (memory only — never
 * persisted). `token` is the initiating-session JWT (Story 167.9 request
 * context) used for the Story 167.8 operation reconciliation after a
 * superseded settlement.
 */
export type CreateAttemptSnapshot = {
  userId: string | null
  cabinetId: string | null
  token: string | null
}

// N2 (review pass 2): TOKEN_RECOVERY_MESSAGE has ONE canonical definition —
// CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE in @/lib/cabinetCreationLock (the
// FE-D5 tombstone uses the same copy). Re-exported here so existing saga
// consumers keep their import path; never redefine the text locally.
export { CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE as TOKEN_RECOVERY_MESSAGE } from '@/lib/cabinetCreationLock'
export const SAFE_RECONCILIATION_MESSAGE =
  'Не удалось безопасно подтвердить состояние операции с кабинетом. Не отправляйте форму повторно. Выйдите из аккаунта и войдите снова: требуется безопасная повторная авторизация и сверка кабинета с сервером.'
export const MARGIN_RECOVERY_MESSAGE =
  'Кабинет создан, но целевая маржа не сохранилась. Исправьте ошибку и повторите попытку.'
export const UPDATE_RECOVERY_MESSAGE = 'Не удалось сохранить целевую маржу. Повторите попытку.'
