/**
 * Notifications Boundary Normalizer
 *
 * Normalizes responses from:
 * - GET /v1/notifications/telegram/status (binding status)
 * - GET /v1/notifications/preferences
 */

import { asRecord, toCount, toStr, toOptionalString } from './normalizer-helpers'
import type {
  BindingStatusResponseDto,
  NotificationPreferencesResponseDto,
} from '@/types/notifications'

export function normalizeBindingStatusResponse(raw: unknown): BindingStatusResponseDto {
  const r = asRecord(raw)
  return {
    bound: Boolean(r.bound),
    telegram_user_id: toCount(r.telegram_user_id) || null,
    telegram_username: toOptionalString(r.telegram_username) ?? null,
    binding_expires_at: toOptionalString(r.binding_expires_at) ?? null,
  }
}

function normalizePreferencesBlock(raw: unknown) {
  const r = asRecord(raw)
  return {
    task_completed: Boolean(r.task_completed),
    task_failed: Boolean(r.task_failed),
    task_stalled: Boolean(r.task_stalled),
    daily_digest: Boolean(r.daily_digest),
    digest_time: toStr(r.digest_time),
  }
}

function normalizeQuietHours(raw: unknown) {
  const r = asRecord(raw)
  return {
    enabled: Boolean(r.enabled),
    from: toStr(r.from),
    to: toStr(r.to),
    timezone: toStr(r.timezone),
  }
}

export function normalizeNotificationPreferencesResponse(
  raw: unknown
): NotificationPreferencesResponseDto {
  const r = asRecord(raw)
  const lang = toStr(r.language)
  return {
    cabinet_id: toStr(r.cabinet_id),
    telegram_enabled: Boolean(r.telegram_enabled),
    telegram_bound: Boolean(r.telegram_bound),
    telegram_username: toOptionalString(r.telegram_username) ?? null,
    preferences: normalizePreferencesBlock(r.preferences),
    language: (lang === 'ru' || lang === 'en'
      ? lang
      : 'ru') as NotificationPreferencesResponseDto['language'],
    quiet_hours: normalizeQuietHours(r.quiet_hours),
  }
}
