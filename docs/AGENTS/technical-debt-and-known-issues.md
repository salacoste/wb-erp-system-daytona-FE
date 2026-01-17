# Technical Debt and Known Issues

## Critical Technical Debt

1. **Payment Service**: Legacy code in `src/legacy/payment.js` - tightly coupled, no tests
2. **User Service**: Different pattern than other services, uses callbacks instead of promises
3. **Database Migrations**: Manually tracked, no proper migration tool
4. **[Other significant debt]**

## Workarounds and Gotchas

- **Environment Variables**: Must set `NODE_ENV=production` even for staging (historical reason)
- **Database Connections**: Connection pool hardcoded to 10, changing breaks payment service
- **[Other workarounds developers need to know]**
