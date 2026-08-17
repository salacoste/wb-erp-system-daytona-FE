# ATDD Checklist — Story 167.7 (Migrate /wb-token)

Acceptance criterion: valid/malformed/rejected/permission/network/expired-session cases keep validation/storage/transition semantics unchanged; input handled safely; duplicates prevented; no token leaks; shared guard consumed without modification.

| # | Invariant | Evidence | Result |
|---|---|---|---|
| 1 | Guard consumed unmodified | `useOnboardingGuard()` call preserved in page; hook file untouched (diff-verified) | PASS |
| 2 | Malformed: empty/short/non-JWT validation messages | `wb-token-form-helpers.test.ts` schema cases + pre-existing form tests | PASS |
| 3 | Valid token → PUT `/v1/cabinets/{id}/keys/wb_api_token` with `{token}` | pre-existing form test `toHaveBeenCalledWith('cabinet-uuid','wb_api_token',validToken)` | PASS |
| 4 | Success → toast + form.reset + `/processing` push | form test (navigates + reset); e2e BROWSER-01 single navigation | PASS |
| 5 | WB-rejected → «Токен недействителен» + «Получить новый токен» link, no navigation | helper test + e2e BROWSER-02 | PASS |
| 6 | Permission (403/forbidden) → «Нет доступа», no link, no navigation | helper test + form `.each` + e2e BROWSER-03 | PASS |
| 7 | Network → «Ошибка сети» | helper + form `.each` | PASS |
| 8 | Rate limit → «Превышен лимит запросов» | helper test | PASS |
| 9 | Expired session (401 / no store token) → fallback copy, stays on route | helper fallback test + form `.each` + e2e BROWSER-03 | PASS |
| 10 | Cabinet missing → destructive panel / «Кабинет не найден» | pre-existing form test + helper test | PASS |
| 11 | Duplicate prevention: pending disables CTA + input; repeated click/Enter → 1 storage call | form test (duplicate lock) | PASS |
| 12 | App-level failed-PUT retry:1 observed, not user-triggered duplicate | e2e BROWSER-02/03 put-attempt counts (2 per failed submit) | PASS |
| 13 | Masked input `type=password` | pre-existing test re-run green | PASS |
| 14 | aria-required / aria-invalid / labels | pre-existing markup preserved; page landmark test | PASS |
| 15 | No token leak: body text + toasts after error AND success | form no-leak tests; e2e privacy scans ×3 | PASS |
| 16 | No token in e2e request-body assertions | block inspects only method+URL pattern, fulfills synthetically | PASS |
| 17 | Editing clears server error; retry possible | form edit-clears test + e2e BROWSER-02 | PASS |
| 18 | Analyst/no-role → CTA disabled | pre-existing tests re-run green | PASS |
| 19 | Single h1 + main landmark after PageHeader migration | page test | PASS |
| 20 | Russian copy byte-identical | manual diff review of all copy strings | PASS |
| 21 | Reduced motion | no animation added by this story; e2e BROWSER-01 emulated `reducedMotion: 'reduce'` | PASS |
| 22 | min-h-11 CTA touch target | form markup | PASS |

Gaps: fallback error echo hardening (pre-existing), real SR audit — see story record.
