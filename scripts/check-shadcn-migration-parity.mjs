#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const EXPECTED_STORIES = 94
const EXPECTED_ROUTES = 76
const EXPECTED_BASE_SHA = '0d6225acb9abfafa872d2d2ee45f215594edc4e6'
const FRONTEND_ROOT = '/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend'
const MASTER_PLAN = '.omx/plans/shadcn-full-ui-migration-master.md'
const BMAD_ARTIFACT = '_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md'
const PLAN_FIELDS = [
  'storyId',
  'storyTitle',
  'epic',
  'status',
  'masterPlan',
  'bmadArtifact',
  'branch',
  'temporaryWorktree',
  'productionScope',
]
const PLAN_STATUSES = new Set([
  'backlog',
  'blocked-on-prerequisites',
  'executed',
  'in-progress',
  'ready-for-execution',
])
const STATUS_VALUES = new Set([
  'backlog',
  'ready-for-dev',
  'in-progress',
  'review',
  'done',
  'deferred',
])
const STATUS_SLUG_OVERRIDES = new Map([
  ['167.5', 'migrate-cabinet-onboarding-cabinet'],
  ['167.6', 'migrate-processing-processing'],
  ['167.7', 'migrate-wb-token-wb-token'],
  ['168.1', 'migrate-analytics-hub-analytics-and-own-analytics-shared-ui'],
  ['168.2', 'migrate-analytics-alerts-analytics-alerts'],
  ['168.3', 'migrate-analytical-dashboard-analytics-dashboard'],
  ['168.4', 'migrate-finance-history-analytics-finance-history'],
  ['168.5', 'migrate-orders-analytics-analytics-orders'],
  ['168.6', 'migrate-pricing-analytics-analytics-pricing'],
  ['168.7', 'migrate-product-analytics-analytics-product-nmid'],
  ['168.8', 'migrate-reorder-analytics-analytics-reorder'],
  ['168.9', 'migrate-sku-analytics-analytics-sku'],
  ['168.10', 'migrate-time-period-analytics-analytics-time-period'],
  ['168.11', 'migrate-unit-economics-analytics-unit-economics'],
])
const ALLOWED_FORWARD_EDGES = new Set([
  '167.5:167.8',
  '167.5:167.9',
  '167.6:167.8',
  '167.6:167.9',
  '167.7:167.8',
  '167.7:167.9',
  '169.12:169.14',
  '169.12:169.15',
])
// The preserved 167.5 lane predates its owner-approved correct course. Its plan inherits
// these two exact edges from the master DAG rather than rewriting the historical lane.
const INHERITED_MASTER_EDGES = new Set(['167.5:167.8', '167.5:167.9'])
const LEGACY_PLAN_PREREQUISITE_EXCEPTIONS = new Set([
  '173.11:166.1',
  '173.11:166.2',
  '173.11:166.3',
  '173.11:166.4',
  '173.11:166.5',
  '173.11:166.6',
  '173.11:166.7',
  '173.11:166.8',
  '173.11:167.1',
  '173.7:167.1',
])
const LEGACY_PLAN_OWNERSHIP = new Map([
  ['167.5', 'route, `CabinetCreationForm`, shared onboarding-guard presentation/tests.'],
])
const EXPECTED_LIFECYCLE = new Map([
  [
    '167.8',
    {
      backendMergeSha: 'c96a2fae8472f24c4c0ded9ee1239e9cffbfbe43',
      deliveredCleanupWorktree: '.claude/worktrees/epic167-8-reconciliation',
      artifactMergeNeedle: 'merge SHA `c96a2fae8`',
      artifactCleanupNeedle: '`.claude/worktrees/epic167-8-reconciliation` removed.',
      artifactBackendBranchCleanupNeedle:
        'local/remote branch `cdx/epic-167-story-8-cabinet-reconciliation-contract` deleted; worktree `.claude/worktrees/epic167-8-reconciliation` removed.',
    },
  ],
  [
    '169.14',
    {
      backendMergeSha: '8fbfc80e0cc756d9f1767c533513004e459192a2',
      artifactMergeNeedle: 'STORY_169_14_MERGE_SHA=8fbfc80e0cc756d9f1767c533513004e459192a2',
      deliveredCleanupWorktree: '/private/tmp/wb-repricer-be-169-14-paid-storage-import-contract',
      artifactCleanupNeedle: 'removed the exact backend branch/worktree',
      artifactBackendBranchCleanupNeedle:
        'Remote Story branch absence, local Story branch absence, compare-and-delete exact-SHA protection, and backend Story worktree removal/prune: **PASS**.',
      artifactFrontendHandoffCleanupNeedle:
        'Frontend final-handoff remote branch, local branch, worktree, and precommit review-bootstrap absence after canonical cleanup: **PASS**.',
      frontendHandoffPr: '292',
      frontendHandoffBranch: 'cdx/epic-169-story-14-final-handoff',
      frontendHandoffWorktree: '/private/tmp/wb-repricer-fe-169-14-final-handoff',
      frontendHandoffCommit: 'eaed12636036cda0b4529a5ba4d712d491591f8b',
      frontendHandoffMergeSha: '83f29b7ff48360ed496f3ef9ce6c56ca61173141',
    },
  ],
])
const PLAN_SECTION_PROFILES = {
  legacy: [
    'Outcome and Requirements',
    'Authoritative References and Inherited Contract',
    'Authority and Scope',
    'Prerequisite DAG',
    'Branch and Temporary Worktree',
    'Checkout-Independent Git Lifecycle',
    'Implementation Sequence',
    'Story-Specific Verification',
    'Acceptance Criteria',
    'Risks and Mitigations',
    'Completion Evidence',
    'Scope Boundary',
  ],
  route: [
    'Authoritative references',
    'Outcome and requirements',
    'Prerequisites and dependency DAG',
    'Isolated branch and worktree',
    'Allowed Change Surface',
    'Forbidden Shared Files',
    'Behavior-lock step',
    'Implementation sequence',
    'Story-targeted tests and local validation',
    'Responsive, table/chart, visual, and accessibility verification',
    'Independent review',
    'Conventional commit, push, PR, and merge',
    'Remote/local branch deletion and mandatory worktree cleanup',
    'Risks and mitigations',
    'Testable acceptance criteria',
    'Explicit no-production scope',
  ],
  modern: [
    'Authoritative References',
    'Outcome and Requirements',
    'Prerequisite DAG and Ownership Gate',
    'Exact Branch and Isolated Worktree',
    'Allowed and Forbidden Files',
    'Behavior Lock Before Presentation Changes',
    'Story-Specific Implementation',
    'Targeted Tests and Local Validation',
    'Visual, Responsive, Theme, and Accessibility Proof',
    'Independent Adversarial Review',
    'Commit, Push, PR, and Merge',
    'Mandatory Branch and Worktree Cleanup',
    'Risks and Mitigations',
    'Testable Acceptance Criteria',
    'No-Production Scope and Stop Conditions',
  ],
}
const PLAN_SECTION_OVERRIDES = new Map([
  ['167.5', [...PLAN_SECTION_PROFILES.legacy, 'Status supersede (2026-08-17)']],
  [
    '167.8',
    [
      'Outcome',
      'Authority and Scope',
      'Prerequisite and Backend Collision Gate',
      'Checkout-Independent Git Lifecycle',
      'RED-First Implementation Sequence',
      'Validation',
      'Acceptance and Stop Conditions',
    ],
  ],
  [
    '167.9',
    [
      'Outcome',
      'Authority and Scope',
      'Prerequisite DAG',
      'Checkout-Independent Git Lifecycle',
      'RED-First Implementation Sequence',
      'Validation',
      'Acceptance and Stop Conditions',
    ],
  ],
  [
    '169.12',
    [
      'Authoritative references',
      'Outcome and requirements',
      'Concurrent route-delivery reconciliation',
      ...PLAN_SECTION_PROFILES.route.slice(2),
    ],
  ],
  [
    '169.14',
    [
      'Outcome',
      'Authority and exact scope',
      'Prerequisite and backend collision gate',
      'Checkout-independent Git lifecycle',
      'RED-first implementation sequence',
      'Validation',
      'Independent review',
      'Commit, push, PR, and merge',
      'Durable final handoff before ephemeral-record retirement',
      'Mandatory cleanup',
      'Acceptance and stop conditions',
    ],
  ],
  [
    '169.15',
    [
      'Outcome',
      'Authority and exact scope',
      'Prerequisite DAG and merge evidence',
      'Checkout-independent Git lifecycle',
      'RED-first implementation sequence',
      'Validation',
      'Independent review',
      'Commit, push, PR, and merge',
      'Mandatory cleanup',
      'Acceptance and stop conditions',
    ],
  ],
  [
    '174.1',
    [
      'Authoritative References',
      'Outcome and Requirements',
      'Prerequisite DAG and Ownership Gate',
      'Exact Branch and Isolated Worktree',
      'Allowed and Forbidden Files',
      'Parity Baseline and Validator Contract',
      'Story-Specific Implementation',
      'Targeted Tests and Local Validation',
      'Planning and Validator Evidence',
      'Independent Adversarial Review',
      'Commit, Push, PR, and Merge',
      'Mandatory Branch and Worktree Cleanup',
      'Risks and Mitigations',
      'Testable Acceptance Criteria',
      'No-Production Scope and Stop Conditions',
    ],
  ],
])
// prettier-ignore
const EVIDENCE_FIELDS = ['Route/User Value', 'Owned Surface', 'Shared Dependencies', 'Allowed Change Surface', 'Forbidden Shared Files', 'State Coverage', 'Responsive/Table/Chart Contract', 'Accessibility Contract', 'Test and Visual Evidence', 'Local Validation', 'Branch/Worktree Lifecycle', 'Cleanup Evidence']

