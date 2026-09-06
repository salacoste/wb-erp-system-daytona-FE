# FE-D5: cross-tab cabinet-create duplication → Web Locks + replay-safe claim

**Status**: done (2026-09-06, сессия-8; PR #415)
**Branch**: `fix/fe-d5-cabinet-create-web-locks` (worktree `/private/tmp/fe-d5-weblocks`, base main `b1d0ffdf`, head `ca314196`+)
**Owner-track**: handoff SESSION6 §3.0 item 2; реестр FE-D5 (cross-tab create duplication → Web Locks API)

## Дефект

Два таба с `cabinetId: null` одновременно сабмитят create: каждый минтил свежий `crypto.randomUUID()` Idempotency-Key (`src/services/cabinets.service.ts`) → BE видел две разные операции (`@@unique([userId, operationId])` — дедуп по ключу, не по аккаунту) → **два кабинета**. Same-tab был защищён тройно (кнопка/in-handler/sessionStorage-маркер); cross-tab — полностью открыт (sessionStorage per-tab; authStore storage-sync закрывает только последовательные, не одновременные сабмиты — верифицировано: listener есть, `src/stores/authStore.ts`).

## Реализация (4 новых + 8 правок)

- **`src/lib/cabinetCreationLock.ts` (новый, 192/200 counted)**: `runCabinetCreateExclusive` — navigator.locks (feature-detect, injectable `ExclusiveLockManager`), localStorage-клейм `wb:cabinet-creation:claim:v1:{userId|_anon}` (write-verify CAS fallback; pre-adoption re-read), in-lock shared re-checks: cabinetId (live store + persisted auth-blob — синхронно, без storage-event гонок) → tombstone → in-flight-fresh. Ключ минтится ВНУТРИ лока; takeover переиспользует ключ мёртвого таба (BE replay). TTL 90s / REPLAY_WINDOW 180s. Ошибки раннера — `{kind:'error'}` → verbatim rethrow (FE-D1 канон); acquisition-фейл → blocked/UNAVAILABLE + logger.warn (privacy-safe payload).
- **`src/services/cabinets.service.ts`**: reporter settlement-aware, трёхполюсный: `applied`⇒clean (клейм снят); postLanded-incomplete⇒uncertain (**tombstone** — CABINET-BROWSER-04 семантика); pre-POST: 4xx-ApiError/local-throw⇒clean (deliberate-retry легален); **ApiError 0/5xx⇒`failed-ambiguous`** — клейм с сохранённым ключом, немедленно adoptable любым табом ≤REPLAY_WINDOW: ретрай шлёт ТОТ ЖЕ ключ → BE replay дедуплит → recovery-UX без возможности дубля. Обёртка `postLanded`-флага (срабатывает сразу за await POST — трассировка `api-client.ts:151→163`: все wire-фейлы = ApiError(0)).
- **`useCabinetCreateMutation.ts`**: новый `'blocked'` статус → finishRecoveryOperation + showRecoveryError(copy, 'recovery-blocked', **source='blocked'**) + `clearRecoveryMarker(marker, true)` (маркер не застревает — resubmit допускается; N5-логирование CasResult).
- **`useCabinetCreationRecovery.ts`**: R2 — алерты дискриминированы по CAUSE (`recoveryErrorSourceRef`); fall-through чистит только recovery-source TOKEN/SAFE (raw setter — ловушка ленивых апдейтеров задокументирована); `sweepSettledClaim` при reconciled-cabinet (F5: login→cabinetId из `cabinet_ids[0]` детерминированно доезжает до sweep).
- **`cabinetCreationSubmission.ts`**: `CABINET_CREATE_TOMBSTONE_BLOCK_MESSAGE` живёт в lock-модуле, реэкспорт как `TOKEN_RECOVERY_MESSAGE` (одиночный источник, направление lib←components сохранено — N2).
- **e2e `onboarding-cabinet-create-cross-tab.spec.ts` (новый)**: two-page same-context, **context-level** route interception (pass-4 F1), held-POST gate, exactly-one-POST + RU-copy + update-flow convergence (wave-4 root-cause: resubmit таба B после settle таба A корректно уходит в margin-UPDATE по `activeCabinetId`).
- Тесты: lock-сьют 19 (T1–T17 + T9b/T15), service +7 (claim-lifecycle: applied⇒removed; auth-write-fail⇒tombstone; ApiError(0)/503⇒failed-ambiguous-with-key; 400⇒removed; TypeError⇒removed; **BROWSER-02-shape**: ретрай переиспользует идентичный ключ), form +3 (blocked-alert, tombstone-survives-reconcile, double-blocked).

## Dev Agent Record (5 проходов opus свежим контекстом + 4 fix-волны + live-e2e волна)

### Post-1st-pass-review fixes (2026-09-06 — REJECT)
Findings 1H+4M+3L: [H] `postLanded?'uncertain':'clean'` классифицировал КАЖДЫЙ успех как uncertain → tombstone после каждого create (неверный copy табу B; e2e-пин несовместим). [M] blocked-ветка оставляла CREATE_PENDING маркер; нет пина detectLockManager; fallback CAS lost-update. **APPLIED** все 8 (fix-волна: settlement-aware reporter + reorder activeCabinet-before-tombstone; marker-clear; T13; re-read + header-doc).
### Post-2nd-pass-review fixes (2026-09-06 — APPROVE-with-riders)
Findings 2M+5L: N1 wire-ambiguous-фейл⇒clean→ретрай-дубль; N2 ложная аттестация byte-identical («с сервера» vs «с сервером»). **APPLIED**: reporter error-aware (ApiError-классификация), единая константа (реэкспорт), N3–N6 (shadowing, logger.warn, CasResult, as-guard).
### Post-3rd-pass-review fixes (2026-09-06 — APPROVE-with-riders)
Findings 1H+2M+1L: R1 e2e toBeDisabled противоречил F2-re-enable (упал бы на живом прогоне); R2 tombstone-алерт само-стирался (N2-коллизия идентичности); R3 pre-POST локальный throw → вечный tombstone-дедлок. **APPLIED**: e2e под F2-семантику; cause-discriminated алерты (ref + raw setter; RED-then-GREEN самодоказательство); wrapping-гарантия верифицирована (`api-client.ts:151→163`) → non-ApiError=local⇒clean.
### Post-4th-pass-review fixes (2026-09-06 — APPROVE-with-riders; верификационный)
R2/R3 FIXED; R1 PARTIAL → [M] page.route page-scoped: POST таба B не считался. **APPLIED** (оркестратор, doc/test-механика): context-level route + header.
### Post-5th-pass-review fixes (2026-09-06 — APPROVE-with-riders; сходимость)
Wave-4-дельта верифицирована (0C/0H). Rider-1 [M] doc: lock-path catch конгломерирует acquisition- и storage-throws. **APPLIED** (оркестратор): оба комментария выровнены под фактическое поведение. Rider-2 [L] T17/double-block = regression-guards, не дискриминаторы — отражено здесь.

**Live-e2e волна (после прохода-4, до прохода-5)**: живой прогон поймал 2 регрессии, невидимые юнитам: (1) 503-create в CABINET-BROWSER-02 → tombstone блокировал deliberate-retry ([P0] регрессия) → **wave-4 design split**: `failed-ambiguous` с key-reuse (BE replay); (2) неверное ожидание «второго блока» в кросс-таб спеке — root-cause трассировкой (resubmit уходит в UPDATE-флоу) → спека исправлена. Живой ревалидационный прогон: кросс-таб ✅, BROWSER-01/03/04 ✅; BROWSER-02 red = **pre-existing на main** (бисект против main-дева: идентичная сигнатура `onboarding.spec.ts:1057`; `/tmp/fe-d5-e2e-browser02-main.log`) — НЕ чинился в этом PR по канону «чужое в своём PR не чинить» → реестр §12.

**Trigger-учёт**: Trigger 2 (кумулятив 15>12 после P1+P2) + Trigger 3 (P1 8>5) + Trigger 1 (novel-pattern Web Locks) → 3-й обязательный; P4 (1 находка) верификационный; wave-4 = substantive design change → P5. Сходимость: 8 → 7 → 3 → 1 → 1(док).

## Evidence

Живой e2e (PM2-свап, окно ~20 мин, восстановлен, :3100→200 проверен): негативный контроль на нефикшенном main — «Expected: 1, Received: 2» (пин дискриминирует); позитивный — кросс-таб спека green + CABINET-BROWSER-01/03/04 green; артефакты зачищены (privacy). Контракты 174.3: 9 stale-SHA фейлов до регена → реген раннером `--owner-units` ×2 → **33/33**. Полный vitest **19521/0** (флор 19492→19521, +29; CLAUDE.md тем же PR) · lint 0/0 · tsc 0 · build --webpack 0 ×2 · boundary 118 · docs 95 · locale 4 · lessons 0 · privacy exit 0 · prettier чисто · diff-check 0. Логи `/tmp/fe-d5-*.log`.

## Остатки (реестр §12)

1. **CABINET-BROWSER-02 pre-existing red на main** (бисект 2026-09-06) — вероятная интеракция с retry-семантикой FE-D1 (gated-PUT флоу); отдельный item.
2. `cabinetCreationLock.ts` 192/200 — при следующем расширении извлечь claim-CAS-хелперы (pass-3 R4).
3. Fallback-путь (без navigator.locks): остаточное µs-окно simultaneous-absent — задокументировано в header (best-effort, старые браузеры обязаны уметь создавать).
4. `_anon`-скоуп: cross-account взаимное исключение для неидентифицированных сессий — fail-closed, принято.
5. OQ-3 (продукт): auto re-sync при появлении cabinetId вместо статичного block-copy — future.

## Change Log

- 2026-09-06: Item исполнен; PR #415. (executor opus: 4 волны; 5 ревью-проходов opus свежим контекстом; live-e2e волна оркестратора через PM2-свап; манифест-реген ×2 оркестратором).
  **Lessons:** (1) Lock без in-lock re-check бессмысленен — сериализация обязана оборачивать проверку shared-состояния. (2) Живой e2e структурно видит то, что юниты не могут: прод-формы ошибок и последовательности блоков. (3) Wire-ambiguous неудача + переиспользование idempotency-key = recovery-UX без риска дубля.
