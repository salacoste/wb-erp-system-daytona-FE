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
  installCannedRule,
  automationQueryKeys,
} from '@/lib/api/automation'
import type { CannedRuleTemplate, AutomationRule, InstallCannedRuleBody } from '@/types/automation'
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
