# Debt FE-D9 — S-1 (§8-P0, security-lane): redact-слой для логгирования тел API-ошибок

**Status**: review — 2026-09-02; 4-pass fresh-context review converged (плотность findings 7→4→6→3); PR #382 (head 781d1282)
**Item**: S-1 (FE-D9) — handoff [`docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md`](../../docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md) §8-P0 (security-lane, P0) · **PR**: #382 · **Head**: `781d1282` · **Base**: main `6d95a1de` · **Branch**: `debt/fe-d9-redact-logger` · **Worktree**: `/private/tmp/fe-d9-redact-logger` · **Date**: 2026-09-02

## 1. Долг и DoD

**Долг.** `logApiError` (`src/lib/api-interceptors.ts:104-113` на main) логировал сырое тело не-2xx ответов в консоль через `logger.error` (виден в production). Тела могут содержать секреты:

- JWT auth-эндпоинтов;
- WB-токены кабинетов;
- валидационный echo `details[].value` (типы: `src/types/auth.ts:15,21,26,32`; `src/types/cabinet/core.ts:138-140,151-156`).

**DoD (handoff §8-P0).**

1. Ни один вызов `logApiError` не логирует raw-тело.
2. Redact-правила (паттерны ключей token/password/secret/authorization/cookie) покрыты vitest.

**Выполнение DoD.** Единственный прод-вызов — `src/lib/api-client.ts:83`: обе ветки (JSON + text) обёрнуты `redactSensitive`. Redact-правила покрыты 49 runtime-тестами (`src/lib/__tests__/redact-utils.test.ts`) + 3 кейсами на уровне `logApiError` (`src/lib/__tests__/api-interceptors.test.ts`).

## 2. Method (конвейер)

Оркестратор V14: все волны делегированы субагентам; валидация и git — у оркестратора. Ревью — code-reviewer/opus, СВЕЖИЙ контекст на каждый проход, вход — дифф-файл. Промежуточные и финальные прогоны логируются в `/tmp/fe-d9-*.log`.

## 3. Tasks

1. [x] Pre-flight source-trace (Story 105.2) — `rg logApiError src/`: item не починен; единственный импортёр — `api-client.ts`; готовых redact-утилит нет.
2. [x] Recon (explore/sonnet) — узкая import-closure (2 файла); существующие тесты пинят raw-вывод; референс паттернов — SECRET_RULES из `scripts/check-privacy-console.mjs`.
3. [x] Реализация (executor/opus, tests-first) — NEW `redact-utils.ts` + `redact-utils.test.ts`; EDIT `api-interceptors.ts` (обе ветки) + `api-interceptors.test.ts`; красный (3 fail) → зелёный.
4. [x] Валидация §4F — все гейты зелёные; полный vitest 19390/0.
5. [x] Ревью ×4 с фикс-волнами — см. §4 Review.
6. [x] Финальные гейты — полный vitest 19415/0; check:privacy — 0 новых нарушений.

## 4. Dev Agent Record

### Implementation

1. **Pre-flight (Story 105.2)**: `rg logApiError src/` — item не починен; единственный импортёр — `api-client.ts`; готовых redact-утилит нет.
2. **Recon (explore/sonnet)**: `/tmp/fe-d9-recon.log` — import-closure узкая (2 файла); существующие тесты пинят raw-вывод; референс паттернов — `SECRET_RULES` из `scripts/check-privacy-console.mjs`.
3. **Реализация (executor/opus, tests-first)**: NEW `src/lib/redact-utils.ts` + EDIT `src/lib/api-interceptors.ts` (обе ветки) + NEW `src/lib/__tests__/redact-utils.test.ts` + EDIT `src/lib/__tests__/api-interceptors.test.ts`. Красный (3 fail) → зелёный.
4. **Валидация §4F**: все гейты зелёные; полный vitest 19390/0.

**Контракт redact-модуля** (`src/lib/redact-utils.ts`; итоговые regex, дословно):

```ts
SENSITIVE_KEY_RE = /token|password|secret|authorization|cookie|api[_-]?key|jwt|session|credential|private[_-]?key/i
BEARER_RE = /(\b(?:bearer|basic)[:\s]+)[A-Za-z0-9._~+/=-]{8,}/gi
KEY_VALUE_RE = /((?:(?:access|refresh|api|wb|session)?[_-]?token|password|secret|authorization|cookie)\s*["']?\s*[:=]\s*["']?)[A-Za-z0-9._~+/=-]{8,}/gi
KEY_VALUE_FALLBACK_RE = /((?:password|secret|token|authorization|cookie|api[_-]?key|private[_-]?key|jwt|session|credential)[\s"'=:]*)([^\s"'<>]{8,})/gi
```

