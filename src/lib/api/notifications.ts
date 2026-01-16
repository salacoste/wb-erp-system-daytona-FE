// ============================================================================
// Telegram Notifications API Client
// Epic 34-FE: Story 34.1-FE
// Backend Reference: Request #73 - Telegram Notifications API
// Refactored: 2025-12-30 - Use centralized apiClient
// ============================================================================

import { apiClient } from '../api-client'
import type {
  BindingCodeResponseDto,
  BindingStatusResponseDto,
  StartBindingRequestDto,
  NotificationPreferencesResponseDto,
  UpdatePreferencesRequestDto,
  SendTestNotificationRequestDto,
  TestNotificationResponseDto,
} from '@/types/notifications'

// ============================================================================
// Telegram Binding API
// ============================================================================

/**
 * POST /v1/notifications/telegram/bind
 * Generate binding code for Telegram bot
 *
 * @param params - Optional language preference for instructions
 * @returns Binding code response with deep link and expiration
 */
export async function startTelegramBinding(
  params?: StartBindingRequestDto
): Promise<BindingCodeResponseDto> {
  return apiClient.post<BindingCodeResponseDto>(
    '/v1/notifications/telegram/bind',
    params || {}
  )
}

/**
 * GET /v1/notifications/telegram/status
 * Poll binding status (called every 3 seconds)
 *
 * @returns Current binding status with username if bound
 */
export async function getBindingStatus(): Promise<BindingStatusResponseDto> {
  return apiClient.get<BindingStatusResponseDto>(
    '/v1/notifications/telegram/status'
  )
}

/**
 * DELETE /v1/notifications/telegram/unbind
 * Remove Telegram binding
 *
 * @returns void - No response body for successful DELETE
 */
export async function unbindTelegram(): Promise<void> {
  return apiClient.delete<void>('/v1/notifications/telegram/unbind')
}

// ============================================================================
// Notification Preferences API
// ============================================================================

/**
 * GET /v1/notifications/preferences
 * Get current notification preferences
 *
 * @returns Complete notification preferences for current cabinet
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesResponseDto> {
  return apiClient.get<NotificationPreferencesResponseDto>(
    '/v1/notifications/preferences'
  )
}

/**
 * PUT /v1/notifications/preferences
 * Update notification preferences (partial update)
 *
 * @param preferences - Partial preferences update
 * @returns Updated preferences
 */
export async function updateNotificationPreferences(
  preferences: UpdatePreferencesRequestDto
): Promise<NotificationPreferencesResponseDto> {
  return apiClient.put<NotificationPreferencesResponseDto>(
    '/v1/notifications/preferences',
    preferences
  )
}

// ============================================================================
// Test Notification API
// ============================================================================

/**
 * POST /v1/notifications/test
 * Send test notification to verify binding
 *
 * @param params - Optional custom message
 * @returns Test notification result
 */
export async function sendTestNotification(
  params?: SendTestNotificationRequestDto
): Promise<TestNotificationResponseDto> {
  return apiClient.post<TestNotificationResponseDto>(
    '/v1/notifications/test',
    params || {}
  )
}
