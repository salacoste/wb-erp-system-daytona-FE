# FE-D3: sanitizeFallbackMessage — bounded fallback + scrub + truncate (security-lane)

**Status**: done (2026-09-05, сессия-6; PR #411, merged)
**Branch**: `fix/fe-d3-get-error-message-scrub` (worktree `/private/tmp/fe-d3-scrub`, base main `8ebf33d0`)
**Owner-track**: реестр §3.1 FE-D3 (registry line 177: «getErrorMessage эхо сырого error.message юзеру»); HANDOFF-173/174:649

## Дефект

`src/components/custom/wb-token-form-helpers.ts:110-114` — fallback-ветка `getErrorMessage` эхоила сырой `error.message` в UI (WbTokenForm рендерит как есть, `<p>{formError.message}</p>`): сервер, встроящий токен/стек/internals в текст ошибки, показывал бы их юзеру. Старый пин-тест фиксировал это как «pre-existing, preserved».

## Реализация

`sanitizeFallbackMessage` (экспортируемый чистый хелпер, 167/200 строк файла) — 11 scrub-паттернов + prebound 4096 UTF-16 (bounds worst-case backtracking) + code-point truncate ≤200 (+`…`, word-cut если пробел во второй половине) + generic-fallback + typeof-гард. Паттерны: `stack:`-dump (ПЕРЕД at-правилом — нагрузочный инвариант порядка), V8 at-фреймы, схема-агностичные URL (`postgresql://user:pass@…`), POSIX/Win-пути, verbal-SQL (one-token object + verb; +DDL drop/truncate/alter table — жадный EOL-хвост, оговорено), prisma, full-JWT + generic-eyJ, hex≥32 (dashed-UUID НЕ покрыт — реестр), base64≥40. Контракты: benign EN+RU pass-through verbatim; пустой/не-строка → generic; 5 классификационных ветвей не тронуты.

## Dev Agent Record (4 прохода, Trigger 3 escalation)

### Post-1st-pass-review fixes (2026-09-05)
Findings (3M+6L; APPROVE-with-riders; GREEN 17/17 независимо повторен): scheme-agnostic URL (postgres/redis creds проходили `https?://`), verbal-SQL false-positives на прозе, пин-c мерил UTF-16. **APPLIED** (fix-волна-1, 8 items): URL-паттерн, SQL-ужатие + 2 guard-пина, code-point метрика + surrogate-пин (/u — обоснованное отклонение исполнителя), stack:-реордер, typeof-гард, full-JWT-паттерн, prebound-константа, prisma-оговорка. RED2 4→GREEN 22.
### Post-2nd-pass-review fixes (2026-09-05)
Findings (1M+5L; APPROVE-with-riders; пин-за-пином факт-сверка честна, RED2 подтверждён): eyJ-комментарий fact-ошибка (base64('{"')='eyI=', не 'eyJ'), SQL-комментарий обобщал, «linear-time» преувеличение, rider-нумерация, пустая строка и кириллица не запинены. **APPLIED**: 3 комментария + нумерация-чистка + 2 пина (24/24).
### Post-3rd-pass-review fixes (2026-09-05)
Findings (2M+5L; APPROVE-with-riders; adversarial 15 входов): SQL за `;` (drop/truncate/alter не покрыты), короткие секреты <40, dashed-UUID, 3 незапиненные ветки. **APPLIED** (fix-волна-2, 5 items): DDL-альтернация (RED3 1→GREEN 28), hex-комментарий, 3 пина (hard-cut-ветка с инертным `!`-наполнителем — 'a'-ран матчится hex-правилом, отклонение обосновано; 4096-маркер; short-sig full-JWT). Короткие секреты + UUID → реестр.
### Post-4th-pass-review fixes (2026-09-05, convergence — 3 ≤ 5)
Findings (3L; APPROVE-with-riders; 28/28 + consumer 19/19 подтверждены, adversarial-smoke 5/5): DDL EOL-collateral не раскрыт, пунктуационные остатки (`;`), short-secrets. **APPLIED**: DDL-оговорка в комментарий; остальное — реестр-остатки.

**Trigger-учёт**: P1 9>5 → эскалация (T3); кумулятив P1+P2 = 15 > 12 (T2); P3 7>5; P4 3≤5 — сходимость. Novel-pattern (санитайзер = новый validator-класс) — 4 прохода исполнены.

## Манифест 174.3 (урок префлайта)

Первый полный прогон упал на 9 контракт-тестах: **манифест пинит SHA-256 `wb-token-form-helpers.test.ts`** (executable-source сценария «Нет доступа» 403). Мой префлайт FE-D3 не прогнал манифест-пины — считал их e2e-only. Реген раннером `--owner-units` ×1 → контракт-тесты 33/33. `helpers.ts` НЕ пинит (проверено grep манифеста) — source-правки после регена безопасны; тест-файл после регена не трогать.

## Evidence

vitest полный **19464/0** (финальный контент; первый прогон 19457 tot / 9 failed = stale-hash каскад до регена) · targeted 28/28 ×3 волны (RED 5→17, 4→22, 1→28) · consumer WbTokenForm 19/19 ×4 · lint 0/0 · tsc 0 · build --webpack 0 · boundary 118 · docs/locale/lessons/privacy 0/4/0/3-pre-existing · prettier чисто · diff-check 0. Логи `/tmp/fe-d3-*.log`.

## Остатки (реестр §10)

1. **fe-d3-family**: 4 hook-локальных `getErrorMessage` (useCloseSupply:29 / useCreateSupply:27 / useGenerateStickers:30 / useDownloadDocument:30 — свои fallback-эха `apiError.message`) + ~128 .tsx echo-поверхностей — системное решение: санитизация на выходе apiClient ИЛИ прогон через sanitizeFallbackMessage.
2. Scrubber residuals (чёрный список конечен): короткие секреты <40 без eyJ-префикса (порог 40 = FP-компромисс); dashed-UUID (низкая чувствительность); scheme-less `admin:pass@host` без `://`; пунктуационные остатки (`;`) как «сообщение».
3. BE-вопрос (низкая конфидельность): пробрасывают ли NestJS-фильтры сырые pg/redis-ошибки в JSON-конверт (достижимость connection-string в error.message).

## Change Log

- 2026-09-05: Item исполнен; PR #411. (executor opus: 2 волны + 2 fix-волны; 4 ревью-прохода opus свежим контекстом; манифест-реген оркестратором).
  **Lessons:** (1) Манифест 174.3 пинит SHA тест-файлов — правка теста = stale-hash каскад; префлайт пинов обязателен каждому item'у. (2) Чёрный список scrubber'а конечен — residuals регистрируй, entropy-детекция отдельный дизайн. (3) Ревьюер-прескрипции верифицируй: 'a'.repeat(240) матчится hex-правилом — подстановка наполнителя исполнителя была верна.
