import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  readStory1743Manifest,
  validateStory1743Manifest,
} from '../../scripts/lib/story-174-3-manifest.mjs'

const roots: string[] = []
const SOURCE_SHA256 = 'a'.repeat(64)
const manifestPath = () => {
  const root = mkdtempSync(join(tmpdir(), 'story-174-3-manifest-test-'))
  roots.push(root)
  return join(root, 'execution-manifest.json')
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('Story 174.3 manifest reader', () => {
  it('permits only a genuinely missing manifest as an empty first-run state', () => {
    expect(readStory1743Manifest(manifestPath()).entries).toEqual([])
  })

  it('fails closed on malformed JSON', () => {
    const path = manifestPath()
    writeFileSync(path, '{broken')
    expect(() => readStory1743Manifest(path)).toThrow(/Malformed Story 174\.3 manifest JSON/)
  })

  it.each([
    [
      { schemaVersion: 2, generatedAt: 'now', runtime: { node: 'v24', npm: '11' }, entries: [] },
      /schemaVersion/,
    ],
    [
      {
        schemaVersion: 1,
        generatedAt: '2026-09-01T00:00:00.000Z',
        runtime: { node: 'v24', npm: '11' },
        entries: {},
      },
      /entries/,
    ],
    [
      {
        schemaVersion: 1,
        generatedAt: '2026-09-01T00:00:00.000Z',
        runtime: { node: '', npm: '11' },
        entries: [],
      },
      /runtime\.node/,
    ],
  ])('fails closed on an invalid manifest shape', (manifest, error) => {
    expect(() => validateStory1743Manifest(manifest, 'fixture.json')).toThrow(error)
  })

  it.each([
    ['sourceSha256', 'abc'],
    ['runner', 'jest'],
    ['command', ''],
    ['result', 'unknown'],
    ['exitCode', '0'],
    ['startedAt', 'not-a-time'],
    ['durationMs', -1],
  ])('fails closed on an invalid manifest entry %s', (field, value) => {
    const entry = {
      source: 'source.test.ts',
      sourceSha256: SOURCE_SHA256,
      scenarioId: 'passes',
      runner: 'vitest',
      command: 'npm test',
      result: 'passed',
      exitCode: 0,
      startedAt: '2026-09-01T00:00:00.000Z',
      durationMs: 1,
      [field]: value,
    }
    expect(() =>
      validateStory1743Manifest(
        {
          schemaVersion: 1,
          generatedAt: '2026-09-01T00:00:00.000Z',
          runtime: { node: 'v24.18.0', npm: '11.11.0' },
          entries: [entry],
        },
        'fixture.json'
      )
    ).toThrow(new RegExp(field))
  })

  it('preserves a valid existing manifest for partial-mode replacement', () => {
    const path = manifestPath()
    const manifest = {
      schemaVersion: 1,
      generatedAt: '2026-09-01T00:00:00.000Z',
      runtime: { node: 'v24.18.0', npm: '11.11.0' },
      entries: [
        {
          source: 'source.test.ts',
          sourceSha256: SOURCE_SHA256,
          scenarioId: 'passes',
          runner: 'vitest',
          command: 'npm test',
          result: 'passed',
          exitCode: 0,
          startedAt: '2026-09-01T00:00:00.000Z',
          durationMs: 1,
        },
      ],
    }
    writeFileSync(path, JSON.stringify(manifest))
    expect(readStory1743Manifest(path)).toEqual(manifest)
  })
})
