# Story 170.2-FE: Migrate Advertising Campaign Bid-Recommendation Detail

Status: done — PR #239 merged (`5bb0dcc3`); 2-pass fresh review APPROVE×2; cleanup 0/0/0

## Story

As a marketing user, I want `/analytics/advertising/campaigns/[advertId]` to show campaign identity and bid recommendations with clear context and recovery, so that I can review recommendations without losing the originating campaign/product selection.

Plan: `.omx/plans/170.2-migrate-advertising-campaign-bid-recommendation-detail.md` (authoritative — branch `cdx/epic-170-story-2-advertising-campaign-detail-shadcn` AFTER 170.1 ✓ `44a6eb7d`; worktree `/private/tmp/wb-repricer-fe-170-2-campaign-shadcn`). SMALLEST story of the epic — no Task 0 preface required (see disposition).

## Acceptance Criteria

1. **Given** a valid campaign ID and optional product query parameter, **when** data loads, **then** campaign/product identity, cabinet context, recommendation values/rationale/status, and back navigation preserve current behavior and URL semantics.
2. **Given** invalid ID, missing cabinet hydration, not-found/unauthorized, empty recommendations, stale/partial recommendation data, or recoverable failure, **when** rendered, **then** each state is distinct and retry never duplicates a consequential bid action.
3. **Given** keyboard/touch or narrow layout, **when** recommendations and any owned actions are reviewed, **then** headings, full values, rationale, scope, focus, and return context are understandable without hover.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — disposition: `src/lib/api/bid-recommendations.ts:13` kopecks→rubles with "Missing/invalid → 0 (the card renders ≤0 as '—')" is DOCUMENTED (iter-70) and render-compensated; hooks/API/types are FS-forbidden for this story → boundary honesty already dispositioned; no preface.
- [x] Task 1: Behavior lock (AC: #1-2) — baseline `npx vitest run "src/app/(dashboard)/analytics/advertising/campaigns/[advertId]"` (**10 tests**) + `BidRecommendationsCard.test.tsx` (**17 tests**). Lock: 5 distinct states (route-level: invalid-ID Alert, cabinet Skeleton; card-level: no-nmId empty, loading skeleton, error incl. !data); URL semantics (`advertId` param, optional `nmId` query — absent → select-product empty); back-route = ADVERTISING root; iter-70 ≤0→«—» guards (BidLevel + KeywordRow min/max/recommended); cacheAge formats (только что/мин/ч; invalid-date → hidden; NOTE: mock-only path — normalizer never sets cachedAt on live boundary; do NOT "fix" the normalizer, FS-forbidden); kopecks ÷100 display. C4: not-found/unauthorized → single destructive error branch (hook isError — N/A-split evidence: hook exposes no status split); partial → keywords empty-array branch; stale → cacheAge indicator; consequential bid actions — NONE EXIST (N/A disposition, AC-2 tail).
- [x] Task 2: Token migration (AC: #1) — `BidRecommendationsCard.tsx:18-22` BID_LEVEL_COLORS light-only pairs → semantic matched pairs: Конкурентная(default)=muted tint `bg-muted/50 border-border`; Лидеры(blue)=`bg-status-information/15 border-status-information/30`; Топ-2(green)=`bg-status-success/15 border-status-success/30`. `KeywordRow:163` `bg-gray-50` → `bg-muted/50`. Both themes. page.tsx already token-clean (verify + pin).
- [x] Task 3: AX fixes (AC: #3) — **BackLink nested-interactive FIX** (page.tsx:57-65: Link>Button violates epic AX "semantic link without nested interactive semantics") → CANON: supplies/[id]/page.tsx:107-113 pattern — plain `<Link className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">` + ArrowLeft, NO button classes/span; semantics test via getByRole('link') (supplies __tests__:264 precedent). Keywords section accessible name: h4 «Диапазоны ставок…» gets id + container `aria-labelledby` (tabular-list contract). Repeated-actions naming N/A (no actions).
- [x] Task 4: Guards + tests (AC: #1-3) — no-palette/no-hex source-contract over the 2 production files (170.1 3-branch regex canon; NB: «Кампания #12345» in tests is 5 digits — length-branches exempt, verify self-test); token pins for 3 bid levels + tier-distinctness (3 distinct + neutral); BackLink semantics test (link role, no nested button); state-distinct suite (5 branches); accessible-name test. Flip any legacy pins (card tests currently have NO palette pins — verify, add token pins).
- [x] Task 5: Validation + 2-pass fresh review + PR + cleanup (AC: #4-9) — route 11 (baseline 10) + card/guard 26 (17+2+7); full 19 086/0 (floor 19 076, +10 exact growth); lint 0/0; tsc 0; max-lines OK; build 0. Round-1 opus APPROVE (1 MEDIUM brittle-pin + 3 LOW → F1/F2 fixed `580022a1`, F3/F4 house-convention notes); round-2 opus **APPROVE** — merge gate clear. e2e N/A (no spec exists — dispositioned). PR #239 merged `5bb0dcc3`; branch remote/local + worktree deleted, 0/0/0 absence proofs. — gates incl. BOTH vitest targets (route + card tests); e2e — NO dedicated spec exists (disposition N/A, record); CE untouched-proof: advertising root + hooks/API/types zero-diff.

## Dev Notes

### Owned surface & scope

- Owned: `campaigns/[advertId]/{page.tsx,__tests__/page.test.tsx}` (66+128 lines) + `src/components/custom/advertising/BidRecommendationsCard.tsx` (178) + its tests — **exclusively consumed by this route** (validated in 170.1: root has no import). FORBIDDEN: advertising root route (170.1's surface), `useBidRecommendations` hook, `src/lib/api/bid-recommendations.ts`, `@/types/bid-recommendations`, global route/not-found definitions, all other lib/hooks/types.
- Legacy total: 4 light-only class-pairs + 1 row bg in ONE file; page.tsx clean. Baselines: 10 + 17 owned tests; full floor **19 076/0**. Node 24.18.0/npm 11.11.0.

### Canon mapping

- /15 tint + /30 border matched pairs (169.5/170.1); muted/50 neutral (170.1 keyword rows); status-information/success per 169.3/169.9; no-palette guard 170.1 canon; Link-not-Button-nested = epic AX contract literal.

### References

- [Source: epics-166-174 §Story 170.2 + §C1-C11]
- [Source: `.omx/plans/170.2-migrate-advertising-campaign-bid-recommendation-detail.md`]
- 170.1 precedent: this card was the forbidden exclusive; now owned (its retirement/migration is exactly this story)

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) via orchestrator (migration `482d200a` + round-1 fixes `580022a1` — orchestrator-applied); reviews: 2× code-reviewer (opus fresh) — round-1 APPROVE (4 findings), round-2 APPROVE (merge gate clear).

### Debug Log References

### Completion Notes List

- Migration `482d200a` (5 files, +159/−14): BID_LEVEL_COLORS → semantic matched pairs (Конкурентная=muted/50+border-border; Лидеры=status-information/15+/30; Топ-2=status-success/15+/30); KeywordRow bg-gray-50 → bg-muted/50; both themes verified.
- BackLink nested-interactive FIX: supplies/[id] canon (plain Link inline-flex text-muted-foreground hover:text-foreground + ArrowLeft aria-hidden; Button import removed) — epic AX literal satisfied; runtime role/href/no-button test.
- Keywords accessible name: h4 id="bid-keywords-heading" + container aria-labelledby (getByLabelText pin).
- Guards (NEW campaign-detail-source-contracts.test.tsx, 7 tests): no-palette/no-hex over BOTH production files (170.1 3-branch canon + self-tests incl. «#12345» 5-digit exemption); 3 bid-level token pins + tier-distinctness + default≠success; BackLink contract pin (wolf-proof after r1-F1: href + class-substring + no-Button, NOT verbatim className); aria-labelledby pin. BID_LEVEL_COLORS exported for single-source pinning.
- C4 dispositions: 5 states TESTED (pre-existing suites); not-found/unauthorized N/A-split (hook exposes no status split — evidence in guard header); partial TESTED; stale cacheAge TESTED (mock-only path noted); consequential bid actions N/A (read-only card).
- Round-1 fixes `580022a1`: brittle verbatim-className pin → contract-based; order-dependent querySelector → text-located + classList (order-independent); unused-var cleanup.

### Gaps

- e2e: NO dedicated spec exists for this route (grep-verified) — visual/e2e evidence deferred to 174.3 consolidated pass.
- cacheAge indicator is mock-only on live boundary (normalizer never sets cachedAt; FS-forbidden — documented, do not "fix").
- ArrowLeft aria-hidden deviation from supplies canon verbatim — consistent with card icon pattern (r2-verified harmless).

### File List

Diff 376ecadf..HEAD = **5 files** (2 M route page+test; 2 M card+card-test; 1 A guard) — +159/−14. Exact: `git diff --name-status 376ecadf..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-25 | Story created from direct source read (smallest epic story: 2 source files; BackLink nested-interactive AX defect found; boundary coercion dispositioned — no preface). Validation PASS-WITH-FINDINGS (0 criticals; supplies/[id] canon cited; cacheAge mock-only note). Plan referenced as authoritative. |
| 2026-08-25 | Round-1 fixes applied (wolf-proof contract pin, order-independent selector). Status: ready-for-dev → review. |
| 2026-08-25 | Implemented + merged: PR #239 (impl `482d200a` + r1 `580022a1` + story `9fdf1dc2`, merge `5bb0dcc3`); route 11 + card/guard 26, full 19 086/0 (+10 exact); 2×opus APPROVE×2; cleanup 0/0/0. Status: review → done. **Lessons:** (1) Verbatim-className пин — «волчий»: рвётся от форматтера, потом ослабляется; пинь контракт, не строку. (2) Самая маленькая стори отдала AX-дефект и 2 тест-фикса — размер не отменяет дисциплину. (3) «1 hex» в разведке = «#12345» в тексте — проверяй контекст греп-хитов. |
