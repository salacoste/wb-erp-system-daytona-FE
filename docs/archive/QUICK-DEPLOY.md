# Quick Deploy - Frontend

⚡ **Самая быстрая инструкция для опытных devops**

📖 Полная документация: [PRODUCTION-DEPLOYMENT-SUMMARY.md](PRODUCTION-DEPLOYMENT-SUMMARY.md)

---

## Prerequisites

- Node.js 20.x
- PM2: `npm install -g pm2`
- Backend API доступен

---

## Deploy в 5 шагов

```bash
# 1. Environment (создайте .env.local)
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NODE_ENV=production
EOF

# 2. Install & Build
npm install --production && npm run build

# 3. Start
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# 4. Enable auto-restart
pm2 save && pm2 startup

# 5. Verify
pm2 logs wb-repricer-frontend
curl http://localhost:3100
```

---

## Update (Zero-Downtime)

```bash
git pull && npm install --production && npm run build && pm2 reload wb-repricer-frontend
```

---

## Validation Checklist

- [ ] `pm2 list` → status "online"
- [ ] `http://localhost:3100/login` → страница логина
- [ ] Меню "Уведомления" (🔔) видно
- [ ] `/settings/notifications` → Telegram binding работает
- [ ] DevTools → Network → POST `/v1/analytics/events` (каждые 30s)

---

## Emergency

```bash
# Restart
pm2 restart wb-repricer-frontend

# Logs
pm2 logs wb-repricer-frontend --lines 100

# Port conflict
lsof -i :3100 && kill -9 <PID>

# Rollback
git checkout <commit> && npm install --production && npm run build && pm2 restart wb-repricer-frontend
```

---

**Port**: 3100 | **Docs**: [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
