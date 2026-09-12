# debt-session14 — owner-decision волны (A2 · apiClient · финтокены-бандл)

> **Дата**: 2026-09-12 (сессия-14, оркестратор по V22). **Owner-ответы**: 2026-09-12, 5 AskUserQuestion подряд.
> **Процесс**: V22 §0 петля (decision-gated); каждая волна = ветка + executor/opus + гейты + ≥2 fresh-pass ревью
> + реестр APPEND-ONLY + ledger-флип тем же PR.

## 1. Owner-решения (все — 2026-09-12)

| # | Item | Решение |
|---|---|---|
| 1 | **A2 OrganicTab /80** | **(a) структурное различение**: полный `text-financial-positive` (5.13 AA) + нетекстовая дистанция тира (иконка/bg-tint — НЕ альфа на тексте); пины `OrganicTab.test.tsx:53-67` репинить осознанно; guard-коммент обновить (идиома 168.3/168.6 сохранена, канал изменён) |
| 2 | **apiClient-санитизация** | **(a) центральная**: `sanitizeFallbackMessage` в `extractErrorMessage`/ApiError (`api-client.ts` ~:110-117); репины контрактов FE-D3; телеграм-ветки проверить; 2-pass + триггеры |
| 3 | **Сканер-семантика** | **ФРИЗ подтверждён** (10 SECRET_RULES + 5 tool-дир #425 без изменений; деривационный контракт redact-utils стабилен) — док-строка |
| 4 | **Logger-redact** | **(a) центральный wrap**: `redactSensitive` в `logger.warn/error` (идемпотентен — безопасно с logApiError); logger-моки обновить; redaction-pin сюита; residual 131 вызов/81 файл закрывается не трогая их |
| 5 | **Sign-valence канон** | **(a) financial-* = канон знаков** + свип: MarginDisplay (реестр C2, legacy gray/green/red-600) + контраст-трио unit-economics-config (4.19/3.97/4.42 → AA-роли); **financial-foreground — отложено** (fg-on-tint закрывает) |

## 2. Волны

| Волна | Ветка | Скоуп | Статус |
|---|---|---|---|
| A | `debt/a2-organictab-tier` | решения 1 | 🔄 префлайт пройден (манифест: 0 пинов OrganicTab) |
| B | `debt/financial-sign-canon` | решения 5 + 3 (док-строка фриза + канон-декларация) | ⏳ |
| C | `debt/apiclient-central-sanitize` | решение 2 | ⏳ |
| D | `debt/logger-central-redact` | решение 4 | ⏳ |

**Порядок**: A (изолированный файл) → B (токен-домен, декларация канона) → C (apiClient) → D (logger).
B объявляет `financial-*` каноном — C/D от токенов не зависят, порядок C↔D свободный.

## 3. Дисциплина (унаследовано + сессия-13)

Манифест-префлайт depth-3 на каждый трогаемый файл; состояние дерева — часть аттестации;
fix-клеймы — grep до коммита; гейты BARE; boundary 0=0/exceptions 0/0 — любое ↑ = STOP;
после каждого ревьюера — `git status`.
