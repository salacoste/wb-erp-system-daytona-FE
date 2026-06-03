/** Pure helpers for HealthReportSheet — extracted for unit testing + to pin a field footgun. */

interface TaskCountsSummary {
  tasksExecuted: number
}

/**
 * Real successful-task count for a health report.
 *
 * FOOTGUN: the backend sets `summary.tasksExecuted = taskExecution.success.length`
 * (`src/monitoring/services/health-report.service.ts:129`) — it is ALREADY the count of tasks
 * that completed SUCCESSFULLY. `tasksFailed` / `tasksPending` are separate mutually-exclusive
 * buckets (total expected = executed + failed + pending; the Telegram report labels this field
 * "✅ Completed:"). So the success count IS `tasksExecuted` — do NOT subtract failed/pending.
 * The previous `tasksExecuted − tasksFailed` undercounted (live 2026-06-01: showed 3 when 5 tasks
 * succeeded); naively subtracting pending too would show 0. This passthrough exists to document
 * that and lock the regression test.
 */
export function healthReportSuccessCount(summary: TaskCountsSummary): number {
  return summary.tasksExecuted
}
