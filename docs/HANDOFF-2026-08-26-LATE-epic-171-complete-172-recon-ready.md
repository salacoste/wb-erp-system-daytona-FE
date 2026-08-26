# HANDOFF 2026-08-26 (вечерняя сессия) — Эпик 171 ЗАКРЫТ 9/9; NEXT 172.1 с готовой разведкой

> **§0 RECONCILED 2026-08-27 (сессии 172.1-172.4)**: 172.1 (#278) · 172.2 (#280) · 172.3 (#282) · 172.4 (#285) SHIPPED — полный пол **19 319/0**, NEXT = **172.5 (owner-координация!)**. Automation-домен мигрирован целиком. Ниже §0 обновлён; §1-§2 исторические.

> **Вход-точка** после закрытия эпика 171-FE целиком (171.7: PRs #266+#267 · 171.8: #268+#269 · 171.9: #270+#271 · эпик-flip: #271 · handoff-§0: #272 · recon 172.1: #273; `main = a6167e88`).
> **Оркестратору следующей сессии**: операционный промпт — [`ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md`](ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md) (bootstrap §1, цикл стори §4, гейты §5, нормы §6, ловушки §8). Этот handoff заменяет вход-точку [`HANDOFF-2026-08-26-epic-171-models-tree-and-full-debt-registry.md`](HANDOFF-2026-08-26-epic-171-models-tree-and-full-debt-registry.md) (его §0 синхронизирован PR #272; §1-§5 исторические).
> BE-канон: [`../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`](../docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md) (по FE-прогрессу устарел, по BE-долгам актуален).

---

## 0. Верифицированное состояние (26.08 поздно, после PR #273)

| Метрика | Значение |
|---|---|
| `main` | `25c8bc19` (PR #285), дерево чистое, сессионные ветки/worktrees 172.1-172.4 = **0/0/0** |
| Прогресс миграции 166-174 | **58/94** канонических стори |
| Эпики | 166 ✅ · 167 ✅ · 168 ✅ · 170 ✅ (7/7) · 171 ✅ (9/9) · **172 IN PROGRESS (4/17)** · 169 in-progress (чужая lane, §2.4) · 173/174 backlog |
| Полный пол (vitest) | **19 319 / 0** (… → 19 311 → 19 319 [+8: гард+близнец 172.4]) |
| Линтер/типы | lint 0/0 (zero-warning), tsc 0, max-lines OK, check:docs = baseline (97 entries, exit 0), check:locale-percent ratchet = **4** |
| PR вечерней сессии | #266–#273 (3 стори × impl+closeout + эпик-flip внутри #271 + handoff + recon) |
| pm2 | `wb-repricer-frontend-dev` online на :3100; BE на :3000 |
| **NEXT** | **172.5-FE COGS Single (OWNER-КООРДИНАЦИЯ — см. registry §5!)**; 172.1-172.4 ✅ (automation-домен целиком). ENV: node-26 (PATH-префикс node@24); BE login-троттл 5/hr — e2e-прогоны планировать (обёртка запрещает --no-deps; троттл-блок лечится юнит-близнецом); zsh word-split — явные пути |

---

## 1. Что сделано вечерней сессией (171.7 → 171.9 → эпик закрыт)

### 1.1 Сводка стори

| Стори | Роут | Вердикт | Diff | Owned тесты | Ревью |
|---|---|---|---|---|---|
| 171.7 Evaluations List | `/analytics/models/[id]/evaluations` | MINOR-GAP (born-clean) | 7 файлов, +172/−11 | 55/3 → 65/4 | 1×opus APPROVE-WITH-NOTES |
| 171.8 SKU Accuracy Detail | `…/sku-accuracy` | MINOR-GAP (born-clean) | 9 файлов, +164/−25 | 63/4 → 71/5 | 1×opus APPROVE-WITH-NOTES (0 дефектов) |
| 171.9 Performance Detail | `…/performance` | MINOR-GAP-plus (палитра+hex) | 7 файлов, +218/−42 | 41/1 → 51/2 | 1×opus **APPROVE** (0 дефектов, 0 правок) |

Все — полный цикл §4→§7: гард-тесты (8/6/9), caption+tabular+padding+provenance, e2e на ветке 13✓/1↓/0 каждый, light+dark visual (a11y caption-узлы подтверждены), cleanup 0/0/0.

### 1.2 Ключевые решения

1. **Detach-паттерн для замороженного `STATUS_BADGE_CONFIG.className`** (§3.2): и 171.7, и 171.9 отвязали своих потребителей через route-local `Record<ModelStatus, string>` карты (`EVALUATION_STATUS_BADGE_CLASS` / `PERFORMANCE_STATUS_BADGE_CLASS`) — **byte-identical 1:1** всем 7 статусам реестра (zero visual delta by construction, exhaustiveness на компиляции). Label остаётся единственным источником из shared-конфига.
2. **Поле НЕ удалено** (вопреки спец-заметке V9 §3): live-code проверка показала, что registry-root `ModelListSection.tsx:149` тоже рендерит `badge.className` — удаление потребовало бы правки 3 forbidden-файлов. Оркестраторское решение (live-code-over-docs, ревьюер подтвердил): удаление = carry-out 174.2 (см. §3.2).
3. **Cross-surface exception в 171.8** (прецедент 18ca6873): anchor-safe фикс гарда 171.7 — его substring-фильтр на JOIN-абсолютном пути матчил имя план-пинового worktree 171.8 (`…-model-sku-accuracy-shadcn`) и опустошал каталог. Фильтры теперь relative-first; необходимость доказана симуляцией ревьюера; APPEND-ONLY disclosure-строка в артефакте 171.7.
4. **Chart-канон 171.4 в 171.9**: MapeTrendChart 8 hex → CSS-переменные по parity с живым ForecastChart (grid/axis → border-var; tick fill → chart-axis; линия+activeDot → **chart-1 categorical** — brand-red → categorical осознанный канонный сдвиг 171.4-класса).

### 1.3 Уроки сессии (полные — в артефактах; память — reference_guard_worktree_name_substring_collision)

- Гард substring-фильтр на абсолютном пути матчит имя worktree — фильтруй относительные сегменты до join (нужен `f as string` каст — readdir union).
- `playwright-cli open` сбрасывает логин-сессию; после логина навигация только через `goto` (не `open`, не `eval`).
- Убитый pkill'ом dev-сервер оставляет truncated `.next/dev/types` → tsc TS1128; `rm -rf .next/dev` лечит (артефакт-гейт ≠ source-регрессия).
- tsc-фантом `_tmp_`-файла от concurrent-сессии (создан/удалён mid-scan) — гонка, лечится перепрогоном.
- Vision-модель не видит мелкий muted caption на full-page скриншоте — надёжные пробы: a11y-дерево + element-скриншот + role-pinned юнит-тест.

---

## 2. NEXT — задачи на продолжение

### 2.1 НЕМЕДЛЕННО: Story 172.1-FE — Business Dashboard (FULL, крупнейшая стори)

- План: [`.omx/plans/172.1-migrate-the-business-dashboard.md`](../.omx/plans/172.1-migrate-the-business-dashboard.md) (branch `cdx/epic-172-story-1-dashboard`, worktree `/private/tmp/wb-repricer-fe-172-1-dashboard`).
- **Разведка снята и зафиксирована**: [`docs/recon-172-1-dashboard.md`](recon-172-1-dashboard.md) — **92 файла / 339 palette-сайтов + 31 файл / 78 hex**; канон соответствий 171.4-171.9; однострочная перепроверка. НЕ пересчитывать с нуля (урок умершей на разведке сессии).
- Owned: `src/app/(dashboard)/dashboard/**` (15 prod) + `src/components/custom/dashboard/**` (146 prod) + тесты.
- Рекомендация: **волновое делегирование** — 3 волны executor-сабагентов по ~30 файлов (маршрутизация по canon-таблице из recon), каждая волна → targeted vitest; затем гарды (route-tree каталог 15; custom-tree без pinned-count на 146), полная валидация, ревью ≥3 проходов (дифф ~>1000 строк → Triggers гарантированы, §6.2).
- Baseline targeted: `npm test -- --run 'src/app/(dashboard)/dashboard' 'src/components/custom/dashboard'` — снять N/M ДО правок.
- E2E: 3 спеки (`dashboard-metrics`, `dashboard-period`, `dashboard-session-fixes`) через npm-обёртку на ветке.

### 2.2 Дальше по эпику 172 (17 стори)

172.2 automation gallery → 172.3 rules list → 172.4 rule editor → 172.5/172.6 COGS single/bulk (owner-координация!) → 172.7 COGS history → 172.8 calculator → 172.9 communications → 172.10 finances-docs → 172.11 monitor → 172.12 monitoring-console → 172.13 moysklad → 172.14 orders overview (owner) → 172.15 fbo-orders → 172.16 order-integrity → 172.17 products. Планы: `.omx/plans/172.{1..17}-*.md`. Owner-зависимые: 172.5, 172.6, 172.14 (см. registry §5).

### 2.3 После 172 → 173 (13 стори) → 174 (5 стори, финальный: ledger-parity, legacy-removal, a11y, regression, docs)

### 2.4 ЧУЖАЯ LANE — НЕ ТРОГАТЬ

169-хвост ведёт параллельная команда: 169.14 → 169.15 → 169.12. Worktrees `/private/tmp/wb-repricer-fe-169-14-*`. Перед созданием своих worktrees — `git worktree list`. Concurrent-риски P7 (коммитить сразу, `git branch --show-current` перед каждым коммитом).

---

## 3. Реестр долгов (дельта этой сессии; полный канон — registry + §3 старого handoff)

### 3.1 Route-tree долг: **40 стори** (172×17 · 173×13 · 174×5) + чужие 169×3

### 3.2 Cross-story контракт `STATUS_BADGE_CONFIG.className` — НОВЫЙ СТАТУС

Оба `[id]`-потребителя отвязаны (171.7/171.9, route-local карты 1:1). Поле живёт **только** для registry-root `ModelListSection.tsx:149`. **Владелец удаления — 174.2** (route-ledger handoff, артефакт 171.9 § Carry-out): (1) удалить поле; (2) переписать stale-комментарий `model-list-helpers.ts:24-26`; (3) переписать stale-комментарий `evaluations-list-helpers.ts:20-23`; (4) перенести статус-токен пины гарда 171.6 (читают helpers напрямую); (5) anchor-hardening гарда 171.6 (join-before-filter — 171.8-класс, латентно).

### 3.3 Story-специфичные отложенные items (Gaps в артефактах 171.7-171.9)

- Dark/breakpoint/zoom/reduced-motion ручные прогоны как скриншоты не снимались (юнит+e2e+light/dark full-page покрывают дельту) — опционально, трек 174.3.
- E2E-пробелы ранних стори эпика (нет спек у 171.1/171.2/171.3) — трек 174.4 (унаследовано).
- Vision-слепота к мелким muted-caption на full-page — методологическая заметка (пробы: a11y + element-screenshot).

### 3.4 Процесс-/инфра-долги: НОВЫЕ (P9-P11) + прежние P1-P8 (см. старый handoff §3.4)

| # | Долг | Канон |
|---|---|---|
| P9 | **Гард × имя worktree**: substring-фильтры на абсолютных путях матчят имя чекаута | memory `reference_guard_worktree_name_substring_collision`; relative-first канон в гардах 171.7-171.9 |
| P10 | **tsc-фантом от concurrent-сессии** (`_tmp_`-файл создан/удалён mid-scan, TS6053) — гонка, не source-баг; лечится перепрогоном | артефакт 171.8 |
| P11 | **`.next/dev` truncated-генерат убитого dev** → tsc TS1128/TS1109; `rm -rf .next/dev` перед type-check после pkill | артефакт 171.7 |

### 3.5 BE-блокеры (без изменений, мы — не исполнители): B1 fbs-enhanced 500 (#212) · B2 orders-detail UUID (#229) · B3 per-order COGS (#138) · B4 CORS Retry-After (#206)

### 3.6 UX-defects: D2 закрыт 171.5; D1=B1 ждёт BE; D3 ops-сторона

---

## 4. Канонические ссылки

| Что | Где |
|---|---|
| **Оркестратор-промпт V10 (операционный, OMC-делегирование)** | [`docs/ORCHESTRATOR-PROMPT-2026-08-26-V10-OMC-SUBAGENT-ORCHESTRATION.md`](ORCHESTRATOR-PROMPT-2026-08-26-V10-OMC-SUBAGENT-ORCHESTRATION.md) |
| Оркестратор-промпт V9 (справочник цикла/гейтов/ловушек) | [`docs/ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md`](ORCHESTRATOR-PROMPT-2026-08-26-V9-FE-CONTINUATION.md) |
| Мастер-план миграции | [`.omx/plans/shadcn-full-ui-migration-master.md`](../.omx/plans/shadcn-full-ui-migration-master.md) |
| **Recon 172.1 (разведка готова)** | [`docs/recon-172-1-dashboard.md`](recon-172-1-dashboard.md) |
| Артефакты сессии | [`_bmad-output/implementation-artifacts/171-{7,8,9}-fe-*.md`](../_bmad-output/implementation-artifacts/) |
| Sprint-статусы (epic-171 done) | [`_bmad-output/implementation-artifacts/sprint-status.yaml`](../_bmad-output/implementation-artifacts/sprint-status.yaml) |
| Debt-registry (живой, NEXT=172.1) | [`_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md`](../_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md) |
| Гарды-эталоны | 171.5 `accuracy-presentation…` · 171.6 (с [id]-exclusion) · 171.7/171.8 (anchor-safe) · 171.9 (chart-var pins) |
| E2E models-дерева | [`e2e/analytics/ai-models.spec.ts`](../e2e/analytics/ai-models.spec.ts) |
| Chart-канон (живой) | [`src/app/(dashboard)/analytics/forecast/components/ForecastChart.tsx`](../src/app/(dashboard)/analytics/forecast/components/ForecastChart.tsx) |

## 5. Как продолжать

1. **V10-промпт** (`ORCHESTRATOR-PROMPT-2026-08-26-V10-OMC-SUBAGENT-ORCHESTRATION.md`) §1 bootstrap (fetch/switch/pull — ожидается `9c579b3d` или новее; repo > doc).
2. Прочитать этот handoff + `docs/recon-172-1-dashboard.md` (не пересчитывать разведку).
3. 172.1 по плану стори волновым OMC-делегированием (V10 §4-§6); микро-цикл V9 §4 — справочник для последующих MINOR-сторий.
4. Гейты V9 §5 (= V10 §7), нормы V9 §6, ловушки V9 §8 + P9-P11 + делегационные V10 §9.16-19.
5. После каждого merge — reconciliation (sprint-flip + registry-строка делает closeout-ветка); handoff §0 — на сдвигах.

**Продолжение = 172.1** (§2.1).
