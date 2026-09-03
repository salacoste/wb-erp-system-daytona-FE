/**
 * API Client for backend communication
 * Uses centralized apiClient from api-client.ts (Story 1.5)
 */

import { apiClient } from './api-client'
import { logger } from '@/lib/logger'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  User,
} from '@/types/auth'
import type {
  CreateCabinetRequest,
  CreateCabinetResponse,
  CabinetCreationOperationState,
  UpdateWbTokenRequest,
  UpdateWbTokenResponse,
} from '@/types/cabinet'
import { handleWbTokenUpdateError } from './api-wb-token-errors'
import type { MarginCalculationStatusResponse } from '@/types/cogs'
import type { ApiRequestOptions } from '@/types/api'

/**
 * Refresh token response interface
 */
export interface RefreshTokenResponse {
  token: string
  user?: {
    id: string
    email: string
    name?: string
    role: 'Owner' | 'Manager' | 'Analyst' | 'Service'
    cabinet_ids?: string[]
  }
}

/**
 * Register a new user
 * @param data - Registration data (email, password, optional name)
 * @returns Promise with user and token
 * @throws Error on registration failure
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>('/v1/auth/register', data, {
    skipAuth: true,
  })
}

/**
 * Logs in a user.
 * @param data - User login data (email, password, rememberMe).
 * @returns Login response with user info and token.
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  // Backend returns { access_token, user } but we expect { token, user }
  const response = await apiClient.post<{ access_token: string; user: User }>(
    '/v1/auth/login',
    data,
    {
      skipAuth: true,
    }
  )

  // Map access_token to token for consistency
  return {
    user: response.user,
    token: response.access_token,
  }
}

/**
 * Refreshes JWT token.
 * @param currentToken - Current JWT token to refresh.
 * @param options - Extra ApiRequestOptions merged under the forced refresh
 *   contract (D-2 pass-1, M2): the refresh deadline's AbortSignal rides this
 *   spread — ApiRequestOptions extends RequestInit, so `signal` flows through
 *   apiClient's option spread into fetch with zero new plumbing. The forced
 *   skipAuth + Authorization contract cannot be overridden by a caller.
 * @returns New token and optionally updated user info.
 */
