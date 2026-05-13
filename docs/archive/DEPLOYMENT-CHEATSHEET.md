# Frontend Deployment Cheat Sheet

Быстрая справка по самым частым командам деплоя.

📖 **Полная документация**: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

---

## 🚀 Initial Deployment

```bash
# 1. Environment setup
cp .env.example .env.local
# Отредактируйте .env.local:
# NEXT_PUBLIC_API_URL=https://your-backend-api.com

# 2. Install, build, start
npm install --production
npm run build
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# 3. Enable auto-restart
pm2 save
pm2 startup

# 4. Verify
pm2 logs wb-repricer-frontend
```

---

## 🔄 Update Deployment (Zero-Downtime)

```bash
git pull origin main
npm install --production
npm run build
pm2 reload wb-repricer-frontend
pm2 logs wb-repricer-frontend --lines 20
```

---

## 📊 Monitoring

```bash
# Status
pm2 list
pm2 status wb-repricer-frontend

# Logs (real-time)
pm2 logs wb-repricer-frontend

# Logs (last 100 lines)
pm2 logs wb-repricer-frontend --lines 100

# Errors only
pm2 logs wb-repricer-frontend --err

# Resource usage
pm2 monit
```

---

## 🔧 Common Commands

```bash
# Restart (with downtime)
pm2 restart wb-repricer-frontend

# Reload (zero-downtime)
pm2 reload wb-repricer-frontend

# Stop
pm2 stop wb-repricer-frontend

# Delete process
pm2 delete wb-repricer-frontend

# Process info
pm2 info wb-repricer-frontend
```

---

## 🐛 Quick Troubleshooting

### Port 3100 already in use
```bash
lsof -i :3100
kill -9 <PID>
```

### Build fails
```bash
npm run type-check
npm run lint
rm -rf .next node_modules
npm install
npm run build
```

### Clear cache & rebuild
```bash
pm2 stop wb-repricer-frontend
rm -rf .next
npm run build
pm2 start wb-repricer-frontend
```

### Backend 401 errors
```bash
# Restart backend PM2 process first
# Then clear browser localStorage:
# DevTools → Application → Local Storage → Clear
```

### High memory usage
```bash
pm2 restart wb-repricer-frontend
# Or add memory limit:
pm2 start ecosystem.config.js --only wb-repricer-frontend \
  --max-memory-restart 400M
```

---

## ✅ Health Check

```bash
# Local
curl http://localhost:3100

# Production
curl https://your-frontend-domain.com

# Backend API
curl https://your-backend-api.com/v1/health
```

---

## 🔄 Rollback

```bash
pm2 stop wb-repricer-frontend
git checkout <previous-commit>
npm install --production
npm run build
pm2 restart wb-repricer-frontend
pm2 logs wb-repricer-frontend
```

---

## 📋 Quick Validation Checklist

После деплоя проверьте:
- [ ] `pm2 list` показывает "online" статус
- [ ] `pm2 logs` без ошибок
- [ ] Login работает (`http://localhost:3100/login`)
- [ ] Navigation menu загружается
- [ ] **Уведомления** появляются в меню (Epic 34-FE)
- [ ] `/settings/notifications` открывается
- [ ] Telegram binding code генерируется
- [ ] Analytics events отправляются (DevTools → Network)

---

## 🔗 Quick Links

- **Full Deployment Guide**: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- **Epic 34-FE Handoff**: [DEV-HANDOFF-EPIC-34-FE.md](DEV-HANDOFF-EPIC-34-FE.md)
- **README**: [README.md](../README.md)
- **Architecture**: [front-end-architecture.md](front-end-architecture.md)

---

**Port**: 3100 (production)
**Node**: 20.x or higher
**PM2**: Required for production
