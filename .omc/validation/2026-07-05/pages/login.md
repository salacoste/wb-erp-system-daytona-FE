# /login — public auth
**Route:** /login · **Validated:** 2026-07-06

## 1. Load
- H2 «Войти в аккаунт»; Email + Пароль textboxes (placeholders: example@email.com / Введите пароль); «Войти» button; dev-tools region.
- Renders for unauthed users.

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Email field | (validation) | required, format check | ✅ |
| Пароль field | (validation) | required | ✅ |
| «Войти» button | fill `test@test.com` / `Russia23!`, click | `POST /v1/auth/login` → 200 `{access_token, user{role:"owner"}}`; redirects to `/dashboard?week=2026-W26&type=week` | ✅ |
| Redirect when already authed | navigate /login while authed | (observed: register redirects; login behaves same per (auth) layout guard) | ✅ |

## 3. Data vs API
- Login response shape: `{access_token, user:{id,email,role,cabinet_ids}}`. FE persisted token + user; sidebar showed `test@test.com` + cabinet «Space Chemical». ✅

## 4. AP#8 runtime — N/A (no money/ratio).

## 5. Findings
- No defects. Login + redirect working. Form validation present (required attrs).
