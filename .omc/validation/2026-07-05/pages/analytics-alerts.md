# /analytics/alerts — Центр уведомлений
**Route:** `/analytics/alerts` · **Filters state:** tab=Обзор

## 1. Load
- HTTP statusMap (all 200): `GET /v1/alerts/rules`, `GET /v1/alerts/history?limit=…`, `GET /v1/alerts/summary?days=7`, `GET /v1/analytics/supply-planning`, cabinet meta.
- Renders: H1 "Центр уведомлений", "Создать правило" button, tablist (Обзор / Активные правила / История).
- No console errors.
- Current state: 0 alert rules, 0 history, summary `{totalAlerts:0, byType:[], bySeverity:{}}`.

## 2. Interactive elements
- **Tabs (Обзор/Активные правила/История)** → switch tabpanels. **PASS.**
- **"Создать правило" button** → opens rule-creation flow (POST `/v1/alerts/rules`). **PASS** (button present, interactive).
- Rule CRUD endpoints (`POST/PATCH/DELETE /v1/alerts/rules`) wired in `src/lib/api/alerts.ts`.

## 3. Data vs API
| Rendered | API field | Match |
|---|---|---|
| Empty-state (no rules/history) | `rules: []`, `history: []`, `summary.totalAlerts: 0` | ✅ honest empty state |

## 4. AP#8 runtime
- Empty state shown honestly (no fabricated rules). ✅

## 5. Findings
- None. Page functional; no live rules to exercise CRUD on (cabinet has none seeded), but create button + tabs verified interactive.
