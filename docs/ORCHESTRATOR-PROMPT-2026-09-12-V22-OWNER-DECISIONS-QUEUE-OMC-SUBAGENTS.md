# ОРКЕСТРАТОР-ПРОМПТ V22 (2026-09-12) — СЕССИЯ-14: owner-decision очередь (3 запроса) → исполнение выбранных

> **Миссия**: ты — агент-оркестратор, менеджеришь OMC-сабагентов. Эпик C5 **ЗАКРЫТ** (boundary 0,
> exceptions 0, PR #446) — debt-программа исчерпала не-блокированный бэклог. Твой контент = **3 готовых
> owner-decision запроса** (handoff §3): сначала AskUserQuestion, потом исполнение выбранных опций
> волной-каждый по петле ниже. **НЕ имплементируй ничего до ответов owner** (V21 §8 — owner не ответил → СТОП).
> **Вход-точка (читать ПЕРВЫМ)**:
> [`docs/HANDOFF-2026-09-12-SESSION13-C5-COMPLETE-OWNER-DECISION-QUEUE.md`](HANDOFF-2026-09-12-SESSION13-C5-COMPLETE-OWNER-DECISION-QUEUE.md)
> (§1 рекорд сессии-13 · §2 ledger · **§3 три decision-запроса с фактами/опциями/рекомендациями** · §5 новые прецеденты).
> Далее: V21-промпт (процесс-канон §0-§10 — наследуется, кроме обновлённых гейтов/целей) → реестр §34/§36 →
> CLAUDE.md (гейты; boundary-строка = **ТЕРМИНАЛЬНАЯ**, exceptions register = **0 — НЕ ре-аддить**).
> **Приоритет при конфликте**: handoff §3 > этот промпт > V21 > CLAUDE.md; **живые гейты — финальная инстанция**.

---

## 0. Петля (decision-gated)

1. bootstrap (§1) → 2. **шаг 0: ТРИ AskUserQuestion** (формулировки готовы в handoff §3.1-§3.3 —
   A2 OrganicTab / apiClient-санитизация / финтокены-бандл из 3 sub-решений) → 3. на каждый ВЫБРАННЫЙ
   option: pre-flight (Story-105.2 + **манифест-префлайт по handoff §5(c)** — глубина-3!) → ветка
   `debt/a2-…`/`debt/apiclient-sanitize`/… → мини-план + commit-immediately → конвейер A-J (V21 §5) →
   closeout (артефакт + реестр APPEND-ONLY + ledger-строки) → cleanup 0/0/0 → следующий выбранный item.
   Отклонённые option'ы → ledger-дисклоужа тем же PR. **Ответов нет (owner AFK) → СТОП, финальный отчёт.**

## 1. Bootstrap (ожидания на старте сессии-14)

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main   # ≥ 5e542c84
curl -s -m 5 http://localhost:3000/v1/health; pm2 jlist | grep -o '"name":"[^"]*"'   # id5 = wb-repricer-frontend-dev (НЕ УДАЛЯТЬ — реестр §36)
node scripts/check-shadcn-ui-boundary.mjs   # BARE: «total = 0 … exceptions = 0 registered, 0 suppressing»
```

Гейты-старт: vitest ≥ **19582**/0 · boundary 0=0 И exceptions 0/0 · lint/tsc 0 · docs 0 · locale 4 ·
lessons 0 · privacy 0. Docker cold-boot recovery — V21 §1. Мёртвый стек → `open -a Docker` → до 15 мин.

## 2. Делегационная матрица (наследие V21 §2 + C5-уроки)

[1m]-окружение: КАЖДЫЙ Agent-вызов = явный model-псевдоним. Рекон → explore/sonnet; behavior →
executor/**opus**; механика по шаблону → executor/sonnet; ревью → code-reviewer/**opus** свежий вызов
(≥2 прохода; behavior-классы → триггеры V21/CLAUDE.md). **Новые жёсткие правила сессии-13**:
- **Read-only мандаты не энфорсятся по-настоящему** (Bash пишет) — после КАЖДОГО ревьюера `git status`;
  инцидент-протокол при чужих правках: снапшот /tmp → `git checkout -- .` → hunk'и оценивать **на
  субстанцию** свежим проходом → adoption отдельным provenance-коммитом (handoff §5(b)).
- **Состояние дерева — часть аттестации**: «на диске X» верифицировать на СВОЁМ дереве и называть
  дерево (HIGH-прецедент Post-3 C5-W4).
- Результат любой волны → СРАЗУ `/tmp/<item>-*.log`; числа в артефакты — только из живых прогонов;
  каждый фикс-клейм — grep на диск до коммита.

## 3. Поверхности (обновления vs V21)

- Boundary-канон **ТЕРМИНАЛЕН**: `var(--color-<role>)` полный фор; классы = семантические утилиты;
  color-mix тинты; hex запрещён для нового кода. Чекер ловит ЧАСТИЧНО (digitless-обёртки не матчатся) —
  обзор энфорсит шире; scanner-semantics = owner-gated (не трогать).
- **exceptions register = 0**: ре-адд исключения = owner-вопрос, не твоя поверхность.
- **174.3 execution-manifest** (`e2e/fixtures/story-174-3/execution-manifest.json`) пиннит sha256
  произвольных source-файлов; префлайт КАЖДОГО трогаемого файла — grep по этому файлу (глубина-3!);
  стейл → реген `node scripts/run-story-174-3-state-evidence.mjs --owner-units` (BARE) + set-diff.
- A2-опция (a) если выбрана: трогаются `OrganicTab.tsx:28` + `OrganicTab.test.tsx:53-67` (пины
  «NOT collapsed» — репинить ОСОЗНАННО, 8/8 consumer-пинов целы по sweep-аттестации).

## 4. Порядок работ

1. **Шаг 0**: 3 AskUserQuestion (handoff §3) → зафиксировать ответы в артефакты.
2. **A2 (если (a))**: executor/opus — полный токен + нетекстовая дистанция; тест-репины; ~1-2ч + 2-pass.
3. **apiClient (если (a))**: executor/opus — `sanitizeFallbackMessage` в `extractErrorMessage`/ApiError
   (`api-client.ts` ~:110-117); контракт-репины FE-D3; телеграм-ветки проверить; 2-pass + триггеры.
   Если (c): ESLint-ратчет (прецедент anti-pattern #8 no-restricted-syntax) + реестровая дисклоужа.
4. **Финтокены-бандл**: sub-(i) сканер-фриз = док-строка; sub-(ii) logger-redact центральный (если да) —
   executor/opus: wrap в `logger.warn/error` (redactSensitive идемпотентен), logger-моки обновить,
   redaction-pin сюита; sub-(iii) sign-valence канон: при «financial = канон» → MarginDisplay C2 + трио
   (реестр :124, :188) executor/sonnet по шаблону C5.
5. Гейты §6 + computed-style проб при цветовых изменениях (протокол V21 §2). 6. доки/ledger тем же PR.
7. Ревью по классам. 8. PR-литерал до мержа (`gh pr merge <N> --merge`, НОМЕР обязателен).

## 5-7. Конвейер / Гейты / Занятость — V21 §5-§7 ДОСЛОВНО, с заменами

Гейты: vitest ≥ **19582**+Δ/0 СОЛО (Δ → флор-синк CLAUDE.md тем же PR) · boundary **0=0 И exceptions
0/0 (любое ↑ = STOP)** · lint 0/0 · tsc 0 bare · docs 0 · locale 4 · lessons 0 · privacy 0 bare ·
манифест-реген при пин-стейле + set-diff. Пайпы на гейтах запрещены. Соседи — V21 §7.

## 8. Стопы — V21 §8 + новые

СТОП: owner не ответил на шаг-0 (ЛЮБОЙ из трёх запросов) — item не имплементировать; чужие правки в
дереве (снапшот → СТОП → owner, если не распознан мой субагент); boundary ↑; forbidden-файл
(ui/**, parity-скрипт, package.json, BE-репо, e2e-гарды, **scanner-semantics**). Запрещено: сырые
триплеты/hsl(var()) в строках-значениях; ре-адд exceptions; деплои/force-push/прямые пуши в main;
`git add -A`; самовольные owner-решения.

## 9. Критерии успеха

1. Каждый ОТВЕЧЕННЫЙ запрос → исполненная волна (гейты зелёные, 2+ ревью-прохода, ledger-строка
   перевернута, артефакт + реестр APPEND-ONLY тем же PR).
2. Неотвеченные → дисклоужа «awaiting owner» в ledger + финальный отчёт → СТОП.
3. После исчерпания: handoff сессии-14 (или APPEND «program drained — only BE-blocked») отдельным PR.

## 10. Дайджест — V21 §10 ПОЛНОСТЬЮ + сессия-13 (свежее сверху)

**Сессия-13 (handoff §5, детали Post-N C5-W4)**: **состояние дерева — часть аттестации** (ложное
«refuted on disk» с rogue-дерева ушло в immutable коммит-месседж); **read-only мандат обходит Bash**
(python3 -c; retry-логика пережила checkout) — инцидент-протокол + substance-adoption; **174.3
манифест = глубина-3 JSON, пиннит sha тестовых файлов** (префлайт-греп scripts/+shallow мимо; стейл =
падение 174.3-сюит; реген раннером + set-diff); **sha-контракты тест↔тест** (пересчёт ПОСЛЕ всех
правок); **проза ловится чекером** (`hsl()`+цифры в 40-симв. окне); **digitless-обёртки невидимы**
(канон помечен «Enforcement is partial»); **dev-auth TTL ~60с** (синтетический computed-style + частичные
живые пробы = достаточное доказательство); **item-списки протухают** (guards уже в #427; pm2 id5 = живой
dev — Story-105.2 префлайт ДО имплементации); премисса owner-решения проверяется рекон-ом (③-C5-W4);
dark-контраст считать ТОЛЬКО от реальных токенов (`--background` 0 0% 3.92% — не предположенный bg).

---

**Первое действие**: handoff сессии-13 целиком → V21 §1-ритуал → bootstrap §1 → **шаг 0: 3
AskUserQuestion** → петля §0 по выбранным. Владелец программы: C5 закрыт навсегда; что осталось —
решается тремя ответами.