export async function refreshToken(
  currentToken: string,
  options?: ApiRequestOptions
): Promise<RefreshTokenResponse> {
  // Use apiClient with manual token header since token might be expired
  return apiClient.post<RefreshTokenResponse>(
    '/v1/auth/refresh',
    {},
    {
      ...options,
      skipAuth: true,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${currentToken}`,
      },
    }
  )
}

/**
 * Logs out a user.
 * @returns Logout response message.
 */
export async function logoutUser(): Promise<{ message: string }> {
  try {
    return await apiClient.post<{ message: string }>('/v1/auth/logout')
  } catch {
    // Even if logout fails on backend, we should still clear local state
    logger.warn('Logout API call failed, but clearing local state')
    return { message: 'Logged out locally' }
  }
}

/**
 * Creates a new cabinet.
 * ⚠️ КРИТИЧНО: После создания кабинета backend возвращает новый JWT токен в поле `newToken`.
 * Этот токен ОБЯЗАТЕЛЬНО нужно обновить в auth store, иначе пользователь не сможет получить доступ к созданному кабинету.
 *
 * @param data - Cabinet creation data (name, optional description)
 * @param token - JWT token for authentication (kept for backward compatibility)
 * @returns Cabinet creation response with newToken
 * @throws Error on creation failure
 */
/**
 * Story 167.9: immutable initiating request context for cabinet creation.
 * `token` is the JWT of the session that initiated the create (never re-read
 * from mutable global state); `idempotencyKey` is the Story 167.8 UUID v4
 * Idempotency-Key that scopes the durable account-scoped operation.
 */
export interface CabinetCreateRequestContext {
  token: string
  idempotencyKey: string
}

export async function createCabinet(
  data: CreateCabinetRequest,
  context: CabinetCreateRequestContext
): Promise<CreateCabinetResponse> {
  // Story 167.9: the immutable initiating token authenticates the request and the
  // Story 167.8 Idempotency-Key (UUID v4) scopes the durable creation operation.
  // `context` is required — every real caller captures its initiating session.
  const options: ApiRequestOptions = {
    // Story 167.8: create is account-scoped — no X-Cabinet-Id participates.
    skipCabinetId: true,
    authToken: context.token,
    headers: { 'Idempotency-Key': context.idempotencyKey },
    // D-2 pass-1 (OQ2, 2026-09-03): explicit initiating-token pin ⇒ no
    // auto-replay. A 401 on this request is the pinned session's credential
    // failure, not a stale-transport artifact — the durable account-scoped
    // create owns its retry via Story 167.8 reconciliation, and silently
    // replaying under a rotated DIFFERENT session's token would both mask
    // the failure and drop the Idempotency-Key↔session pairing (cross-session
    // pin-drop defense).
    allowReactiveRefresh: false,
  }
  return apiClient.post<CreateCabinetResponse>('/v1/cabinets', data, options)
}

// Story 167.5 consumer: `useCabinetCreateMutation.reconcileSettledOperation`
// (superseded-settlement evidence). Supersedes the 167.9-era PENDING-BACKEND note.
/**
 * Story 167.8 contract: account-scoped authoritative reconciliation of a cabinet
 * creation operation. Returns in_progress / failed evidence; a succeeded
 * operation replays the full CreateCabinetResponseDto (including newToken).
 * Unknown and cross-account operation ids are indistinguishable 404s.
 *
 * @param operationId - UUID operation id from the initiating create context/response
 * @param token - Immutable initiating-session JWT
 */
export async function getCabinetCreationOperation(
  operationId: string,
  token: string
): Promise<CreateCabinetResponse | CabinetCreationOperationState> {
  return apiClient.get<CreateCabinetResponse | CabinetCreationOperationState>(
    `/v1/cabinets/creation-operations/${operationId}`,
    {
      authToken: token,
      // D-2 pass-2 (2026-09-03): initiating-JWT pin ⇒ no auto-replay —
      // symmetric with createCabinet; cross-account op-id lookups are
      // indistinguishable 404s by contract.
      allowReactiveRefresh: false,
    }
  )
}

/**
 * Updates WB API token for a cabinet.
 * ⚠️ ВАЖНО: Заголовок X-Cabinet-Id обязателен для всех запросов к cabinet endpoints.
 * apiClient автоматически добавляет X-Cabinet-Id из auth store.
 *
 * 📝 Важно: Имя ключа должно быть 'wb_api_token' (см. docs/CHANGELOG-wb-token-key-name.md)
 *
 * @param cabinetId - UUID кабинета (kept for backward compatibility)
 * @param keyName - Имя ключа (например, "wb_api_token")
 * @param newToken - Новый WB API токен
 * @param jwtToken - JWT токен пользователя (kept for backward compatibility, apiClient uses store)
 * @returns Обновленная информация о ключе
 * @throws Error если обновление не удалось
 */
export async function updateWbToken(
  cabinetId: string,
  keyName: string,
  newToken: string,
  _jwtToken?: string
): Promise<UpdateWbTokenResponse> {
  try {
    return await apiClient.put<UpdateWbTokenResponse>(`/v1/cabinets/${cabinetId}/keys/${keyName}`, {
      token: newToken,
    } satisfies UpdateWbTokenRequest)
  } catch (error) {
    handleWbTokenUpdateError(error)
  }
}

/**
 * Get margin calculation status for a product (Request #21 - Epic 22)
 * GET /v1/products/:nmId/margin-status
 * Reference: docs/request-backend/21-margin-calculation-status-endpoint-backend.md
 *
 * This lightweight endpoint checks BullMQ queue for margin calculation task status
 * without fetching full product data. Recommended for polling.
 *
 * @param nmId - Product article number
 * @returns Margin calculation status response
 */
export async function getMarginCalculationStatus(
  nmId: string
): Promise<MarginCalculationStatusResponse> {
  return apiClient.get<MarginCalculationStatusResponse>(`/v1/products/${nmId}/margin-status`)
}
