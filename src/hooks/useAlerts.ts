'use client'

/**
 * TanStack Query hooks for Alerts Dashboard
 * useAlertRules, useAlertHistory, useAlertSummary,
 * useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAlertRules,
  getAlertHistory,
  getAlertSummary,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from '@/lib/api/alerts'
import type {
  AlertHistoryParams,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '@/types/alerts'

const alertsKeys = {
  all: ['alerts'] as const,
  rules: () => [...alertsKeys.all, 'rules'] as const,
  history: (params: AlertHistoryParams) => [...alertsKeys.all, 'history', params] as const,
  summary: (days: number) => [...alertsKeys.all, 'summary', days] as const,
}

export function useAlertRules() {
  return useQuery({
    queryKey: alertsKeys.rules(),
    queryFn: getAlertRules,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useAlertHistory(params: AlertHistoryParams = {}) {
  return useQuery({
    queryKey: alertsKeys.history(params),
    queryFn: () => getAlertHistory(params),
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useAlertSummary(days = 7) {
  return useQuery({
    queryKey: alertsKeys.summary(days),
    queryFn: () => getAlertSummary(days),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useCreateAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAlertRulePayload) => createAlertRule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertsKeys.rules() }),
  })
}

export function useUpdateAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAlertRulePayload }) =>
      updateAlertRule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertsKeys.rules() }),
  })
}

export function useDeleteAlertRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAlertRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: alertsKeys.rules() }),
  })
}
