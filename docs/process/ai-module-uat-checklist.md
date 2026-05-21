# AI Module — Manual Visual UAT Checklist

**Epic scope**: Stories 110.2, 110.3, 110.4, 110.5, 112.1, 112.2
**Authored**: 2026-05-20 — Story 112.4-FE (Epic 110-FE retro A-3 action item)
**Target audience**: QA tester / developer who has access to a test cabinet in `ready` state

> **Status note**: Visual UAT was deferred until a test cabinet reaches `readinessLevel=ready` (system-wide AiStatusResponse.readinessLevel, NOT per-model ModelStatus) with real evaluation
> data (Locked Decision Q3, `docs/process/ai-module-architecture.md`). Run this checklist once that
> prerequisite is met. All UI strings below are in Russian — they reflect exactly what the tester sees.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Story 110.2 — Evaluations list](#story-1102--evaluations-list)
3. [Story 110.3 — SKU accuracy drill-down](#story-1103--sku-accuracy-drill-down)
4. [Story 110.4 — Thumbs feedback](#story-1104--thumbs-feedback)
5. [Story 110.5 — CSV export](#story-1105--csv-export)
6. [Story 112.1 — Model rollback (admin)](#story-1121--model-rollback-admin)
7. [Story 112.2 — AI preferences (admin)](#story-1122--ai-preferences-admin)
8. [Edge case probes](#edge-case-probes)
9. [Sign-off block](#sign-off-block)

---

## Prerequisites

The following cabinet state is required before running this checklist. Without it, most steps will
hit empty-state paths (which are covered in [Edge case probes](#edge-case-probes)).

| # | Requirement | How to verify |
|---|-------------|---------------|
| P-1 | At least one AI model with `status = active` | Visit `/analytics/models` → row shows status badge "Активна" (backend semantic: `ModelStatus = 'active'`; NOT to be confused with system-wide `ReadinessLevel = 'ready'` which lives on `AiStatusResponse.readinessLevel` (see `src/types/ai/status.ts`)) |
| P-2 | Evaluations populated for that model | Visit `/analytics/models/{id}/evaluations` → summary cards show non-null MAPE and skuCount > 0 |
| P-3 | Feedback entries in the system (at least 2, one thumbs-up and one thumbs-down) | Check feedback existence via database query, backend admin tool, OR test-api/99-ai.http if available (the GET endpoint is NOT in the frontend API client; backend may or may not expose it) |
| P-4 | Owner-role user credentials for admin tests (Stories 112.1, 112.2) | Login email with `role = owner` |
| P-5 | Non-owner user credentials (Analyst or Manager role) for access-denial tests | Login email with `role = analyst` or `role = manager` |
| P-6 | DevTools network throttling available (Chrome / Firefox) | F12 → Network → Throttle dropdown |

---

## Story 110.2 — Evaluations list

**Route**: `/analytics/models/{id}/evaluations`
**Source story**: `_bmad-output/implementation-artifacts/110-2-fe-evaluations-list-page.md`

### 110.2-A: Page load — loading skeleton

| # | Action | Expected result |
|---|--------|----------------|
| 1 | Navigate to `/analytics/models/{id}/evaluations` with slow connection (throttle to Slow 3G before clicking) | Three skeleton placeholders appear: header skeleton, summary cards skeleton, table skeleton |
| 2 | Wait for data to load | Skeletons disappear and content renders |

### 110.2-B: Happy path — evaluations list rendering

| # | Action | Expected result |
|---|--------|----------------|
| 3 | Open `/analytics/models/{id}/evaluations` | Page title card shows "Оценки точности модели" |
| 4 | Inspect model identity row below the title | Shows model type label (e.g., "Прогноз продаж"), version number (e.g., "v3"), and status badge (e.g., "Активна") with correct colour |
| 5 | Inspect summary cards | Three cards visible: "Средняя точность (MAPE)" with a percentage value, "Последняя оценка" with a formatted date, "SKU оценено" with a count |
| 6 | Inspect MAPE value format | Uses Russian locale: comma as decimal separator, space before percent sign (e.g., "15,2 %"), NOT "15.2%" |
| 7 | Inspect date format | Russian short format "DD.MM.YYYY" (e.g., "17.05.2026"), NOT ISO format |
| 8 | Inspect table headers | Columns: "Дата", "Артикул", "Прогноз (ед.)", "Факт (ед.)", "MAPE ед." with sort button, "MAPE выр." with sort button |
| 9 | Cabinet-level row | One row shows "По кабинету" in the Артикул column (for the cabinet-aggregate evaluation) |

### 110.2-C: Sort interaction

| # | Action | Expected result |
|---|--------|----------------|
| 10 | Click "MAPE ед." sort button (default ASC) | Rows reorder: lowest MAPE units first; sort button shows ↑ indicator |
| 11 | Click "MAPE ед." sort button again | Rows reorder: highest MAPE units first; sort button shows ↓ indicator |
| 12 | Click "MAPE выр." sort button | Rows reorder by MAPE revenue ASC; ↑ indicator on that column; ↑ removed from units column |

### 110.2-D: Navigation to SKU detail

| # | Action | Expected result |
|---|--------|----------------|
| 13 | Click a row with a real артикул (non-cabinet row) | Navigates to `/analytics/models/{id}/evaluations/sku-accuracy?nmId={nmId}` |
| 14 | Click the "По кабинету" row | Nothing happens (no navigation); cursor does not change to pointer |

### 110.2-E: "Подробные оценки" button on ModelPerformanceDetail

| # | Action | Expected result |
|---|--------|----------------|
| 15 | Navigate to `/analytics/models/{id}/performance` | "Подробные оценки" button is visible in page actions area |
| 16 | Click "Подробные оценки" | Navigates to `/analytics/models/{id}/evaluations` |

---

## Story 110.3 — SKU accuracy drill-down

**Route**: `/analytics/models/{id}/evaluations/sku-accuracy?nmId={nmId}`
**Source story**: `_bmad-output/implementation-artifacts/110-3-fe-sku-accuracy-table.md`

### 110.3-A: Overview table

| # | Action | Expected result |
|---|--------|----------------|
| 17 | Navigate to `/analytics/models/{id}/evaluations/sku-accuracy` (without nmId) | Page shows an overview table of all evaluated SKUs with columns for артикул, средний AI MAPE, средний baseline MAPE, AI точность %, baseline точность % |
| 18 | Inspect MAPE values | Russian locale formatting; null values render "—" (em-dash, not 0 or blank) |

### 110.3-B: Per-SKU drill-down

| # | Action | Expected result |
|---|--------|----------------|
| 19 | Click on a SKU row in the overview table | Page URL updates to include `?nmId={nmId}` and detail section appears |
| 20 | Inspect per-SKU history rows | Each evaluation period shows date, predicted units, actual units, AI MAPE, baseline MAPE in Russian locale |
| 21 | Navigate directly to `?nmId={knownNmId}` | Page loads with that SKU pre-selected; detail section visible without clicking the table |
| 22 | Navigate with `?nmId={unknownNmId}` | Page shows a non-destructive Alert: "SKU не найден" or equivalent message; overview table still visible |

---

## Story 110.4 — Thumbs feedback

**Route**: `/analytics/models/{id}/evaluations` (feedback buttons are in the evaluations table)
**Source story**: `_bmad-output/implementation-artifacts/110-4-fe-thumbs-feedback-mutation.md`

### 110.4-A: Thumbs-up click

| # | Action | Expected result |
|---|--------|----------------|
| 23 | Locate a table row with thumbs feedback buttons (👍 / 👎) | Both buttons visible and enabled |
| 24 | Click 👍 (thumbs up) | Button enters pending state: spinner (Loader2 icon) replaces the button icon; button disabled during pending |
| 25 | Wait for success response | Spinner disappears; inline confirmation "Спасибо" appears (rendered as a `role="status"` `aria-live="polite"` element replacing the thumbs buttons — NOT a toast, NOT "Спасибо за оценку") |
| 26 | Verify inline confirmation resets | Inline "Спасибо" element auto-resets back to thumbs buttons within 2 seconds |

### 110.4-B: Thumbs-down click

| # | Action | Expected result |
|---|--------|----------------|
| 27 | Click 👎 (thumbs down) on a different row | Same pending → success flow as thumbs-up |
| 28 | Inline "Спасибо" appears for thumbs-down | Same inline `role="status"` element as thumbs-up path — consistent, auto-resets in 2 seconds |

### 110.4-C: 403 error rendering

| # | Action | Expected result |
|---|--------|----------------|
| 29 | Log in as non-owner user, navigate to evaluations | Thumbs buttons visible in table (feedback is available to non-owner roles per Story 110.4 AC) |
| 30 | If 403 occurs from backend permission change: click thumbs button | Error toast shows "Нет доступа" — NOT a generic "Что-то пошло не так" error |

### 110.4-D: Rapid click debouncing

| # | Action | Expected result |
|---|--------|----------------|
| 31 | Click thumbs-up rapidly multiple times on the same row | Only ONE request is sent (debounced or disabled-while-pending); button stays disabled after first click until response |

---

## Story 110.5 — CSV export

**Route**: `/analytics/models/{id}/evaluations`
**Source story**: `_bmad-output/implementation-artifacts/110-5-fe-csv-export-retrospective.md`

### 110.5-A: Export button state

| # | Action | Expected result |
|---|--------|----------------|
| 32 | Open evaluations page with data present | Export CSV button visible and enabled in the page header card |
| 33 | Check empty-evaluations state (use a model with no data or navigate to a no-data cabinet) | Export CSV button is disabled (greyed out, not clickable) |

### 110.5-B: Download and Cyrillic encoding

| # | Action | Expected result |
|---|--------|----------------|
| 34 | Click Export CSV button | File download starts immediately (client-side generation, no spinner required) |
| 35 | Check downloaded filename | Format: `evaluations-{modelId}-{date}.csv` (e.g., `evaluations-model-1-2026-05-17.csv`) |
| 36 | Open CSV in Excel (double-click the downloaded file) | File opens without asking about encoding; Cyrillic column headers render correctly (e.g., "Артикул", "Дата оценки") |
| 37 | Verify BOM in hex editor or via `xxd` | First 3 bytes are `EF BB BF` (UTF-8 BOM) |
| 38 | Check decimal format in numeric columns | Russian locale: comma decimal separator ("15,2"), NOT English dot ("15.2") |

---

## Story 112.1 — Model rollback (admin)

**Route**: `/analytics/ai-admin/models`
**Source story**: `_bmad-output/implementation-artifacts/112-1-fe-model-rollback-admin-ui.md`

### 112.1-A: Owner-only access

| # | Action | Expected result |
|---|--------|----------------|
| 39 | Log in as owner, navigate to `/analytics/ai-admin/models` | Page loads with model list table |
| 40 | Log in as non-owner (analyst/manager), navigate to same URL | Page shows denied Alert (e.g., "Доступ запрещён" or "Только для владельцев") — NOT a blank page or redirect loop |
| 41 | As non-owner: inspect page for rollback buttons | No rollback buttons visible |

### 112.1-B: Rollback confirmation dialog

| # | Action | Expected result |
|---|--------|----------------|
| 42 | As owner, click "Откатить" button for a model | AlertDialog appears with title mentioning rollback and a reason input field |
| 43 | Leave reason field empty, click confirm button | Confirm button disabled OR inline validation error shown — cannot submit without reason |
| 44 | Enter a short reason (< 10 chars, e.g., "тест"), click confirm | Validation error: reason too short (minimum 10 characters) |
| 45 | Enter a valid reason (≥ 10 chars, e.g., "Плохой прогноз на прошлой неделе"), click confirm | Dialog closes; success toast shows "Модель откачена. Причина залогирована." |
| 46 | After successful rollback: model list refreshes | The rolled-back model shows updated status in the table |
| 47 | Click "Откатить", then click Cancel or press Escape | Dialog closes without any action; model state unchanged |

---

## Story 112.2 — AI preferences (admin)

**Route**: `/analytics/ai-admin/preferences`
**Source story**: `_bmad-output/implementation-artifacts/112-2-fe-ai-preferences-admin-ui.md`

### 112.2-A: Owner-only access

| # | Action | Expected result |
|---|--------|----------------|
| 48 | Log in as owner, navigate to `/analytics/ai-admin/preferences` | Page loads with AI settings form |
| 49 | Log in as non-owner, navigate to same URL | Page shows denied Alert — NOT a blank page |

### 112.2-B: AI engine toggle

| # | Action | Expected result |
|---|--------|----------------|
| 50 | Locate the "Включить AI прогнозы" toggle Switch | Toggle is visible with current state (on/off) reflecting backend value |
| 51 | Click the toggle to change its state | Toggle visually changes immediately (optimistic UI or pending state indicator) |
| 52 | Wait for success response | Success toast appears: "Настройки сохранены." |
| 53 | Reload the page | Toggle reflects the saved state (change persisted) |

### 112.2-C: Error states

| # | Action | Expected result |
|---|--------|----------------|
| 54 | Simulate 403 error (throttle network, or log in as non-owner and try direct API call) | Error state shows "Нет доступа" — distinct from generic error |
| 55 | Simulate generic server error (throttle + force 500 via DevTools request blocking) | Error toast or inline error shows generic message; NOT "Нет доступа" |
| 56 | Verify 403 and generic errors are visually distinct | Different icon, colour, or text — not the same component instance |

---

## Edge case probes

These probes apply across all stories. Run at least the checked ones for each story section.

### Empty data states

| # | Scenario | Expected result |
|---|----------|----------------|
| 57 | Evaluations page: model has `status = active` but no evaluations yet | Non-destructive Alert: "Нет оценок этой модели. Модель должна быть оценена хотя бы один раз для появления данных здесь." Export CSV button disabled |
| 58 | SKU accuracy page: no SKU data | Non-destructive Alert or empty-state message; no JS error in console |
| 59 | Preferences page: `aiEnabled = null` from backend (unexpected) | Page renders without crashing; toggle shows a safe default state |

### 403 errors

| # | Scenario | Expected result |
|---|----------|----------------|
| 60 | Open evaluations as logged-out user | Redirected to login page; no blank page |
| 61 | Owner-only pages (112.1, 112.2) with non-owner role | Denied Alert shown inline — NOT redirect to login |

### Network failure

| # | Scenario | How to trigger | Expected result |
|---|----------|----------------|----------------|
| 62 | Evaluations list fails to load | DevTools → Network → Block request URL for `/v1/ai/evaluations` | Destructive Alert: "Ошибка загрузки оценок модели"; page does not crash |
| 63 | Models list fails to load | Block `/v1/ai/models` | Destructive Alert: "Ошибка загрузки списка моделей" |
| 64 | Thumbs feedback POST fails | Block `/v1/ai/feedback` | Error toast shown; feedback buttons re-enable after error |
| 65 | CSV export (client-side) | Not applicable (no network request) | Button always works if evaluations are in cache |

### Cyrillic content rendering

| # | Scenario | Expected result |
|---|----------|----------------|
| 66 | Export CSV, open in Excel | All column headers in Russian render without garbled characters (encoding correct, BOM present) |
| 67 | Success toast messages | Русский текст renders correctly in all browsers (Chrome, Firefox, Safari) |
| 68 | Error messages with dynamic content (e.g., server error messages in Russian) | No mojibake; proper UTF-8 throughout |

### Rapid clicks / concurrent actions

| # | Scenario | Expected result |
|---|----------|----------------|
| 69 | Rapid thumbs-up clicks | Only one POST sent; button disabled after first click |
| 70 | Rapid rollback button clicks | AlertDialog prevents double-submit; confirm button disabled while pending |
| 71 | Toggle AI enabled switch rapidly | Only last state persists; no race condition visible |

### Browser back-button behaviour

| # | Scenario | Expected result |
|---|----------|----------------|
| 72 | Navigate to SKU accuracy drill-down (`?nmId=...`) then press browser Back | Returns to evaluations list; list state (sort order, scroll position) ideally preserved |
| 73 | Navigate from evaluations to performance page, then Back | Returns to evaluations page; evaluations data loads from cache (no full re-fetch visible) |

---

## Sign-off block

Complete one row per test run. Multiple testers may sign off for the same cabinet.

| Date | Tester | Cabinet ID | Result | Notes |
|------|--------|------------|--------|-------|
| | | | PASS / FAIL / PARTIAL | |
| | | | PASS / FAIL / PARTIAL | |
| | | | PASS / FAIL / PARTIAL | |

**Definition of PASS**: All steps in sections 110.2–112.2 pass with no regressions. Edge case probes 57–73 pass.

**Definition of PARTIAL**: One or more edge-case steps fail but all happy-path steps pass. Document which steps failed in Notes.

**Definition of FAIL**: Any happy-path step fails, or a critical edge-case (empty data, 403 denial, network failure) renders a blank page or JS console error.
