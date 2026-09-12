# debt-session14 — owner-decision волны (A2 · apiClient · финтокены-бандл)

> **Дата**: 2026-09-12 (сессия-14, оркестратор по V22). **Owner-ответы**: 2026-09-12, 5 AskUserQuestion подряд.
> **Процесс**: V22 §0 петля (decision-gated); каждая волна = ветка + executor/opus + гейты + ≥2 fresh-pass ревью
> + реестр APPEND-ONLY + ledger-флип тем же PR.

## 1. Owner-решения (все — 2026-09-12)

| # | Item | Решение |
|---|---|---|
| 1 | **A2 OrganicTab /80** | **(a) структурное различение**: полный `text-financial-positive` (5.13 AA) + нетекстовая дистанция тира (иконка/bg-tint — НЕ альфа на тексте); пины `OrganicTab.test.tsx` репинить осознанно (финальный диапазон :53-113 после riders — след. строка); guard-коммент обновить (идиома 168.3/168.6 сохранена, канал изменён) |
| 2 | **apiClient-санитизация** | **(a) центральная**: `sanitizeFallbackMessage` в `extractErrorMessage`/ApiError (`api-client.ts` ~:110-117); репины контрактов FE-D3; телеграм-ветки проверить; 2-pass + триггеры |
| 3 | **Сканер-семантика** | **ФРИЗ подтверждён** (10 SECRET_RULES + 5 tool-дир #425 без изменений; деривационный контракт redact-utils стабилен) — док-строка |
| 4 | **Logger-redact** | **(a) центральный wrap**: `redactSensitive` в `logger.warn/error` (идемпотентен — безопасно с logApiError); logger-моки обновить; redaction-pin сюита; residual 131 вызов/81 файл закрывается не трогая их |
| 5 | **Sign-valence канон** | **(a) financial-* = канон знаков** + свип: MarginDisplay (реестр C2, legacy gray/green/red-600) + контраст-трио unit-economics-config (4.19/3.97/4.42 → AA-роли); **financial-foreground — отложено** (fg-on-tint закрывает) |

## 2. Волны

| Волна | Ветка | Скоуп | Статус |
|---|---|---|---|
| A | `debt/a2-organictab-tier` | решения 1 | ✅ SHIPPED (см. §4-A) |
| B | `debt/financial-sign-canon` | решения 5 + 3 (док-строка фриза + канон-декларация) | ✅ SHIPPED — **код-контент NO-OP** (C2/трио/класс протухли, закрыты §37; канон-декларация + фриз-строка — CLAUDE.md/§37; см. §4-B) |
| C | `debt/apiclient-central-sanitize` | решение 2 | ✅ SHIPPED (2-pass: RC→APPROVE merge-ready; см. §4-C + реестр §38) |
| D | `debt/logger-central-redact` | решение 4 | ✅ SHIPPED (2-pass: AWR→APPROVE merge-ready; same-class clone после rider-1; см. §4-D + реестр §39) |

**Порядок**: A (изолированный файл) → B (токен-домен, декларация канона) → C (apiClient) → D (logger).
B объявляет `financial-*` каноном — C/D от токенов не зависят, порядок C↔D свободный.

## 3. Дисциплина (унаследовано + сессия-13)

Манифест-префлайт depth-3 на каждый трогаемый файл; состояние дерева — часть аттестации;
fix-клеймы — grep до коммита; гейты BARE; boundary 0=0/exceptions 0/0 — любое ↑ = STOP;
после каждого ревьюера — `git status`.

## 4-A. Wave A record: A2 OrganicTab (2026-09-12, ветка `debt/a2-organictab-tier`)

**Имплементация** (executor/opus): OrganicTab.tsx + OrganicTab.test.tsx (только 2 файла; манифест-префлайт 0 пинов). «Эффективно» = полный токен (5.13/9.38 vs **bg-card** — executor корректно взял card, не background); дистанция = `CheckCircle2 opacity-80` (3.51/6.34 ≥3:1 non-text; opacity-70 = 2.92 light — новое нарушение, измерено и отклонено). Идиома 168.3/168.6 цела; `aria-hidden` иконка; 6 return-путей обновлены. Пины репинены + `/80` re-inflation guard (toBe(false) ×2) + icon-leak guards на не-позитивных тирах + 2 defensive-теста.

**Ревью (2 fresh-pass opus)**:
- **Проход-1 (структура): APPROVE-with-riders** — 0 C/H/M, 2 LOW, 14/14 чисел Δ=0.00 (вкл. surface-ловушку: dark card 6.666667%, не background). RIDERS применены: LOW-1 — guard-коммент содержал ЛОЖЬ «нет проходного альфа-интервала» → исправлено с provenance (/95 = 4.66 проходит, свип не проверял; закрытие owner-design-forced); LOW-2 — +2 теста defensive-веток (unknown-tier через `as never` мост anti-pattern #4; iroas=null).
- **Проход-2 (нарратив/PR-readiness): APPROVE-with-riders** — 0 код-дефектов; 1 M (merge-батч аттестаций — исполнен этим коммитом) + 5 LOW (surface-лейблы на числах — применены на :28-32; vitest-scope в коммит-месседже 243a434b без scope — immutable, дисклоужа здесь: 21/21 = OrganicTab(8)+ProductAnalyticsContent(13); negative-пин unknown-tier — добавлен; 2 informational — без правок).

**Гейты (live, HEAD ветки)**: vitest СОЛО **19584/19584 exit 0** (флор 19582 +2) · tsc 0 bare · boundary 0=0, exceptions 0/0 · eslint 0/0 (2 файла; effective 170 строк < 200) · live `/80` = 0. CLAUDE.md-флор → 19584 тем же PR. Computed-style проб не требуется (числа контраста дважды независимо пересчитаны + статическая природа изменения); визуальный проб иконки — по желанию owner на живой странице.

**Дисклоужи**: surface-лейблы: «2.92 / 4.23 / 4.66» в ранних аттестациях = light-only (dark проходит на всех альфах — 5.11/7.76/8.55); в финальном guard-комменте все числа помечены. Row :15 sweep-артефакта суперсессирована APPEND-рядом (не правилась in-place).

## 4-B. Wave B record: financial-sign канон (2026-09-12, ветка `debt/financial-sign-canon`) — DOC-ONLY

**Префлайт-результат (Story-105.2 снова спас волну)**: весь код-контент решения 5 оказался УЖЕ
исполнен прежними волнами, реестровые строки оставались открытыми: C2 MarginDisplay — токен-чист
(0 legacy-классов; boundary 0=0 корроборирует системно); контраст-трио — исправлено P2 wave-3
(2026-09-05) + pass-2 selected-stack хардненинг, всё in-file с измерениями
(`unit-economics-config.ts:18-35`); GrossProfitSection/CashflowRowPrimitives — уже fg-on-tint
(`CashflowRowPrimitives.tsx:126`). Свидетельство и закрытия строк — реестр §37.

**Поставлено (doc-only)**: CLAUDE.md — канон-декларация sign-valence (financial-* = канон, zero =
muted-foreground, fg-on-tint обязателен, financial-foreground отложен, tier = нетекстовый канал);
реестр §37 — решения 3 (сканер-фриз подтверждён) и 5 + no-op закрытия C2/трио/класса.

**Ревью**: doc-only process-cleanup (Epic 107-A-2 scope: inline-verify допустим) — все evidence
живые grep'ы оркестратора этого окна; гейты docs/lessons прогнаны. Sub-AA /10-пары price-calculator
(pass-2 F1) — НЕ в скоупе, остаются ⏳.

## 4-C. Wave C record: apiClient центральная санитизация (2026-09-12)

Полный рекорд — реестр §38 (APPEND-ONLY). Кратко: 2 construction-сайта санитизированы; HIGH-обход
через errorData (api-wb-token-errors) закрыт проходом-1; слэш-date over-scrub санитайзера ужесточён;
telegram-эгресс обёрнут; 8 новых пинов; api.test репин на санитизированную рекомендацию; манифест
реген (set-diff 1 sha). Гейты: СОЛО **19592/19592** (флор 19592 в CLAUDE.md) · tsc 0 · boundary
0=0/0 · privacy 0. Ревью: pass-1 RC (1H/2M/4L — все applied/accepted-documented), pass-2 APPROVE
merge-ready (fix-attestation line-exact, `||`-цепь и регекс-трейсы подтверждены). Trigger-аудит:
p1 = 7 > 5 → pass-2 (исполнен); p2 = 0 blocking ≤ 5; кумулятив 9 < 12 → 2 прохода достаточны
(не-кодификационная волна).

## 4-D. Wave D record: logger центральный redact (2026-09-12)

Полный рекорд — реестр §39. Кратко: warn/error → redactSensitive (131 сайт закрыт без касания);
2-коммитная эволюция identity-carve-out → same-class clone после обязательного rider-1 прохода-1
(ApiError.data raw-body leak); 12 пинов (не-вакуальны по 4 осям); debug/info нетронуты (пин).
Гейты: СОЛО **19604/19604** (флор 19604 в CLAUDE.md) · tsc 0 · boundary 0=0/0 · privacy 0.
Остатки-дисклоужи: stack verbatim, name benign, {}-коллапс не-plain объектов (doc-line) — §39.
