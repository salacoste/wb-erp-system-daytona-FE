/**
 * API Client for backend communication
 * Uses centralized apiClient from api-client.ts (Story 1.5)
 */

import { apiClient } from './api-client'
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
  UpdateWbTokenRequest,
  UpdateWbTokenResponse,
  ApiError as CabinetApiError,
} from '@/types/cabinet'
import type { MarginCalculationStatusResponse } from '@/types/cogs'

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
export async function registerUser(
  data: RegisterRequest,
): Promise<RegisterResponse> {
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
    },
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
 * @returns New token and optionally updated user info.
 */
export async function refreshToken(
  currentToken: string,
): Promise<RefreshTokenResponse> {
  // Use apiClient with manual token header since token might be expired
  return apiClient.post<RefreshTokenResponse>(
    '/v1/auth/refresh',
    {},
    {
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    },
  )
}

/**
 * Logs out a user.
 * @returns Logout response message.
 */
export async function logoutUser(): Promise<{ message: string }> {
  try {
    return await apiClient.post<{ message: string }>('/v1/auth/logout')
  } catch (error) {
    // Even if logout fails on backend, we should still clear local state
    console.warn('Logout API call failed, but clearing local state')
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
export async function createCabinet(
  data: CreateCabinetRequest,
  token?: string,
): Promise<CreateCabinetResponse> {
  // apiClient automatically includes token from store, but we accept token param for compatibility
  return apiClient.post<CreateCabinetResponse>('/v1/cabinets', data)
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
  jwtToken?: string,
): Promise<UpdateWbTokenResponse> {
  try {
    return await apiClient.put<UpdateWbTokenResponse>(
      `/v1/cabinets/${cabinetId}/keys/${keyName}`,
      { token: newToken } satisfies UpdateWbTokenRequest,
    )
  } catch (error) {
    // Enhanced error handling for specific error codes
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string; data?: CabinetApiError }
      
      if (apiError.status === 400) {
        const details = apiError.data as CabinetApiError | undefined
        throw new Error(
          details?.details?.[0]?.recommendation ||
            details?.message ||
            'Invalid token or missing X-Cabinet-Id header',
        )
      } else if (apiError.status === 403) {
        throw new Error(
          apiError.message ||
            'Insufficient permissions to update token. Owner or Manager role required.',
        )
      } else if (apiError.status === 404) {
        throw new Error(apiError.message || 'Cabinet or key not found')
      } else if (apiError.status === 401) {
        throw new Error(apiError.message || 'Unauthorized. Please log in again.')
      }

      // Handle specific error codes
      const details = apiError.data as CabinetApiError | undefined
      if (details?.code === 'INVALID_TOKEN') {
        throw new Error(
          details.details?.[0]?.recommendation ||
            'WB API token is invalid or expired. Please check your token or get a new one from https://seller.wildberries.ru/',
        )
      } else if (details?.code === 'RATE_LIMITED') {
        throw new Error(
          'WB API rate limit exceeded. Please wait a few minutes and try again.',
        )
      } else if (details?.code === 'NETWORK_ERROR') {
        throw new Error(
          'Unable to connect to WB API. Please check your internet connection and try again later.',
        )
      } else if (details?.code === 'TOKEN_VALIDATION_FAILED') {
        throw new Error(
          details.details?.[0]?.recommendation ||
            'Token validation failed. Please verify your token is correct.',
        )
      }
    }
    throw error
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
  nmId: string,
): Promise<MarginCalculationStatusResponse> {
  return apiClient.get<MarginCalculationStatusResponse>(
    `/v1/products/${nmId}/margin-status`,
  )
}

