import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  compareStoryOwnedFiles,
  extractTestCounts,
  REQUIRED_ARTIFACTS,
  REQUIRED_COMMANDS,
  REVIEWED_BACKEND_COMMIT,
  validateFrontendManifest,
} from './verify-frontend.mjs'

const manifest = JSON.parse(
  await readFile(path.resolve('scripts/story-128-10/frontend-command-manifest.json'), 'utf8')
)

test('frontend manifest binds the reviewed backend commit and pinned runtime', () => {
  assert.deepEqual(validateFrontendManifest(manifest), { valid: true, errors: [] })
  assert.equal(manifest.backendContractCommit, REVIEWED_BACKEND_COMMIT)
  assert.deepEqual(manifest.runtime, { node: 'v24.18.0', npm: '11.11.0' })
  assert.match(manifest.networkPolicyNote, /intentionally disables Unix sockets/)
  assert.ok(manifest.commands.includes('node --test scripts/story-128-10/verify-frontend.test.mjs'))
  assert.deepEqual(manifest.commands, REQUIRED_COMMANDS)
  assert.deepEqual(manifest.expectedArtifacts, REQUIRED_ARTIFACTS)
})

test('manifest validation rejects provisional backend commits and unsafe commands', () => {
  const provisional = structuredClone(manifest)
  provisional.backendContractCommit = '7f27ee82453c2d96782a8863d860e78799669402'
  assert.match(validateFrontendManifest(provisional).errors.join('\n'), /reviewed remediation/)

  const unsafe = structuredClone(manifest)
  unsafe.commands[0] = 'npm test && deploy'
  assert.match(validateFrontendManifest(unsafe).errors.join('\n'), /canonical frontend command set/)

  const incomplete = structuredClone(manifest)
  incomplete.commands.pop()
  incomplete.expectedArtifacts.pop()
  assert.match(
    validateFrontendManifest(incomplete).errors.join('\n'),
    /canonical frontend command set/
  )
  assert.match(
    validateFrontendManifest(incomplete).errors.join('\n'),
    /canonical frontend artifact set/
  )
})

test('Story-owned inventory rejects every omission and addition', () => {
  const omitted = REQUIRED_ARTIFACTS.slice(1)
  assert.deepEqual(compareStoryOwnedFiles(omitted), {
    valid: false,
    missing: [REQUIRED_ARTIFACTS[0]],
    unexpected: [],
  })

  const added = [...REQUIRED_ARTIFACTS, 'src/unrelated-story-change.ts']
  assert.deepEqual(compareStoryOwnedFiles(added), {
    valid: false,
    missing: [],
    unexpected: ['src/unrelated-story-change.ts'],
  })

  assert.deepEqual(compareStoryOwnedFiles([...REQUIRED_ARTIFACTS]), {
    valid: true,
    missing: [],
    unexpected: [],
  })
})

test('extracts Vitest, Node test, and Playwright counts for the receipt', () => {
  assert.deepEqual(extractTestCounts('Tests  20 passed (20)'), {
    failed: 0,
    passed: 20,
    skipped: 0,
    total: 20,
  })
  assert.deepEqual(extractTestCounts('ℹ tests 20\nℹ pass 20\nℹ fail 0'), {
    total: 20,
    passed: 20,
    failed: 0,
  })
  assert.deepEqual(extractTestCounts('  2 passed (1.1s)'), {
    failed: 0,
    passed: 2,
    total: 2,
  })
})