const read = (root, relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const normalize = value => value.replace(/\s+/g, ' ').trim()
const sha256 = value => crypto.createHash('sha256').update(normalize(value)).digest('hex')
const storyNumber = id => id?.split('.').reduce((epic, story) => Number(epic) * 100 + Number(story))

function expectedPlanSections(storyId) {
  if (PLAN_SECTION_OVERRIDES.has(storyId)) return PLAN_SECTION_OVERRIDES.get(storyId)
  const epic = Number(storyId?.split('.')[0])
  if (epic >= 166 && epic <= 168) return PLAN_SECTION_PROFILES.legacy
  if (epic >= 169 && epic <= 171) return PLAN_SECTION_PROFILES.route
  if (epic >= 172 && epic <= 174) return PLAN_SECTION_PROFILES.modern
  return []
}

function duplicates(items, key) {
  const counts = new Map()
  for (const item of items) {
    const value = key(item)
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value)
}

export function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const entries = block.split(/\r?\n/).flatMap(line => {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/)
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : []
  })
  return {
    values: Object.fromEntries(entries),
    entries,
    duplicateKeys: duplicates(entries, entry => entry[0]),
  }
}

function fieldValue(section, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return section
    .match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s+(.+?)(?=\\s+\\*\\*[^*]+:\\*\\*|$)`, 'mi'))?.[1]
    ?.trim()
}

export function parseStories(source) {
  const matches = [...source.matchAll(/^### Story (\d+\.\d+): (.+)$/gm)]
  return matches.map((match, index) => {
    const section = source.slice(match.index, matches[index + 1]?.index ?? source.length)
    const values = Object.fromEntries(
      EVIDENCE_FIELDS.map(field => [field, fieldValue(section, field)])
    )
    return {
      id: match[1],
      title: match[2].trim(),
      ownedSurface: values['Owned Surface'],
      sharedDependencies: values['Shared Dependencies'],
      evidence: EVIDENCE_FIELDS.filter(field => Boolean(values[field])),
      evidenceCounts: Object.fromEntries(
        EVIDENCE_FIELDS.map(field => [field, section.split(`**${field}:**`).length - 1])
      ),
    }
  })
}

function tableRows(section) {
  return section.split(/\r?\n/).flatMap(line => {
    if (!/^\|\s*[^-]/.test(line)) return []
    return [
      line
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim()),
    ]
  })
}

export function parseMaster(source) {
  const frontendRepository = source.match(/Canonical frontend repository:\s*`([^`]+)`/)?.[1]
  const backendSection = source.match(
    /## Backend Exception Lifecycle Records\n([\s\S]*?)(?=\n## Story Plan Index)/
  )?.[1]
  const indexSection = source.match(
    /## Story Plan Index\n([\s\S]*?)(?=\n## Canonical Ownership and Dependency Fingerprints)/
  )?.[1]
  const fingerprintSection = source.match(
    /## Canonical Ownership and Dependency Fingerprints\n([\s\S]*?)(?=\n## Parity Validation Evidence)/
  )?.[1]
  const backend = tableRows(backendSection ?? '').flatMap(cells => {
    if (!/^\d+\.\d+$/.test(cells[0] ?? '') || cells.length !== 14) return []
    const clean = value => value.replaceAll('`', '')
    return [
      {
        storyId: cells[0],
        artifact: clean(cells[1]),
        repository: clean(cells[2]),
        githubRepository: clean(cells[3]),
        branch: clean(cells[4]),
        worktree: clean(cells[5]),
        deliveredCleanupWorktree: clean(cells[6]),
        backendMergeSha: clean(cells[7]),
        backendMainRef: clean(cells[8]),
        frontendHandoffPr: clean(cells[9]),
        frontendHandoffBranch: clean(cells[10]),
        frontendHandoffWorktree: clean(cells[11]),
        frontendHandoffCommit: clean(cells[12]),
        frontendHandoffMergeSha: clean(cells[13]),
      },
    ]
  })
  const index = tableRows(indexSection ?? '').flatMap(cells => {
    if (!/^\d+\.\d+$/.test(cells[0] ?? '') || cells.length !== 5) return []
    const link = cells[2].match(/\((\.\/[^)]+)\)/)?.[1]
    return [
      {
        storyId: cells[0],
        title: cells[1],
        file: link ? `.omx/plans/${link.slice(2)}` : null,
        branch: cells[3].replaceAll('`', ''),
        prerequisiteText: cells[4],
      },
    ]
  })
  const fingerprints = tableRows(fingerprintSection ?? '').flatMap(cells =>
    /^\d+\.\d+$/.test(cells[0] ?? '') && cells.length === 3
      ? [
          {
            storyId: cells[0],
            ownedSurfaceSha256: cells[1],
            sharedDependenciesSha256: cells[2],
          },
        ]
      : []
  )
  return { frontendRepository, backend, index, fingerprints }
}

