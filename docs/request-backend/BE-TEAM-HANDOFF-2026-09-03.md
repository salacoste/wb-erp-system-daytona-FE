# BE-TEAM HANDOFF 2026-09-03 — пакет вопросов FE→BE (от owner)

**From**: owner (передаёт FE-оркестратору V15 для компиляции) · **Кому**: BE-команда
**Контакт-контекст**: FE main `86fb550c`, все гейты зелёные (vitest 19424/0); BE `:3000` жив, **degraded: queue down с 2026-09-02**.

Два приоритетных item'а + один статус-вопрос. Каждому соответствуют детальные доки (ссылки ниже) — этот файл = карта входа.

---

## Item 1 (HIGH): отсутствует refresh-эндпоинт — блокер D-2/PB-3

**Полный документ**: [`230-auth-refresh-endpoint-missing.md`](230-auth-refresh-endpoint-missing.md) (Problem / Root Cause / Impact / Fix Scope / Reproduction / Resolution)

**Суть в 3 строках**:
1. `AuthController` = ровно `register` / `login` / `logout` — refresh-маршрута **не существует ни по какому пути** (0 упоминаний в auth-модуле; в `test-api/01-auth*.http` тоже).
2. FE-хук `useAuth.refreshTokenIfNeeded` (глобально в root layout) вызывает `POST /v1/auth/refresh` → **404 NOT_FOUND всегда** → любой протухший/непарсящийся access-токен = мгновенный тихий `logout()` + редирект на /login. Поймано e2e-сессией D-1 (curl-репродукция в доке).
3. FE-задача D-2 (реактивный 401-interceptor: 401 → single-flight refresh → replay×1) **не может быть реализована** без целевого маршрута.

**Что нужно от BE** (если решение = реализовать; открытые контрактные вопросы — § Fix Scope дока):
- Механизм: dedicated refresh-token (выдача/ротация при login) ИЛИ продление самого access-JWT (слайдинг)? Текущий FE-вызов шлёт `Authorization: Bearer <access>` + пустое тело, т.е. FE-сторона исходно предполагала слайдинг.
- Ответ: FE ожидает `RefreshTokenResponse = { token: string; user?: User }` (при наличии `user` FE делает полный ре-login с новой sessionNonce).
- Безопасность: ротация/ревокация, TTL пары, троттл.
- До решения FE ничего за BE не имплементирует (`PENDING BACKEND:`).

**Альтернативы** (решает owner): re-scope D-2 на silent re-login UX / отмена с residual-риском.

---

## Item 2 (MEDIUM, doc-only): SEC-DOC-1 D-2 — ремедиация BE-репо

**Полный план**: [`../security/SEC-DOC-1-BE-remediation-plan-2026-09-02.md`](../security/SEC-DOC-1-BE-remediation-plan-2026-09-02.md) (4 фазы, живой инвентарь, прецеденты, запреты)

**Суть**: ~110 doc-only вхождений двух мёртвых кред-литералов (L-A stale / L-B dead после ротации 2026-09-02 — «password re-hashed» re-seed'ом; **активной утечки нет**, это documentation hygiene). Оба литерала изъяты из FE-репо (PR #383/#385); остался BE-native residue: docs/guides/handoffs/README/CLAUDE-API/backlog и т.д.

**⚠️ Предусловие (Фаза 0)**: в BE working tree висит **~1338 незакоммиченных файлов `frontend/*`** (mirror-sync WIP от параллельного актора). Порядок: разобрать WIP (stat-живость → осознанный `mirror(frontend):` коммит ИЛИ откат) → Фаза 1 (фикс mirror с FE main) → Фаза 2 (doc-only sweep ~59-63 файлов). **НЕ смешивать** mirror-коммит с redaction-волной.

Связанные решения owner (уже приняты): D-1 ротация исполнена; D-3 history — «не трогать»; D-4 сканер — исполнен FE (PR #386).

---

## Item 3 (статус-вопрос): degraded `queue: down`

`GET /v1/health` с 2026-09-02 возвращает `{"status":"degraded","dependencies":{"database":"up","redis":"up","queue":"down"}}`. Для FE-разработки не блокер, но:
- все BE-фоновые задачи (BullMQ: ingest/enrichment/aggregation) не исполняются?
- влияет на e2e-сценарии с data-мутациями (FE e2e бежит в READ-ONLY mode при недоступной очереди).

**Вопрос**: это известное состояние (план восстановления?) или нужна диагностика? FE будет мониторить `/v1/health` перед e2e-окнами.

---

## Справка: что FE уже сделало вокруг этих item'ов

| PR | Что |
|---|---|
| #390 | D-1/PB-1 silent cabinet-create закрыт (nonce-mint + recovery alert) — попутно задокументирован битый `/v1/auth/refresh`-путь |
| #391 | D-2 → BE-BLOCKED, реестры отражают; request #230 создан |
| #383/#386/#387 | SEC-DOC-1: изъятие литералов FE-side + сканер + верификация ротации (login 200) |

FE-оркестратор продолжает независимо: boundary-sweep волны (459→372), AA-quick-wins, /80-sweep — BE-вовлечения не требуют.
