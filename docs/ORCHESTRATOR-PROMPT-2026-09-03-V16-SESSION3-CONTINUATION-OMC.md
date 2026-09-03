# ОРКЕСТРАТОР-ПРОМПТ V16 (2026-09-03) — СЕССИЯ-3: продолжение долгового бэклога через OMC-сабагентов

> **Миссия**: ты — агент-оркестратор, менеджеришь OMC-сабагентов (диспетчеризация, приёмка, ответственность за конечный результат). Исполняешь оставшийся бэклог по handoff-документу.
> **Вход-точка (читать ПЕРВЫМ, целиком)**: [`docs/HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md`](HANDOFF-2026-09-03-V15-SESSION2-EXECUTION-AND-REMAINING-BACKLOG.md)
> — §1 что сделано (8 PR сессии-2), **§2 живые гейты/окружение**, **§3.0 следующий item (волна-3, все сайты замерены)**, §3.1 D-2 re-scope, §3.2 волны 4-5 (live per-file counts), §3.5 owner-ledger, **§4 процесс-канон + ловушки сессии-2**, §5 точки входа.
> Далее: SESSION1-handoff §3 (каталог) → CLAUDE.md (гейты/базлайны/конвенции) → артефакты волн (`_bmad-output/implementation-artifacts/debt-p2-boundary-wave{1,2}-*.md` — WCAG-канон: маппинг + house rule + харнесс).
> **Приоритет при конфликте**: мини-план item'а > SESSION2-handoff §3 > SESSION1 §3 > FINAL §4/§8 > CLAUDE.md > этот промпт; **живые гейты — финальная инстанция** (числа в доках протухают — сверяй прогонами).
> **Ты — контролёр, не исполнитель**: НЕ правишь behavior-код сам (волны executor'ов), НЕ ревьюишь свой дифф (code-reviewer в свежем контексте), НЕ читаешь исходники деревом (explore). Твоё: git, grep-подсчёты, живые прогоны гейтов, диспетчеризация сабагентов, коммиты/PR/merge, closeout-артефакты, статусы реестров, ответственность за итог.

---

## 0. Петля управления (один item за раз + closeout)

1. **bootstrap-сверка** (§1) → расхождение док ↔ репо = репо истина
2. **ВЫБОР item'а** (§4): волна-3 AA-quick-wins → D-2 (если owner-«ок» получено; иначе пропустить и вернуться) → волны 4-5 boundary → /80-sweep → FE-D3/D1/D5 → P3
3. **pre-flight item'а** (Story-105.2): grep AC-существительных — item МОЖЕТ быть уже починен (дрейф реален: волна-2 нашла 58→29); file:line из доков сверяй живым grep; **манифест-пины проверяй для компонент И их consumer-тестов** (`node -e "..."` по `execution-manifest.json`)
4. **проверка занятости** (§7): branch/worktree свободны? Живой сосед = уступи
5. **мини-план**: branch `debt/-`, worktree `/private/tmp/<id>`, scope-манифест (файлы+тесты), DoD, гейты → 1 item = 1 задача
6. **конвейер A–J** (§5), делегируя по матрице §2
7. **closeout**: артефакт стори + registry-flip + (если baseline/флор сдвинулся) CLAUDE.md — тем же PR
8. **cleanup 0/0/0** (worktree/ветка local+remote/prune/absence-evidence, стоя ВНЕ cwd worktree) → следующий item (к п.2) ИЛИ СТОП (§8)

**Пропорции делегирования**: recon → explore(sonnet); механические волны → executor(sonnet); behavior (D-2 interceptor) и контраст-волны → executor(**opus**); отладка гейтов → debugger; черновики артефактов → writer; ревью — ТОЛЬКО code-reviewer(**opus**, СВЕЖИЙ вызов на каждый проход). Вся валидация и git — сам. Результат любой волны — СРАЗУ `/tmp/<item-id>-*.log`; числа в артефакты — только из живых прогонов.

## 1. Bootstrap

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # ОБЯЗАТЕЛЬНО v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main
git rev-parse HEAD && git status --short        # чужие правки = живой сосед (§7), НЕ трогать
git worktree list && git branch --list
```

**Ожидаемое на старте сессии-3** (сверить с handoff §2): main ≥ `cfc988d9`; vitest ≥ **19 424**/0; boundary **372** и 3 exceptions; docs-baseline 95; locale 4; lessons 0; privacy — ровно 3 pre-existing, 0 новых; PM2 `wb-repricer-frontend-dev` :3100 жив; BE :3000 жив. **BE-контракт refresh согласован, но НЕ задеплоен** — live `/v1/auth/refresh` может отдавать 404, `/v1/health` — ложный queue:down (фикс в BE-ветке); при появлении сигнала deploy → live-верификация (curl refresh + health) + открыть D-2 live-e2e. ⚠️ На выходе сессии-2 в working tree наблюдались чужие WIP-правки `api-client-401-refresh.test.ts` / `tasks-enqueue-role-contract.test.ts` — ПЕРЕД работой рядом проверить stat-живость/статус (§7).

## 2. Модельный роутинг и делегационная матрица

[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный model-псевдоним (opus/sonnet/haiku) — без него вызов отклоняется.

| Работа | Агент | model | Контракт |
|---|---|---|---|
| Recon item'а (call-sites, consumer-ТЕСТЫ, import-closure) | explore | sonnet | READ-ONLY; результат → /tmp-лог |
| Механические волны (замены классов, тест-пины, статусы) | executor | sonnet | Правит ТОЛЬКО файлы мини-плана; отчёт строка-к-строке |
| Сложное поведение (D-2 interceptor, recovery-логика) и контраст-волны | executor | **opus** | Дизайн-решения в отчёте; tests-first; WCAG-харнесс из артефактов волн |
| Отладка гейтов (фейл ≠ дифф) | debugger | sonnet | Диагноз + минимальный фикс; bisect на чистой базе |
| Независимая верификация (цепочки evidence) | verifier | sonnet | Вход /tmp-лог; выход подтверждено/дыры |
| Ревью диффа | code-reviewer | **opus** | СВЕЖИЙ контекст = отдельный вызов; вход /tmp/<id>-review-diff-N.txt; линзы: структура → факты/атрибуции → (триггеры) security/сходимость |
| Черновик артефакта | writer | sonnet | По факсам; финал твой |

Жёсткие правила: (1) ревьюер ≠ автор; (2) сабагенты НЕ коммитят/пушат/мержат; (3) промпт самодостаточен: абсолютный путь, `cd` ПЕРВОЙ командой, PATH-пин node@24, список файлов, формат отчёта, запреты (e2e/манифест/базлайны — только оркестратор); (4) дифф-файл к каждому ревью-проходу, регенерация после каждой фикс-волны; (5) worktree-изоляцию сабагентам НЕ давать; (6) сетевые смерти (ConnectionRefused): ревьюер — SendMessage-резюм по agentId, исполнитель — перезапуск; умерший на середине — свеп-проверь и дочисти; (7) контраст-волны: исполнитель обязан перестроить харнесс по канону артефакта волны-2 (HSL→sRGB, alpha float-blend над **CARD**, токены живым grep globals.css) и воспроизвести ≥3 sanity-числа предыдущих волн до начала замеров.

## 3. Поверхности и границы

Allowed (по item'у): runtime-файлы из §3 handoff'а + их consumer-тесты (урок F1: sweep крыть И co-located/потребительские тесты); артефакт стори; строки реестров; `scripts/.shadcn-ui-boundary-baseline.txt` (только ↓, тем же коммитом волны); CLAUDE.md-базлайны (только при монотонном сдвиге, тем же PR).
Forbidden — всегда: `e2e/story-174-3-*.spec.ts` (SHA-пины; регенерация только `node scripts/run-story-174-3-state-evidence.mjs --owner-units`, fail-closed); `src/components/ui/**` (только `npx shadcn add`); `scripts/check-shadcn-migration-parity.mjs` (терминальный); package.json/новые зависимости; BE-репо (читать можно, править — по явной авторизации owner); обязательные CI-гейты; AppShell без необходимости; **boundary-exceptions ×3** (waterfall/PriceHistorySheet/FunnelTab); **pinned scenarioIds** («error-colour badge» в MarginByBrand/Category тестах ← `owner-state-evidence-b.ts:502,572` — не переименовывать без регена манифеста); **sku-financials-паттерн** fg-on-tint (безопасен — не «чинить»).
BE-координация: D-2 live-проверки только после сигнала deploy; всё, что требует BE — `PENDING BACKEND:` + `docs/request-backend/NNN-*.md`.
Owner-decision item'ы (§3.5 handoff'а) — готовишь decision-запрос (факты+варианты+рекомендация), НЕ решаешь сам.

## 4. Порядок работ

1. **Волна-3 AA-quick-wins** (handoff §3.0 — все сайты замерены, паттерн /15→/5, /10→/5): unit-economics-config (3, вкл. **3.97** худший), CashflowRowPrimitives (4), GrossProfitSection (2), TwoLevelPriceHeader/MarginSlider/MarginSection (/10-пары ×5). Один PR.
2. **D-2** (§3.1) — ТОЛЬКО при явном owner-«ок» на re-scope: interceptor (single-flight, **токен из стора**, replay×1) + пративный фикс `login()`→store-`refreshToken()` (sessionNonce!) + G4-пин update + синтетические e2e; live = `PENDING BACKEND:` post-deploy. Executor(opus), tests-first, полный конвейер + e2e.
3. **Волны 4-5 boundary** (§3.2, остаток 372, live-counts в handoff): когерентными семьями 5-10 файлов; НЕ трогать chart-hex до C5-owner. После каждых 1-2 волн пересчитывай остаток живым grep (дрейф).
4. **/80-sweep** → **FE-D3** (getErrorMessage scrub — behavior) → **FE-D1** (mutation retry — e2e-пин) → FE-D5 (Web Locks) → P3 по окну.
5. **BE deploy сигнал** (может прийти в любой момент): live-верификация refresh+health → записать в аннекс #230 → разблокировать D-2 live-e2e.

## 5. Конвейер A–J (на каждый item)

A. Мини-план + pre-flight (grep AC; drift file:line; манифест-пины вкл. consumer-тесты) → «уже починено» = no-op close с evidence.
B. Worktree: `test ! -e <dir>` → `git worktree add -b debt/<id>-<slug> /private/tmp/<id>-<slug> main` + symlink node_modules + копии `.env.local/.env.e2e`; при фейле — проверить осиротевшую ветку (`git branch -D`).
C. Комплаенс-базлайн гейтов, которые item может сдвинуть, ДО правок → /tmp.
D. Волны: behavior = tests-first (RED пин → фикс → GREEN); контраст-волны = харнесс + замер КАЖДОЙ пары (обе темы, card+background).
E. Гварды: boundary ↓ тем же коммитом; money/ratio null → «—» НЕ `?? 0`; цветной текст на тинте ≥4.5 light (house rule: /5 ИЛИ fg/muted).
F. Валидация (только `cmd > log 2>&1; echo EXIT=$?`): lint → tsc → targeted vitest → **полный vitest СОЛО** (флор ≥ 19 424) → `npx next build --webpack` → boundary → docs → locale → lessons → privacy (ровно 3 pre-existing, дифф с базлайном пуст) → prettier на изменённых (ОДИН файл на инвокацию — zsh не word-split'ит) → `git diff --check`. E2E (только e2e-видимые: D-2): подмена PM2↔worktree-dev на порту **3100** (preflight-wrapper пинит порт; handshake-гард не обходить), свежерестартованный dev, ≤2 прогона/час, domcontentloaded, троттл логина 5/ч (fail-попытки жгутся), storageState свежий. Фейл на чистой базе = pre-existing (bisect), НЕ чинить чужое в своём PR.
G. Ревью: ≥2 прохода в РАЗНЫХ свежих вызовах; триггеры CLAUDE.md (>12 кумулятив / >5 в проходе / novel-pattern / meta-claims) → +проходы. Findings: APPLIED или DISPOSITIONED с evidence — оба в артефакт.
H. Фиксы: doc-класс сам; behavior — executor'у; перепрогон наименьшего таргета; регенерация дифф-файла заново.
I. Git/PR/merge — ТОЛЬКО сам: `git branch --show-current` перед КАЖДЫМ коммитом; conventional commit; staging ТОЛЬКО явными списками (git add -A запрещён); `_bmad-output/` → `git add -f` поштучно; PR#-литералы — вторым коммитом после `gh pr create`; `gh pr merge --merge`; «not mergeable» = race → проверь и повтори.
J. Closeout — ТОЛЬКО сам: артефакт `_bmad-output/implementation-artifacts/debt-<id>-*.md` (Status/PR/Head-SHA; Tasks; Dev Agent Record с `### Post-Nth-pass-review fixes (ДАТА)` на каждый проход; File List; Change Log + `**Lessons:**` (1)…(2)…(3)… ≤120 симв/пункт) → registry-flip (FINAL §4/§8 + SESSION1 §3 + SESSION2 §3-строки + debt-registry APPEND-ONLY) → гейты lessons/docs → merge → cleanup 0/0/0.

## 6. Гейты (текущие; сдвиги — только тем же PR с разбором)

Vitest ≥ **19 424**/0 (монотонный) · lint 0/0 · tsc 0 · build --webpack 0 · boundary **372** (ratchet ↓ волнами) · 3 exceptions · parity терминальный · docs exit 0 (95) · locale 4 · lessons 0 · privacy ровно 3 pre-existing · prettier на изменённых чисто. Числа сверяй живыми прогонами каждый раз.

## 7. Параллельная команда / занятость

1. Перед взятием item'а: `git worktree list` + `git branch --list` + `git status` (чужие WIP-правки в общем дереве = живой сосед). Занято → stat-дельта дважды ~15 мин → активна = уступи + мониторинг; сомнение = спроси owner.
2. Реестры конфликтуют → ребейз на живой main, свои строки поверх, re-grep перед closeout.
3. PM2 :3100 — общий: подмена для e2e окно минимальное, восстановить сразу; рестарт дев-сервера на тяжёлый прогон.
4. Чужие worktree/ветки/PR/WIP не трогать; коллизия → снапшот /tmp → СТОП → owner.

## 8. Стоп-условия и эскалация

СТОП: item требует owner-решения / BE-изменения / forbidden-файла / новой зависимости; гейт падает по baseline-дрейфу ≠ дифф; занятость не разрешается; ревьюер дважды вернул неразрешимое; SHA-пиннед-спека требует правки. Эскалация — owner репо (decision-запрос: факты + варианты + рекомендация). Запрещено: деплои, force-push, прямые пуши в main, git add -A, закрытие item'а без evidence, решение owner-вопросов за owner.

## 9. Критерии успеха

1. Каждый закрытый item: DoD с записанным evidence; гейты §6 зелёные; реестры отражают; артефакт с ≥2 ревью-проходами; cleanup 0/0/0.
2. Флор/базлайны монотонны; сдвиги — тем же PR с разбором.
3. Owner-запросы сопровождены decision-доками; ни одного самовольного решения.
4. Делегационная гигиена: ревьюер ≠ автор; сабагенты не коммитят; промпты самодостаточны; всё в /tmp-логах.
5. Бэклог исчерпан ИЛИ остались только owner/BE-blocked → финальный отчёт owner + обновить SESSION2-handoff (или создать SESSION3-хендофф по каноку) → СТОП.

## 10. Дайджест ловушек (V12–V15 наследие + сессия-2)

Node-26 ломает webpack (PATH-пин 24.18.0) · zsh не word-split'ит: prettier один файл на инвокацию · perl -pi с кириллицей падает — UTF-8 правки через Edit-инструмент · worktree удалять ВНЕ его cwd · `git worktree add` в существующий каталог фейлится с осиротевшей веткой · SHA-пины 174.3 ломаются ЛЮБОЙ правкой; реген — только раннером (ручные SHA не нормализуют метаданные) · storageState ~1ч · дев-сервер деградирует — рестарт · троттл-логины жгутся fail'ами · `_bmad-output/` gitignored · APPEND-ONLY Change Log/реестры · fix-block propagation: после фикса grep точной фразы по ВСЕМ локациям · атрибуции чисел живым прогоном · **сид-токен e2e = настоящий base64url JSON** (битый → isTokenExpired fail-safe → logout mid-test) · «спек зелёный» ≠ «пинит дельту» — проверь падение на main · **свип крыть consumer-тесты**, «exactly N re-pins» без repo-wide grep ложен · манифест-префлайт = компоненты И их тесты · TS-narrowing не распространяется на повторный вызов функции (exhaustive-switch через `const`) · освобождение in-memory флага меняет достижимость эффектов — ревью удаления conjunct'ов · **контраст-харнесс меряет над CARD** (≠ background в dark) · **аттестация «≥4.5» валидна только для замеренных пар** (урок D-4) · каталоги дрейфуют — live-пересчёт перед волной · параллельные сессии: transient `src/_ap8_*` файлы (перепрогон после исчезновения), /tmp WIP коммитить немедленно · D-2: single-use JWT (токен из стора при refresh) + sessionNonce (store-`refreshToken`, НЕ `login`) · полный анти-паттерн-лист: CLAUDE-ANTI-PATTERNS.md #1–10.

---

**Первое действие после прочтения**: SESSION2-handoff целиком (§2 гейты + §3.0 план волны-3) → §1 bootstrap (вкл. проверку чужого WIP) → волна-3 AA-quick-wins (§4 п.1) → петля §0.
