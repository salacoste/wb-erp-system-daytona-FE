# Integration Points and External Dependencies

## External Services

| Service  | Purpose  | Integration Type | Key Files                      |
| -------- | -------- | ---------------- | ------------------------------ |
| Stripe   | Payments | REST API         | `src/integrations/stripe/`     |
| SendGrid | Emails   | SDK              | `src/services/emailService.js` |

etc...

## Internal Integration Points

- **Frontend Communication**: REST API on port 3100 (default, production via PM2), expects specific headers
- **Background Jobs**: Redis queue, see `src/workers/`
- **[Other integrations]**