- Правило `details[].value` echo: sibling-`field` матчит секрет-паттерн → `value` → `'[REDACTED]'` (ключ `value` глобально НЕ чувствителен).
- `'[REDACTED]'` — маркер редакции.
- Depth-cap 10: за капом всё → `'[REDACTED]'`; кап также обрывает циклы.
- Копирующая семантика: вход не мутируется.
- Идемпотентность доказана тестом.

### Validation

Финальные гейты — живой прогон в worktree (2026-09-02); логи `/tmp/fe-d9-final-*.log`.

| Gate | Результат |
|---|---|
| Vitest полный | **19415 passed / 0 failed** (1275 файлов) — флор 19363 → 19415 (+52: redact-utils 49 runtime + api-interceptors +3) |
| lint | 0 errors / 0 warnings |
| tsc | 0 errors |
| max-lines | OK |
| `npx next build --webpack` | 0 (exit 0) |
| UI boundary | 459/459 (4 registered exceptions) |
| check:docs | exit 0 (baseline 95) |
| check:locale-percent | 4/4 (== baseline) |
| check:lessons-length | 0 violations |
| prettier | 4/4 файла чисто |
| `git diff --check` | 0 |
| check:privacy | ровно 3 pre-existing нарушений (файлы вне диффа), 0 новых |

### Review

4 прохода (code-reviewer/opus, СВЕЖИЙ контекст на каждый; вход — дифф-файл). Плотность findings: **7 → 4 → 6 → 3**.

### Post-1st-pass-review fixes (2026-09-02)

**Проход-1 — структура/корректность.** Вердикт APPROVE-WITH-FINDINGS, 7 findings:

- **MAJOR**: тестовые JWT-литералы сами триггерят `check:privacy` (+2 новых нарушения; на main pre-existing ровно 3, в файлах вне диффа).
- **MINOR**: кириллица-креды raw; `Basic`-auth не редактится; неполный инвентарь ключей.
- **NIT**: substring over-redact (KEEP — осознанно); двойной `Object.entries`; коллапс Date/Map/Set.
- Дополнительно — дыры покрытия: uppercase-ключи, не-строковые значения, слабый cyclic-ассерт, границы глубины, идемпотентность.

**Фикс-волна 1 (executor/sonnet):**

- F1 — split-константы JWT (privacy → ровно 3 pre-existing);
- F2 — `KEY_VALUE_FALLBACK_RE` (не-ASCII ≥8 non-space);
- F3 — `(?:bearer|basic)` в схемной группе;
- F4 — расширение `SENSITIVE_KEY_RE` (+`api[_-]?key|jwt|session|credential|privatekey|private_key`; проверено `node -e`);
- F6 — entries-параметр;
- F7 — JSON-only контракт-комментарий;
- +19 тестов.

### Post-2nd-pass-review fixes (2026-09-02)

**Проход-2 — факты/атрибуции.** Вердикт APPROVE-WITH-FINDINGS, 4 nit: «mirror»-комментарий завышает точность (→ «derived from, broadened»); kebab `api-key` заявлен, но не запинен; F7-заявление не запинено; пороги 7/8 не запинены. Все атрибуции подтверждены исполнением (ложных комментариев/тавтологий нет).

**Фикс-волна 2:** N1-N4 закрыты — переформулировка mirror-комментария; ряд для kebab `api-key`; тест Date-коллапса; граничные ряды 7/8; фраза про поглощение разделителя.

### Post-3rd-pass-review fixes (2026-09-02)

**Проход-3 — security-adversarial.** Вердикт APPROVE-WITH-FINDINGS, 6 findings:

- `private-key` kebab протекает — MEDIUM, FIX;
- `Bearer:`/`Basic:` без пробела протекает — LOW-MEDIUM, FIX;
- остаточные риски (без фикса): голые pass/pwd/auth-ключи; секрет-в-КЛЮЧЕ объекта; голые креды без ключа/схемы; obfuscation-написания / не-ASCII после схемы;
- ReDoS-чистота подтверждена (100KB входы ≤1.1ms); `[REDACTED]`-спуфинг не воспроизводится.

