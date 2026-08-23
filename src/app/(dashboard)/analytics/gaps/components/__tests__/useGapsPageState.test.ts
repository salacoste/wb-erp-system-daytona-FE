import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RootCause, RemediationAction } from '@/types/financial-gaps'
import type { GapAnalysisResponse } from '@/types/financial-gaps'

const { analyzeGap, remediateGap } = vi.hoisted(() => ({
  analyzeGap: vi.fn(),
  remediateGap: vi.fn(),
}))

vi.mock('@/hooks/useFinancialGaps', () => ({
  useFinancialGaps: () => ({ data: undefined, isLoading: false, isError: false }),
  useAnalyzeGap: () => ({ isPending: false, variables: null, mutateAsync: analyzeGap }),
  useRemediateGap: () => ({ isPending: false, mutateAsync: remediateGap }),
}))

import { useGapsPageState } from '../useGapsPageState'

const analysis: GapAnalysisResponse = {
  missing_date: '2026-05-10',
  root_cause: RootCause.IMPORT_FAILURE,
  remediation: RemediationAction.RE_IMPORT,
  evidence: {
    imports: [],
    task_schedule: null,
    queue_errors: [],
    wb_api_status: 'ok',
  },
}

describe('useGapsPageState dialog lifecycle', () => {
  beforeEach(() => {
    analyzeGap.mockReset().mockResolvedValue(analysis)
    remediateGap.mockReset().mockResolvedValue(undefined)
  })

  it('keeps analysis mounted while successful remediation closes the dialog', async () => {
    const { result } = renderHook(() => useGapsPageState())

    await act(async () => {
      await result.current.handleAnalyze(analysis.missing_date)
    })
    expect(result.current.analysisDialogOpen).toBe(true)
    expect(result.current.analysisResult).toEqual(analysis)

    await act(async () => {
      await result.current.handleRemediate(analysis.missing_date, analysis.root_cause)
    })

    expect(result.current.analysisDialogOpen).toBe(false)
    expect(result.current.analysisResult).toEqual(analysis)
  })
})
