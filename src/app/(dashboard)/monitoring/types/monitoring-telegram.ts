/**
 * Monitoring Telegram health types — Epic 68-FE
 * Extracted from monitoring.ts for Story 74.8 (file size compliance)
 *
 * Types for GET /v1/monitoring/telegram-health endpoint.
 */

import type { BotStatus } from './monitoring-enums'

// --- Telegram Health (GET /v1/monitoring/telegram-health) ---

export interface TelegramBot {
  status: BotStatus
  lastActivityAt: string | null
}

export interface TelegramBinding {
  isBound: boolean
  boundAt: string | null
  telegramUsername: string | null
  isVerified: boolean
}

export interface TelegramDelivery {
  totalSent: number
  totalFailed: number
  totalRateLimited: number
  totalSkippedQuietHours: number
  deliveryRate: number
  avgDeliveryMs: number | null
}

export interface TelegramEventBreakdown {
  eventType: string
  enabled: boolean
  sentCount: number
  failedCount: number
}

export interface TelegramFailure {
  timestamp: string
  eventType: string
  errorMessage: string
}

export interface TelegramPreferences {
  telegramEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursFrom: string | null
  quietHoursTo: string | null
  language: string
  enabledEvents: string[]
  disabledEvents: string[]
}

export interface TelegramHealth {
  cabinetId: string
  generatedAt: string
  period: { from: string; to: string }
  bot: TelegramBot
  binding: TelegramBinding
  delivery: TelegramDelivery
  eventBreakdown: TelegramEventBreakdown[]
  recentFailures: TelegramFailure[]
  preferences: TelegramPreferences
}
