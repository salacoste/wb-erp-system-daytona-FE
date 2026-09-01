import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  artifactLifecycle,
  collectGitContext,
  collectRepository,
  parseMaster,
  parsePlanSource,
  run,
  validateModel,
} from '../check-shadcn-migration-parity.mjs'

const canonical = collectRepository()
const scriptPath = fileURLToPath(new URL('../check-shadcn-migration-parity.mjs', import.meta.url))
const frontendRoot = '/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend'

function cloneCorpus() {
  return structuredClone(canonical)
}

function errors(model, code, identity) {
  return validateModel(model).filter(
    error => error.code === code && (identity === undefined || error.identity === identity)
  )
}

function assertError(model, code, identity) {
  assert.deepEqual(errors(model, code, identity), [{ code, identity }])
}

function planSource(plan, prerequisiteLines, ownedSurface = plan.ownedSurfaceDeclaration) {
  return `---
storyId: '${plan.storyId}'
storyTitle: '${plan.storyTitle.replaceAll("'", "''")}'
epic: '${plan.epic}'
status: ${plan.status}
masterPlan: ${plan.masterPlan}
bmadArtifact: ${plan.bmadArtifact}
branch: ${plan.branch}
temporaryWorktree: ${plan.temporaryWorktree}
repository: ${plan.repository ?? frontendRoot}
productionScope: ${plan.productionScope}
---
## Authority and Scope
- **Owned Surface:** ${ownedSurface}
## Prerequisite DAG
${prerequisiteLines.map(line => `- ${line}`).join('\n')}
## Steps
`
}

test('accepts the clean repository corpus with zero parity errors', () => {
  assert.deepEqual(validateModel(canonical), [])
})

test('reports missing, orphaned, and duplicate Story/plan identities', () => {
  const missingStory = cloneCorpus()
  const [story] = missingStory.stories.splice(0, 1)
  const plan = missingStory.plans.find(item => item.storyId === story.id)
  assertError(missingStory, 'orphan-plan', `${story.id}:${plan.file}`)
  assertError(missingStory, 'story-count', '93')

  const missingPlan = cloneCorpus()
  const [removedPlan] = missingPlan.plans.splice(0, 1)
  assertError(missingPlan, 'story-plan-missing', removedPlan.storyId)
  assertError(missingPlan, 'plan-count', '93')

  const duplicate = cloneCorpus()
  duplicate.stories.push(structuredClone(duplicate.stories[0]))
  duplicate.plans.push(structuredClone(duplicate.plans[0]))
  assertError(duplicate, 'duplicate-story', duplicate.stories[0].id)
  assertError(duplicate, 'duplicate-plan', duplicate.plans[0].storyId)
})

test('reports title, master path, branch, and Story-index drift', () => {
  const model = cloneCorpus()
  const plan = model.plans[0]
  const index = model.master.index.find(row => row.storyId === plan.storyId)
  plan.storyTitle += ' changed'
  index.file = '.omx/plans/wrong.md'
  index.branch = 'cdx/wrong'
  assert.equal(errors(model, 'title-mismatch').length, 1)
  assertError(model, 'master-plan-path-mismatch', plan.storyId)
  assertError(model, 'master-branch-mismatch', plan.storyId)
})

test('reports canonical ownership and dependency fingerprint mutations', () => {
  const owned = cloneCorpus()
  owned.stories[0].ownedSurface += ' changed'
  assertError(owned, 'owned-surface-fingerprint-mismatch', owned.stories[0].id)

  const shared = cloneCorpus()
  shared.stories[0].sharedDependencies += ' changed'
  assertError(shared, 'shared-dependencies-fingerprint-mismatch', shared.stories[0].id)
})

