# Frontend Troubleshooting Guide

## Common Issues & Solutions

### Issue: Webpack Runtime Error (TypeError: __webpack_modules__[moduleId] is not a function)

**Symptom**: Page stuck on "Загрузка..." or blank screen, Next.js 500 error in browser console.

**Root Cause**: Corrupted Next.js build cache (`.next` directory).

**Quick Fix**:
```bash
# Stop the dev server
pm2 stop wb-repricer-frontend

# Clean build cache
npm run clean

# Restart
pm2 start wb-repricer-frontend
```

**Why it happens**:
- Interrupted build process (Ctrl+C during compilation)
- Git branch switch during dev server run
- Code changes while Next.js is compiling
- System crash or force shutdown
- Node version mismatch

---

## Preventive Measures

### 1. Use Safe Restart Commands

**✅ ALWAYS use** (automatically cleans cache):
```bash
pm2 restart wb-repricer-frontend
```

**❌ AVOID manual restart without cleanup**:
```bash
pm2 stop wb-repricer-frontend
pm2 start wb-repricer-frontend
```

### 2. Clean Before Major Operations

**Before Git operations**:
```bash
# Before branch switch
pm2 stop wb-repricer-frontend
git checkout other-branch
pm2 start wb-repricer-frontend
```

**After dependency updates**:
```bash
npm run clean:full  # Removes .next, node_modules/.cache, reinstalls
```

**After Next.js version upgrade**:
```bash
npm run clean:full
pm2 restart wb-repricer-frontend
```

### 3. PM2 Configuration (Already Implemented)

Our `ecosystem.dev.config.js` includes:
- **`pre_restart_hook: 'cd frontend && rm -rf .next'`** - Auto-cleanup on restart
- **`kill_timeout: 5000`** - Gives Next.js 5s to gracefully shutdown
- **`restart_delay: 2000`** - Waits 2s before restart to avoid race conditions
- **`max_restarts: 5`** - Prevents infinite restart loops

---

## Development Workflow Best Practices

### Starting Work
```bash
# Start all services (includes auto-cleanup)
npm run start:dev

# Or frontend only
pm2 start wb-repricer-frontend
```

### During Development

**✅ Safe to do while running**:
- Edit code files (`.tsx`, `.ts`, `.css`)
- Save files (Next.js HMR will reload)
- View different pages

**⚠️ Requires restart**:
- Change `.env.local`
- Update `next.config.js`
- Install/remove npm packages
- Change TypeScript config

**Restart safely**:
```bash
pm2 restart wb-repricer-frontend  # Uses pre_restart_hook
```

### Ending Work
```bash
# Stop all services
npm run stop:dev

# Or frontend only
pm2 stop wb-repricer-frontend
```

---

## Emergency Recovery

### Complete Reset (Nuclear Option)
```bash
# Stop everything
pm2 stop all

# Clean all caches
cd frontend
rm -rf .next node_modules/.cache

# If still broken, full reinstall
rm -rf node_modules
npm install

# Restart
cd ..
pm2 start wb-repricer-frontend
```

### Check for Duplicate Processes
```bash
# List all Node processes
ps aux | grep node

# Kill duplicate Next.js processes
pkill -f "next dev"

# Restart cleanly
pm2 restart wb-repricer-frontend
```

---

## Monitoring & Diagnostics

### Check PM2 Logs
```bash
# Real-time logs
pm2 logs wb-repricer-frontend

# Last 50 lines
pm2 logs wb-repricer-frontend --lines 50

# Errors only
pm2 logs wb-repricer-frontend --err
```

### Check Build Status
```bash
# Verify .next directory state
ls -lah frontend/.next

# Check for lock files
ls -lah frontend/.next/*.lock
```

### Verify Server is Running
```bash
# Check PM2 status
pm2 status

# Check port 3100
lsof -i :3100

# Test HTTP response
curl http://localhost:3100/api/health
```

---

## CI/CD Best Practices

### Pre-deployment Checklist
```bash
# 1. Clean build
npm run clean

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Production build test
npm run build

# 5. Start production server
npm run start
```

### Docker Best Practice
Always add `.next` to `.dockerignore`:
```
# .dockerignore
.next
node_modules
.env*.local
```

Build fresh in container:
```dockerfile
RUN npm run build
CMD ["npm", "start"]
```

---

## Known Next.js Quirks

### 1. Fast Refresh Limitations
- Adding/removing files requires manual restart
- Changing global CSS requires reload
- Environment variable changes need full restart

### 2. Cache Invalidation
Next.js caches:
- `node_modules/.cache` - SWC compilation cache
- `.next/cache` - Build artifacts
- `.next/server` - Server bundles

**When to clear**: After major dependency updates, Next.js upgrades, or unexplained build errors.

### 3. Memory Leaks
If PM2 shows growing memory:
```bash
# Check memory usage
pm2 monit

# Restart if >1GB
pm2 restart wb-repricer-frontend
```

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (local, no PM2) |
| `npm run dev:clean` | Start with clean cache |
| `npm run clean` | Remove `.next` and cache |
| `npm run clean:full` | Nuclear option (reinstall deps) |
| `pm2 restart wb-repricer-frontend` | Safe restart (auto-cleanup) |
| `pm2 logs wb-repricer-frontend` | View logs |
| `pm2 monit` | Real-time monitoring |

---

## When to Ask for Help

If issue persists after:
1. ✅ Running `npm run clean:full`
2. ✅ Restarting PM2 process
3. ✅ Checking for duplicate processes
4. ✅ Verifying `.env.local` exists

Then escalate to team lead or check:
- GitHub Issues: https://github.com/vercel/next.js/issues
- Next.js Discord: https://nextjs.org/discord
- Internal team Slack channel

---

**Last Updated**: 2025-12-30
**Maintainer**: Development Team