**Фикс-волна 3:** P1 — `privatekey|private_key` → `private[_-]?key`; P2 — `[:\s]+` в `BEARER_RE`; +2 теста.

### Post-4th-pass-review fixes (2026-09-02)

**Проход-4 — сходимость** (обязательный по Trigger 2+3: кумулятив 17 > 12, плотность прохода-3 6 > 5). Вердикт APPROVE-WITH-FINDINGS, 3 findings (≤5 → СХОДИТСЯ):

- MEDIUM — межволновой дрейф словаря: `private[_-]?key` попал в 1 из 3 regex;
- LOW — хедер-комментарий отстал;
- LOW — over-redact безобидных фраз (KEEP).

P1/P2 (фикс-волны 3) верифицированы исполнением, регрессий нет.

**Фикс-волна 4:** D1 — словарь-синхронизация `KEY_VALUE_FALLBACK_RE` (+тест); D2 — хедер-комментарий. Словарь синхронен во всех 4 поверхностях (2 regex + 2 комментария; grep-сверка).

### Residual risks (accepted)

1. Redact покрывает ТОЛЬКО воронку `logApiError`; `ApiError.data` (`src/lib/api-client.ts:86`) намеренно несёт raw-тело в UI-слой (Defensive Frontend Principle — не мутировать данные). ~75 других `logger.error(..., error)`-сайтов печатают ApiError-объекты (раскрываемые в devtools) — отдельный широкий трек (вариант: redact внутри `src/lib/logger.ts`; затронет контракт 131 файла и 52 тест-мока — решение архитектора/owner).
2. Секрет-в-КЛЮЧЕ объекта не трансформируется (ключи не прогоняются через строковую редакцию).
3. Голые креды без ключа/схемы (top-level массивы, тело-один-JWT) — вне threat-model (небрежный, не злонамеренный BE).
4. Креды <8 символов; не-ASCII после `Bearer `/`Basic `; obfuscation-написания (`t0ken`) — вне threat-model.
5. Over-redact безобидных фраз (`'Basic authentication failed'` → съедает слово; fallback съедает хвост `session_note=ok`) — безопасное направление, задокументировано в контракте модуля.
6. `check:privacy` красный на main ДО диффа (3 pre-existing: `api-client-401-refresh.test.ts:53,145`, `tasks-enqueue-role-contract.test.ts:75`) — вне зоны ответственности item'а, репорт владельцу.
7. `isPasswordPolicyError` из fix-канона registry-строки FE-D9 не потребовался: DoD §8-P0 достигнут общим redact-слоём (регистр-строка писала «БЛИЖАЙШАЯ FE-story трогающая apiClient»; выбран выделенный redact-модуль, apiClient не менялся).

## 5. File List

### Код (4)

- `src/lib/redact-utils.ts` — NEW, 92 строки (<200)
- `src/lib/api-interceptors.ts` — EDIT, 119 строк: импорт `redactSensitive` (:11), `logApiError` обе ветки обёрнуты (:107-116)
- `src/lib/__tests__/redact-utils.test.ts` — NEW, 228 строк, 49 runtime-тестов
- `src/lib/__tests__/api-interceptors.test.ts` — EDIT, 525 строк: +3 кейса, header-scope обновлён

### Closeout — оркестратор (3)

- `docs/HANDOFF-2026-09-02-FINAL-94-94-PROGRAM-COMPLETE.md` — §4 статус FE-D9 + §8 статус S-1
- `CLAUDE.md` — Vitest-флор 19363 → 19415
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` — строка FE-D9 (gitignored, `git add -f`)

## 6. Change Log

| Date | Scope | Status |
|---|---|---|
| 2026-09-02 | Implemented S-1 (FE-D9): redact-слой `redactSensitive`, `logApiError` обе ветки, 52 новых теста, флор 19415 | review | **Lessons:** (1) Тестовые JWT-литералы сами триггерят check:privacy — security-истории должны гонять PII-сканер до ревью, не после. (2) Словарь секретов живёт в 3 regex + 2 комментариях — каждый словарный фикс требует grep-синхронизации всех поверхностей. (3) Over-redact — безопасное направление по умолчанию: дисконтировать диагностику дешевле, чем закрыть узкий обход. |
