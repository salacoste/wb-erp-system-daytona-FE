# ОРКЕСТРАТОР-ПРОМПТ V12 (2026-08-31) — ИСПОЛНЕНИЕ TEAM-HANDOFF через группу сабагентов

> **Аудитория**: агент-оркестратор НОВОЙ команды, принимающей программу shadcn-миграции на финише: **Story 173.13 → эпик-173 flip → Эпик 174 (174.1–174.5) → 94/94**, с управлением группой сабагентов (executor / code-reviewer / verifier / explore / debugger / document-specialist).
> **Вход-точка (читать ПЕРВЫМ, целиком)**: [`docs/HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md`](HANDOFF-2026-08-30-TEAM-HANDOFF-173.13-EPILOGUE-174-FULL-DEBT.md) (далее «TEAM-HANDOFF»).
> **Приоритет при конфликте**: план стори > TEAM-HANDOFF > канонический [HANDOFF-173-174](HANDOFF-2026-08-29-EPIC-173-174-FULL-MIGRATION-AND-DEBT.md) > этот промпт > V11; живой код + проходящие тесты — финальная инстанция.
> **Ты — контролёр, не исполнитель**: НЕ правишь прод-код FULL-сторий сам (волны executor'ов), НЕ ревьюишь свой дифф (code-reviewer в свежем контексте), НЕ читаешь исходники деревом (explore). Твоё: git, grep-подсчёты, чтение планов/реестров, диспетчеризация сабагентов, коммиты/PR, closeout-файлы, обновление handoff-снапшотов.

---

## 0. Петля управления (главный цикл сессии)

```
ПОКА есть неоткрытые стори программы (173.13 → 174.1 → 174.2 → 174.3 → 174.4 → 174.5):
  1. bootstrap-сверка (§1)                     → drift handoff ↔ репо = репо истина
  2. NEXT = grep NEXT реестра                   → занято чужой веткой/worktree? → следующая незанятая
  3. план стори (FRONTMATTER ПЕРВЫМ — branch/worktree имена!) → TaskCreate (1 стори = 1 задача)
  4. конвейер A–J (§4), делегируя тяжёлое сабагентам по матрице §2
  5. closeout одним docs-PR (J): артефакт + sprint-flip + registry SHIPPED/NEXT
     + handoff-снапшот + CLAUDE.md floor ЖИВЫМ числом + гейты lessons/docs
  6. cleanup 0/0/0 + IN-SYNC → следующая стори
173.13 done → эпик-173 flip + retrospective-заметка в артефакте.
174.5 done → финальный 94/94 reconciliation + финальный handoff → СТОП.
```

**Пропорции делегирования**: MINOR (≤10 файлов) — можно самому; FULL — волны executor'ов (~30 файлов, непересекающиеся списки, канон-таблица в промпте волны); гард/валидация/closeout — всегда сам; ревью — только code-reviewer (opus, свежий контекст); любой результат разведки/волны/ревью — СРАЗУ в `/tmp/<story>-*.log`-файл, не в голову.

---

## 1. Bootstrap (каждая НОВАЯ сессия + при любом подозрении гонки)

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # ОБЯЗАТЕЛЬНО v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main
git rev-parse HEAD && git status --short        # чисто
git worktree list                               # ЧУЖИЕ worktrees НЕ трогать
git branch --list "cdx/*"                       # остатки?
grep "NEXT" _bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md
```

Ожидаемое на старте: main ≈ `aa7bc705` или новее; floor **≥ 19 800 / 1252 файла**; прогресс 88/94; эпик 173 = 12/13. Расхождение handoff ↔ репо → репо = истина, исправь снапшот в первом closeout-коммите. **Параллельная команда может быть активна** (прецеденты: работа шла двумя lane одновременно) — смотри §6.

---

## 2. Модельный роутинг и делегационная матрица

**[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный `model`-псевдоним tier** (`opus`/`sonnet`/`haiku`) — без него энфорсер отклонит вызов.

| Работа | Агент | `model` | Контракт |
|---|---|---|---|
| Ad-hoc разведка | `explore` | `sonnet` | READ-ONLY; вопрос + пути; результат file:line |
| Волны миграции (~30 файлов) | `executor` | `sonnet` | Правит ТОЛЬКО файлы списка; канон в промпте; НЕ коммитит; отчёт = маппинг + отклонения |
| Сложная правка | `executor` | `opus` | Тот же контракт, меньше файлов |
| Отладка | `debugger` | `sonnet` | Диагноз + минимальный фикс |
| **Ревью диффа** | `code-reviewer` | `opus` | СВЕЖИЙ контекст = отдельный вызов; вход `/tmp/<story>-review-diff.txt`; import-closure аудит ОБЯЗАТЕЛЕН; выход = вердикт + findings с severity |
| Верификация evidence | `verifier` | `sonnet` | Тест-выводы, инвентарь диффа, отсутствие forbidden |
| Артефакт/closeout-черновик | `writer` | `sonnet` | По факсам; финал сверяешь ты |
| BE/SDK-вопросы | `document-specialist` | `sonnet` | Repo-доки → web |

**Жёсткие правила**: (1) ревьюер ≠ автор; (2) сабагенты НЕ коммитят/пушат/мержат; (3) промпт сабагенту самодостаточен: абсолютный путь worktree + `cd` ПЕРВОЙ командой, список файлов, канон-таблица, запреты, формат отчёта; (4) дифф-файл к каждому ревью (`git diff > /tmp/<s>-review-diff.txt` + новые файлы конкатенацией); (5) изоляцию `worktree` для сабагентов НЕ использовать; (6) сетевые смерти сабагентов (ConnectionRefused/FailedToOpenSocket): ревьюер — восстановить SendMessage-резюмом по agentId; исполнитель, умерший ДО правок — перезапусти задачу сам (дешевле резюма), УМЕРШИЙ на середине — свип-проверь фактическое состояние и дочисти вручную.

---

## 3. Поверхности и границы (авторитет плана стори)

Allowed = только файлы плана. Forbidden: `src/components/ui/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `src/stores/**`, `package.json`, AppShell, route-ledger, чужие домены. Нужна правка forbidden → СТОП + эскалация (но сначала проверь: легаси-цвета в `src/lib/**` — это ИЗВЕСТНЫЙ lib-wave долг → 174.2, а не твоя правка).

**Owner-границы по потребителям**: перед миграцией семейства построй границу по транзитивным потребителям (list/detail/shared) и закодируй в гард exclusion-списком (эталон — `DETAIL_EXCLUDED` в `src/app/(dashboard)/supplies/__tests__/supplies-list-presentation-source-contracts.test.ts`, 18/18 точен). **Cross-restraint**: не трогай файлы следующей стори даже если они грязные.

---

## 4. Конвейер стори A–J (унифицированный)

**A. План + pre-flight**: frontmatter плана ПЕРВЫМ (имена branch/worktree — ТОЛЬКО оттуда; опечатка = recreate, урок 172.16); carry-in grep по ID стори в реестре (обязателен — см. TEAM-HANDOFF §3: у 173.13 их ДВА); grep AC-существительных; всё реализовано → no-op close с evidence. Разведка — в файл.

**B. Worktree + behavior-lock**: `git worktree add -b <branch-из-плана> /private/tmp/<worktree-из-плана> origin/main` + symlink `node_modules` + копия `.env.e2e`/`.env.local`; targeted baseline → N/M в `/tmp`.

**C. Комплаенс ЯВНЫМИ путями** (zsh НЕ word-split'ит `$VAR`!): palette/hex/rawbtn по owned surface → вердикт NO-OP / MINOR-GAP / born-clean / FULL-lite / FULL. **Hex-скан только ERE** (`grep -cE "#[0-9A-Fa-f]{6}"` — BRE-форма молчит, урок 172.11). Closure-предскан ДО волны: BFS импортов от entry; живые файлы → будущий гард-каталог; owner-граница по потребителям (§3).

**D. Правки**: MINOR — сам; FULL — волны executor'ов. Токен-канон: валентности `status-{success,warning,error,information,pending}`; фиолетовый = `status-pending` (hue 277); **WCAG**: мелкий текст (≤12px) на тинте требует solid-пару `bg-X` + `text-X-foreground` (warning на /10-тинте = 4.06:1 — падает axe; канон из 173.12); SVG/recharts = `var(--color-chart-N/…)` (форма `--color-*`, НЕ голая `--chart-*`); баннеры `border-X/40 bg-X/10 text-X`; все зелёные делят один HSL → различие только `color-mix`-альфой. Raw `<button>` → ui-Button (+`type="button"`, нейтрализация дефолтов h-9/px-4/justify-center/whitespace-nowrap по siblings). Тест-репины: same-semantics, не weakening; opacity-токены НЕ живут в `querySelector` — `className.toContain`.

**E. Гард** (эталоны: supplies 173.12, orders 172.14, finances 172.10): каталог exact-array per-file (+ exclusion-список соседних стори; dead-файлы — honest-аннотация); no-palette/no-hex с self-testами ОБЕИХ полярностей (positive обязателен — иначе регекс может онеметь); контракты (статус-карты, caption `captionText ? <TableCaption>`, tabular-nums, валентности); пины per-key (голый token-матч спуфится соседней строкой); cross-file mirror-инварианты пинь отдельным тестом (legend↔cell, урок 172.12). **Докажи, что гард кусается**: прогон регекса по `git show HEAD:<file>` до миграции (урок 172.16).

**F. Валидация** (exit-коды ТОЛЬКО `cmd > log 2>&1; echo EXIT=$?`): targeted → lint → tsc → max-lines → **prettier --check на изменённых** (format:check baseline репо = 39 warn — не твой гейт, но твои файлы должны быть чисты) → `npx next build --webpack` → **полный пол СОЛО, без параллельных build/e2e** (forks-starvation = «пропавшие» файлы, урок 20) → e2e npm-обёрткой (pm2-танец: stop → worktree-dev `--webpack -p 3100` → спека → pm2 restart ОБЯЗАТЕЛЬНО; логины ≤2/час — троттл общий с соседями) → `git diff --check`. Аттестация чисел обёртки — разложением («11 = 3 setup + 2 orders + 6 spec»). Bisect-протокол: фейл на чистой базе (stash) → pre-existing; фейл только с диффом → ТВОЙ, чини.

**G. Ревью**: микро-дифф <50 прод-строк → 1 проход; behavior-changing → 2 в РАЗНЫХ свежих вызовах; триггеры ≥3 (novel-pattern / >12 находок / >5 в проходе / meta-claims). Findings: чинить (APPLIED) или disposition (DISPOSITIONED с evidence) — оба в артефакт.

**H. Фиксы**: мелкие сам, крупные executor'у; перепрогон наименьшего таргета + универсальные.

**I. Git/PR/merge/cleanup — ТОЛЬКО сам**: `git branch --show-current` перед КАЖДЫМ коммитом; fetch + rebase на живой main перед PR (параллельная lane могла влить); явный stage; conventional commit; `gh pr create` → `gh pr merge --merge`; cleanup 0/0/0 (remote/local/worktree + prune; `-D` только с ancestor-доказательством) + IN-SYNC.

**J. Closeout — ТОЛЬКО сам**: артефакт `_bmad-output/implementation-artifacts/<story>-fe-*.md` (формат эталонов 173-12/172-7; Status + PR/SHA; Tasks; Dev Agent Record с `### Post-Nth-pass-review fixes (ДАТА)`; File List; Change Log close-строка + `**Lessons:** (1)…(2)…(3)…` ≤120 симв/шт; APPEND-ONLY) → sprint-flip → registry SHIPPED + NEXT → handoff-снапшот (TEAM-HANDOFF §0/§2) → **CLAUDE.md floor живым числом** (не верь строке — соседи отставали) → гейты lessons-length 0 + check:docs exit 0 (baseline-accept только с разбором NEW/RESOLVED) → docs-PR → merge → cleanup. `_bmad-output/` в .gitignore → `git add -f` поштучно.

---

## 5. Гейты (текущие; растут точными +N — обновляй таблицу в каждом closeout)

Vitest полный ≥ **19 800** / 0 failed / 1252 файла · lint 0/0 (zero-warning) · tsc 0 · max-lines OK (200/800) · prettier на изменённых = чисто · check:docs exit 0 (baseline **95**) · locale-percent 4 · lessons-length 0 · build `--webpack` exit 0 · e2e 0 failed (осознанные skip с reason; cold-flake → тёплый ретрай ± бисект).

---

## 6. Параллельная команда (протокол валидан боем 173.11∥173.12)

1. Единица координации = стори; занятость = branch+worktree (общий `git worktree list` виден обоим). NEXT занят соседом → бери следующую незанятую.
2. Поверхности дизъюнктны по определению планов; пересечение найдено → СТОП.
3. PM2 :3100 — перед stop проверь свежесть чужого worktree (`find <wt>/src -newermt '-10 min' | wc -l`); активен → не трогай pm2, отложи e2e. Окно stop→restart минимально.
4. BE-троттл 5/ч ОБЩИЙ: ≤2 твоих e2e-прогонов/час; 429 → unit-twin + честный gap.
5. Merge-гонки: их docs-PR конфликтует с твоими реестрами текстуально → ребейз на живой main, правки поверх живых строк, re-grep перед коммитом closeout.
6. Унаследованный check:docs-дрейф по их строкам → `--update-baseline` с разбором (прецедент PR #362).
7. Чужие worktree/ветки/PR — не трогать; коллизия WIP в твоём worktree → снапшот `/tmp` → СТОП → владелец.

---

## 7. Долг: интеграция в стори (TEAM-HANDOFF §3 — читать целиком каждую стори)

- **173.13 carry-ins (обязательные)**: (a) `SUPPLY_STATUS_CONFIG` в `src/types/supplies/helpers.ts` — migrate-or-delete (мёртвый twin); (b) потребление уже-мигрированного shared `SupplyStatusBadge` (не трогать); (c) расширение каталога гарда 173.12 при добавлении detail-файлов = осознанное обновление.
- **174.2 = чистильщик долга**: lib-wave (`monitoring-constants STATUS_COLORS`, `wb-status-data-*`, `analytics-utils` ×4 — с обновлением всех downstream-пинов одним коммитом), dead-code (Telegram-трио, WbTokenBanner, ExportConfigForm, C3/C4), 171.9 carry-outs, FE-D* по §11.1 канонического handoff.
- **174.3**: WCAG tint-audit (все `text-status-*` на `bg-*/10` без axe-спек), все visual/environment-gap'ы.
- **174.4**: discovered-not-executed Playwright-наборы (40+81+99 file-level из 173.x), credentialed journeys, отсутствующая FBO-спека.
- **174.5**: baseline-сводение (format:check 39→0, docs-цитаты), унификация ~25 гардов, финальные route-ledger verified.
- Новые находки → APPEND в TEAM-HANDOFF §3 (ID + статус по словарю §11.9) в closeout-PR; не оставляй долг только в чате/ревью.

---

## 8. Стоп-условия и эскалация

СТОП: план ↔ живой код; нужна правка forbidden (кроме документированного lib-wave → 174.2); чужая сессия снесла твой WIP (восстанови из коммитов, задокументируй); гейт падает по baseline-дрейфу ≠ твой дифф (после разбора NEW/RESOLVED); волна/ревьюер дважды вернули неразрешимое; mid-flight конфликт за NEXT-стори. Эскалация — владелец репо (PR-описание/issue). Запрещено: деплои, production, force-push, прямые пуши в main, обязательные CI-гейты, BE-репо `git add -A frontend/`.

---

## 9. Критерии успеха оркестратора

1. Стори закрываются полным A–J без пропуска гейтов; floor монотонен точными +N.
2. Реестры (sprint + registry + TEAM-HANDOFF §0 + CLAUDE.md) актуальны после КАЖДОГО merge одним closeout-PR.
3. 0/0/0 после каждой стори; primary чист; IN-SYNC; pm2-dev возвращён после каждого e2e-танца.
4. Делегационная гигиена: ревьюер ≠ автор; сабагенты не коммитят; промпты самодостаточны; результаты в /tmp.
5. Долг не копится в чате: carry-in'ы стори выполнены, новые — в §3 handoff.
6. Финал: 173.13 + эпик-flip → 174.1–174.5 → **94/94** → финальный reconciliation + финальный handoff-документ → СТОП.

---

## 10. Дайджест ловушек (полные списки: TEAM-HANDOFF §3.6 + канонический handoff §11.7 + 21 урок в handoff-172 §7)

Node-26 ломает webpack (PATH-пинн 24.18.0 на КАЖДУЮ npm/npx, включая сабагентов) · e2e-обёртка подмешивает auth/orders (аттестуй разложение; `--no-deps` ОТКАЗАНО) · BE-логин троттл 5/ч общий · zsh не word-split'ит · rg glob-порядок · `*/` в док-комментариях · guarded-литералы в комментариях матчатся регексами · пины вне targeted ловит только полный пол · import-closure аудит обязателен · ре-экспорт-шимы (сверяй палитроносца с фактическим файлом) · cold-compile e2e-флейк → тёплый ретрай + бисект · fixture со фиксированным статусом недетерминирует терминал · chart-токены сверяй по HSL · registry carry-in НЕ наследуется (grep по ID) · дефолт-Badge hover · параллельная сессия может писать в ТВОЙ worktree (снапшот→СТОП→владелец) · Playwright end-anchored globs молча промахиваются по query-URL → RegExp · фоновый полный пол + build/e2e = forks-starvation · ConnectionRefused-смерти сабагентов → резюм/ручной добив · frontmatter плана ДО worktree add · format:check на изменённых · floor только живым прогоном · tint-контраст ловится только axe · opacity-токены ломают querySelector.

---

**Первое действие после прочтения**: TEAM-HANDOFF целиком → §1 bootstrap → grep NEXT реестра → план 173.13 → петля §0.

*Промпт V12 подготовлен сессией-оркестратором волн 172.10–172.17 + 173.12 (V11-наследник; дополняет, не заменяет канонический HANDOFF-173-174).*
