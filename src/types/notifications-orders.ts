/**
 * FBS Order Notification Settings Types
 * Epic 132-FE: Story 132.1 — Backend Story 40.7
 * Contract: GET/POST /v1/notifications/orders/settings
 *
 * Extracted from notifications.ts for file-size compliance.
 */

/**
 * Response from GET /v1/notifications/orders/settings
 * FBS order notification preferences for current cabinet
 */
export interface OrderNotificationSettingsDto {
  cabinetId: string
  newOrderEnabled: boolean
  slaWarningEnabled: boolean
  dailySummaryEnabled: boolean
  dailySummaryHour: number // 0-23
  quietHoursStart: number // 0-23
  quietHoursEnd: number // 0-23
  confirmationSlaWarningMinutes: number
  completionSlaWarningMinutes: number
}

/**
 * Request body for POST /v1/notifications/orders/settings
 * Full replacement — send all fields
 */
export type UpdateOrderNotificationSettingsDto = Omit<OrderNotificationSettingsDto, 'cabinetId'>
