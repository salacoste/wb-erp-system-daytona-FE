# Epic: МойСклад (completion) + Order Management — implementation tracker

> **Source of truth for the `/loop 15m` implementation cycle.** The loop picks the **first ⬜ story**, implements it per the BMad cycle (§Loop contract), marks it ✅, commits, and moves on. Append-only Progress log at the bottom.
> cwd: `frontend/` · branch per story (`feat/<story-id>-lowercase`) → merge `--no-ff` main → push.
> Verify-first is MANDATORY for every story (probe the live endpoint → exact contract before coding).

## Gathered documentation

- **МойСклад contract** — `docs/request-backend/221-moysklad-integration-backend-contract.md` (committed; 9 endpoints, 3 models, D43/D44 read-only, bootstrap-cabinet, response-shape quirks). Phase 1 already shipped (`b3945edf`).
- **Order Management** — **NO contract doc** for S11/S12/S8. Each O-story MUST verify-first: probe the endpoint, capture the enum/shape, then build. Live endpoints (verified 2026-07-02, dev backend):
  - `PATCH /v1/orders/:orderId/operational-status` — body `{ status: <OrderOperationalStatus> }` (NOT `operationalStatus`). Enum unknown → capture from a valid-order probe or backend `src/orders/` dto.
  - `POST /v1/orders/:orderId/confirm` · `POST /v1/orders/:orderId/cancel` · `PATCH /v1/orders/:orderId/meta` — routes exist (500/400 on bad id).
  - `POST /v1/supplies/:id/acceptance-act` — route exists.
  - `GET /v1/orders?limit=N` → items: `{ orderId, orderUid, nmId, vendorCode, productName, price, salePrice, supplierStatus, wbStatus, warehouseId, deliveryType, isB2B, cargoType, createdAt, … }`.
- **FE modules to extend**: `/orders` page (`src/app/(dashboard)/orders/`), `src/lib/api/orders.ts` + `orders/` dir, `src/hooks/useOrders.ts`; `/supplies` for acceptance-act.

