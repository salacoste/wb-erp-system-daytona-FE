export type Story1743EvidenceRunner = 'vitest' | 'playwright'

export type Story1743RequiredExecution = {
  source: string
  sourceSha256: string
  scenarioId: string
  runner: Story1743EvidenceRunner
}

export type Story1743ExecutionManifestEntry = Story1743RequiredExecution & {
  command: string
  result: 'passed' | 'failed' | 'skipped'
  exitCode: number
  startedAt: string
  durationMs: number
}

export type Story1743ExecutionManifest = {
  schemaVersion: 1
  generatedAt: string
  runtime: {
    node: string
    npm: string
  }
  entries: Story1743ExecutionManifestEntry[]
}

const executionKey = (source: string, scenarioId: string): string =>
  JSON.stringify([source, scenarioId])

const label = (execution: Pick<Story1743RequiredExecution, 'source' | 'scenarioId'>): string =>
  execution.source + ' :: ' + execution.scenarioId

export function indexStory1743ExecutionManifest(
  manifest: Story1743ExecutionManifest,
  requiredExecutions: readonly Story1743RequiredExecution[]
): ReadonlyMap<string, Story1743ExecutionManifestEntry> {
  if (manifest.schemaVersion !== 1) {
    throw new Error(
      'Story 174.3 execution manifest has unsupported schema version: ' + manifest.schemaVersion
    )
  }
  if (!manifest.generatedAt || !manifest.runtime.node || !manifest.runtime.npm) {
    throw new Error('Story 174.3 execution manifest is missing runner metadata')
  }

  const entries = new Map<string, Story1743ExecutionManifestEntry>()
  for (const entry of manifest.entries) {
    const key = executionKey(entry.source, entry.scenarioId)
    if (entries.has(key)) {
      throw new Error('Story 174.3 duplicate execution result: ' + label(entry))
    }
    entries.set(key, entry)
  }

  for (const required of requiredExecutions) {
    const key = executionKey(required.source, required.scenarioId)
    const entry = entries.get(key)
    if (!entry) {
      throw new Error('Story 174.3 missing execution result: ' + label(required))
    }
    if (entry.sourceSha256 !== required.sourceSha256) {
      throw new Error('Story 174.3 stale source hash: ' + label(required))
    }
    if (entry.runner !== required.runner) {
      throw new Error('Story 174.3 runner mismatch: ' + label(required))
    }
    if (entry.result !== 'passed' || entry.exitCode !== 0) {
      throw new Error(
        'Story 174.3 execution did not pass: ' +
          label(required) +
          ' (result=' +
          entry.result +
          ', exitCode=' +
          entry.exitCode +
          ')'
      )
    }
    if (!entry.command || !entry.startedAt || entry.durationMs < 0) {
      throw new Error(
        'Story 174.3 execution result has incomplete runner metadata: ' + label(required)
      )
    }
  }

  return entries
}

export function findStory1743Execution(
  entries: ReadonlyMap<string, Story1743ExecutionManifestEntry>,
  required: Story1743RequiredExecution
): Story1743ExecutionManifestEntry {
  const entry = entries.get(executionKey(required.source, required.scenarioId))
  if (!entry) {
    throw new Error('Story 174.3 missing indexed execution result: ' + label(required))
  }
  return entry
}
