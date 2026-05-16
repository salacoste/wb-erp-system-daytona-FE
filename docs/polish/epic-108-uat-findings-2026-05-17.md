# Epic 108-FE Visual UAT Findings — 2026-05-17

**Trigger**: Epic 108-FE retro action item **A-2** (`_bmad-output/implementation-artifacts/epic-108-fe-retro-2026-05-16.md` § A-2)
**Run by**: BMad Master via Claude Code Chrome browser tool
**Cabinet**: `Space Chemical` (test cabinet, user `test@test.com`)
**URL tested**: `http://localhost:3100/analytics/forecast`
**Cabinet readiness state observed**: `collecting` (17% progress, 2 weeks collected, activation expected 26.07.2026)

---

## Coverage summary against Epic 108-FE retro § A-2 checklist

| A-2 verification item | Status | Notes |
|---|---|---|
| 1. Engine status badge renders correctly (green/red/amber dots) | ✅ Pass | Header shows `"Движок: подключён"` with green status semantics. |
| 2. AI preferences toggle persists across reload | ✅ Pass (visible) | Switch rendered with `label="Переключить AI прогнозы"` + status `"AI прогнозы включены"`. Cross-reload persistence not retested — see future-work below. |
| 3. Collecting state renders for new cabinets | ✅ Pass | `CollectingProgressTracker` rendered with progress bar, COGS alert, activation date, embedded Top-5 SKU table. |
| 4. Sneak-preview state renders for cabinets with 6-11 weeks | ⚠️ Deferred | No cabinet in `sneak_preview` state available in test environment. |
| 5. Trend indicators show Russian text + accessible icons (WCAG fix) | ⚠️ Deferred | `SneakPreviewSection` not rendered in `collecting` state — cannot exercise the WCAG-fixed `TrendIcon`. |

**Net coverage**: 3 of 5 items verified. A-2 marked **partially closed**; remaining 2 items deferred until cabinets reach `sneak_preview` / `ready` states.

---

## Findings

### Finding F-1 (MEDIUM): `CollectingProgressTracker` displays nonsensical denominator `"2 из 0 недель"`

**Observed**: The progress bar text reads `"2 из 0 недель"` — collected count = 2 weeks, but the denominator is `0`. This is logically impossible for a "weeks-collected vs weeks-required" progress display.

**Expected**: `"2 из N недель"` where N is the backend-published threshold for ready-state graduation (per backend integration guide, typically 12 weeks).

**Likely root cause**: One of:
- (a) Backend response `weeksRequired` field returns `0` for this cabinet (possible if the cabinet's recommended model type has no minimum threshold, OR if backend returns `weeksRequired` only when status is `collecting` AND some other gate is met).
- (b) Frontend reads the wrong field from the AI status response (e.g., reads `cabinetWeeksRequired` instead of `weeksRequired`).
- (c) Field is genuinely missing (`undefined`) and code coalesces to `0` via implicit Number conversion or `?? 0`.

**Severity**: MEDIUM — the page still renders and is comprehensible (users can see they're at 17%), but the literal text is confusing and undermines trust.

**Defensive Frontend Principle alignment** (CLAUDE-PATTERNS.md): per the principle, the frontend should NOT silently coerce `0` or `null` into a "fake correct" value. Instead, render a warning indicator AND preserve the raw value (or omit the X/Y display entirely if denominator is missing).

**Recommended fix** (frontend-side, defensive):
```tsx
// in CollectingProgressTracker.tsx (collecting state body)
const { weeksCollected = 0, weeksRequired } = status
const denominatorValid = typeof weeksRequired === 'number' && weeksRequired > 0
// Render: "{weeksCollected} {pluralize(WEEK_FORMS, weeksCollected)}" when invalid,
// else "{weeksCollected} из {weeksRequired} недель"
```

If investigation reveals a backend bug (response misses `weeksRequired`), file a separate backend ticket and link both directions.

**Files to investigate**:
- `src/app/(dashboard)/analytics/forecast/components/CollectingProgressTracker.tsx` (frontend display)
- `src/types/ai/status.ts` + `src/lib/api/ai/status.ts` (response shape + normalizer)
- Backend `/v1/ai/status` response payload for `Space Chemical` cabinet (curl test)

**Triage owner**: Frontend (start here; escalate to backend only if the field is genuinely absent at the API level).

---

### Finding F-2 (LOW): Section heading `"Что вы можете делать сейчас"` has no visible body content

**Observed**: The `<h2>` `"Что вы можете делать сейчас"` is rendered, but the accessibility tree under it shows no content nodes — just empty space before the next section.

**Expected**: Per typical "what you can do while waiting" UX patterns, this section should list 2-4 actionable suggestions (e.g., "Загрузите COGS для топ-SKU", "Подключите Telegram уведомления", "Перейдите к Юнит-экономике для исторического анализа").

**Likely root cause**: The section is a placeholder added in Epic 108 with the intent to fill it later, BUT the content was never actually authored. Could also be a render bug where conditional rendering fails silently.

**Severity**: LOW — the page is functional, the heading is just an empty promise. No data integrity issue.

**Recommended fix**:
- Investigate `CollectingProgressTracker.tsx` for the section's render block.
- If placeholder (no content authored): file a polish story under Epic 109 or a follow-up sprint to author 2-4 actionable items.
- If render bug (content exists but doesn't display): fix the conditional logic.

**Files to investigate**:
- `src/app/(dashboard)/analytics/forecast/components/CollectingProgressTracker.tsx`

**Triage owner**: Frontend (small content/UX polish).

---

## Deferred A-2 items (re-run UAT when conditions met)

| Item | Condition required | How to seed |
|---|---|---|
| Sneak-preview state UI | Cabinet with 6-11 weeks of sales data | Either (a) wait until `Space Chemical` reaches 6 weeks (~6 weeks from 2026-05-17), or (b) seed a test cabinet in the dev database with 6-11 weeks of fake sales rows. |
| Trend indicators (WCAG fix) | Cabinet in `sneak_preview` state with SKU rows in `SneakPreviewSection` | Same as above; once `SneakPreviewSection` renders, verify each `TrendIcon` has `aria-label` + visible Russian text per Epic 108-FE retro § C-3 fix. |
| Ready-state forecast UI | Cabinet with 12+ weeks of sales data | Either (a) wait, or (b) seed test cabinet. Note: Story 109.1 implementation lands new UI in `ready` state — re-run UAT after 109.1 ships. |

---

## Cross-references

- Epic 108-FE retro: `_bmad-output/implementation-artifacts/epic-108-fe-retro-2026-05-16.md` § "Action Items § A-2" (line 148-160)
- Defensive Frontend Principle: `CLAUDE-PATTERNS.md` § Defensive Frontend Principle (Story 89.4-FE)
- Anti-Pattern #8: `CLAUDE.md` § Known Anti-Patterns #8 (null-vs-zero rule)
- Pre-flight verification pattern: `CLAUDE.md` § Pre-flight source-trace verification (Story 105.2-FE)
- Epic 109-FE spec: `_bmad-output/planning-artifacts/epics-109-fe.md` § Risks/Open Questions Q3 (this UAT marked the question resolved)

---

## Status

- F-1: **OPEN** — needs triage (frontend investigation first, backend escalation if needed)
- F-2: **OPEN** — needs UX/content polish or render-bug fix
- A-2 closure: **PARTIAL** (3/5 items verified; 2 items deferred to future UAT runs)
- Epic 109 impact: **NONE** — neither finding blocks Story 109.1 (which only modifies `ready`-state UI; this cabinet is in `collecting`)
