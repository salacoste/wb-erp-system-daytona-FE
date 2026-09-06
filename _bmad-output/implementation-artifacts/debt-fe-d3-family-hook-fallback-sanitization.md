# fe-d3-family: 4 hook-локальных getErrorMessage fallback → sanitizeFallbackMessage

**Status**: done (2026-09-06, сессия-8; PR #416)
**Branch**: `fix/fe-d3-family-hooks` (worktree `/private/tmp/fe-d3-family`, base main `dd4ec115`, head `eeac0ab3`)
**Owner-track**: реестр §10 (fe-d3-family follow-up FE-D3); handoff SESSION6 §3.0 item 3

## Дефект

Тот же класс, что FE-D3 закрыл в WbTokenForm: unmapped-status fallback-ветка hook-локальных `getErrorMessage` эхоила сырой `apiError.message` в toast (4 хука: useCloseSupply / useCreateSupply / useGenerateStickers / useDownloadDocument). Враждебный/багованый сервер мог показать connection-string/стек/JWT.

## Реализация (2 новых + 5 правок, +337/−56)

- **`src/lib/sanitize-fallback-message.ts` (новый, 60/42)**: `sanitizeFallbackMessage` + 4 константы + 11 SCRUB_PATTERNS перенесены **байт-идентично** (diff против main пуст — верифицировано двумя ревью-проходами); модульный header обновлён (канонический домен + провенанс FE-D3).
- **`wb-token-form-helpers.ts` (122/100, было 167)**: import + re-export (чистого `export … from` недостаточно — локальный вызов в getErrorMessage; первый прогон поймал ReferenceError). **SHA-пиннутый `wb-token-form-helpers.test.ts` не тронут — манифест-реген НЕ потребовался**; удаление реэкспорта = громкий module-resolution red (верифицировано).
- **4 хука**: fallback `return apiError.message` → `return sanitizeFallbackMessage(apiError.message)` (по одному свапу на хук); доменные ветки/копии/toast-вызовы байт-идентичны; rethrow нетронуты (FE-D1 instance-identity).
- **`src/hooks/__tests__/supply-sticker-document-error-fallback.test.ts` (новый, 253/216)**: 16 тестов, по 4 на хук — hostile-fallback санитизирован (конн-строка+V8-фрейм+JWT, newline-joined, статус 502 = не замаплен ни в одном); benign-RU passthrough; доменная ветка байт-идентична; `rejects.toBe(original)` (FE-D1). Моки — реальные `ApiError` (анти-паттерн #3; фикс оркестратора по нитке прохода-2).

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-06 — APPROVE)
Findings 2L+2info: юнит-аттестаций (47/47 и 253/253 — тесты vs ассерты; фактические прогоны зелёные); нет сьюта в каноническом доме (покрытие через реэкспорт — осознанно, громкий фейл при удалении). **DISPOSITIONED**: юнит-уточнение — в этом артефакте (сьюты: pinned 28+19; консьюмеры-наблюдения 133-253 прогонов); канонический-домен-сьют → реестр.
### Post-2nd-pass-review fixes (2026-09-06 — APPROVE; сетевая смерть → SendMessage-резюм отработал)
Findings 1L: моки через `Object.assign(new Error(), {status})` — анти-паттерн #3 (сейчас безопасно: хуки не проверяют instanceof ApiError; риск дивергенции). **APPLIED** (оркестратор): фабрики hostile/benign + инлайны 429/404 → `new ApiError(msg, status)` из `@/types/api`; domain-`code` моки (EMPTY_SUPPLY/WRONG_STATUS) оставлены — не статус-фейки. Перепрогон 16/16 + pinned 47/47.

**Trigger-учёт**: находок 3+1 ≤ 5, кумулятив 4 ≤ 12, non-novel (FE-D3 lineage) → 2 проходов достаточно.

## Evidence

RED **4 failed / 12 passed** (дословные эхо; `/tmp/fe-d3fam-red.log`) → GREEN **16/16**. Полный vitest **19537/0** (флор 19521→19537, +16; CLAUDE.md тем же PR) · pinned пара 47/47 (28 helpers + 19 WbTokenForm) без регена · консьюмеры зелёные (CloseSupplyDialog/CreateSupplyModal/GenerateStickersModal/supplies-page/CreateSupplyButton/SupplyDocumentsList) · lint 0/0 · tsc 0 · build --webpack 0 · boundary 118 · docs 95 · locale 4 · lessons 0 · privacy 0 · prettier чисто · diff-check 0. Логи `/tmp/fe-d3fam-*.log`.

## Остатки (реестр §13)

1. Системный вопрос (~128 .tsx echo-поверхностей → санитизация на выходе apiClient) — **owner-decision**, не решён (§3.3).
2. Сьюта в каноническом доме `src/lib/sanitize-fallback-message.test.ts` нет — покрытие через пиннутый сьют старого места (реэкспорт); добавить при следующем касании.
3. Pre-existing вне скоупа: `error as ApiError` касты в 4 хуках; недостижимый `|| 'Документ скачан'` (useDownloadDocument).
4. Scrubber-residuals (короткие секреты <40 / dashed-UUID / scheme-less) — наследие FE-D3, реестр §10.

## Change Log

- 2026-09-06: Item исполнен; PR #416. (executor opus: 1 волна + тесты-first; 2 ревью-прохода opus свежим контекстом — оба APPROVE; анти-паттерн #3-фикс оркестратора).
  **Lessons:** (1) Перенос функции без регена манифеста: реэкспорт из старого места держит SHA-пин и ломается громко. (2) Байт-идентичность переноса доказуема diff против main — сильнейшая форма аттестации move-операций. (3) Моки ошибок обязаны строить реальный класс — instanceof-будущее дешевле предусмотреть, чем чинить.