test('raw master table and fingerprint mutations fail closed', () => {
  const source = fs.readFileSync(
    path.join(canonical.root, '.omx/plans/shadcn-full-ui-migration-master.md'),
    'utf8'
  )

  const lifecycle = cloneCorpus()
  lifecycle.master = parseMaster(
    source.replace('cdx/epic-169-story-14-final-handoff', 'cdx/noncanonical-169-story-14-handoff')
  )
  for (const row of lifecycle.master.index)
    row.prerequisites = canonical.master.index.find(
      item => item.storyId === row.storyId
    ).prerequisites
  assertError(lifecycle, 'backend-lifecycle-record-invalid', '169.14:frontendHandoffBranch')

  const fingerprint = cloneCorpus()
  const original = canonical.master.fingerprints[0].ownedSurfaceSha256
  const mutated = `${original[0] === '0' ? '1' : '0'}${original.slice(1)}`
  fingerprint.master = parseMaster(source.replace(original, mutated))
  for (const row of fingerprint.master.index)
    row.prerequisites = canonical.master.index.find(
      item => item.storyId === row.storyId
    ).prerequisites
  assertError(
    fingerprint,
    'owned-surface-fingerprint-mismatch',
    canonical.master.fingerprints[0].storyId
  )
})

test('reports an explicit per-plan ownership declaration mismatch', () => {
  const model = cloneCorpus()
  const plan = model.plans.find(item => item.ownedSurfaceDeclaration && item.storyId !== '167.5')
  plan.ownedSurfaceDeclaration += ' changed'
  assertError(model, 'plan-owned-surface-mismatch', plan.storyId)

  const legacy = cloneCorpus()
  legacy.plans.find(item => item.storyId === '167.5').ownedSurfaceDeclaration += ' changed'
  assertError(legacy, 'plan-owned-surface-mismatch', '167.5')
})

test('reports missing and extra master prerequisite identities', () => {
  const missing = cloneCorpus()
  const row = missing.master.index.find(item => item.prerequisites.length > 0)
  const dependency = row.prerequisites.shift()
  assertError(missing, 'master-prerequisite-missing', `${row.storyId}:${dependency}`)

  const extra = cloneCorpus()
  const target = extra.master.index.find(item => item.storyId === '174.5')
  target.prerequisites.push('172.1')
  assertError(extra, 'master-prerequisite-extra', '174.5:172.1')
})

test('reports missing and extra explicit plan prerequisite identities', () => {
  const missing = cloneCorpus()
  const plan = missing.plans.find(item => item.prerequisites.length > 0)
  const dependency = plan.prerequisites.shift()
  assertError(missing, 'plan-prerequisite-missing', `${plan.storyId}:${dependency}`)

  const extra = cloneCorpus()
  const target = extra.plans.find(item => item.storyId === '174.5')
  target.prerequisites.push('172.1')
  assertError(extra, 'plan-prerequisite-extra', '174.5:172.1')

  const forbiddenLegacyBypass = cloneCorpus()
  forbiddenLegacyBypass.plans.find(item => item.storyId === '174.5').prerequisites.push('166.8')
  assertError(forbiddenLegacyBypass, 'plan-prerequisite-extra', '174.5:166.8')
})

test('reports duplicate plan branch and worktree identities', () => {
  const model = cloneCorpus()
  model.plans[1].branch = model.plans[0].branch
  model.plans[1].temporaryWorktree = model.plans[0].temporaryWorktree
  assertError(model, 'duplicate-branch', model.plans[0].branch)
  assertError(model, 'duplicate-worktree', model.plans[0].temporaryWorktree)
})

test('parser retains explicit self edges and ignores incidental Story prose', () => {
  const source = `---
storyId: '174.1'
storyTitle: 'Fixture'
epic: '174-FE'
status: in-progress
masterPlan: .omx/plans/shadcn-full-ui-migration-master.md
bmadArtifact: _bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md
branch: cdx/fixture
temporaryWorktree: /private/tmp/fixture
productionScope: forbidden
---
Story 173.13 appears in narrative only.
## Prerequisite DAG
- Story 174.1 is merged into main.
- Story 173.12 is merged into main.
- Story 999.9 is merged into main.
## Steps
- Mention Story 172.1 without declaring it.
`
  const plan = parsePlanSource(source, '.omx/plans/174.1-fixture.md', {
    storyIds: ['172.1', '173.12', '173.13', '174.1'],
  })
  assert.deepEqual(plan.prerequisites, ['173.12', '174.1', '999.9'])
})

