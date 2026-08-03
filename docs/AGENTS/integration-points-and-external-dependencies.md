# Integration Points and External Dependencies

## External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Stripe   | Payments | REST API         | `src/integrations/stripe/`     |
| SendGrid | Emails   | SDK              | `src/services/emailService.js` |

etc...

## Internal Integration Points

- **Local frontend**: `http://localhost:3100`
- **Backend communication**: REST API at `http://localhost:3000` by default via `NEXT_PUBLIC_API_URL`; application requests use `/v1/...` paths and expect the required auth/cabinet headers
- **Background Jobs**: Redis queue, see `src/workers/`
- **[Other integrations]**
