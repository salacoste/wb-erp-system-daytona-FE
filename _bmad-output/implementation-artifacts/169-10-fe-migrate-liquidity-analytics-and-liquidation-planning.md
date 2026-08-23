# Story 169.10-FE: Migrate Liquidity Analytics and Liquidation Planning

Status: done

## Story

As an owner/operations user, I want `/analytics/liquidity` to connect inventory liquidity distribution, benchmarks, trends, SKU detail, and liquidation scenarios, so that I can identify tied-up capital and evaluate an action safely.

Plan: `.omx/plans/169.10-migrate-liquidity-analytics-and-liquidation-planning.md` (authoritative). No separate prep artifact — this file is the closeout record created at delivery.

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) ×2 rounds (migration + REQUEST-CHANGES micro-fix) via orchestrator on glm-5.2[1m]; interim micro-fix (lib-hex channels). Reviews: 2× code-reviewer (opus) FRESH-parallel.

### Completion Notes List

- Owned surface only: 22 files (19 modified + 3 new) under `src/app/(dashboard)/analytics/liquidity/**`; `src/lib/**` untouched (read-only — lib stays classification single-source).
- Charts: 6 trend series → `var(--color-chart-1..6)` (stack 1-4 liquid→illiquid + metrics 5-6; 0 collisions; structural pin); grid/tick/axis → border/chart-axis (structure preserved); 3 tooltips → bg-popover+shadow-lg; tooltip headers → popover-foreground.
- NEW `liquidity-category-tokens.ts` single-sources category colors (chart-1..4) across cards + donut + table badge; lib hex/bgColor/textClass channels no longer consumed by the route (chips = `color-mix` 15%/30% tint + **text-foreground** — measured: chart-token-as-text on 15% tint fails AA 3.71–4.19, foreground text passes).
- Benchmarks: local `overall_status → token` map (excellent/good→success, warning, critical→error); `${color}15` alpha-hack + lib textClass removed.
- SummaryBar → solid semantic pairs (169.9 canon); frozen-tier thresholds documented from lib (`formatFrozenCapitalWarning` ⇔ pct>5); dead disjunct removed; pct=5 → neutral = deliberate legacy-visual decision (lib `isFrozenCapitalHealthy` divergence documented).
- ScenarioCard: urgency label→status token (lib `getScenarioUrgencyLabel` = classification source; hex helper dropped); /15 badges; Скидка/Прибыль → financial valence; ring-ring recommended. Defensive comments (null→'—', ∞/999 sentinel) preserved verbatim.
- Header → PageHeader+actions (Droplets decorative icon dropped — no slot, 169.9 precedent). Table → scroll-region + static TableCaption («Ликвидность товаров по SKU», period visible in presets) + aria-sort Buttons (min-h-11) + tabular-nums (SKU font-mono, negative-pinned). PlannerModal tokenized (display-only — the plan's AX form-items recorded N/A: no inputs exist).
- Guard: no-palette (+lime/rose/sky/slate/zinc/neutral/stone families), no-hex letter-lookahead, runtime-lib-hex-channel negatives (`config.color|config.bgColor|statusConfig.color|statusConfig.textClass|getScenarioUrgencyColor|getFrozenCapitalStatusClass` forbidden in owned sources).
- Gates (final): targeted 8 files / **59/59** (baseline 36 → +23 growth-only); full vitest **18 936/0** (floor 18 913); lint 0/0; tsc 0; max-lines OK; format clean; doc-cit 0; locale 4=baseline; diff-check clean; build exit 0. e2e static sweep: all pins intact («Ликвидность товаров», «Обновить», категории, columnheaders).
- Reviews: 2×opus **REQUEST-CHANGES** → 3 HIGH fixed (lib-hex flowing into donut fills / table status badge / benchmarks chip — cross-surface color contradiction, measured 1.7–3.76 contrast fails) + MAIN spot-verification of fixes on disk; MEDIUMs fixed (chart-chip text→foreground; dead disjunct) or folded.
- PR #212 (impl `84250483`, merge `0245f52b`); `gh pr merge` GraphQL response timed out but merge landed server-side — ls-remote proof caught the un-deleted remote branch → manual delete; cleanup with absence proofs.

### Gaps

- `/15` status-chip AA light escalations registered with exact numbers: success 4.19, warning 3.96 (dark chart-2 4.46) — consolidated fix at 174.2 (darken light status tokens).
- URGENCY_CLASS keyed by Russian labels (lib label = source; silent-break on lib rename — compile-invisible; fallback text-foreground).
- Pie `as unknown as` pre-existing double-cast retained (moot post-fix); chart-3-as-text light margin 0.02 (4.52 vs 4.5).
- Live visual/browser matrix not run this cycle (jest-level only); 174.x consolidated pass.

### File List

- M: 16 components + 3 test files; A: `liquidity-category-tokens.ts`, `__tests__/{liquidity-presentation-source-contracts,LiquiditySummaryBar,LiquidityChips}.test.tsx`… (full list in PR #212)

### Change Log

| Date | Change |
|---|---|
| 2026-08-23 | Implemented via executor cycle + REQUEST-CHANGES fix round; merged PR #212 (`84250483`, merge `0245f52b`); cleanup with absence proofs. Status: backlog → done. **Lessons:** (1) Lib-цветовые каналы (config.color/bgColor/textClass) невидимы class-regex guard'ам — нужен runtime-channel-негатив. (2) Chart-токен как ТЕКСТ на тинтах проваливает AA (3.71-4.19) — текст foreground, цвет только в заливках. (3) gh merge «timeout» может быть успешным сервер-side — проверяй state до retry. |
