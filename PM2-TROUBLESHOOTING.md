# PM2 Troubleshooting Guide

## Problem: High CPU Usage & Restart Loops

### Symptoms
- PM2 process shows thousands of restarts (e.g., 42,176+)
- High CPU usage even when idle
- Process uptime very short (< 1 minute)
- Logs show `EADDRINUSE: address already in use` errors

### Root Cause
Port conflict creates infinite restart loop:
1. PM2 starts Next.js dev server
2. Port 3100 already occupied → `EADDRINUSE` error
3. Process crashes
4. PM2 autorestart triggers immediately
5. Loop repeats thousands of times → high CPU usage

### Solution

#### Quick Fix (Immediate Relief)
```bash
# Stop and delete problematic process
pm2 stop wb-repricer-frontend-dev
pm2 delete wb-repricer-frontend-dev
pm2 save
```

#### Safe Restart (Recommended)
```bash
# Use the safe restart script
./pm2-safe-restart.sh
```

#### Manual Cleanup
```bash
# 1. Find and kill process using port 3100
lsof -ti :3100 | xargs kill -9 2>/dev/null || echo "Port already free"

# 2. Delete all PM2 frontend processes
pm2 delete all

# 3. Clear PM2 dumps and logs
pm2 flush
pm2 save --force

# 4. Restart cleanly
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
```

## Prevention

### Updated PM2 Configuration (ecosystem.config.js)

**Key Changes**:
- `max_restarts: 5` (reduced from 10)
- `min_uptime: '30s'` (increased from 10s)
- `restart_delay: 5000` (5s delay between restarts)
- `exp_backoff_restart_delay: 100` (exponential backoff)
- `kill_timeout: 5000` (graceful shutdown timeout)

**Why These Work**:
1. **max_restarts: 5** - Prevents runaway restart loops (stops after 5 failures)
2. **min_uptime: 30s** - Process must run 30s to be considered "stable"
3. **restart_delay: 5s** - Gives port time to be released
4. **exp_backoff_restart_delay** - Progressively increases delay between restarts
5. **kill_timeout: 5s** - Ensures clean shutdown before restart

## Monitoring

### Check PM2 Status
```bash
pm2 list              # List all processes
pm2 describe wb-repricer-frontend-dev  # Detailed info
pm2 monit             # Real-time monitoring
```

### Check Logs
```bash
pm2 logs wb-repricer-frontend-dev --lines 50
pm2 logs wb-repricer-frontend-dev --err  # Error logs only
```

### Check Port Usage
```bash
lsof -i :3100         # See what's using port 3100
netstat -an | grep 3100  # Alternative method
```

## Common Issues

### Issue: "Port 3100 already in use"
**Cause**: Another process is using port 3100
**Solution**:
```bash
# Find and kill the process
lsof -ti :3100 | xargs kill -9
# Or change port in ecosystem.config.js
```

### Issue: "Max restarts reached"
**Cause**: Process crashes repeatedly within min_uptime window
**Solution**:
1. Check error logs: `pm2 logs wb-repricer-frontend-dev --err`
2. Fix underlying issue (usually port conflict or dependency error)
3. Restart: `pm2 restart wb-repricer-frontend-dev`

### Issue: "Process not responding"
**Cause**: Zombie process or PM2 daemon issue
**Solution**:
```bash
pm2 kill              # Kill PM2 daemon
pm2 resurrect         # Restore saved processes
# Or start fresh
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
```

## Best Practices

1. **Always use the safe restart script** (`./pm2-safe-restart.sh`)
2. **Check port availability** before starting: `lsof -i :3100`
3. **Monitor logs after start**: `pm2 logs wb-repricer-frontend-dev`
4. **Save PM2 state** after changes: `pm2 save`
5. **Review error logs regularly**: Look for patterns before they cause problems

## Emergency Commands

```bash
# Nuclear option - stop everything and start fresh
pm2 kill
pm2 flush
lsof -ti :3100 | xargs kill -9 2>/dev/null || true
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
pm2 save
```

## Health Check

Run this to verify everything is healthy:
```bash
echo "=== PM2 Status ==="
pm2 list

echo -e "\n=== Port Check ==="
lsof -i :3100 || echo "Port 3100 is free"

echo -e "\n=== Recent Errors ==="
pm2 logs wb-repricer-frontend-dev --err --lines 10 --nostream

echo -e "\n=== Process Info ==="
pm2 describe wb-repricer-frontend-dev | grep -E "restarts|uptime|status"
```

---

**Created**: 2025-12-25
**Last Updated**: 2025-12-25
**Issue**: High CPU usage from restart loops (42,176+ restarts)
**Status**: ✅ RESOLVED