test('parser expands explicit Epic ranges and Story ranges', () => {
  const source = `---
storyId: '174.1'
---
## Prerequisite DAG
- Verify the merge SHA for All Stories in Epics 172-FE through 173-FE.
- Story 171.1–171.2 is merged.
## Next
`
  const plan = parsePlanSource(source, '.omx/plans/174.1-fixture.md', {
    storyIds: ['171.1', '171.2', '172.1', '172.2', '173.1', '174.1'],
  })
  assert.deepEqual(plan.prerequisites, ['171.1', '171.2', '172.1', '172.2', '173.1'])
})

test('parser-originated fixtures expose missing, extra, future, cycle, and ownership drift', () => {
  const model = cloneCorpus()
  const original = model.plans.find(item => item.storyId === '174.4')
  const replacement = parsePlanSource(
    planSource(original, ['Story 174.5 is merged into main.'], 'wrong owned surface'),
    original.file,
    { storyIds: model.stories.map(story => story.id) }
  )
  model.plans[model.plans.indexOf(original)] = replacement
  assertError(model, 'plan-prerequisite-missing', '174.4:174.3')
  assertError(model, 'plan-prerequisite-extra', '174.4:174.5')
  assertError(model, 'future-prerequisite', '174.4:174.5')
  assertError(model, 'plan-owned-surface-mismatch', '174.4')

  const cycle = cloneCorpus()
  const first = cycle.plans.find(item => item.storyId === '174.4')
  const second = cycle.plans.find(item => item.storyId === '174.5')
  cycle.plans[cycle.plans.indexOf(first)] = parsePlanSource(
    planSource(first, ['Story 174.5 is merged into main.']),
    first.file,
    { storyIds: cycle.stories.map(story => story.id) }
  )
  cycle.plans[cycle.plans.indexOf(second)] = parsePlanSource(
    planSource(second, ['Story 174.4 is merged into main.']),
    second.file,
    { storyIds: cycle.stories.map(story => story.id) }
  )
  assert.equal(errors(cycle, 'prerequisite-cycle').length, 1)

  const unresolved = cloneCorpus()
  const unresolvedPlan = unresolved.plans.find(item => item.storyId === '174.5')
  unresolved.plans[unresolved.plans.indexOf(unresolvedPlan)] = parsePlanSource(
    planSource(unresolvedPlan, ['Story 999.9 is merged into main.']),
    unresolvedPlan.file,
    { storyIds: unresolved.stories.map(story => story.id) }
  )
  assertError(unresolved, 'unresolved-prerequisite', '174.5:999.9')
})

test('reports filesystem-derived self, future, unresolved, and cyclic edges', () => {
  const model = cloneCorpus()
  const plan = model.plans.find(item => item.storyId === '174.1')
  plan.prerequisites.push('174.1', '174.2', '999.9')
  assertError(model, 'self-prerequisite', '174.1:174.1')
  assertError(model, 'future-prerequisite', '174.1:174.2')
  assertError(model, 'unresolved-prerequisite', '174.1:999.9')

  const cycle = cloneCorpus()
  cycle.plans.find(item => item.storyId === '174.1').prerequisites.push('174.2')
  assertError(cycle, 'prerequisite-cycle', '174.2:174.1')
})

test('detects duplicate frontmatter keys from raw parser entries', () => {
  const parsed = parsePlanSource(
    `---
storyId: '174.1'
storyId: '174.2'
---
## Prerequisite DAG
`,
    '.omx/plans/174.1-fixture.md',
    { storyIds: ['174.1', '174.2'] }
  )
  assert.deepEqual(parsed.duplicateFrontmatterKeys, ['storyId'])

  const model = cloneCorpus()
  model.plans[0].duplicateFrontmatterKeys.push('storyId')
  assertError(model, 'duplicate-frontmatter-key', `${model.plans[0].file}:storyId`)
})

