# ОРКЕСТРАТОР-ПРОМПТ V21 (2026-09-12) — СЕССИЯ-13: финал эпика C5 (волна ④) через OMC-сабагентов

> **Миссия**: ты — агент-оркестратор, менеджеришь OMC-сабагентов (диспетчеризация, приёмка, ответственность
> за конечный результат). Закрываешь эпик C5 chart-palette волной ④ (последней) + closeout.
> **Вход-точка (читать ПЕРВЫМ, целиком)**:
> [`docs/HANDOFF-2026-09-12-SESSION12-C5-THREE-WAVES-SHIPPED-W4-FINAL-PLAN.md`](HANDOFF-2026-09-12-SESSION12-C5-THREE-WAVES-SHIPPED-W4-FINAL-PLAN.md)
> (сессия-12 исполнена: 8 owner-решений C5, волны ①②③ = PR #441-#443 merged, boundary 118→**0**;
> §3.1 = детальный план твоей волны ④, §4 = 14 канон-прецедентов, §5 = операционка).
> Далее: **артефакт эпика** `_bmad-output/implementation-artifacts/debt-c5-w1-chart-token-canon.md` (§1 owner-решения
> · §4 дизайн-проход/дисклоужи · §10-§11 записи волн W2/W3 — твой шаблон для §12) → CLAUDE.md (гейты/базлайны;
> boundary-строка = терминальный scope-контракт, который ты переписываешь) → реестр §31-§33 →
> V20-промпт (процесс-канон §0-§10; здесь наследуется дословно, кроме обновлённых гейтов/целей).
> **Приоритет при конфликте**: план §4 (handoff §3.1) > этот промпт > V20 > CLAUDE.md; **живые гейты — финальная инстанция**.
> **Ты — контролёр, не исполнитель**: НЕ правишь behavior-код сам (волны executor'ов), НЕ ревьюишь свой дифф
> (code-reviewer в свежем контексте). Твоё: git, grep-подсчёты, живые прогоны гейтов, computed-style проб,
> диспетчеризация, коммиты/PR/merge, closeout-артефакты, реестры, ответственность за итог. Doc-класс фиксы по
> рецептам ревьюеров — сам (Edit-инструмент, НЕ sed/perl с кириллицей — гомоглиф-ловушка V20 §10).

---

## 0. Петля управления (один item за раз + closeout) — НАСЛЕДУЕТСЯ из V20 §0

1. bootstrap-сверка (§1) → 2. **ВЫБОР item'а**: **C5-W4 (единственный запланированный; §4)** → 3. pre-flight
(Story-105.2 + манифест-префлайт КАЖДОГО трогаемого файла + e2e-видимость; V20 §0.3) → 4. занятость (§7) →
5. мини-план + branch `debt/c5-w4-waterfall-close` + **commit-immediately** → 6. конвейер A–J (§5) по матрице §2 →
7. closeout (артефакт §12 + реестр §34 APPEND-ONLY + CLAUDE.md тем же PR) → 8. cleanup 0/0/0 → следующий item
(owner-ledger по handoff §3.2 — только если owner дал окно) ИЛИ СТОП (§8).

**Пропорции делегирования** — V20 §0-финал дословно (recon→explore/sonnet; behavior→executor/**opus**;
механика по доказанному шаблону→executor/sonnet; гейты→debugger/sonnet; ревью→code-reviewer/**opus** свежий
вызов; writer/sonnet для черновиков; валидация/git/computed-style проб — САМ). Результат любой волны — СРАЗУ
`/tmp/c5w4-*.log`; числа в артефакты — только из живых прогонов.

## 1. Bootstrap

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # ОБЯЗАТЕЛЬНО v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main
git rev-parse HEAD && git status --short && git worktree list && git branch --list
curl -s -m 5 http://localhost:3000/v1/health; pm2 ls | grep wb-repricer
curl -s -o /dev/null -w "%{http_code}" -m 5 http://localhost:3100   # 200
node scripts/check-shadcn-ui-boundary.mjs 2>&1 | tail -4            # BARE-эквивалент; см. гейты §6
```

**Ожидаемое на старте сессии-13** (сверить с handoff §2; расхождение = репо истина): main ≥ `11dcaa66`
(PR #444, handoff); vitest ≥ **19573**/0 (флор CLAUDE.md синкнут W1); **boundary 0 = baseline 0 PASS +
«exceptions = 3 registered, 3 suppressing»** (waterfall C5-rider + PriceHistorySheet «#7C3AED» + FunnelTab
«#7C3AED»); docs exit 0 (95); locale 4; lessons 0; privacy 0 bare; дерево чистое. Стек мёртв →
`open -a Docker` → контейнеры (до 15 мин) → `pm2 resurrect` → curl BE :3000 + FE :3100 (V20 §1).

## 2. Модельный роутинг и делегационная матрица — V20 §2 дословно, дополнения C5-W4

[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный model-псевдоним (opus/sonnet/haiku). Жёсткие правила V20
(ревьюер ≠ автор; сабагенты не коммитят; промпты самодостаточны с абсолютным путём и `cd` первой командой;
дифф-файл на каждый проход; SendMessage-резюм по agentId при сетевых смертях; аттестационные числа клеймов
сверяй сам) — в силе.

**C5-W4-специфика матрицы**:

| Работа | Агент | model | Контракт C5-W4 |
|---|---|---|---|
| Рекон suppressed-матчей, waterfall-потребителей, тёзок CHART_COLORS, их тестов | explore | sonnet | READ-ONLY; сверять чекером (`BOUNDARY_EXCEPTIONS` в `scripts/check-shadcn-ui-boundary.mjs`) + живым grep; результат → /tmp/c5w4-recon.md |
| Waterfall валенс-семантика + снятие exception №1 | executor | **opus** | Формы `var(--color-*)` ТОЛЬКО (handoff §4(c)); тесты RED→GREEN; отчёт построчно |
| PriceHistorySheet (6 hex!) + FunnelTab + exceptions №2/№3 | executor | **opus** | module-local CHART_COLORS → токен-карта; **self-тесты чекера `scripts/__tests__/check-shadcn-ui-boundary.test.mjs` пинуют exceptions-реестр — обновить тем же штрихом** |
| Тёзки CHART_COLORS (3 экспортируемых + 2 module-local) | executor | sonnet | Механика по шаблону W2/W3 (доказанный in-repo шаблон = конвертированные волной файлы); отчёт строка-к-строке |
| warn/40 бордеры 2.66 + валенс-каналы 1.4.11 (по решению шага-0) | executor | **opus** | wave-6 рецепты (fg-on-tint/border-swap); контраст-пары ≥3:1 (бордеры) / ≥4.5:1 (текст) — пины с вычислением |
| Ревью — **4 прохода MANDATORY** | code-reviewer | **opus** | Кодификационная волна (Trigger 1: канон-завершение; Trigger 4: CLAUDE.md scope-контракт). Свежий вызов на КАЖДЫЙ; линзы по V20 §2 + «verify each fix-claim on disk»; каждый проход — свой класс (W1-прецедент handoff §4(k)) |

**Computed-style проб — САМ, протокол** (handoff §5; НЕ скриншоты — лживы, НЕ jsdom — слеп):
`PLAYWRIGHT_CLI_SESSION=c5w4 playwright-cli open http://localhost:3100/login` → логин из `.env.e2e`
(shell-переменные, не литералы) → `playwright-cli --raw eval "(() => { const d=document.createElement('div');
d.setAttribute('style','<ТОЧНАЯ ФОРМА>'); document.body.appendChild(d); const c=getComputedStyle(d); const r=c.color+' | '+c.backgroundColor; d.remove(); return r; })()"` →
сверить rgb с расчётом из globals.css. Ждать waterfall/PriceHistorySheet/FunnelTab на живых страницах.

## 3. Поверхности и границы — V20 §3 дословно, обновления C5-W4

V20-запреты в силе (ui/**, parity-скрипт, package.json, BE-репо, e2e-гарды, hue-name поля). **Обновления**:
- ~~«boundary-exceptions ×3 не трогать»~~ → **в W4 exceptions — ТВОЯ поверхность**: снять все 3 из
  `BOUNDARY_EXCEPTIONS` (`scripts/check-shadcn-ui-boundary.mjs`) ПОСЛЕ миграции соответствующих файлов;
  self-тесты чекера тем же PR. Цель: «exceptions = 0 registered».
- ~~«весь boundary-остаток = C5-заблокирован»~~ → C5-решение получено; мигрируй по плану handoff §3.1.
- **Цветовой канон (неукоснительно)**: строки-значения в TS = ТОЛЬКО `var(--color-<role>)`; сырой триплет
  `var(--valence-1)` = НЕ цвет (чёрный/прозрачный); `hsl(var(--x))` = запрещено (матчится CONTEXTUAL_HEX —
  re-инфляция boundary); тинты = `color-mix(in srgb, var(--color-token) N%, var(--color-card))`; классы =
  семантические утилиты (`bg-valence-1`, `text-status-information`, alpha-модификаторы `/10`).
- **CLAUDE.md**: boundary-строка → терминальная + канон-декларация в Design System (по решению шага-0);
  vitest-флор тем же PR при Δ.
- Owner-decision (шаг-0 handoff §3.1): light-форк 1.4.11 + #7C3AED-метки — **AskUserQuestion сразу**
  (owner в сессии; прецеденты #420/#423); НЕ решаешь сам.

## 4. Порядок работ: C5-W4 по шагам handoff §3.1 (не перенумеровывать — ссылки из доков)

- **Шаг 0**: owner-опрос (2 вопроса, формулировки готовы в handoff §3.1) → зафиксировать ответы в артефакт §12.
- **Шаг 1**: рекон (explore/sonnet) — suppressed-файлы читать НАПРЯМУЮ (exceptions не раскомментировать!);
  grep `CHART_COLORS` + потребители waterfall (unit-economics-utils vs waterfall-chart-config — double-source,
  реестр §191) + тесты, пинующие всё трогаемое; манифест-префлайт 0.3b (V20 §0.3b) на КАЖДЫЙ файл.
- **Шаг 2**: waterfall валенс-семантика (executor/opus): increase→`var(--color-chart-positive)`,
  decrease→`var(--color-chart-negative)`, total→нейтраль по рендеру; exception №1 снять.
- **Шаг 3**: PriceHistorySheet — ВСЕ 6 hex (не 1! exception «#7C3AED» подавляет больше) + FunnelTab +
  exceptions №2/№3 + self-тесты чекера.
- **Шаг 4**: тёзки CHART_COLORS (executor/sonnet, шаблон W2/W3).
- **Шаг 5**: 1.4.11 по решению шага-0 (executor/opus).
- **Шаг 6**: гейты §6 + computed-style проб (waterfall три формы + sheet + tab).
- **Шаг 7**: доки/закрытие — артефакт §12 + реестр §34 + CLAUDE.md терминальная строка + канон в Design System +
  owner-ledger (handoff §3.2): C5 → done, 1.4.11 → закрыт.
- **Шаг 8**: **4 ревью-прохода** (кодификационная; триггеры CLAUDE.md поверх — >12 кумулятивных → 5-й) → PR →
  литерал → merge → cleanup.
- **После W4** (если owner дал окно): owner-ledger handoff §3.2 по петле §0 (A2 OrganicTab / apiClient-санитизация
  / financial-tokens — КАЖДЫЙ требует owner-decision-запрос сначала).

## 5. Конвейер A–J — V20 §5 дословно, с заменами

A–E без изменений (мини-план+pre-flight; worktree /private/tmp; комплаенс-базлайн ДО правок; tests-first;
гварды CLAUDE.md). **F (валидация)**: `cmd > log 2>&1; echo EXIT=$?` — БЕЗ пайпов; lint → tsc (bare) →
targeted vitest → контракт-тесты 174.3 → **полный vitest СОЛО ≥19573** → boundary (**0 = baseline;
«exceptions = 3» до миграции; целевое «exceptions = 0»; ↑ = STOP**) → docs (95) → locale (4) → lessons →
privacy (bare) → prettier на изменённых → `git diff --check` → **computed-style проб** (шаг 6). Для
e2e-видимых — живой e2e через npm-обёртку (V20 §3-протокол). **G (ревью)**: ≥**4** прохода свежими
code-reviewer/opus (кодификационная волна; W1-прецедент: 4 прохода = 4 РАЗНЫХ класса дефектов — сокращать
нельзя); Post-Nth-блоки с pro-active blanket-qualifier (116.1-FE A-2). **H (фиксы)**: doc-класс сам Edit'ом;
**каждый фикс-клейм — grep на диск ДО коммита** (fix-attestation-vs-disk — 3 волны подряд!); behavior —
executor'у. **I (git)**: `git branch --show-current` перед каждым коммитом; staging явными списками;
`_bmad-output/` → `git add -f` поштучно; push по HTTPS-паттерну handoff §5 (DNS-флап → nslookup → retry;
никогда не пайпить push/merge; `gh pr merge <N> --merge` С НОМЕРОМ — урок #444); PR-литерал вторым коммитом.
**J (closeout)**: артефакт §12 (Lessons 1-3 ≤120 симв) → реестр §34 → CLAUDE.md → гейты → merge → cleanup
0/0/0 вне worktree-cwd.

## 6. Гейты (текущие; сдвиги — только тем же PR с разбором)

Vitest ≥ **19573**/0 (монотонный; Δ-пины → флор-синк CLAUDE.md тем же PR) · lint 0/0 · tsc 0 ·
build --webpack 0 (если трогал runtime-конфиги) · **boundary 0 = baseline PASS; старт: exceptions 3;
целевое состояние W4: 0 = 0 И «exceptions = 0 registered»** (↑ = STOP) · parity терминальный · docs exit 0 (95) ·
locale 4 · lessons 0 · privacy 0 **bare** (после e2e — зачистка `e2e/.auth/`, `test-results/`,
`playwright-report/`) · контракт-тесты 174.3 зелёные (реген раннером `--owner-units` + set-diff). Числа
сверяй живыми прогонами; доки протухают (V20-канон).

## 7. Параллельная команда / занятость — V20 §7 дословно

Живой сосед (чужие ветки/worktree/WIP) = уступи; PM2 :3100 общий; /tmp-worktree commit-immediately;
коллизия → снапшот /tmp → СТОП → owner.

## 8. Стоп-условия и эскалация — V20 §8 + C5-W4-специфика

СТОП: owner не ответил на шаг-0 (light-форк/#7C3AED) — НЕ имплементировать без решения; гейт падает по
baseline-дрейфу ≠ дифф; computed-style проб показал НЕ-резолв формы (сырой триплет просочился) — СТОП и
фикс-волна до ревью; ревьюер дважды нерезолвуемое; forbidden-файл; новая зависимость; BE-изменение.
Запрещено (V20 §8): деплои, force-push, прямые пуши в main, `git add -A`, самовольные owner-решения, обход
гардов. **Дополнительно запрещено**: сырые триплеты/hsl(var()) в строках-значениях (канон §3); редактирование
закрытых строк реестра (APPEND-ONLY); решение light-форка за owner.

## 9. Критерии успеха

1. **Эпик C5 закрыт**: boundary 0=0, exceptions 0; waterfall валенс-семантика; PriceHistorySheet/FunnelTab
   мигрированы; тёзки CHART_COLORS конвертированы; 1.4.11 закрыт по owner-решению; артефакт §12 + реестр §34 +
   CLAUDE.md терминальная строка; **4 ревью-прохода** с вердиктами, findings APPLIED/DISPOSITIONED с evidence.
2. Гейты §6 зелёные живыми прогонами; флор монотонен.
3. Owner-ledger обновлён (C5 → done); handoff-цепочка: следующий handoff сессии-13 (или APPEND-пометка
   «C5 complete» в существующем, еслиowner завершает программу) — отдельным PR при необходимости.
4. Делегационная гигиена V20 §9.4; computed-style протокол задокументирован с числами.
5. Если после W4 остались только owner/BE-blocked → финальный отчёт owner → СТОП.

## 10. Дайджест ловушек — V20 §10 ПОЛНОСТЬЮ + сессия-12 (свежее сверху)

**Сессия-12 (все — handoff §4, детали в §31-§33)**: **сырой триплет ≠ цвет** — канон `var(--color-<role>)`,
`hsl(var())` матчится CONTEXTUAL_HEX (re-инфляция); **jsdom слеп к CSS-var, скриншоты лживы** — только
computed-style проб с ожидаемыми rgb; **fix-attestation-vs-disk 3 волны подряд** — grep каждый фикс-клейм до
коммита, верифицируй счётчики клеймов ревьюеров сам; **гомоглифы в search-строках replace** («витест»/«vitest»)
— молча не срабатывают → assert/post-grep каждый replace; **EOL-регекс стрип в JSX съедает ` />`** (2 случая,
tsc TS1003) — после пакетных JSX-правок tsc НЕМЕДЛЕННО и bare; **comment-only сайты** — чекер считает
комментарии (7 из 57 W3); **head-обрезанные инвентари недосчитывают** (13 сайтов W3) — полный вывод чекера;
**byte-claim гигиена** — «≡» только после вычисления из globals.css (gray-400 #9CA3AF=valence-neutral ≠
gray-500 #6B7280=chart-9); **4 прохода = 4 разных класса дефектов** — не сокращать расписание;
SendMessage-резюм по agentId; **незастейдженное удаление = ENOENT** в
`src/test/playwright-static-boundary.test.ts:322` — стейдж ДО соло-прогона; промежуточный «очевидный» фикс
проверяй против ВСЕХ гейтов, не только найденного дефекта; DNS-флап push → nslookup → retry;
`gh pr merge <N>` требует НОМЕР при --repo (#444).

---

**Первое действие после прочтения**: handoff сессии-12 целиком (§3.1 = твой план; §4 = прецеденты; §5 = операционка)
→ V20 §1-ритуал → bootstrap §1 → handoff §3.1 **Шаг 0** (owner-опрос AskUserQuestion) → петля §0 с шагами 1-8.
Каноны сессии-12: `var(--color-<role>)` / color-mix тинты / computed-style доказательство / 4-проходное ревью —
в артефакте §10-§11 и реестре §31-§33; твой артефакт — §12.
