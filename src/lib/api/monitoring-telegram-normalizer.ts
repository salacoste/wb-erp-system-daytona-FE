/**
 * Monitoring Telegram Health Boundary Normalizer
 *
 * Normalizes response from GET /v1/monitoring/telegram-health
 */

import { asRecord, toCount, toNullableNumber, toStr, toOptionalString } from './normalizer-helpers'
import type {
  TelegramHealth,
  TelegramBot,
  TelegramBinding,
  TelegramDelivery,
  TelegramEventBreakdown,
  TelegramFailure,
  TelegramPreferences,
} from '@/app/(dashboard)/monitoring/types/monitoring'

function normalizeTelegramBot(raw: unknown): TelegramBot {
  const r = asRecord(raw)
  return {
    status: (toStr(r.status) || 'not_configured') as TelegramBot['status'],
    lastActivityAt: toOptionalString(r.lastActivityAt) ?? null,
  }
}

function normalizeTelegramBinding(raw: unknown): TelegramBinding {
  const r = asRecord(raw)
  return {
    isBound: Boolean(r.isBound),
    isVerified: Boolean(r.isVerified),
    boundAt: toOptionalString(r.boundAt) ?? null,
    telegramUsername: toOptionalString(r.telegramUsername) ?? null,
  }
}

function normalizeTelegramDelivery(raw: unknown): TelegramDelivery {
  const r = asRecord(raw)
  return {
    totalSent: toCount(r.totalSent),
    totalFailed: toCount(r.totalFailed),
    totalRateLimited: toCount(r.totalRateLimited),
    totalSkippedQuietHours: toCount(r.totalSkippedQuietHours),
    deliveryRate: toNullableNumber(r.deliveryRate) ?? 0,
    avgDeliveryMs: toNullableNumber(r.avgDeliveryMs),
  }
}

function normalizeTelegramEventBreakdown(raw: unknown): TelegramEventBreakdown {
  const r = asRecord(raw)
  return {
    eventType: toStr(r.eventType),
    enabled: Boolean(r.enabled),
    sentCount: toCount(r.sentCount),
    failedCount: toCount(r.failedCount),
  }
}

function normalizeTelegramFailure(raw: unknown): TelegramFailure {
  const r = asRecord(raw)
  return {
    timestamp: toStr(r.timestamp),
    eventType: toStr(r.eventType),
    errorMessage: toStr(r.errorMessage),
  }
}

function normalizeTelegramPreferences(raw: unknown): TelegramPreferences {
  const r = asRecord(raw)
  return {
    telegramEnabled: Boolean(r.telegramEnabled),
    quietHoursEnabled: Boolean(r.quietHoursEnabled),
    quietHoursFrom: toOptionalString(r.quietHoursFrom) ?? null,
    quietHoursTo: toOptionalString(r.quietHoursTo) ?? null,
    language: toStr(r.language),
    enabledEvents: Array.isArray(r.enabledEvents) ? r.enabledEvents.map(String) : [],
    disabledEvents: Array.isArray(r.disabledEvents) ? r.disabledEvents.map(String) : [],
  }
}

export function normalizeTelegramHealthResponse(raw: unknown): TelegramHealth {
  const r = asRecord(raw)
  const per = asRecord(r.period)
  const eb = Array.isArray(r.eventBreakdown) ? r.eventBreakdown : []
  const rf = Array.isArray(r.recentFailures) ? r.recentFailures : []
  return {
    cabinetId: toStr(r.cabinetId),
    generatedAt: toStr(r.generatedAt),
    period: { from: toStr(per.from), to: toStr(per.to) },
    bot: normalizeTelegramBot(r.bot),
    binding: normalizeTelegramBinding(r.binding),
    delivery: normalizeTelegramDelivery(r.delivery),
    eventBreakdown: eb.map(normalizeTelegramEventBreakdown),
    recentFailures: rf.map(normalizeTelegramFailure),
    preferences: normalizeTelegramPreferences(r.preferences),
  }
}