function idsForEpic(epic, storyIds) {
  return storyIds.filter(id => id.startsWith(`${epic}.`))
}

export function dependencyIds(text, storyIds, routeStoryIds = []) {
  text = text
    .replace(/\bStories?\s+[\d.–-]+\s+consume[^.;]*/gi, '')
    .replace(/\b(?:used|consumed) by\s+(?:Stories?\s+)?[\d.\s,–-]+/gi, '')
  const found = new Set()
  const add = id => found.add(id)
  for (const match of text.matchAll(
    /\b(16[6-9]|17[0-4])\.(\d+)\s*[–-]\s*(?:(16[6-9]|17[0-4])\.)?(\d+)\b/g
  )) {
    const fromEpic = Number(match[1])
    const toEpic = Number(match[3] ?? match[1])
    const fromStory = Number(match[2])
    const toStory = Number(match[4])
    for (let epic = fromEpic; epic <= toEpic; epic += 1) {
      for (const id of idsForEpic(epic, storyIds)) {
        const story = Number(id.split('.')[1])
        if ((epic > fromEpic || story >= fromStory) && (epic < toEpic || story <= toStory))
          found.add(id)
      }
    }
  }
  // Preserve explicit unknown Story identities so validation rejects them instead of
  // silently normalizing them out of the dependency graph.
  for (const match of text.matchAll(/\b(\d+)\.(\d+)\b/g)) add(`${match[1]}.${match[2]}`)
  for (const match of text.matchAll(
    /\bEpics?\s+(16[6-9]|17[0-4])\s*[–-]\s*(16[6-9]|17[0-4])(?:-FE)?\b/gi
  )) {
    for (let epic = Number(match[1]); epic <= Number(match[2]); epic += 1)
      for (const id of idsForEpic(epic, storyIds)) found.add(id)
  }
  for (const match of text.matchAll(
    /\bEpics?\s+(16[6-9]|17[0-4])-FE\s+through\s+(16[6-9]|17[0-4])-FE\b/gi
  )) {
    for (let epic = Number(match[1]); epic <= Number(match[2]); epic += 1)
      for (const id of idsForEpic(epic, storyIds)) found.add(id)
  }
  for (const match of text.matchAll(/\b(?:Epic\s+)?(16[6-9]|17[0-4])-FE\b/gi))
    for (const id of idsForEpic(Number(match[1]), storyIds)) found.add(id)
  if (/\bfoundation\b/i.test(text)) for (const id of idsForEpic(166, storyIds)) found.add(id)
  if (/\bC2\b/.test(text)) {
    for (const id of idsForEpic(166, storyIds)) found.add(id)
    add('167.1')
    add('168.1')
  }
  if (/\bAppShell\b/i.test(text)) add('167.1')
  if (/\b(?:analytics[- ]shared|hub(?:-owned)?)\b/i.test(text)) add('168.1')
  if (/\ball (?:route migrations|route Stories)\b/i.test(text))
    for (const id of routeStoryIds) add(id)
  return [...found].sort((left, right) => storyNumber(left) - storyNumber(right))
}

