import { readFileSync } from 'node:fs'

export function emptyStory1743Manifest() {
  return {
    schemaVersion: 1,
    generatedAt: new Date(0).toISOString(),
    runtime: { node: process.version, npm: 'unknown' },
    entries: [],
  }
}

function assertString(value, label, manifestPath) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid Story 174.3 manifest ${label} in ${manifestPath}`)
  }
}

function assertIsoTimestamp(value, label, manifestPath) {
  assertString(value, label, manifestPath)
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Invalid Story 174.3 manifest ${label} in ${manifestPath}`)
  }
}

export function validateStory1743Manifest(manifest, manifestPath) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`Invalid Story 174.3 manifest object in ${manifestPath}`)
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported Story 174.3 manifest schemaVersion in ${manifestPath}`)
  }
  assertIsoTimestamp(manifest.generatedAt, 'generatedAt', manifestPath)
  if (!manifest.runtime || typeof manifest.runtime !== 'object') {
    throw new Error(`Invalid Story 174.3 manifest runtime in ${manifestPath}`)
  }
  assertString(manifest.runtime.node, 'runtime.node', manifestPath)
  assertString(manifest.runtime.npm, 'runtime.npm', manifestPath)
  if (!Array.isArray(manifest.entries)) {
    throw new Error(`Invalid Story 174.3 manifest entries in ${manifestPath}`)
  }
  for (const [index, entry] of manifest.entries.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Invalid Story 174.3 manifest entry ${index} in ${manifestPath}`)
    }
    for (const field of ['source', 'sourceSha256', 'scenarioId', 'runner', 'command', 'result']) {
      assertString(entry[field], `entries[${index}].${field}`, manifestPath)
    }
    if (!/^[a-f0-9]{64}$/.test(entry.sourceSha256)) {
      throw new Error(
        `Invalid Story 174.3 manifest entries[${index}].sourceSha256 in ${manifestPath}`
      )
    }
    if (!['vitest', 'playwright'].includes(entry.runner)) {
      throw new Error(`Invalid Story 174.3 manifest entries[${index}].runner in ${manifestPath}`)
    }
    if (!['passed', 'failed', 'skipped'].includes(entry.result)) {
      throw new Error(`Invalid Story 174.3 manifest entries[${index}].result in ${manifestPath}`)
    }
    if (!Number.isInteger(entry.exitCode)) {
      throw new Error(`Invalid Story 174.3 manifest entries[${index}].exitCode in ${manifestPath}`)
    }
    assertIsoTimestamp(entry.startedAt, `entries[${index}].startedAt`, manifestPath)
    if (!Number.isFinite(entry.durationMs) || entry.durationMs < 0) {
      throw new Error(
        `Invalid Story 174.3 manifest entries[${index}].durationMs in ${manifestPath}`
      )
    }
  }
  return manifest
}

export function readStory1743Manifest(manifestPath) {
  let source
  try {
    source = readFileSync(manifestPath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyStory1743Manifest()
    throw new Error(`Unable to read Story 174.3 manifest ${manifestPath}`, { cause: error })
  }

  let manifest
  try {
    manifest = JSON.parse(source)
  } catch (error) {
    throw new Error(`Malformed Story 174.3 manifest JSON in ${manifestPath}`, { cause: error })
  }
  return validateStory1743Manifest(manifest, manifestPath)
}