test('reports filename/frontmatter identity and exact plan field drift', () => {
  const cases = [
    ['fileStoryId', '999.1', 'plan-filename-id-mismatch'],
    ['epic', '999-FE', 'plan-epic-mismatch'],
    ['masterPlan', 'wrong.md', 'plan-master-mismatch'],
    ['bmadArtifact', 'wrong.md', 'plan-bmad-artifact-mismatch'],
    ['productionScope', 'allowed', 'plan-production-scope-invalid'],
    ['status', 'nonsense', 'plan-status-invalid'],
  ]
  for (const [field, value, code] of cases) {
    const model = cloneCorpus()
    model.plans[0][field] = value
    assert.equal(errors(model, code).length, 1, `${field} must fail closed`)
  }
})

test('reports missing required frontmatter fields', () => {
  const model = cloneCorpus()
  delete model.plans[0].branch
  assertError(model, 'plan-field-missing', `${model.plans[0].file}:branch`)
})

test('binds frontend plans to the raw master repository assignment', () => {
  const source = fs.readFileSync(
    path.join(canonical.root, '.omx/plans/shadcn-full-ui-migration-master.md'),
    'utf8'
  )
  for (const [replacement, identity] of [
    ['', '<missing>'],
    ['Canonical frontend repository: `/wrong/frontend`', '/wrong/frontend'],
  ]) {
    const model = cloneCorpus()
    model.master = parseMaster(
      source.replace(`Canonical frontend repository: \`${frontendRoot}\``, replacement)
    )
    for (const row of model.master.index)
      row.prerequisites = canonical.master.index.find(
        item => item.storyId === row.storyId
      ).prerequisites
    assertError(model, 'frontend-repository-contract-invalid', identity)
  }

  const explicitWrong = cloneCorpus()
  explicitWrong.plans.find(item => item.storyId === '174.1').repository = '/wrong/frontend'
  assertError(explicitWrong, 'plan-repository-mismatch', '174.1:/wrong/frontend')

  const backendMissing = cloneCorpus()
  delete backendMissing.plans.find(item => item.storyId === '167.8').repository
  assertError(backendMissing, 'backend-exception-invalid', '167.8:repository')
})

test('raw plans require every canonical section exactly once', () => {
  const original = canonical.plans.find(item => item.storyId === '174.1')
  const source = fs.readFileSync(path.join(canonical.root, original.file), 'utf8')
  const context = {
    storyIds: canonical.stories.map(story => story.id),
    routeStoryIds: [...new Set(canonical.ledger.map(row => row.storyId))],
  }
  const heading = 'Commit, Push, PR, and Merge'

  const missing = cloneCorpus()
  missing.plans[missing.plans.findIndex(item => item.storyId === '174.1')] = parsePlanSource(
    source.replace(`## ${heading}\n`, ''),
    original.file,
    context
  )
  assertError(missing, 'plan-section-missing', `${original.file}:${heading}`)

  const duplicate = cloneCorpus()
  duplicate.plans[duplicate.plans.findIndex(item => item.storyId === '174.1')] = parsePlanSource(
    `${source}\n## ${heading}\n`,
    original.file,
    context
  )
  assertError(duplicate, 'plan-section-duplicate', `${original.file}:${heading}`)
})

test('binds sprint keys to canonical artifact identity and rejects a wrong slug', () => {
  const model = cloneCorpus()
  const row = model.statusRows[0]
  row.slug = 'wrong-unrelated-slug'
  assert.equal(errors(model, 'status-slug-mismatch').length, 1)

  const routeQualified = cloneCorpus()
  const qualifiedRow = routeQualified.statusRows.find(item => item.storyId === '168.1')
  qualifiedRow.slug = 'migrate-analytics-hub-arbitrary-suffix'
  assertError(
    routeQualified,
    'status-slug-mismatch',
    '168.1:migrate-analytics-hub-arbitrary-suffix:migrate-analytics-hub-analytics-and-own-analytics-shared-ui'
  )
})