export function parsePlanSource(source, file, context = {}) {
  const parsed = parseFrontmatter(source)
  const prerequisiteSection = source.match(/## Prerequisite[^\n]*\n([\s\S]*?)(?=\n## )/i)?.[1] ?? ''
  const explicitPrerequisites = prerequisiteSection
    .replace(/```mermaid[\s\S]*?```/gi, '')
    .split(/\r?\n/)
    .filter(
      line =>
        /Merged prerequisites?:/i.test(line) ||
        (!/--?>/.test(line) &&
          (/Verify the merge SHA for/i.test(line) ||
            /\b(?:Epic|Story)\b.+\bis merged\b/i.test(line) ||
            /^\s*(?:[-*]\s+)?(?:guard owner )?Story \d+\.\d+ .*merged/i.test(line)))
    )
    .join('\n')
  return {
    ...parsed.values,
    file,
    fileStoryId: path.basename(file).match(/^(\d+\.\d+)-/)?.[1],
    frontmatterEntries: parsed.entries,
    duplicateFrontmatterKeys: parsed.duplicateKeys,
    sectionHeadings: [...source.matchAll(/^## (.+)$/gm)].map(match => match[1].trim()),
    prerequisiteDeclaration: explicitPrerequisites,
    prerequisites: dependencyIds(
      explicitPrerequisites,
      context.storyIds ?? [],
      context.routeStoryIds ?? []
    ),
    ownedSurfaceDeclaration:
      fieldValue(source, 'Owned Surface') ??
      fieldValue(source, 'Resolved owned surface') ??
      fieldValue(source, 'Canonical owned surface'),
  }
}

function parsePlans(root, context) {
  const directory = path.join(root, '.omx/plans')
  return fs.readdirSync(directory).flatMap(file => {
    if (!/^\d+\.\d+-.+\.md$/.test(file)) return []
    const relative = `.omx/plans/${file}`
    return [parsePlanSource(fs.readFileSync(path.join(directory, file), 'utf8'), relative, context)]
  })
}

function routeFromEntry(entry) {
  if (entry === 'src/app/page.tsx') return '/'
  const segments = entry
    .replace(/^src\/app\//, '')
    .replace(/\/page\.tsx$/, '')
    .split('/')
    .filter(segment => !/^\(.*\)$/.test(segment))
  return `/${segments.join('/')}`
}

function parseLedger(root) {
  return read(root, '_bmad-output/planning-artifacts/shadcn-route-ledger.md')
    .split('\n')
    .flatMap(line => {
      const match = line.match(/^\| (\d+\.\d+) \| `([^`]+)` \| `([^`]+)` \| ([^|]+) \| ([^|]+) \|$/)
      return match
        ? [
            {
              storyId: match[1],
              route: match[2],
              entry: match[3],
              domain: match[4].trim(),
              status: match[5].trim(),
            },
          ]
        : []
    })
}

function implementationArtifact(root, storyId) {
  const prefix = `${storyId.replace('.', '-')}-fe-`
  const matches = fs
    .readdirSync(path.join(root, '_bmad-output/implementation-artifacts'))
    .filter(file => file.startsWith(prefix) && file.endsWith('.md'))
  return matches.length === 1 ? `_bmad-output/implementation-artifacts/${matches[0]}` : null
}

function parseStatusRows(root) {
  return [
    ...read(root, '_bmad-output/implementation-artifacts/sprint-status.yaml').matchAll(
      /^  (16[6-9]|17[0-4])-(\d+)-fe-([^:]+):\s*([a-z-]+)/gm
    ),
  ].map(match => ({ storyId: `${match[1]}.${match[2]}`, slug: match[3], status: match[4] }))
}

function defaultGit(repository, args) {
  const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout?.trim() ?? '', stderr: result.stderr ?? '' }
}

function githubIdentity(url) {
  return url
    .replace(/^git@github\.com:/, '')
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
}

function queryGit(repository, args, git, expectedStatuses = [0]) {
  const result = git(repository, args)
  return { ...result, ok: expectedStatuses.includes(result.status) }
}

export function collectGitContext(root, lifecycleRecords, git = defaultGit) {
  const failures = []
  const base = queryGit(root, ['merge-base', 'HEAD', 'main'], git)
  const baseSha =
    base.ok && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(base.stdout) ? base.stdout : null
  if (!baseSha) failures.push({ code: 'base-sha-invalid', identity: root })
  else if (baseSha !== EXPECTED_BASE_SHA)
    failures.push({
      code: 'base-sha-mismatch',
      identity: `${baseSha}:${EXPECTED_BASE_SHA}`,
    })
  const lifecycle = lifecycleRecords.map(record => {
    const repository = record.repository
    const origin = queryGit(repository, ['config', '--get', 'remote.origin.url'], git)
    const commit = queryGit(
      repository,
      ['cat-file', '-e', `${record.backendMergeSha}^{commit}`],
      git
    )
    const ancestry = queryGit(
      repository,
      ['merge-base', '--is-ancestor', record.backendMergeSha, record.backendMainRef],
      git
    )
    const localBranch = queryGit(
      repository,
      ['show-ref', '--verify', '--quiet', `refs/heads/${record.branch}`],
      git,
      [1]
    )
    const cachedRemoteTrackingBranch = queryGit(
      repository,
      ['show-ref', '--verify', '--quiet', `refs/remotes/origin/${record.branch}`],
      git,
      [1]
    )
    const worktrees = queryGit(repository, ['worktree', 'list', '--porcelain'], git)
    const registeredWorktrees = worktrees.stdout
      .split('\n')
      .filter(line => line.startsWith('worktree '))
      .map(line => line.slice('worktree '.length))
    const deliveredCleanupWorktree = path.isAbsolute(record.deliveredCleanupWorktree)
      ? record.deliveredCleanupWorktree
      : path.resolve(repository, record.deliveredCleanupWorktree)
    const result = {
      storyId: record.storyId,
      repositoryIdentity: origin.ok ? githubIdentity(origin.stdout) : null,
      backendCommitExists: commit.ok,
      backendMergeOnMain: ancestry.ok,
      backendLocalBranchAbsent: localBranch.ok,
      backendCachedRemoteTrackingBranchAbsent: cachedRemoteTrackingBranch.ok,
      backendLiveRemoteBranchProof: 'unavailable',
      backendPlannedWorktreeAbsent: worktrees.ok && !registeredWorktrees.includes(record.worktree),
      backendDeliveredCleanupWorktreeAbsent:
        worktrees.ok && !registeredWorktrees.includes(deliveredCleanupWorktree),
      gitQueriesComplete:
        origin.ok &&
        commit.ok &&
        ancestry.ok &&
        localBranch.ok &&
        cachedRemoteTrackingBranch.ok &&
        worktrees.ok,
    }
    if (record.frontendHandoffCommit !== '-') {
      const frontendOrigin = queryGit(root, ['config', '--get', 'remote.origin.url'], git)
      const handoffCommit = queryGit(
        root,
        ['cat-file', '-e', `${record.frontendHandoffCommit}^{commit}`],
        git
      )
      const handoffMerge = queryGit(
        root,
        ['cat-file', '-e', `${record.frontendHandoffMergeSha}^{commit}`],
        git
      )
      const handoffToMerge = queryGit(
        root,
        [
          'merge-base',
          '--is-ancestor',
          record.frontendHandoffCommit,
          record.frontendHandoffMergeSha,
        ],
        git
      )
      const mergeToMain = queryGit(
        root,
        ['merge-base', '--is-ancestor', record.frontendHandoffMergeSha, 'refs/remotes/origin/main'],
        git
      )
      const handoffLocal = queryGit(
        root,
        ['show-ref', '--verify', '--quiet', `refs/heads/${record.frontendHandoffBranch}`],
        git,
        [1]
      )
      const handoffCachedRemoteTracking = queryGit(
        root,
        ['show-ref', '--verify', '--quiet', `refs/remotes/origin/${record.frontendHandoffBranch}`],
        git,
        [1]
      )
      const frontendWorktrees = queryGit(root, ['worktree', 'list', '--porcelain'], git)
      Object.assign(result, {
        frontendRepositoryIdentity: frontendOrigin.ok
          ? githubIdentity(frontendOrigin.stdout)
          : null,
        frontendHandoffCommitExists: handoffCommit.ok,
        frontendHandoffMergeExists: handoffMerge.ok,
        frontendHandoffOnMerge: handoffToMerge.ok,
        frontendHandoffMergeOnMain: mergeToMain.ok,
        frontendHandoffLocalBranchAbsent: handoffLocal.ok,
        frontendHandoffCachedRemoteTrackingBranchAbsent: handoffCachedRemoteTracking.ok,
        frontendHandoffLiveRemoteBranchProof: 'unavailable',
        frontendHandoffWorktreeAbsent:
          frontendWorktrees.ok &&
          !frontendWorktrees.stdout
            .split('\n')
            .includes(`worktree ${record.frontendHandoffWorktree}`),
      })
      result.gitQueriesComplete &&=
        frontendOrigin.ok &&
        handoffCommit.ok &&
        handoffMerge.ok &&
        handoffToMerge.ok &&
        mergeToMain.ok &&
        handoffLocal.ok &&
        handoffCachedRemoteTracking.ok &&
        frontendWorktrees.ok
    }
    return result
  })
  return { baseSha, failures, lifecycle }
}

export function artifactLifecycle(root, record) {
  let source = ''
  try {
    source = read(root, record.artifact)
  } catch {
    return { storyId: record.storyId, exists: false }
  }
  const isHandoff = record.frontendHandoffCommit !== '-'
  const expected = EXPECTED_LIFECYCLE.get(record.storyId)
  return {
    storyId: record.storyId,
    exists: true,
    completed: /^Status:\s*done\b/im.test(source),
    backendMergeRecorded: Boolean(
      expected?.artifactMergeNeedle && source.includes(expected.artifactMergeNeedle)
    ),
    branchRecorded: source.includes(record.branch),
    plannedWorktreeRecorded: source.includes(record.worktree),
    deliveredCleanupWorktreeRecorded: Boolean(
      expected?.deliveredCleanupWorktree && source.includes(expected.deliveredCleanupWorktree)
    ),
    cleanupRecorded: Boolean(
      expected?.artifactCleanupNeedle && source.includes(expected.artifactCleanupNeedle)
    ),
    backendBranchCleanupRecorded: Boolean(
      expected?.artifactBackendBranchCleanupNeedle &&
      normalize(source).includes(normalize(expected.artifactBackendBranchCleanupNeedle))
    ),
    frontendHandoffCleanupRecorded:
      !isHandoff ||
      Boolean(
        expected?.artifactFrontendHandoffCleanupNeedle &&
        normalize(source).includes(normalize(expected.artifactFrontendHandoffCleanupNeedle))
      ),
    frontendHandoffRecorded:
      !isHandoff ||
      (source.includes(`PR: [#${expected.frontendHandoffPr}]`) &&
        source.includes(expected.frontendHandoffBranch) &&
        source.includes(expected.frontendHandoffWorktree) &&
        source.includes(expected.frontendHandoffCommit) &&
        source.includes(expected.frontendHandoffMergeSha)),
    retirementRecorded: !isHandoff || /record-retirement[\s\S]{0,400}: \*\*PASS\*\*/i.test(source),
  }
}

export function collectRepository(root = process.cwd(), options = {}) {
  const stories = parseStories(read(root, BMAD_ARTIFACT))
  const master = parseMaster(read(root, MASTER_PLAN))
  const ledgerBase = parseLedger(root)
  const routeStoryIds = [...new Set(ledgerBase.map(row => row.storyId))]
  const context = { storyIds: stories.map(story => story.id), routeStoryIds }
  const plans = parsePlans(root, context)
  for (const story of stories)
    story.prerequisites = dependencyIds(
      story.sharedDependencies ?? '',
      context.storyIds,
      routeStoryIds
    )
  for (const row of master.index)
    row.prerequisites = dependencyIds(row.prerequisiteText, context.storyIds, routeStoryIds)
  const ledger = ledgerBase.map(row => ({
    ...row,
    artifact: implementationArtifact(root, row.storyId),
  }))
  const sourceEntries = []
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(absolute)
      else if (entry.name === 'page.tsx') sourceEntries.push(path.relative(root, absolute))
    }
  }
  visit(path.join(root, 'src/app'))
  const routes = sourceEntries.sort().map(entry => ({ entry, route: routeFromEntry(entry) }))
  const statusRows = parseStatusRows(root)
  const gitContext = collectGitContext(root, master.backend, options.git)
  return {
    root,
    stories,
    plans,
    master,
    ledger,
    routes,
    statusRows,
    statuses: Object.fromEntries(statusRows.map(row => [row.storyId, row.status])),
    gitContext,
    artifactLifecycle: master.backend.map(record => artifactLifecycle(root, record)),
  }
}

function compareSet(actual, expected, add, missingCode, extraCode, owner) {
  const actualSet = new Set(actual)
  const expectedSet = new Set(expected)
  for (const value of expectedSet) if (!actualSet.has(value)) add(missingCode, `${owner}:${value}`)
  for (const value of actualSet) if (!expectedSet.has(value)) add(extraCode, `${owner}:${value}`)
}

export function validateModel(model) {
  const errors = []
  const add = (code, identity) => errors.push({ code, identity })
  const storyIds = new Set(model.stories.map(story => story.id))
  const planIds = new Set(model.plans.map(plan => plan.storyId))
  const routeEntries = new Set(model.routes.map(route => route.entry))
  const ledgerEntries = new Set(model.ledger.map(row => row.entry))
  for (const failure of model.gitContext?.failures ?? []) add(failure.code, failure.identity)
  if (
    model.gitContext?.baseSha &&
    model.gitContext.baseSha !== EXPECTED_BASE_SHA &&
    !(model.gitContext.failures ?? []).some(failure => failure.code === 'base-sha-mismatch')
  )
    add('base-sha-mismatch', `${model.gitContext.baseSha}:${EXPECTED_BASE_SHA}`)
  for (const id of duplicates(model.stories, story => story.id)) add('duplicate-story', id)
  for (const id of duplicates(model.plans, plan => plan.storyId)) add('duplicate-plan', id)
  for (const id of duplicates(model.master.index, row => row.storyId))
    add('duplicate-master-index', id)
  for (const id of duplicates(model.master.fingerprints, row => row.storyId))
    add('duplicate-fingerprint', id)
  for (const id of duplicates(model.master.backend, row => row.storyId))
    add('duplicate-backend-record', id)
  if (model.master.frontendRepository !== FRONTEND_ROOT)
    add('frontend-repository-contract-invalid', model.master.frontendRepository ?? '<missing>')
  for (const id of duplicates(model.statusRows, row => row.storyId)) add('duplicate-status', id)
  for (const id of duplicates(model.ledger, row => row.storyId)) add('duplicate-route-owner', id)
  for (const entry of duplicates(model.ledger, row => row.entry))
    add('duplicate-ledger-entry', entry)
  for (const branch of duplicates(model.plans, plan => plan.branch)) add('duplicate-branch', branch)
  for (const worktree of duplicates(model.plans, plan => plan.temporaryWorktree))
    add('duplicate-worktree', worktree)
  for (const route of duplicates(model.routes, item => item.route))
    add(
      'duplicate-source-route',
      `${route}:${model.routes
        .filter(item => item.route === route)
        .map(item => item.entry)
        .join(',')}`
    )
  for (const route of duplicates(model.ledger, item => item.route))
    add(
      'duplicate-ledger-route',
      `${route}:${model.ledger
        .filter(item => item.route === route)
        .map(item => item.storyId)
        .join(',')}`
    )
  for (const story of model.stories) {
    if (!planIds.has(story.id)) add('story-plan-missing', story.id)
    if (!model.statuses[story.id]) add('story-status-missing', story.id)
    for (const field of EVIDENCE_FIELDS)
      if (!story.evidence.includes(field)) add('evidence-field-missing', `${story.id}:${field}`)
    for (const field of EVIDENCE_FIELDS)
      if (story.evidenceCounts[field] > 1) add('evidence-field-duplicate', `${story.id}:${field}`)
    const fingerprint = model.master.fingerprints.find(row => row.storyId === story.id)
    if (!fingerprint) add('fingerprint-missing', story.id)
    else {
      if (sha256(story.ownedSurface ?? '') !== fingerprint.ownedSurfaceSha256)
        add('owned-surface-fingerprint-mismatch', story.id)
      if (sha256(story.sharedDependencies ?? '') !== fingerprint.sharedDependenciesSha256)
        add('shared-dependencies-fingerprint-mismatch', story.id)
    }
    for (const dependency of story.prerequisites) {
      const edge = `${story.id}:${dependency}`
      if (!storyIds.has(dependency)) add('unresolved-prerequisite', edge)
      if (dependency === story.id) add('self-prerequisite', edge)
      if (storyNumber(dependency) > storyNumber(story.id) && !ALLOWED_FORWARD_EDGES.has(edge))
        add('future-prerequisite', edge)
    }
  }
  for (const row of model.statusRows) {
    if (!storyIds.has(row.storyId)) add('orphan-status', row.storyId)
    if (!STATUS_VALUES.has(row.status)) add('status-invalid', `${row.storyId}:${row.status}`)
    const artifact = implementationArtifact(model.root, row.storyId)
    const artifactSlug = artifact
      ? path.basename(artifact, '.md').replace(`${row.storyId.replace('.', '-')}-fe-`, '')
      : null
    const expectedSlug = STATUS_SLUG_OVERRIDES.get(row.storyId) ?? artifactSlug
    if (expectedSlug && row.slug !== expectedSlug)
      add('status-slug-mismatch', `${row.storyId}:${row.slug}:${expectedSlug}`)
  }
  for (const plan of model.plans) {
    if (plan.storyId && !storyIds.has(plan.storyId)) {
      add('story-missing', plan.storyId)
      add('orphan-plan', `${plan.storyId}:${plan.file}`)
    }
    const story = model.stories.find(item => item.id === plan.storyId)
    const index = model.master.index.find(item => item.storyId === plan.storyId)
    if (story && story.title !== plan.storyTitle)
      add(
        'title-mismatch',
        `${plan.storyId}:${plan.file}:${plan.storyTitle ?? '<missing>'}:${story.title}`
      )
    if (!index) add('master-index-missing', plan.storyId ?? plan.file)
    else {
      if (index.title !== plan.storyTitle) add('master-title-mismatch', plan.storyId)
      if (index.file !== plan.file) add('master-plan-path-mismatch', plan.storyId)
      if (index.branch !== plan.branch) add('master-branch-mismatch', plan.storyId)
      if (story)
        compareSet(
          index.prerequisites,
          story.prerequisites,
          add,
          'master-prerequisite-missing',
          'master-prerequisite-extra',
          plan.storyId
        )
    }
    if (story) {
      if (
        plan.ownedSurfaceDeclaration &&
        normalize(plan.ownedSurfaceDeclaration) !== normalize(story.ownedSurface)
      ) {
        const legacyDeclaration = LEGACY_PLAN_OWNERSHIP.get(plan.storyId)
        if (
          !legacyDeclaration ||
          normalize(plan.ownedSurfaceDeclaration) !== normalize(legacyDeclaration)
        )
          add('plan-owned-surface-mismatch', plan.storyId)
      }
      for (const dependency of story.prerequisites)
        if (
          !plan.prerequisites.includes(dependency) &&
          !INHERITED_MASTER_EDGES.has(`${plan.storyId}:${dependency}`)
        )
          add('plan-prerequisite-missing', `${plan.storyId}:${dependency}`)
      for (const dependency of plan.prerequisites)
        if (
          !story.prerequisites.includes(dependency) &&
          !LEGACY_PLAN_PREREQUISITE_EXCEPTIONS.has(`${plan.storyId}:${dependency}`)
        )
          add('plan-prerequisite-extra', `${plan.storyId}:${dependency}`)
    }
    for (const field of PLAN_FIELDS)
      if (!plan[field]) add('plan-field-missing', `${plan.file}:${field}`)
    for (const key of plan.duplicateFrontmatterKeys)
      add('duplicate-frontmatter-key', `${plan.file}:${key}`)
    const expectedSections = expectedPlanSections(plan.storyId)
    for (const heading of expectedSections) {
      const count = plan.sectionHeadings.filter(actual => actual === heading).length
      if (count === 0) add('plan-section-missing', `${plan.file}:${heading}`)
      if (count > 1) add('plan-section-duplicate', `${plan.file}:${heading}`)
    }
    for (const heading of new Set(plan.sectionHeadings))
      if (!expectedSections.includes(heading))
        add('plan-section-unexpected', `${plan.file}:${heading}`)
    if (plan.fileStoryId !== plan.storyId)
      add('plan-filename-id-mismatch', `${plan.file}:${plan.fileStoryId}:${plan.storyId}`)
    if (plan.storyId && plan.epic !== `${plan.storyId.split('.')[0]}-FE`)
      add('plan-epic-mismatch', `${plan.file}:${plan.epic}`)
    const isBackend =
      plan.repository === '/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new'
    const expectedMaster = isBackend ? `frontend/${MASTER_PLAN}` : MASTER_PLAN
    const expectedBmad = isBackend ? `frontend/${BMAD_ARTIFACT}` : BMAD_ARTIFACT
    if (plan.masterPlan !== expectedMaster) add('plan-master-mismatch', plan.file)
    if (plan.bmadArtifact !== expectedBmad) add('plan-bmad-artifact-mismatch', plan.file)
    if (plan.productionScope !== 'forbidden') add('plan-production-scope-invalid', plan.file)
    if (plan.status && !PLAN_STATUSES.has(plan.status))
      add('plan-status-invalid', `${plan.file}:${plan.status}`)
    for (const dependency of plan.prerequisites) {
      const edge = `${plan.storyId}:${dependency}`
      if (!storyIds.has(dependency)) add('unresolved-prerequisite', edge)
      if (dependency === plan.storyId) add('self-prerequisite', edge)
      if (storyNumber(dependency) > storyNumber(plan.storyId) && !ALLOWED_FORWARD_EDGES.has(edge))
        add('future-prerequisite', edge)
    }
    const backend = model.master.backend.find(row => row.storyId === plan.storyId)
    if (!backend && plan.repository && plan.repository !== FRONTEND_ROOT)
      add('plan-repository-mismatch', `${plan.storyId}:${plan.repository}`)
    if (backend)
      for (const [field, actual, expected] of [
        ['repository', plan.repository, backend.repository],
        ['file', plan.file, index?.file],
        ['branch', plan.branch, backend.branch],
        ['worktree', plan.temporaryWorktree, backend.worktree],
      ])
        if (actual !== expected) add('backend-exception-invalid', `${plan.storyId}:${field}`)
  }
  const detectCycles = graph => {
    const active = new Set()
    const seen = new Set()
    const visit = id => {
      if (seen.has(id)) return
      active.add(id)
      for (const dependency of graph.get(id) ?? []) {
        if (active.has(dependency)) add('prerequisite-cycle', `${id}:${dependency}`)
        else if (graph.has(dependency)) visit(dependency)
      }
      active.delete(id)
      seen.add(id)
    }
    for (const id of graph.keys()) visit(id)
  }
  detectCycles(
    new Map(
      model.plans.filter(plan => plan.storyId).map(plan => [plan.storyId, plan.prerequisites])
    )
  )
  detectCycles(new Map(model.stories.map(story => [story.id, story.prerequisites])))
  for (const record of model.master.backend) {
    const expectedLifecycle = EXPECTED_LIFECYCLE.get(record.storyId)
    if (!expectedLifecycle) add('backend-lifecycle-record-invalid', `${record.storyId}:unexpected`)
    else
      for (const [field, expected] of Object.entries(expectedLifecycle).filter(
        ([field]) => !field.startsWith('artifact')
      ))
        if (record[field] !== expected)
          add('backend-lifecycle-record-invalid', `${record.storyId}:${field}`)
    const artifact = model.artifactLifecycle.find(item => item.storyId === record.storyId)
    const gitFacts = model.gitContext.lifecycle.find(item => item.storyId === record.storyId)
    for (const [field, valid] of Object.entries({
      artifact: artifact?.exists,
      completed: artifact?.completed,
      merge: artifact?.backendMergeRecorded,
      branch: artifact?.branchRecorded,
      plannedWorktree: artifact?.plannedWorktreeRecorded,
      deliveredCleanupWorktree: artifact?.deliveredCleanupWorktreeRecorded,
      cleanup: artifact?.cleanupRecorded,
      historicalBranchCleanup: artifact?.backendBranchCleanupRecorded,
      handoff: artifact?.frontendHandoffRecorded,
      historicalHandoffBranchCleanup: artifact?.frontendHandoffCleanupRecorded,
      retirement: artifact?.retirementRecorded,
      repository: gitFacts?.repositoryIdentity === record.githubRepository,
      mainRef: record.backendMainRef === 'refs/remotes/origin/main',
      commit: gitFacts?.backendCommitExists,
      ancestry: gitFacts?.backendMergeOnMain,
      localBranchAbsence: gitFacts?.backendLocalBranchAbsent,
      cachedRemoteTrackingBranchAbsence: gitFacts?.backendCachedRemoteTrackingBranchAbsent,
      liveRemoteProofBoundary: gitFacts?.backendLiveRemoteBranchProof === 'unavailable',
      plannedWorktreeAbsence: gitFacts?.backendPlannedWorktreeAbsent,
      deliveredCleanupWorktreeAbsence: gitFacts?.backendDeliveredCleanupWorktreeAbsent,
      gitQueries: gitFacts?.gitQueriesComplete,
    }))
      if (!valid) add('backend-lifecycle-invalid', `${record.storyId}:${field}`)
    if (record.frontendHandoffCommit !== '-')
      for (const [field, valid] of Object.entries({
        handoffCommit: gitFacts?.frontendHandoffCommitExists,
        handoffRepository:
          gitFacts?.frontendRepositoryIdentity === 'salacoste/wb-erp-system-daytona-FE',
        handoffMerge: gitFacts?.frontendHandoffMergeExists,
        handoffAncestry: gitFacts?.frontendHandoffOnMerge,
        handoffMainAncestry: gitFacts?.frontendHandoffMergeOnMain,
        handoffLocalBranchAbsence: gitFacts?.frontendHandoffLocalBranchAbsent,
        handoffCachedRemoteTrackingBranchAbsence:
          gitFacts?.frontendHandoffCachedRemoteTrackingBranchAbsent,
        handoffLiveRemoteProofBoundary:
          gitFacts?.frontendHandoffLiveRemoteBranchProof === 'unavailable',
        handoffWorktreeAbsence: gitFacts?.frontendHandoffWorktreeAbsent,
      }))
        if (!valid) add('backend-lifecycle-invalid', `${record.storyId}:${field}`)
  }
  for (const row of model.ledger) {
    if (!storyIds.has(row.storyId)) add('orphan-ledger-owner', row.storyId)
    if (!routeEntries.has(row.entry)) add('route-entry-missing', row.entry)
    if (!row.artifact) add('implementation-artifact-missing', row.storyId)
    if (row.status !== 'verified') add('ledger-status-changed', `${row.storyId}:${row.status}`)
  }
  for (const route of model.routes) {
    if (!ledgerEntries.has(route.entry)) add('source-route-missing-ledger', route.entry)
    const row = model.ledger.find(item => item.entry === route.entry)
    if (row && row.route !== route.route) add('route-path-mismatch', route.entry)
  }
  for (const storyId of model.master.backend.map(record => record.storyId))
    if (model.ledger.some(row => row.storyId === storyId))
      add('backend-exception-has-route', storyId)
  if (model.stories.length !== EXPECTED_STORIES) add('story-count', String(model.stories.length))
  if (model.plans.length !== EXPECTED_STORIES) add('plan-count', String(model.plans.length))
  if (model.master.index.length !== EXPECTED_STORIES)
    add('master-index-count', String(model.master.index.length))
  if (model.master.fingerprints.length !== EXPECTED_STORIES)
    add('fingerprint-count', String(model.master.fingerprints.length))
  if (model.master.backend.length !== 2)
    add('backend-record-count', String(model.master.backend.length))
  if (model.routes.length !== EXPECTED_ROUTES)
    add('source-route-count', String(model.routes.length))
  if (model.ledger.length !== EXPECTED_ROUTES)
    add('ledger-route-count', String(model.ledger.length))
  return errors.sort((left, right) =>
    `${left.code}:${left.identity}`.localeCompare(`${right.code}:${right.identity}`)
  )
}

export function report(model, errors) {
  const epicCounts = Object.fromEntries(
    [...new Set(model.stories.map(story => story.id.split('.')[0]))].map(epic => [
      epic,
      model.stories.filter(story => story.id.startsWith(`${epic}.`)).length,
    ])
  )
  const defectCounts = Object.fromEntries(
    [...new Set(errors.map(error => error.code))].map(code => [
      code,
      errors.filter(error => error.code === code).length,
    ])
  )
  return {
    schemaVersion: 3,
    baseSha: model.gitContext.baseSha,
    expectedBaseSha: EXPECTED_BASE_SHA,
    counts: {
      stories: model.stories.length,
      plans: model.plans.length,
      sourceRoutes: model.routes.length,
      ledgerRows: model.ledger.length,
    },
    epicCounts,
    backendExceptions: model.master.backend.map(record => record.storyId),
    stories: model.stories.map(story => ({
      ...story,
      plan: model.plans.find(plan => plan.storyId === story.id),
      status: model.statuses[story.id],
    })),
    sourceRoutes: model.routes,
    ledgerRows: model.ledger,
    statusRows: model.statusRows,
    prerequisiteEdges: model.stories.flatMap(story =>
      story.prerequisites.map(dependency => ({
        owner: story.id,
        dependency,
        source: BMAD_ARTIFACT,
      }))
    ),
    planPrerequisiteEdges: model.plans.flatMap(plan =>
      plan.prerequisites.map(dependency => ({ owner: plan.storyId, dependency, plan: plan.file }))
    ),
    backendResults: model.master.backend.map(record => {
      const gitFacts = model.gitContext.lifecycle.find(item => item.storyId === record.storyId)
      return {
        storyId: record.storyId,
        valid: !errors.some(
          error =>
            error.code.startsWith('backend-') && error.identity.startsWith(`${record.storyId}:`)
        ),
        proofScope: 'committed-historical-artifact+local-git+cached-remote-tracking',
        backendLiveRemoteBranchProof: gitFacts?.backendLiveRemoteBranchProof ?? 'unavailable',
        frontendHandoffLiveRemoteBranchProof:
          gitFacts?.frontendHandoffLiveRemoteBranchProof ?? 'not-applicable',
      }
    }),
    defectCounts,
    errors,
  }
}

function humanLines(model, output, errors) {
  return [
    `HUMAN: base SHA = ${output.baseSha ?? 'INVALID'}`,
    `HUMAN: ${model.stories.length} BMAD Stories = ${model.plans.length} OMX plans`,
    `HUMAN: ${model.routes.length} source routes = ${model.ledger.length} route-ledger rows = ${new Set(model.ledger.map(row => row.storyId)).size} route Stories`,
    `HUMAN: epic counts = ${Object.entries(output.epicCounts)
      .map(([epic, count]) => `${epic}:${count}`)
      .join(', ')}`,
    `HUMAN: backend exceptions = ${output.backendResults.map(item => `${item.storyId}:${item.valid ? 'PASS(historical+local+cached)' : 'FAIL'};live-remote:${item.backendLiveRemoteBranchProof}`).join(', ')}; duplicates/orphans/mismatches = ${errors.filter(error => /duplicate|orphan|mismatch/.test(error.code)).length}; errors = ${errors.length}`,
  ]
}

export function run(root = process.cwd(), options = {}) {
  const write = options.write ?? (line => console.log(line))
  if (options.selfTest !== false) {
    const testPath = fileURLToPath(
      new URL('./__tests__/check-shadcn-migration-parity.test.mjs', import.meta.url)
    )
    const tests = (options.spawn ?? spawnSync)(process.execPath, ['--test', testPath], {
      stdio: options.testStdio ?? 'inherit',
      env: { ...process.env, STORY_174_1_SKIP_SELF_TESTS: '1' },
    })
    if (tests.status !== 0) return { status: 1, reason: 'self-test-failed' }
  }
  const model = options.model ?? collectRepository(root, { git: options.git })
  const errors = validateModel(model)
  const output = report(model, errors)
  write(JSON.stringify(output, null, 2))
  for (const line of humanLines(model, output, errors)) write(line)
  return { status: errors.length ? 1 : 0, model, errors, output }
}

function cli() {
  const args = process.argv.slice(2)
  const rootIndex = args.indexOf('--root')
  const fixtureIndex = args.indexOf('--fixture')
  const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : process.cwd()
  const model =
    fixtureIndex >= 0 ? JSON.parse(fs.readFileSync(args[fixtureIndex + 1], 'utf8')) : null
  const result = run(root, {
    model,
    selfTest: !process.env.STORY_174_1_SKIP_SELF_TESTS,
  })
  process.exitCode = result.status
}

if (process.argv[1] === fileURLToPath(import.meta.url)) cli()
