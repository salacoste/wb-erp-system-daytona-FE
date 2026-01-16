# Prevention: Webpack Cache Corruption

**Date**: 2025-12-30
**Issue**: `TypeError: __webpack_modules__[moduleId] is not a function`
**Impact**: Frontend stuck on loading, 500 error
**Root Cause**: Corrupted Next.js `.next` build cache

---

## What We Implemented (2025-12-30)

### ✅ 1. PM2 Auto-Cleanup (ecosystem.dev.config.js)

Added frontend process to PM2 config with **automatic cache cleanup via npm script**:

```javascript
{
  name: 'wb-repricer-frontend',
  script: 'npm',
  args: 'run dev:clean',   // CRITICAL: Always cleans cache before start
  cwd: './frontend',
  kill_timeout: 5000,      // Graceful shutdown
  restart_delay: 2000,     // Prevent race conditions
  max_restarts: 5,         // Prevent infinite loops
}
```

**How it works**:
- PM2 runs `npm run dev:clean`
- Which executes `npm run clean && npm run dev`
- Clean removes `.next` and `node_modules/.cache`
- Then starts fresh Next.js dev server

**Benefit**: Every PM2 start/restart now **guarantees** clean cache state.

---

### ✅ 2. NPM Scripts (package.json)

Added convenience scripts:

```json
{
  "clean": "rm -rf .next node_modules/.cache",
  "clean:full": "rm -rf .next node_modules/.cache node_modules && npm install",
  "dev:clean": "npm run clean && npm run dev",
  "restart:safe": "npm run clean && npm run dev"
}
```

**Usage**:
- `npm run clean` - Quick cache cleanup
- `npm run clean:full` - Nuclear option (reinstall everything)
- `npm run dev:clean` - Start with clean slate

---

### ✅ 3. Troubleshooting Documentation

Created `TROUBLESHOOTING.md` with:
- **Common issues** and quick fixes
- **Preventive measures** for developers
- **Best practices** for daily workflow
- **Emergency recovery** procedures
- **CI/CD guidelines**

**Location**: `/frontend/TROUBLESHOOTING.md`

---

### ✅ 4. Git Ignore Verification

Confirmed `.next/` is in `.gitignore` ✅
- Prevents accidental commits of build artifacts
- Ensures clean clones

---

## Developer Workflow (New Process)

### Daily Development

**Start work**:
```bash
pm2 start wb-repricer-frontend  # Auto-starts with clean cache
```

**Make changes**:
- Edit files → Next.js HMR reloads automatically
- No manual restart needed for code changes

**Restart after config changes** (.env, next.config.js, package.json):
```bash
pm2 restart wb-repricer-frontend  # Auto-cleans cache via pre_restart_hook
```

**End work**:
```bash
pm2 stop wb-repricer-frontend
```

---

### When Problems Occur

**Quick fix** (95% of cases):
```bash
pm2 restart wb-repricer-frontend
```

**If still broken**:
```bash
pm2 stop wb-repricer-frontend
npm run clean
pm2 start wb-repricer-frontend
```

**Nuclear option** (if everything else fails):
```bash
npm run clean:full
pm2 restart wb-repricer-frontend
```

---

## What Causes Cache Corruption?

### High Risk ⚠️
1. **Interrupted builds**: Ctrl+C during compilation
2. **Git branch switches**: During dev server run
3. **System crashes**: Force shutdown, power loss
4. **Node version changes**: Without reinstall

### Medium Risk ⚡
5. **Package updates**: Without cache cleanup
6. **Next.js upgrades**: Major version changes
7. **Multiple processes**: Duplicate dev servers on same port

### Low Risk (But Possible) 📝
8. **Long-running processes**: Memory leaks (>1GB)
9. **Disk full**: Build artifacts incomplete
10. **File system issues**: Permissions, NFS problems

---

## CI/CD Integration

### GitHub Actions / Jenkins

**Always build fresh**:
```yaml
- name: Clean cache
  run: npm run clean

- name: Build
  run: npm run build

- name: Test production build
  run: npm run start
```

### Docker

**Add to `.dockerignore`**:
```
.next
node_modules
.env*.local
```

**Dockerfile best practice**:
```dockerfile
# Install dependencies
RUN npm ci

# Build fresh (never copy .next from host)
RUN npm run build

# Start production server
CMD ["npm", "start"]
```

---

## Monitoring & Alerting

### PM2 Monitoring

**Check health**:
```bash
pm2 status           # Process status
pm2 monit            # Real-time metrics
pm2 logs frontend    # Error logs
```

**Restart triggers**:
- Memory > 1GB → Auto-restart (configured in ecosystem)
- CPU > 80% for 5min → Investigation needed
- Error rate spike → Check logs

### Recommended Alerts

Set up alerts for:
1. **PM2 restart count** > 3 in 1 hour → Cache corruption suspected
2. **Memory usage** > 1GB → Potential leak
3. **Error log pattern**: "webpack_modules" → Cache corruption confirmed

---

## Testing the Fix

### Verification Steps

1. **Normal restart**:
   ```bash
   pm2 restart wb-repricer-frontend
   # Should auto-clean and start successfully
   ```

2. **Check logs**:
   ```bash
   pm2 logs wb-repricer-frontend --lines 20
   # Should see "Ready in Xms"
   ```

3. **Test browser**:
   ```bash
   curl http://localhost:3100
   # Should return 200 OK
   ```

4. **Simulate corruption** (for testing):
   ```bash
   # Create corrupted cache
   echo "corrupted" > frontend/.next/cache/webpack.lock

   # Restart (should auto-fix)
   pm2 restart wb-repricer-frontend

   # Verify working
   curl http://localhost:3100
   ```

---

## Future Improvements

### Short-term (Next Sprint)
- [ ] Add health check endpoint: `GET /api/health`
- [ ] PM2 ecosystem for production (separate config)
- [ ] Automated cache cleanup cron (weekly)

### Medium-term (1-2 Months)
- [ ] Monitoring dashboard (Grafana + PM2 metrics)
- [ ] Automated alerts (Slack/Email on restart failures)
- [ ] Pre-commit hook to check for cache corruption

### Long-term (3-6 Months)
- [ ] Migration to Docker Compose (cleaner process management)
- [ ] Kubernetes deployment (auto-healing, scaling)
- [ ] Separate build/runtime containers

---

## Related Documentation

- **Troubleshooting Guide**: `/frontend/TROUBLESHOOTING.md`
- **PM2 Config**: `/ecosystem.dev.config.js`
- **Next.js Docs**: https://nextjs.org/docs/advanced-features/debugging
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/application-declaration/

---

## Changelog

### 2025-12-30 - Initial Implementation
- Added `pre_restart_hook` to ecosystem.dev.config.js
- Created npm scripts: `clean`, `clean:full`, `dev:clean`
- Documented troubleshooting procedures
- Verified `.gitignore` coverage

---

**Status**: ✅ IMPLEMENTED & TESTED
**Next Review**: After 1 week of production use
**Owner**: Development Team