test('reports duplicate, invalid, orphaned, and missing sprint records', () => {
  const model = cloneCorpus()
  const duplicate = structuredClone(model.statusRows[0])
  duplicate.status = 'impossible'
  model.statusRows.push(duplicate, { storyId: '999.1', slug: 'orphan', status: 'backlog' })
  assertError(model, 'duplicate-status', duplicate.storyId)
  assertError(model, 'status-invalid', `${duplicate.storyId}:impossible`)
  assertError(model, 'orphan-status', '999.1')
})

test('reports backend master/plan repository, branch, worktree, and route drift', () => {
  const model = cloneCorpus()
  const plan = model.plans.find(item => item.storyId === '169.14')
  plan.repository = process.cwd()
  plan.branch = 'cdx/wrong'
  plan.temporaryWorktree = '/private/tmp/wrong'
  model.ledger.push({ ...structuredClone(model.ledger[0]), storyId: plan.storyId })
  assertError(model, 'backend-exception-invalid', '169.14:repository')
  assertError(model, 'backend-exception-invalid', '169.14:branch')
  assertError(model, 'backend-exception-invalid', '169.14:worktree')
  assertError(model, 'backend-exception-has-route', '169.14')
})

test('reports backend merge, ancestry, cleanup, and artifact evidence failures', () => {
  const wrongMerge = cloneCorpus()
  wrongMerge.master.backend.find(item => item.storyId === '167.8').backendMergeSha = '0'.repeat(40)
  assertError(wrongMerge, 'backend-lifecycle-record-invalid', '167.8:backendMergeSha')

  for (const [collection, field, identity] of [
    ['artifactLifecycle', 'backendMergeRecorded', 'merge'],
    ['artifactLifecycle', 'cleanupRecorded', 'cleanup'],
    ['git', 'backendCommitExists', 'commit'],
    ['git', 'backendMergeOnMain', 'ancestry'],
    ['git', 'backendLocalBranchAbsent', 'localBranchAbsence'],
    ['git', 'backendCachedRemoteTrackingBranchAbsent', 'cachedRemoteTrackingBranchAbsence'],
    ['git', 'backendPlannedWorktreeAbsent', 'plannedWorktreeAbsence'],
    ['git', 'backendDeliveredCleanupWorktreeAbsent', 'deliveredCleanupWorktreeAbsence'],
  ]) {
    const model = cloneCorpus()
    const target =
      collection === 'artifactLifecycle'
        ? model.artifactLifecycle.find(item => item.storyId === '167.8')
        : model.gitContext.lifecycle.find(item => item.storyId === '167.8')
    target[field] = false
    assertError(model, 'backend-lifecycle-invalid', `167.8:${identity}`)
  }

  const inventedLiveProof = cloneCorpus()
  inventedLiveProof.gitContext.lifecycle.find(
    item => item.storyId === '167.8'
  ).backendLiveRemoteBranchProof = 'absent'
  assertError(inventedLiveProof, 'backend-lifecycle-invalid', '167.8:liveRemoteProofBoundary')
})

