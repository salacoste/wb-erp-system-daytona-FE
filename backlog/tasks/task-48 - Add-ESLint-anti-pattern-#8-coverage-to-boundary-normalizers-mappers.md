---
id: task-48
title: 'Add ESLint anti-pattern #8 coverage to boundary normalizers/mappers'
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - tooling
  - ux-validation
  - anti-pattern-8
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Root-cause guard for the whole BD money/ratio-null class. The existing `no-restricted-syntax` anti-pattern-#8 rule (eslint.config.js) only targets component/hook code, so `?? 0` on money/ratio committed inside `src/lib/api/*-normalizer.ts` / `*-mapper.ts` is invisible — that is where every BD-2/10/16/29/32/34/38 defect lives. Extend the lint so this class can't recur silently. Depends on the normalizer fix task landing first (otherwise the rule fails the existing sites). Pair with a self-test like the existing scripts/test-anti-pattern-8-rule.sh.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 anti-pattern #8 no-restricted-syntax rule (or an equivalent check) flags `?? 0` on money/ratio inside src/lib/api/*-normalizer.ts and *-mapper.ts
- [x] #2 Legitimate toCount / documented SEMANTIC-ZERO / AGGREGATION-REDUCE sites use the allowlist comment convention and pass
- [x] #3 A self-test script proves the rule fires on a bad sample and passes a good one
- [x] #4 eslint runs clean at baseline after the normalizer-fix task
<!-- AC:END -->