## Hard rules (project CLAUDE.md — every story)
- ≤200 lines source / ≤800 test (split proactively ~150). No `any` (use `unknown`+narrow); no `as` casts (except `raw as RawInterface` normalizer pattern). `@/` aliases. Russian-locale formatters (`formatCurrency`/`formatDate`/`formatPercentage`) — no inline `%`.
- **Boundary Normalizer Pattern**: every backend response → FE-canonical at the API layer (raw shapes never reach components). Money/ratio `?? null` (AP#8, ESLint-enforced); counts `?? 0`. `skipDataUnwrap` when the envelope (`{count,total,rows}` / `{data,pagination}`) must survive.
- **Verify-first**: before coding an endpoint, `curl` it (login → JWT) to confirm shape; cite the verified shape in the normalizer test.
- **Gates** (all green before merge): `npm run type-check` 0 · `npx eslint 'src/**/*.{ts,tsx}'` 0 new · `npm test -- --run` ≥ floor + new tests, 0 failed · `bash scripts/check-locale-percent.sh` baseline 4 · `bash scripts/check-eslint-rules.sh` OK. `check:doc-citations` exit 0 (update baseline if a route edit legitimately shifts line-citations — `--update-baseline` same commit).
- **2-pass review**: behavior-changing source (mutations, normalizers, state machines) → 2 fresh-context `code-reviewer` passes before commit (1st structural/correctness, 2nd narrative/drift). Trivial additive UI: inline verify OK.
- **Concurrent-session protocol**: `git reset -q` before `git add`; stage ONLY your files; contamination check (`git diff --cached --name-only | grep -iE …`) before commit. Nuke `.next` before any live/Playwright check.

---

## Epic M — МойСклад (complete the module)

### M1 — Сток tab: `/stock-db` snapshots ⬜
- **Verify-first**: `GET /v1/moysklad/stock-db?limit=2&date=YYYY-MM-DD` → `{count,total,date,rows: MoyskladStockSnapshot[]}` (fields: date, moyskladAssortmentId, nmId|null, stockFree, reserve). `skipDataUnwrap`.
- **ACs**: (1) Сток tab renders a table (date, МС товар name [join via mappings cache or assortmentId], nmId or «не привязан», stockFree, reserve); (2) date selector (latest by default; invalid date → 400 handled); (3) pagination hint + pager; (4) loading/empty states; (5) null money → «—».
- **Files**: `stock-db` in `moysklad.ts` + normalizer; `useMoyskladStockDb`; `components/MoyskladStockTable.tsx`; wire into page.tsx Сток tab (replace placeholder).
- **Tests**: normalizer (null, date-validation), table render; E2E (Сток tab renders rows).

### M2 — МС товары browse (live `/products`) ⬜
- **Verify-first**: `GET /v1/moysklad/products?limit=2&offset=0` → `{rows: MoyskladProduct[], meta:{size}}` (live read-through). `skipDataUnwrap`.
- **ACs**: (1) paginated list of МС products (name, article, code, buyPrice, salePrices); (2) live-call failure → graceful error (per contract v1-boundary #2, live ESM path); (3) limit/offset pager.
- **Files**: `getMoyskladProducts`; `useMoyskladProducts`; `components/MoyskladProductsList.tsx`; sub-tab or section on Обзор.
- **Tests**: normalizer + pager; E2E (list renders).

### M3 — МС модификации browse (live `/variants`) ⬜
- **Verify-first**: `GET /v1/moysklad/variants?limit=2` → `{rows, meta}`. Variants have **no article** (per contract).
- **ACs**: (1) paginated variant list; (2) indicates variant (no article) vs product; (3) live-call error handling.
- **Files**: `getMoyskladVariants`; `useMoyskladVariants`; `components/MoyskladVariantsList.tsx`.
- **Tests**: normalizer; E2E.

### M4 — Mappings pagination (reach all 422 pending) ⬜
- **ACs**: (1) limit/offset pager on `MoyskladMappingsTable` (currently capped 100 + hint); (2) «Показано N из total» updates; (3) filter (matched/pending) preserved across pages; (4) keyboard-accessible pager.
- **Files**: extend `MoyskladMappingsTable.tsx` (+ a small `Pagination` reuse if exists, else shadcn).
- **Tests**: page navigation; filter preserved; E2E.

### M5 — COGS-recalc visibility (after link+sync) ⬜
- **Context**: buy-price → versioned Cogs → auto `MARGIN_CALCULATION` (backend). FE surfaces it.
- **ACs**: (1) after a successful link+sync, the linked mapping shows «себестоимость обновлена» badge (buyPrice → Cogs); (2) a link to the product's COGS/margin view; (3) badge clears on next sync.
- **Files**: `MoyskladMappingRow.tsx` badge; hook state (post-sync linked-set).
- **Tests**: badge renders after link+sync; E2E optional.
- **Deps**: M1 (sync) done (Phase 1).

---

## Epic O — Order Management

### O1 — Order operational-status (PATCH) ⬜
- **Verify-first (CRITICAL)**: probe `PATCH /v1/orders/<realOrderId>/operational-status` with a valid order id (from `GET /orders?limit=1`) → capture the `OrderOperationalStatus` enum + the response shape + valid transitions. Do NOT guess.
- **ACs**: (1) per-order status badge in the orders table (supplierStatus/wbStatus → operational); (2) a status-change control (dropdown) → PATCH; (3) only valid transitions enabled (capture from verify); (4) optimistic update + invalidate; (5) error toast on failure.
- **Files**: `orders.ts` `updateOrderOperationalStatus`; normalizer + enum type; `useUpdateOrderOperationalStatus`; row component in `/orders`.
- **Tests**: enum/normalizer; mutation + invalidate; E2E (status change on a real order — or non-mutating: control visible/disabled states).
- **2-pass review** (state machine + mutation).

### O2 — Confirm order (POST `/orders/:id/confirm`) ⬜
- **Verify-first**: probe with a real pending order → response shape + preconditions (which orders can be confirmed).
- **ACs**: (1) «Подтвердить» action on confirmable orders; (2) success → status flips; (3) disabled on non-confirmable; (4) loading state.
- **Files**: `confirmOrder`; `useConfirmOrder`; row action.
- **Tests**: mutation + state; E2E.

### O3 — Cancel order (POST `/orders/:id/cancel`) ⬜
- **Verify-first**: probe → shape + preconditions.
- **ACs**: (1) «Отменить» action with a **confirm dialog** (destructive); (2) success → status flips; (3) reason field if the API requires it; (4) disabled on non-cancellable.
- **Files**: `cancelOrder`; `useCancelOrder`; `CancelOrderDialog.tsx`.
- **Tests**: confirm-gate; mutation; E2E.

### O4 — Edit order meta (PATCH `/orders/:id/meta`) ⬜
- **Verify-first (CRITICAL)**: probe `PATCH /meta` with `{}` (400) and a valid body → capture **which fields** are editable (the contract is unknown). Do NOT guess.
- **ACs**: (1) edit dialog with the editable fields (from verify); (2) save → PATCH; (3) validation; (4) success → row updates.
- **Files**: `updateOrderMeta`; `useUpdateOrderMeta`; `EditOrderMetaDialog.tsx`.
- **Tests**: field validation; mutation; E2E.

### O5 — Acceptance-act (POST `/supplies/:id/acceptance-act`) ⬜
- **Verify-first**: probe with a real supply id → shape (WB act storage, indefinite retention).
- **ACs**: (1) «Загрузить акт приёмки» action on a supply; (2) success → stored-act indicator + link/date; (3) idempotent (re-request doesn't duplicate); (4) error handling.
- **Files**: `requestAcceptanceAct` (in supplies API); `useRequestAcceptanceAct`; supply row action.
- **Tests**: mutation + idempotency; E2E.

---

## Loop contract (BMad cycle — each fire)

For the **first ⬜ story** in order (M1→M5→O1→O5):
1. **Verify-first** — `curl` the story's endpoint(s) (login→JWT, X-Cabinet-Id); capture exact shape/enum; update the story's "Verify-first" line with the verified contract. If the endpoint is NOT live → mark ⛔ (blocked: backend) + move on.
2. **Analyze** — read the cited existing code (patterns to mirror: МойСklad Phase 1 normalizer/hooks; orders module for O-stories).
3. **Implement (TDD)** — types → normalizer (+ unit tests for nullability/shape) → hook → component → page wiring → fixture. ≤200 lines/file.
4. **Validate** — `type-check` + `eslint` (changed files) + `vitest` (new + touched area). Fix until 0.
5. **QA** — component/page tests cover every AC; add a Playwright E2E (`e2e/<story>.spec.ts`, storageState, `--no-deps`, no networkidle). Run it (nuke `.next` first). Non-mutating where possible.
6. **2-pass review** (behavior-changing) — fresh-context `code-reviewer` ×2; address findings; re-validate.
7. **Green?** all gates + tests + E2E pass → mark story ✅, append a dated **Progress log** entry (files + gate results), commit `feat(<id>): <subject>` on the story branch, merge `--no-ff` main, push, delete branch. → next fire picks the next ⬜.
   **Not green / blocked** → mark ⛔ with reason (gate fail you can't fix in-fire / external block); do NOT commit broken code; next fire retries or moves on.
8. **No ⬜ remain** → stop, post a final summary.

## Status legend
⬜ pending · 🔄 in-progress · ✅ done · ⛔ blocked

## Progress log (append-only)
- _(loop writes one entry per ✅/⛔)_
