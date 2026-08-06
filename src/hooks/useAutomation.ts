'use client'

/**
 * useAutomation — AT1 hooks for the canned-rules gallery.
 *
 * - useCannedRules: query for GET /v1/automation/canned-rules (static gallery).
 * - useInstallCannedRule: mutation for POST /v1/automation/canned-rules/:key/install.
 *   On success: invalidate the gallery + toast. On 409/404: friendly RU toast
 *   (status-based via ApiError, not locale-substring — backend returns EN msgs).
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCannedRules,
  getInstalledRules,
  installCannedRule,
  automationQueryKeys,
} from '@/lib/api/automation'
import { getInstalledRule, updateInstalledRule } from '@/lib/api/installed-rule-detail'
import type {
  CannedRuleTemplate,
  AutomationRule,
  AutomationRuleDetail,
  InstallCannedRuleBody,
  InstalledRulesQuery,
  UpdateAutomationRuleInput,
} from '@/types/automation'
import { ApiError } from '@/types/api'
import { logger } from '@/lib/logger'

/** Fetch the canned-rules gallery (static across cabinets). */
export function useCannedRules() {
  return useQuery<CannedRuleTemplate[], Error>({
    queryKey: automationQueryKeys.cannedRules,
    queryFn: getCannedRules,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch the cabinet's installed rules (GET /v1/automation/rules). Story 163.2-FE.
 * Same cache/retry policy as useCannedRules. Pass optional filters via `params`.
 * A failure here is isolated to this query — it never blanks the templates gallery.
 */
export function useInstalledRules(params?: InstalledRulesQuery) {
  return useQuery<AutomationRule[], Error>({
    queryKey: automationQueryKeys.installedRules(params),
    queryFn: () => getInstalledRules(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}

/**
 * Fetch a single installed rule by id (GET /v1/automation/rules/:id). Story 163.3.
 * `enabled: !!id` gates the query so an empty id (e.g. during route resolve)
 * never fires the request. Same cache/retry policy as useInstalledRules.
 *
 * Errors carry ApiError.status so the editor can branch independent states
 * (404 not-found, 401/403 authorization, 5xx retryable, malformed-response).
 */
export function useInstalledRule(id?: string) {
  return useQuery<AutomationRuleDetail, Error>({
    queryKey: automationQueryKeys.ruleDetail(id ?? ''),
    queryFn: () => getInstalledRule(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/** Input for useInstallCannedRule. */
export interface InstallCannedRuleInput {
  /** Stable template slug, e.g. "low-stock-notify". */
  key: string
  /** Optional { name?, enabled? } overrides (name resolves a 409 duplicate). */
  body?: InstallCannedRuleBody
}

/**
 * Install a canned rule into the cabinet. POST .../:key/install.
 * - 201 → toast "Шаблон установлен", invalidate the gallery (so re-installs
 *   surface the 409 path correctly) and the cabinet's rules list.
 * - 409 → toast "Правило с таким именем уже существует" (offer a name override).
 * - 404 → toast "Шаблон не найден".
 */
export function useInstallCannedRule() {
  const queryClient = useQueryClient()

  return useMutation<AutomationRule, Error, InstallCannedRuleInput>({
    mutationFn: ({ key, body }) => installCannedRule(key, body ?? {}),
    onSuccess: data => {
      logger.debug('[useInstallCannedRule] Installed:', data.id)
      queryClient.invalidateQueries({ queryKey: automationQueryKeys.cannedRules })
      queryClient.invalidateQueries({ queryKey: automationQueryKeys.rules })
      toast.success('Шаблон установлен')
    },
    onError: error => {
      logger.error('[useInstallCannedRule] Install failed:', error)
      // Status-based messages (backend returns English text — don't surface it).
      const status = error instanceof ApiError ? error.status : 0
      if (status === 409) {
        toast.error('Правило с таким именем уже существует')
      } else if (status === 404) {
        toast.error('Шаблон не найден')
      } else {
        toast.error(error.message || 'Не удалось установить шаблон')
      }
    },
  })
}

/** Input for useUpdateInstalledRule. The id is the path param; patch is the body. */
export interface UpdateInstalledRuleInput {
  id: string
  patch: UpdateAutomationRuleInput
}

/**
 * Update an installed rule (PATCH /v1/automation/rules/:id). Story 163.3-FE.
 * On success: write the updated detail into the ruleDetail cache + invalidate
 * the rules list (so the installed-rules page re-fetches), then toast RU.
 * On error: status-based RU toasts (never claims the rule was updated). The
 * editor preserves the operator's unsaved input on error (mutation leaves the
 * form state intact — only the cache is untouched).
 */
export function useUpdateInstalledRule() {
  const queryClient = useQueryClient()

  return useMutation<AutomationRuleDetail, Error, UpdateInstalledRuleInput>({
    mutationFn: ({ id, patch }) => updateInstalledRule(id, patch),
    onSuccess: data => {
      logger.debug('[useUpdateInstalledRule] Updated:', data.id)
      queryClient.setQueryData(automationQueryKeys.ruleDetail(data.id), data)
      queryClient.invalidateQueries({ queryKey: automationQueryKeys.rules })
      toast.success('Правило обновлено')
    },
    onError: error => {
      logger.error('[useUpdateInstalledRule] Update failed:', error)
      const status = error instanceof ApiError ? error.status : 0
      if (status === 400) {
        toast.error('Некорректные данные. Проверьте значения полей.')
      } else if (status === 403) {
        toast.error('Недостаточно прав для изменения правила.')
      } else if (status === 404) {
        toast.error('Правило не найдено.')
      } else if (status === 409) {
        toast.error('Конфликт: правило было изменено другим сеансом.')
      } else {
        toast.error(error.message || 'Не удалось обновить правило')
      }
    },
  })
}
