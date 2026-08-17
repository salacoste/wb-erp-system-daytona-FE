/**
 * Cabinet service functions
 * Handles cabinet creation with automatic JWT token refresh.
 * Story 167.9: cabinet settlement is conditional on the immutable initiating
 * account/session; a late result for a superseded session is typed and never
 * committed to global auth state.
 */

import { createCabinet } from '@/lib/api'
import { updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { useAuthStore } from '@/stores/authStore'
import type { CreateCabinetResponse } from '@/types/cabinet'
import { logger } from '@/lib/logger'
import type { ApiRequestOptions } from '@/types/api'

/** Story 167.9: typed settlement outcome of a cabinet creation attempt. */
export type CabinetSettlementStatus = 'applied' | 'stale' | 'indeterminate'

export interface CabinetSettlementResult {
  status: CabinetSettlementStatus
  /** Present only for `applied` — the committed cabinet view. */
  cabinet?: {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    targetMarginPct: number | null
  }
  productsSyncTasks?: CreateCabinetResponse['productsSyncTasks']
  /** Durable Story 167.8 operation id for the initiating account's reconciliation. */
  operationId?: string
}

/** Immutable snapshot of the session that initiated the create. */
interface InitiatingSessionContext {
  accountId: string | null
  sessionNonce: string | null
}

/**
 * Compare the initiating session with the live auth state at settlement time.
 * Story 167.9 (review fix MEDIUM-3): the session nonce is the PRIMARY identity
 * predicate — a nonce match settles `applied` even when the initiating snapshot
 * lacked a user (token-only state). The account id is compared only as
 * defense-in-depth when BOTH sides are non-null: a mismatch overrides to stale
 * (a different account re-using a nonce should be impossible, but fail-safe).
 * - indeterminate: either nonce is null (e.g. a session persisted before
 *   sessionNonce existed). Fail-safe: treated like stale for all UI effects.
 */
export function evaluateCabinetSettlement(
  expected: InitiatingSessionContext
): CabinetSettlementStatus {
  const live = useAuthStore.getState()

  if (!live.token || !live.user) {
    return 'stale'
  }
  if (!expected.sessionNonce || !live.sessionNonce) {
    return 'indeterminate'
  }
  if (live.sessionNonce !== expected.sessionNonce) {
    return 'stale'
  }
  if (expected.accountId && live.user.id && live.user.id !== expected.accountId) {
    return 'stale'
  }
  return 'applied'
}

/** Quiet reconciliation log for the initiating account — no secrets (Story 167.9 privacy rule). */
function logStaleSettlement(status: CabinetSettlementStatus, operationId?: string): void {
  logger.warn('Cabinet creation settlement skipped (superseded session)', {
    settlement: status,
    operationId: operationId ?? null,
  })
}

/**
 * Creates a cabinet and conditionally settles the new JWT/cabinet into the
 * auth store — ONLY when the initiating session is still the live session.
 * ⚠️ КРИТИЧНО: После создания кабинета backend возвращает новый JWT токен.
 * Этот токен обновляется в auth store только если сессия не была заменена
 * (Story 167.9: account-scoped conditional settlement).
 *
 * @param cabinetName - Название кабинета
 * @param targetMarginPct - Целевая маржа (%)
 * @returns Typed settlement result: applied | stale | indeterminate.
 *   Stale/indeterminate results never mutate global auth state and never throw.
 * @throws Error только если создание/оформление не удалось в ЖИВОЙ (та же самая) сессии.
 */
export async function handleCreateCabinet(
  cabinetName: string,
  targetMarginPct: number
): Promise<CabinetSettlementResult> {
  const { token, refreshToken: refreshTokenInStore, user } = useAuthStore.getState()

  if (!token) {
    throw new Error('User not authenticated')
  }

  // Immutable initiating context: token + session identity captured once.
  const initiating: InitiatingSessionContext = {
    accountId: user?.id ?? null,
    sessionNonce: useAuthStore.getState().sessionNonce,
  }
  const idempotencyKey = crypto.randomUUID()

  let response: CreateCabinetResponse
  try {
    response = await createCabinet({ name: cabinetName }, { token, idempotencyKey })
  } catch (error) {
    // Stale failure: the session that initiated this create is gone — the live
    // session must not see an error for work it did not start.
    const failureSettlement = evaluateCabinetSettlement(initiating)
    if (failureSettlement !== 'applied') {
      logStaleSettlement(failureSettlement)
      return { status: failureSettlement }
    }
    logger.error('Failed to create cabinet:', error)
    throw error
  }

  // Conditional settlement: compare expected vs live BEFORE any commit. The
  // comparison and commits below run synchronously, so no interleaving can
  // slip a session switch between check and commit (JS single-threaded).
  const settlement = evaluateCabinetSettlement(initiating)
  if (settlement !== 'applied') {
    logStaleSettlement(settlement, response.operationId)
    return { status: settlement, operationId: response.operationId }
  }

  // ⚠️ КРИТИЧНО: Обновляем JWT токен в store синхронно (initiating session is live)
  try {
    refreshTokenInStore(response.newToken, user || undefined)
  } catch (tokenError) {
    // Критическая ошибка - токен не обновлен
    logger.error('Failed to update token after cabinet creation:', tokenError)
    throw new Error(
      'Cabinet created, but token update failed. Please refresh the page or log in again.'
    )
  }

  // Устанавливаем созданный кабинет как активный
  useAuthStore.getState().setCabinetId(response.id)

  // Persist the explicit onboarding target through the existing cabinet PUT endpoint.
  // Story 167.9 (review fix HIGH-1): the margin PUT is an AWAIT gap — a session
  // switch between the commit block and here would make a store-based transport
  // read B's token with A's cabinet. Instead, pin the transport to the JUST
  // COMMITTED context: response.newToken + response.id, independent of live state.
  const marginContext: ApiRequestOptions = {
    authToken: response.newToken,
    cabinetIdOverride: response.id,
  }

  let updatedCabinet
  try {
    updatedCabinet = await updateCabinetTaxSettings(response.id, { targetMarginPct }, marginContext)
  } catch (marginError) {
    // The await above is a switch point: if the initiating session is no longer
    // live, the margin failure belongs to a superseded session and must NOT
    // throw into the live session's UI (same quiet-swallow shape as above).
    const postMarginSettlement = evaluateCabinetSettlement(initiating)
    if (postMarginSettlement !== 'applied') {
      logStaleSettlement(postMarginSettlement, response.operationId)
      return { status: postMarginSettlement, operationId: response.operationId }
    }
    logger.error('Cabinet created, but target margin update failed:', marginError)
    throw new Error('Cabinet created, but target margin could not be saved')
  }

  return {
    status: 'applied',
    cabinet: {
      id: response.id,
      name: response.name,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      targetMarginPct: updatedCabinet.targetMarginPct,
    },
    productsSyncTasks: response.productsSyncTasks,
    operationId: response.operationId,
  }
}
