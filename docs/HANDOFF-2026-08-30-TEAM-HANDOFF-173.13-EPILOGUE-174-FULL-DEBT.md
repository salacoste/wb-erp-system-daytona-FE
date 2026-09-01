# HANDOFF 2026-08-30 — Принимающей команде: Story 173.13 + Эпик 174 + полный техдолг

> **Аудитория**: новая FE-команда, принимающая программу shadcn-миграции на финише (осталось **6 из 94 канонических стори**: 173.13 + 174.1–174.5).
> **От**: сессии-оркестратора, закрывшей Stories 172.10–172.17 (эпик 172 целиком) и 173.12 (supplies owner), работавшей **параллельно** с командой Epic-173 lane (173.1–173.11).
> **Дата**: 2026-08-30 (обновлено 2026-08-31 closeout'ами 173.13/174.1/174.2). **main после 174.2**: base `fbdab2da` (174.1 closeout #370 + lifecycle #371) + PR #372.
> **Статус программы**: **93/94** стори; эпики 166–173 ✅; **Epic 174 = 4/5** (174.1 #369/#370/#371; 174.2 #372/#373; 174.3 #374; 174.4 full-regression ✅); NEXT = **174.5** (финальная) → 94/94.
> **Живые гейты на main (после 174.4)**: vitest **≥ 19 363 passed / 0 failed**; lint 0/0; tsc 0; max-lines OK; **ui-boundary 459 (ratchet ↓64, дроп предшествует 174.4)**; check:docs exit 0; locale-percent 4; lessons-length 0; PM2 `wb-repricer-frontend-dev` online :3100; BE :3000.

---

## 0. Executive snapshot — что делать следующей команде

| # | Действие | План (authoritative) | Ветки/PR-прецеденты |
|---|---|---|---|
| 1 | ~~**Story 173.13 Supply Detail**~~ ✅ SHIPPED (PR #365/#366/#367) | [`.omx/plans/173.13-migrate-supply-detail.md`](../.omx/plans/173.13-migrate-supply-detail.md) | Артефакт-эталон: [`_bmad-output/implementation-artifacts/173-12-fe-migrate-supplies-list.md`] (owner-граница) |
| 2 | ~~Эпик-173 flip~~ ✅ done 13/13 | sprint-status.yaml | Прецедент flip: PR #326 (эпик 172) |
| 3 | ~~**174.1** Parity~~ ✅ SHIPPED (PR #369, merge `360c9cb9`; closeout #370) | [`.omx/plans/174.1-…`](../.omx/plans/174.1-prove-bmad-route-ledger-and-omx-plan-parity.md) | — |
| 4 | ~~**174.2** Legacy removal + design-system boundary~~ ✅ SHIPPED (PR #372 на `fbdab2da`; 65 deletions, lib-wave, boundary-скрипт ratchet 523, классификационный манифест; артефакт `174-2-fe-*.md`) | [`.omx/plans/174.2-…`](../.omx/plans/174.2-remove-legacy-ui-and-enforce-the-design-system-boundary.md) | — |
| 5 | **174.3** A11y/responsive/theme/visual (все отложенные visual-gap'ы + §3.3 tint-audit) | [`.omx/plans/174.3-…`](../.omx/plans/174.3-complete-accessibility-responsive-theme-and-visual-verification.md) | вход: boundary-манифест cat-1 (59 файлов) |
| 6 | **174.4** Полная функциональная/контрактная регрессия (+ pre-existing liquidity/monitor e2e фейлы — bisect-доказаны, см. registry APPEND) | [`.omx/plans/174.4-…`](../.omx/plans/174.4-complete-full-local-functional-and-backend-contract-regression.md) | — |
| 7 | **174.5** Финализация документации + cleanup → **94/94** | [`.omx/plans/174.5-…`](../.omx/plans/174.5-finalize-documentation-and-repository-cleanup.md) | — |

**DAG**: 173.13 → (эпик-flip) → 174.1 → 174.2 → 174.3 → 174.4 → 174.5. Полный мерmaid: [HANDOFF-173-174 §4](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md#4-execution-dag-6-stories-remaining).

---

## 1. Порядок чтения (authority hierarchy)

1. **План стори** (`.omx/plans/<NEXT>.md`) — branch/worktree/surface/валидация/cleanup. Authoritative при любом конфликте.
2. **[HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md)** — главный процесс-канон (19 секций): lifecycle стори (§7), UX-контракты (§8), ownership/forbidden (§9), гейты (§10), **полный debt-регистр §11 (FE-D*, C1–C17, контраст-семьи, process-гочки)** — читать целиком.
3. **Этот документ** — актуализация состояния + дополнение debt-регистра пунктами волн 172.10–172.17/173.12 (§3 ниже) + параллельный протокол (§5).
4. [`CLAUDE.md`](../../CLAUDE.md) — baselines-таблица (floor **≥ 19 800**), анти-паттерны #1–10, двухпроходность, APPEND-ONLY.
5. Реестры: [`_bmad-output/implementation-artifacts/sprint-status.yaml`] (статусы), [`shadcn-migration-status-and-debt-registry.md`] (NEXT + carry-outs).
6. Операционный промпт (для оркестратора-контролёра): [`docs/ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md`] + уроки 1–21 в [§7 handoff-172](./HANDOFF-2026-08-27-CROSS-TEAM-OMC-ORCHESTRATOR-172-8-CONTINUATION.md#7-ловушки--готовые-решения-20-уроков-сессий-1721-17210--v10-канон-не-наступать-повторно).

---

## 2. Оставшаяся работа — детально

### 2.1 Story 173.13 «Migrate Supply Detail» (последняя стори эпика 173)

- **Branch**: `cdx/epic-173-story-13-supply-detail`; **worktree**: `/private/tmp/wb-repricer-fe-173-13-supply-detail` (из frontmatter плана — создайте точно по нему).
- **Owned surface**: `src/app/(dashboard)/supplies/[id]/**` + **detail-exclusive** файлы `src/components/custom/supplies/**` — точный список из 18 файлов уже закодирован как `DETAIL_EXCLUDED` в гардe 173.12: [`src/app/(dashboard)/supplies/__tests__/supplies-list-presentation-source-contracts.test.ts`] (AcceptanceActSection, CloseSupplyDialog, GenerateStickersModal, OrderPicker ×7, RemoveOrderDialog, Sticker ×2, SupplyDocumentsList, SupplyHeader, SupplyOrdersTable, SupplyStatusStepper) — ревьюеры 173.12 доказали, что список = **точное транзитивное замыкание** импортов `[id]/page.tsx`.
- **Что мигрировать** (замерено на main): 10 detail-файлов с legacy-palette (SupplyHeader 1, SupplyOrdersTable 4, CloseSupplyDialog 3, SupplyStatusStepper 8, AcceptanceActSection 1, RemoveOrderDialog 1, OrderPickerContent 4, OrderPickerRow 4+1 rawbtn, StickerPreview 8, IntegrityChecksGrid-аналог — SupplyDetailError 2 в [id]/) + тест-репины (StickerPreview.test, SupplyStatusStepper.test, RemoveOrderDialog.test имеют legacy-ассерты).
- **Carry-in из 173.12** (обязательные): (a) мёртвый legacy-twin `SUPPLY_STATUS_CONFIG` в [`src/types/supplies/helpers.ts`] — **migrate-or-delete** (0 прод-потребителей, 3 тест-файла; fallback расходится с живым бейджем); (b) shared `SupplyStatusBadge` уже мигрирован — не трогать, только потреблять; (c) гард 173.12 при добавлении файлов в detail-семейство будет RED — **расширяйте его каталог осознанно** (boundary-список уходит в гард 173.13).
- **Таргеты**: `npm test -- --run 'src/app/(dashboard)/supplies/__tests__' …SuppliesFilters… …SuppliesTable…` + badge-тест; e2e: `e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts` (существуют).
- **WCAG-ловушка (главный урок 173.12)**: `text-status-warning` на `/10`-тинте = 4.06:1@12px — падает axe; канон = solid-пара `bg-status-X` + `text-status-X-foreground` (машина-тестирована в [`src/styles/__tests__/globals-compiled-contrast.test.ts`]). Фиолетовые статусы → `status-pending` (hue 277). Opacity-токены (`bg-x/10`) невалидны в `querySelector` — используйте `className.toContain`.
- **Эпик-flip после merge**: sprint `epic-173-fe: done` + retrospective-заметка в артефакте 173.13 (прецедент — артефакт 172.17).

### 2.2 Эпик 174 «Complete Migration Assurance and Legacy Removal» (5 стори, строго по DAG)

| Стори | Суть | Ключевые входы |
|---|---|---|
| **174.1 Parity** | Доказать соответствие BMAD-артефакты ↔ route-ledger ↔ OMX-планы ↔ evidence; route-ledger статусы → verified-готовность | [`_bmad-output/planning-artifacts/shadcn-route-ledger.md`]; carry-out 174.2-строки из 171.9 (см. §3.2 ниже) |
| **174.2 Legacy removal** | Удаление мёртвого legacy-UI, enforce design-system boundary — **сюда стекается большинство долга §3** | import-closure-доказательства обязательны; флагман: lib-wave (см. §3.1) |
| **174.3 A11y/visual** | Консолидированная матрица: обе темы × ширины × zoom × reduced-motion × keyboard/axe/real-SR × charts/tables/overlays; + все `environment-gap` credentialed-browser долги | Находка 173.12 о tint-контрасте → программный аудит (§3.3) |
| **174.4 Регрессия** | Credentialed E2E, критические джорни, контракты BE, полный локальный suite | «Discovered-but-not-executed» Playwright-наборы 173.x (§3.4) |
| **174.5 Docs+cleanup** | Финальные переходы статусов, документация, репозиторий-cleanup → **94/94** | route-ledger final verified; OpenWiki-обновление автоматом |

---

## 3. Технический долг — консолидированный регистр

> **Глубокий канонический регистр**: [HANDOFF-173-174 §11](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md#11-complete-known-technical-debt-and-carry-out-register) — FE-D1…D9 (behavior/security), C1–C17 (route carry-outs), контраст-семьи (11.3), story-specific (11.4), backend/external (11.5), process-гочки (11.7), словарь статусов (11.9). **Ниже — только дополнения и актуализации волн 172.10–172.17 + 173.12**, не дублирующие §11.

### 3.1 Lib-wave: legacy-цвета в forbidden `src/lib/**` (самый массовый残留) → **174.2**

Продуктовые компоненты мигрированы, но цвето-хелперы в запретной lib-зоне остались legacy и **протекают в UI** через импорты:

| Источник в `src/lib/` | Что отдаёт | Живые потребители / пины |
|---|---|---|
| `monitoring-constants.ts` → `STATUS_COLORS` | `bg-green-500/bg-yellow-500/…` | `/monitoring` route (PipelineStatusGrid и др.) + `/monitor`; carry-out из 172.11→172.12 |
| `wb-status-data-{core,delivery,returns}.ts` | `config.color/bgColor` legacy | `WbStatusBadge.test` — **31 ассерт** пинит легаси (172.14) |
| `analytics-utils.ts` → `getSlaStatusColor` | `text-{green,yellow,red}-600` | `SlaComplianceWidget.test` — 6 пинов (172.14) |
| `analytics-utils.ts` → `getConfirmationTimeColor`/`getCompletionTimeColor` | legacy | `VelocityMetricsWidget.test` — 14 пинов (компонент чист!) |
| `analytics-utils.ts` → `getCountdownColor` | legacy | Тест импортирует реальную ф-цию (173.12-канон: зеркало→импорт) — при lib-миграции ассерты обновятся сами |
| `orders-analytics-utils.ts` (через `analytics-utils` re-export) | legacy тройки | AtRiskOrdersCard.test |

**Правило 174.2**: миграция lib-хелпера = обновление всех downstream-пинов одним коммитом; каждый удаляемый экспорт — с repo-wide import-closure доказательством (прецедент-эталон: carry-out `SUPPLY_STATUS_CONFIG` из 173.12).

### 3.2 Dead code и boundary-долг → **174.2** (манифест-очистка)

- **Мёртвое Telegram-трио** (172.12, ревьюер доказал 0 импортёров): `src/app/(dashboard)/monitoring/components/TelegramDetailPanel.tsx`, `TelegramDetailSections.tsx`, `hooks/use-telegram-health.ts` (+ их тесты) — гард 172.12 пинит «honest dead-аннотацией»; удаление = сознательное обновление каталога.
- `WbTokenBanner` (FE-D2), `ExportConfigForm` дубль (FE-D6), barrel-only хелперы C3/C4 — из §11.
- **171.9 carry-outs → 174.2 owner** (из registry): удалить `className` из `STATUS_BADGE_CONFIG`; переписать 2 stale-комментария (model-list-helpers.ts:24-26, evaluations-list-helpers.ts:20-23); перенести статус-токен пины гарда 171.6; anchor-hardening гарда 171.6 (join-before-filter).
- Pre-existing `as`-касты вне миграционных диффов: `CreateSupplyModal.tsx:139` (`as MutableRefObject`), `monitor-weekly-chart-tooltip.test.tsx:27` (`null as any`) — чистить только в 174.2/5 с type-proof.

### 3.3 Контраст/тема — программные пункты → **174.3** (дополнение к §11.3)

- **Tint-слепота темы**: compiled-contrast тест проверяет только solid-пары; `text-on-/10-tint` композиты — axe-only территория. `text-status-warning` — единственный из 5 статусов, падающий ниже 4.5 на /10-тинте (4.06:1@12px). **Аудит-кандидат**: все поверхности с `text-status-*` на `bg-status-*/10` без axe-спек (172.10-172.17 использовали идиому широко — banner-канон ReportPendingBanner прошёл там, где нет мелкого текста; риск = мелкие бейджи/лейблы ≤12px).
- Фикс-канон: solid `bg-status-X` + `text-status-X-foreground` (testPairs в `globals-compiled-contrast.test.ts`); прецедент — 173.12 CLOSED-бейдж.
- `/15`-чипы, chart-токены-как-текст, `/80`-текст — уже в §11.3 (owner 174.2 foundation).

### 3.4 Evidence-долг (discovered-not-executed) → **174.3/174.4**

| Источник | Что обнаружено | Где зафиксировано |
|---|---|---|
| 173.5 | Playwright 40 тестов discovered, browser-gap | артефакт 173-5 |
| 173.6 | 81 file-level (вкл. 20 tariff-сценариев) | артефакт 173-6 |
| 173.7 | 99 file-level (вкл. 20 tax-сценариев) | артефакт 173-7 |
| 173.8–173.10 | credentialed browser gaps ×3 | артефакты 173-8…10 |
| 172.8 | dynamic-Playwright gap | артефакт 172-8 |
| 172.15 | плановая `e2e/orders-fbo.spec.ts` **не существует** — dedicated FBO E2E отсутствует | артефакт 172-15 |
| волна 172.4–172.13 | live light/dark скриншоты, 200% zoom, reduced-motion, real-SR — отложены на 174.3 | артефакты соответствующих стори (Gaps-секции) |
| C17 | credentialed E2E corrective-journey 169.9 | §11.2 |

### 3.5 Мелкие продуктовые/UX carry-outs (next-touch, owner = касающийся файл)

- 172.10: category-dead-end affordance (categories-error при активном фильтре); `error.tsx` digest-логирование (check:privacy-риск — осторожно с console); tautological e2e-assert `finances.spec.ts:~231` (`expect(downloadResponse).toBeDefined()` после await).
- 172.12: `text-white` статус-круги HealthHistoryChart:115; `role="listitem"` на кнопках :111; cursor-pointer в общем Button-base (app-wide решение).
- 172.14: ASSEMBLED/PACKED различимы только альфой (/10 vs /15) — при юзер-жалобах дифференцировать бордером/иконкой; OrderSyncStatus tier-коллапс (лейблы несут); tautological hover-тест AtRiskOrdersCard.test:259-267 (render real row).
- 172.15: nmId-колонки без tabular (optional); guard POSIX-separator нормализация (canon-wide).
- 172.16/172.17: guard-family hardening — ring-offset в LEGACY_PALETTE, rgb()/oklch в CONTEXTUAL_HEX, `;`-lookahead, css-модули в энумерации (единая process-правка всех ~25 гардов).
- 173.12: badge-тест `querySelector('.bg-red-50')`-паттерн уже переписан — при lib-wave не возвращаться к селекторам с opacity-токенами.

### 3.6 Baseline/процесс-долг → **174.5**

- **check:docs baseline = 95** (принят в PR #362 после унаследованного дрейфа: их notifications-рефактор сжал TelegramBindingModal 216→128 строк). Правило: baseline-accept только с разбором NEW/RESOLVED в коммит-месседже.
- `format:check` — 39 pre-existing warn (репо-базлайн; не продукт-гейт, но 174.5 может свести к 0).
- CLAUDE.md floor исторически отставал у соседней lane (19615 при реальных 19 800) — **всегда выводите floor живым прогоном**, не верьте строке (исправлено в #362).
- ~25 route-гардов с чуть разными формами каталогов — 174.5 может унифицировать (exact-array канон 172.10+).

---

## 4. Процесс-канон (краткая выжимка; полный — HANDOFF-173-174 §7/§10 и CLAUDE.md)

- **Конвейер стори A–J**: plan-preflight (carry-in grep по ID!) → worktree от живого main (branch из frontmatter плана — **читайте frontmatter ДО `worktree add`**, урок 172.16) → baseline targeted → правки (MINOR сам / FULL executor-волнами ≤30 файлов, непересекающиеся списки) → гард (каталог exact-array per-file, no-palette/no-hex self-tested, контракты; dead-файлы пинить с honest-аннотацией) → валидация (targeted → lint → tsc → max-lines → `npx next build --webpack` → **полный пол СОЛО** → e2e npm-обёрткой с dev-танцем → diff --check → prettier) → ревью (1–2+ проходов, code-reviewer opus СВЕЖИЙ контекст; import-closure аудит обязателен; микро-дифф <50 прод-строк = 1 проход, behavior-changing = 2, триггеры ≥3) → коммит (branch-check!) → PR → merge `--merge` → cleanup 0/0/0 → closeout одним docs-PR (артефакт формата `172-{1..17}-fe-*.md` / `173-12-*.md` с Lessons ≤120×3; sprint-flip; registry SHIPPED+NEXT; handoff-снапшот; CLAUDE.md floor живым числом; гейты lessons/docs).
- **Гейты-таблица (текущие)**: vitest ≥ **19 800**/0 failed/1252 файлов; lint 0/0; tsc 0; check:docs exit 0 (baseline 95); locale-percent 4; lessons 0; format:check = 39 warn baseline.
- **Гард-канон**: регексы 169.11 (LEGACY_PALETTE полный набор; CONTEXTUAL_HEX с self-test обеих полярностей — positive обязателен, урок 173.12); relative-first энумерация (171.8); `resolve(fileURLToPath())` (170.6); catalog exact-array `toEqual`; мутационная проверка «гард кусается» через `git show HEAD:file` (урок 172.16 — дешёвое доказательство).
- **Токен-канон**: статус-валентности `status-{success,warning,error,information,pending}` (+`-foreground` для solid-пар WCAG); фиолетовый = `status-pending` (hue 277, открытие 172.14); chart-серии `var(--color-chart-N/positive/negative/grid)` для SVG/recharts (форма `--color-*`, НЕ голый `--chart-*` — там HSL-тройник); баннеры `border-X/40 bg-X/10 text-X` (ReportPendingBanner); все зелёные делят ОДИН HSL-тройник → различение только альфой `color-mix` (прецедент 172.12 «recovered»).

---

## 5. Параллельная работа двух команд — валидированный протокол (доказан 173.11∥173.12)

1. **Разделение**: единица координации = стори; занятость = branch+worktree (видимы обоим через общий `git worktree list` в общем primary). NEXT-очередь ведёт registry; перед взятием стори — проверить, что её ветки/worktree нет.
2. **Поверхности**: до правок построить owner-границу по транзитивным потребителям (list vs detail vs shared) и закодировать в гард-каталог с exclusion-списком (эталон — DETAIL_EXCLUDED в 173.12, ревью-доказан 18/18).
3. **Общие ресурсы**: PM2 :3100 — перед stop проверить свежесть чужого worktree (`find … -newermt '-10 min'`); BE-login троттл 5/hr **общий** — ≤2 e2e-прогонов/команду/час, при исчерпании честный gap; полный пол vitest — только соло ( forks-starvation, урок 20).
4. **Merge-гонки**: перед КАЖДЫМ коммитом `git branch --show-current` + fetch; feature-ветку ребейзить на живой main перед PR; closeout-PR — по свежему re-grep origin/main (docs-файлы реестров конфликтуют текстуально — ваши правки поверх живых строк).
5. **Унаследованный docs-дрейф**: если check:docs падает по чужим строкам — `--update-baseline` с разбором NEW/RESOLVED в коммит-месседже (прецедент #362).
6. **Чужое не трогать**: worktree/ветки/PR соседа; WIP-коллизии в чужом worktree — снапшот в /tmp → STOP → решение владельца (прецедент 172.10).

---

## 6. Environment quick-facts

- **Node 24.18.0 / npm 11.11.0** — пинн; PATH-префикс `/opt/homebrew/opt/node@24/bin` на КАЖДУЮ npm/npx (Node 26 ломает webpack: WasmHash TypeError). Команды сабагентов — тоже.
- Worktrees: `/private/tmp/<путь-из-плана>` + symlink node_modules + копия `.env.e2e`/`.env.local`; build — только `npx next build --webpack` (Turbopack×symlink); e2e — только `npm run test:e2e -- <spec>` (обёртка добавляет auth/orders; `--no-deps` ОТКАЗАНО).
- Креды: `test@test.com / Russia23!`; BE- Swagger `/api`; health `/v1/health`.
- Логи/диффы волн — в `/tmp/172.{10..17}-*.log`, `/tmp/173.12-*.log` (эфемерны; при необходимости сохранить — переместить в артефакт).

---

## 7. Stop-условия и эскалация

План ↔ живой код; нужен файл из forbidden (`src/lib/**`, `ui/**`, hooks/types, package.json, route-ledger); чужая сессия снесла WIP; гейт падает по baseline-дрейфу ≠ ваш дифф; волна/ревьюер дважды вернули неразрешимое. Эскалация — владелец репо через PR-описание/issue; никаких деплоев/force-push/CI-гейтов. Полные списки: [HANDOFF-173-174 §16](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md#16-stop-conditions-and-escalation), [§17 Definition of 94/94](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md#17-definition-of-final-9494-completion).

---

## 8. Authoritative link index

| Ресурс | Путь |
|---|---|
| Этот handoff | `docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md` |
| Главный процесс-канон + deep debt §11 | [`docs/HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md`](./HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md) |
| Handoff эпохи 172 (уроки 1–21) | [`docs/HANDOFF-2026-08-27-CROSS-TEAM-OMC-ORCHESTRATOR-172-8-CONTINUATION.md`](./HANDOFF-2026-08-27-CROSS-TEAM-OMC-ORCHESTRATOR-172-8-CONTINUATION.md) |
| Оркестратор-промпт V11 | [`docs/ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md`](./ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md) |
| Планы оставшихся стори | `.omx/plans/173.13-migrate-supply-detail.md`, `.omx/plans/174.{1..5}-*.md` |
| Sprint-статусы | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Registry (NEXT/carry-outs/owner §5) | `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` |
| Route ledger | `_bmad-output/planning-artifacts/shadcn-route-ledger.md` |
| Артефакты-эталоны конвейеров | `_bmad-output/implementation-artifacts/` — FULL: `172-1`, owner+boundary: `173-12`, born-clean: `172-7`/`172-15`, e2e-создание: `172-9`, WCAG-пивот: `173-12` |
| Правила репо + baselines | [`CLAUDE.md`](../../CLAUDE.md), [`CLAUDE-PATTERNS.md`](../../CLAUDE-PATTERNS.md), [`CLAUDE-ANTI-PATTERNS.md`](../../CLAUDE-ANTI-PATTERNS.md) |
| Тема/токены | `src/styles/globals.css`, `src/styles/__tests__/globals-compiled-contrast.test.ts` |
| Гарды-эталоны | `dashboard/__tests__/…` (172.1), `finances/…` (172.10 caption), `monitor/…` (172.11), `monitoring/…` (172.12 legend-sync), `orders/…` (172.14 dual-root+fbo-exclusion), `supplies/__tests__/…` (173.12 DETAIL_EXCLUDED) |

---

## 9. Maintainer update rule

Обновляйте §0/§2 этого документа в closeout-PR каждой стори (APPEND-ONLY для §3-долга: новые пункты получают ID и статус по словарю §11.9 канонического handoff). При завершении 174.5 — замените этот документ финальным 94/94 handoff.

*Подготовлено сессией-оркестратором волн 172.10–172.17 + 173.12; параллельная команда 173.1–173.11 завершила свою lane вливанием #363.*