test('artifact parser requires the exact recorded backend merge identity', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-1-artifact-'))
  const record = canonical.master.backend.find(item => item.storyId === '167.8')
  const artifactPath = path.join(directory, record.artifact)
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
  const source = `Status: done
merge SHA \`c96a2fae8\`
${record.branch}
${record.worktree}
${record.deliveredCleanupWorktree}
local/remote branch \`cdx/epic-167-story-8-cabinet-reconciliation-contract\` deleted; worktree
\`.claude/worktrees/epic167-8-reconciliation\` removed.
`
  try {
    fs.writeFileSync(artifactPath, source)
    assert.equal(artifactLifecycle(directory, record).backendMergeRecorded, true)
    assert.equal(artifactLifecycle(directory, record).backendBranchCleanupRecorded, true)
    fs.writeFileSync(artifactPath, source.replace('c96a2fae8', 'c96a2fa'))
    assert.equal(artifactLifecycle(directory, record).backendMergeRecorded, false)
    fs.writeFileSync(
      artifactPath,
      source.replaceAll('.claude/worktrees/epic167-8-reconciliation', '.claude/worktrees/wrong')
    )
    assert.equal(artifactLifecycle(directory, record).cleanupRecorded, false)
    fs.writeFileSync(artifactPath, source.replace('local/remote branch', 'local branch'))
    assert.equal(artifactLifecycle(directory, record).backendBranchCleanupRecorded, false)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('artifact parser binds exact 169.14 backend and handoff branch cleanup evidence', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-1-handoff-artifact-'))
  const record = canonical.master.backend.find(item => item.storyId === '169.14')
  const artifactPath = path.join(directory, record.artifact)
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
  const backendCleanup =
    'Remote Story branch absence, local Story branch absence, compare-and-delete exact-SHA protection, and backend Story worktree removal/prune: **PASS**.'
  const handoffCleanup =
    'Frontend final-handoff remote branch, local branch, worktree, and precommit review-bootstrap absence after canonical cleanup: **PASS**.'
  const source = `Status: done
STORY_169_14_MERGE_SHA=8fbfc80e0cc756d9f1767c533513004e459192a2
${record.branch}
${record.worktree}
removed the exact backend branch/worktree
PR: [#${record.frontendHandoffPr}]
${record.frontendHandoffBranch}
${record.frontendHandoffWorktree}
${record.frontendHandoffCommit}
${record.frontendHandoffMergeSha}
${backendCleanup}
${handoffCleanup}
record-retirement completed: **PASS**
`
  try {
    fs.writeFileSync(artifactPath, source)
    assert.equal(artifactLifecycle(directory, record).backendBranchCleanupRecorded, true)
    assert.equal(artifactLifecycle(directory, record).frontendHandoffCleanupRecorded, true)
    fs.writeFileSync(artifactPath, source.replace(backendCleanup, ''))
    assert.equal(artifactLifecycle(directory, record).backendBranchCleanupRecorded, false)
    fs.writeFileSync(artifactPath, source.replace(handoffCleanup, ''))
    assert.equal(artifactLifecycle(directory, record).frontendHandoffCleanupRecorded, false)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('guarded Git facts fail closed on ancestry, branch, and worktree residue', () => {
  const record = canonical.master.backend.find(item => item.storyId === '167.8')
  const fakeGit = (_repository, args) => {
    if (args[0] === 'merge-base' && args[1] === 'HEAD')
      return { status: 0, stdout: 'a'.repeat(40), stderr: '' }
    if (args[0] === 'config')
      return {
        status: 0,
        stdout: 'https://github.com/salacoste/wb-erp-system-daytona.git',
        stderr: '',
      }
    if (args[0] === 'cat-file') return { status: 0, stdout: '', stderr: '' }
    if (args[0] === 'merge-base') return { status: 1, stdout: '', stderr: '' }
    if (args[0] === 'show-ref' && args[3] === `refs/heads/${record.branch}`)
      return { status: 0, stdout: '', stderr: '' }
    if (args[0] === 'show-ref') return { status: 128, stdout: '', stderr: 'query failed' }
    if (args[0] === 'worktree')
      return { status: 0, stdout: `worktree ${record.worktree}`, stderr: '' }
    return { status: 128, stdout: '', stderr: 'unexpected fixture command' }
  }
  const context = collectGitContext('/frontend', [record], fakeGit)
  const facts = context.lifecycle[0]
  assert.equal(facts.backendCommitExists, true)
  assert.equal(facts.backendMergeOnMain, false)
  assert.equal(facts.backendLocalBranchAbsent, false)
  assert.equal(facts.backendCachedRemoteTrackingBranchAbsent, false)
  assert.equal(facts.backendPlannedWorktreeAbsent, false)
  assert.equal(facts.backendDeliveredCleanupWorktreeAbsent, true)
  assert.equal(facts.backendLiveRemoteBranchProof, 'unavailable')
  assert.equal(facts.gitQueriesComplete, false)
})

test('guarded Git facts detect the delivered 167.8 worktree residue', () => {
  const record = canonical.master.backend.find(item => item.storyId === '167.8')
  const delivered = path.resolve(record.repository, record.deliveredCleanupWorktree)
  const fakeGit = (_repository, args) => {
    if (args[0] === 'merge-base' && args[1] === 'HEAD')
      return { status: 0, stdout: '0d6225acb9abfafa872d2d2ee45f215594edc4e6', stderr: '' }
    if (args[0] === 'config')
      return {
        status: 0,
        stdout: 'https://github.com/salacoste/wb-erp-system-daytona.git',
        stderr: '',
      }
    if (args[0] === 'cat-file' || args[0] === 'merge-base')
      return { status: 0, stdout: '', stderr: '' }
    if (args[0] === 'show-ref') return { status: 1, stdout: '', stderr: '' }
    if (args[0] === 'worktree') return { status: 0, stdout: `worktree ${delivered}`, stderr: '' }
    return { status: 128, stdout: '', stderr: 'unexpected fixture command' }
  }
  const facts = collectGitContext('/frontend', [record], fakeGit).lifecycle[0]
  assert.equal(facts.backendPlannedWorktreeAbsent, true)
  assert.equal(facts.backendDeliveredCleanupWorktreeAbsent, false)
})

test('reports missing 169.14 frontend handoff and retirement evidence', () => {
  for (const [field, identity] of [
    ['frontendHandoffRecorded', 'handoff'],
    ['retirementRecorded', 'retirement'],
  ]) {
    const model = cloneCorpus()
    model.artifactLifecycle.find(item => item.storyId === '169.14')[field] = false
    assertError(model, 'backend-lifecycle-invalid', `169.14:${identity}`)
  }
  const ancestry = cloneCorpus()
  ancestry.gitContext.lifecycle.find(item => item.storyId === '169.14').frontendHandoffMergeOnMain =
    false
  assertError(ancestry, 'backend-lifecycle-invalid', '169.14:handoffMainAncestry')

  const repository = cloneCorpus()
  repository.gitContext.lifecycle.find(
    item => item.storyId === '169.14'
  ).frontendRepositoryIdentity = 'foreign/repository'
  assertError(repository, 'backend-lifecycle-invalid', '169.14:handoffRepository')

  const inventedLiveProof = cloneCorpus()
  inventedLiveProof.gitContext.lifecycle.find(
    item => item.storyId === '169.14'
  ).frontendHandoffLiveRemoteBranchProof = 'absent'
  assertError(
    inventedLiveProof,
    'backend-lifecycle-invalid',
    '169.14:handoffLiveRemoteProofBoundary'
  )

  for (const [field, value] of [
    ['frontendHandoffBranch', 'cdx/fabricated-absent'],
    ['frontendHandoffWorktree', '/private/tmp/fabricated-absent'],
  ]) {
    const identity = cloneCorpus()
    identity.master.backend.find(item => item.storyId === '169.14')[field] = value
    assertError(identity, 'backend-lifecycle-record-invalid', `169.14:${field}`)
  }
})

test('Git base discovery fails closed on command failure, malformed SHA, and wrong valid SHA', () => {
  const record = canonical.master.backend[0]
  const failingGit = () => ({ status: 128, stdout: '', stderr: 'fixture failure' })
  const failed = collectGitContext('/fixture', [record], failingGit)
  assert.deepEqual(failed.failures, [{ code: 'base-sha-invalid', identity: '/fixture' }])

  const malformedGit = (_repository, args) => ({
    status: args[0] === 'show-ref' ? 1 : 0,
    stdout: args[0] === 'merge-base' && args[1] === 'HEAD' ? 'not-a-sha' : '',
    stderr: '',
  })
  const malformed = collectGitContext('/fixture', [record], malformedGit)
  assert.deepEqual(malformed.failures, [{ code: 'base-sha-invalid', identity: '/fixture' }])

  const wrongSha = 'a'.repeat(40)
  const wrongGit = (_repository, args) => ({
    status: args[0] === 'show-ref' ? 1 : 0,
    stdout: args[0] === 'merge-base' && args[1] === 'HEAD' ? wrongSha : '',
    stderr: '',
  })
  const wrong = collectGitContext('/fixture', [record], wrongGit)
  assert.deepEqual(wrong.failures, [
    {
      code: 'base-sha-mismatch',
      identity: `${wrongSha}:0d6225acb9abfafa872d2d2ee45f215594edc4e6`,
    },
  ])

  const model = cloneCorpus()
  model.gitContext.baseSha = wrongSha
  assertError(model, 'base-sha-mismatch', `${wrongSha}:0d6225acb9abfafa872d2d2ee45f215594edc4e6`)
})

test('run propagates deterministic self-test failure without validating corpus', () => {
  const lines = []
  const result = run(process.cwd(), {
    model: canonical,
    spawn: () => ({ status: 1 }),
    testStdio: 'pipe',
    write: line => lines.push(line),
  })
  assert.deepEqual(result, { status: 1, reason: 'self-test-failed' })
  assert.deepEqual(lines, [])
})

test('defective CLI fixture exits 1 and emits the exact defect identity', () => {
  const fixture = cloneCorpus()
  const plan = fixture.plans.find(item => item.storyId === '174.5')
  plan.status = 'nonsense'
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'story-174-1-cli-'))
  const fixturePath = path.join(directory, 'fixture.json')
  try {
    fs.writeFileSync(fixturePath, JSON.stringify(fixture))
    const result = spawnSync(process.execPath, [scriptPath, '--fixture', fixturePath], {
      cwd: canonical.root,
      encoding: 'utf8',
      env: { ...process.env, STORY_174_1_SKIP_SELF_TESTS: '1' },
    })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /"code": "plan-status-invalid"/)
    assert.match(result.stdout, new RegExp(plan.file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

test('reports source-route and ledger bijection mutations', () => {
  const model = cloneCorpus()
  const [route] = model.routes.splice(0, 1)
  assertError(model, 'route-entry-missing', route.entry)
  assertError(model, 'source-route-count', '75')

  const extra = cloneCorpus()
  extra.routes.push({ entry: 'src/app/(dashboard)/extra/page.tsx', route: '/extra' })
  assertError(extra, 'source-route-missing-ledger', 'src/app/(dashboard)/extra/page.tsx')

  const mismatch = cloneCorpus()
  mismatch.ledger[0].route = '/wrong-route'
  assertError(mismatch, 'route-path-mismatch', mismatch.ledger[0].entry)
})

test('reports duplicate owner/routes, path mismatch, artifact absence, and status drift', () => {
  const model = cloneCorpus()
  model.ledger[1].storyId = model.ledger[0].storyId
  model.routes[1].route = model.routes[0].route
  model.ledger[1].route = model.ledger[0].route
  model.ledger[0].artifact = null
  model.ledger[0].status = 'done'
  assertError(model, 'duplicate-route-owner', model.ledger[0].storyId)
  assert.equal(errors(model, 'duplicate-source-route').length, 1)
  assert.equal(errors(model, 'duplicate-ledger-route').length, 1)
  assertError(model, 'implementation-artifact-missing', model.ledger[0].storyId)
  assertError(model, 'ledger-status-changed', `${model.ledger[0].storyId}:done`)
})

test('reports duplicate Story evidence fields and missing evidence', () => {
  const model = cloneCorpus()
  const story = model.stories[0]
  story.evidence = story.evidence.filter(field => field !== 'Route/User Value')
  story.evidenceCounts['Owned Surface'] = 2
  assertError(model, 'evidence-field-missing', `${story.id}:Route/User Value`)
  assertError(model, 'evidence-field-duplicate', `${story.id}:Owned Surface`)
})
