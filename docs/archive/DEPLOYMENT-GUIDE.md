# Frontend Deployment Guide

**Project**: WB Repricer System - Frontend
**Framework**: Next.js 15 (App Router)
**Production Port**: 3100
**Node Version**: 20.x or higher

---

## 📋 Pre-Deployment Checklist

### 1. Code Quality

```bash
# Запустить type-check
npm run type-check

# Запустить linter
npm run lint

# Запустить тесты
npm test

# Результат: Все должны пройти без ошибок
```

### 2. Environment Variables

Создайте `.env.local` (или системные переменные окружения):

```bash
# ОБЯЗАТЕЛЬНО для продакшна
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NODE_ENV=production

# ОПЦИОНАЛЬНО (есть fallback значения)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
NEXT_PUBLIC_APP_NAME="WB Repricer System"
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**⚠️ ВАЖНО**:
- `NEXT_PUBLIC_API_URL` должен быть **БЕЗ** `/api` на конце (endpoints начинаются с `/v1/`)
- Все `NEXT_PUBLIC_*` переменные встраиваются в код при билде
- Если меняете переменные → нужен rebuild

### 3. Backend Readiness

**Проверьте что бэкенд готов:**
- ✅ Epic 34 (Request #73) - Telegram Notifications API deployed
- ✅ JWT authentication работает
- ✅ Rate limiting настроен (600 req/min)
- ✅ Telegram bot `@Kernel_crypto_bot` сконфигурирован

```bash
# Проверка доступности API
curl https://your-backend-api.com/v1/health

# Ожидаемый ответ: 200 OK
```

---

## 🚀 Deployment Options

### Option 1: PM2 (Recommended) ⭐

**Преимущества:**
- ✅ Auto-restart on crashes
- ✅ Log management
- ✅ Zero-downtime reload
- ✅ Process monitoring
- ✅ Cluster mode support

#### Initial Deployment

```bash
# 1. Install PM2 globally (если еще не установлен)
npm install -g pm2

# 2. Navigate to project directory
cd /path/to/frontend

# 3. Install dependencies
npm install --production

# 4. Build application
npm run build

# 5. Start with PM2
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# 6. Save PM2 configuration for auto-restart on server reboot
pm2 save
pm2 startup
# Следуйте инструкциям команды startup для вашей ОС

# 7. Verify it's running
pm2 status
pm2 logs wb-repricer-frontend --lines 50
```

#### PM2 Management Commands

```bash
# Просмотр статуса
pm2 list
pm2 status wb-repricer-frontend

# Просмотр логов (real-time)
pm2 logs wb-repricer-frontend
pm2 logs wb-repricer-frontend --lines 100
pm2 logs wb-repricer-frontend --err  # только ошибки

# Перезапуск (с downtime)
pm2 restart wb-repricer-frontend

# Reload (zero-downtime)
pm2 reload wb-repricer-frontend

# Остановка
pm2 stop wb-repricer-frontend

# Удаление процесса
pm2 delete wb-repricer-frontend

# Мониторинг ресурсов
pm2 monit

# Информация о процессе
pm2 info wb-repricer-frontend
```

#### Update Deployment (Zero-Downtime)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies (if any)
npm install --production

# 3. Build new version
npm run build

# 4. Reload with zero-downtime
pm2 reload wb-repricer-frontend

# 5. Verify logs
pm2 logs wb-repricer-frontend --lines 20
```

---

### Option 2: Docker

**Преимущества:**
- ✅ Isolated environment
- ✅ Reproducible builds
- ✅ Easy rollback

#### Build Docker Image

```bash
# 1. Build image
docker build -t wb-repricer-frontend:latest .

# 2. Tag version
docker tag wb-repricer-frontend:latest wb-repricer-frontend:1.0.0

# 3. Run container
docker run -d \
  --name wb-repricer-frontend \
  -p 3100:3100 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://your-backend-api.com \
  -e NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot \
  --restart unless-stopped \
  wb-repricer-frontend:latest

# 4. Verify it's running
docker ps
docker logs wb-repricer-frontend
```

#### Docker Management

```bash
# Просмотр логов
docker logs wb-repricer-frontend -f

# Перезапуск
docker restart wb-repricer-frontend

# Остановка
docker stop wb-repricer-frontend

# Удаление
docker rm -f wb-repricer-frontend

# Вход в контейнер для debugging
docker exec -it wb-repricer-frontend sh
```

---

### Option 3: Standalone Next.js

**Используйте только если PM2/Docker недоступны**

```bash
# 1. Build application
npm run build

# 2. Start in production mode
npm run start

# Приложение будет доступно на http://localhost:3100
```

**⚠️ Недостатки:**
- ❌ No auto-restart on crash
- ❌ No log management
- ❌ Process killed on SSH disconnect (используйте `nohup` или `screen`)

```bash
# С nohup для background execution
nohup npm run start > logs/frontend.log 2>&1 &

# Проверка процесса
ps aux | grep next

# Остановка
kill <PID>
```

---

## ✅ Post-Deployment Validation

### 1. Health Check

```bash
# Проверка HTTP доступности
curl http://localhost:3100

# Ожидаемый ответ: HTML страница Next.js

# Проверка через внешний URL (если настроен)
curl https://your-frontend-domain.com
```

### 2. Functional Testing

**Откройте в браузере и проверьте:**

1. **Login Flow** (`http://localhost:3100/login`)
   - ✅ Страница логина загружается
   - ✅ Ввод `test@test.com` / `<E2E_TEST_PASSWORD>`
   - ✅ Успешная авторизация → редирект на `/dashboard`

2. **Navigation** (проверьте все пункты меню)
   - ✅ Dashboard
   - ✅ COGS Management
   - ✅ Cabinet Summary
   - ✅ Analytics
   - ✅ Storage
   - ✅ Планирование
   - ✅ Юнит-экономика
   - ✅ Ликвидность
   - ✅ Реклама
   - ✅ **Уведомления** ← NEW (Epic 34-FE)
   - ✅ Settings

3. **Telegram Notifications** (`/settings/notifications`)
   - ✅ Страница загружается
   - ✅ Binding flow работает (код генерируется)
   - ✅ Deep link корректный: `https://t.me/Kernel_crypto_bot?start={code}`
   - ✅ Preferences сохраняются
   - ✅ Quiet hours работают
   - ✅ Language переключается RU/EN
   - ✅ Test notification отправляется

4. **Analytics Events** (DevTools → Network)
   - ✅ События отправляются каждые 30 секунд
   - ✅ POST `/v1/analytics/events` (batch до 50 events)
   - ✅ Retry logic работает (проверить в offline mode)

### 3. Performance Check

```bash
# Lighthouse CI (опционально)
npx lighthouse http://localhost:3100 --view

# Целевые метрики:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >80
```

### 4. Log Monitoring

```bash
# PM2
pm2 logs wb-repricer-frontend --lines 100

# Docker
docker logs wb-repricer-frontend --tail 100 -f

# Проверьте на наличие:
# ✅ "ready started server on 0.0.0.0:3100"
# ✅ "compiled client and server successfully"
# ❌ Нет ошибок 500/404
# ❌ Нет uncaught exceptions
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Metrics summary
pm2 describe wb-repricer-frontend

# CPU/Memory usage
pm2 list
```

### Log Files Location

**PM2:**
- Stdout: `~/.pm2/logs/wb-repricer-frontend-out.log`
- Stderr: `~/.pm2/logs/wb-repricer-frontend-error.log`

**Docker:**
- Access via: `docker logs wb-repricer-frontend`

### Log Rotation (PM2)

```bash
# Install PM2 log rotation module
pm2 install pm2-logrotate

# Configure rotation (10MB max, 10 files retained)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

---

## 🔄 Rollback Procedures

### PM2 Rollback

```bash
# 1. Stop current version
pm2 stop wb-repricer-frontend

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild
npm install --production
npm run build

# 4. Restart PM2
pm2 restart wb-repricer-frontend

# 5. Verify
pm2 logs wb-repricer-frontend
```

### Docker Rollback

```bash
# 1. Stop current container
docker stop wb-repricer-frontend
docker rm wb-repricer-frontend

# 2. Run previous version
docker run -d \
  --name wb-repricer-frontend \
  -p 3100:3100 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://your-backend-api.com \
  --restart unless-stopped \
  wb-repricer-frontend:1.0.0  # Previous version tag

# 3. Verify
docker logs wb-repricer-frontend
```

---

## 🐛 Troubleshooting

### Issue 1: Port 3100 Already in Use

**Симптомы:**
```
Error: listen EADDRINUSE: address already in use :::3100
```

**Решение:**
```bash
# Найти процесс на порту 3100
lsof -i :3100

# Убить процесс
kill -9 <PID>

# Или изменить порт в ecosystem.config.js
```

---

### Issue 2: Build Fails

**Симптомы:**
```
Error: Command "build" exited with 1
```

**Решение:**
```bash
# 1. Проверить TypeScript errors
npm run type-check

# 2. Проверить ESLint errors
npm run lint

# 3. Очистить кеш
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

---

### Issue 3: 401 Unauthorized from Backend

**Симптомы:**
- Login fails
- API requests return 401

**Решение:**
```bash
# 1. Проверить backend logs
# (бэкенд должен быть перезапущен если JWT secret изменился)

# 2. Проверить NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_URL

# 3. Очистить localStorage в браузере
# DevTools → Application → Local Storage → Clear
```

---

### Issue 4: Telegram Bot Not Working

**Симптомы:**
- Deep link не открывает бот
- Binding code не работает

**Решение:**
```bash
# 1. Проверить environment variable
echo $NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
# Должно быть: Kernel_crypto_bot

# 2. Проверить backend bot token
# (backend должен иметь правильный TELEGRAM_BOT_TOKEN)

# 3. Rebuild если изменили переменную
npm run build
pm2 reload wb-repricer-frontend
```

---

### Issue 5: Analytics Events Not Sending

**Симптомы:**
- No POST requests to `/v1/analytics/events`
- Console errors about analytics

**Решение:**
```bash
# 1. Проверить browser console (F12)
# Должны быть логи: "📊 Analytics: Sending batch of X events"

# 2. Проверить backend endpoint
curl -X POST https://your-backend-api.com/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"events": []}'

# Ожидаемый ответ: 204 No Content

# 3. Проверить SSR compatibility
# Analytics должен работать только на клиенте (не на сервере)
```

---

### Issue 6: High Memory Usage

**Симптомы:**
```
PM2 показывает >500MB memory usage
```

**Решение:**
```bash
# 1. Enable memory limit в PM2
pm2 delete wb-repricer-frontend
pm2 start ecosystem.config.js --only wb-repricer-frontend \
  --env production \
  --max-memory-restart 400M

# 2. Проверить memory leaks
pm2 monit

# 3. Перезапуск раз в день (опционально)
pm2 delete wb-repricer-frontend
pm2 start ecosystem.config.js --only wb-repricer-frontend \
  --env production \
  --cron-restart="0 4 * * *"  # Restart at 4 AM daily
```

---

### Issue 7: Slow Page Load

**Симптомы:**
- First load >5 seconds
- Subsequent loads slow

**Решение:**
```bash
# 1. Проверить что используется production build
pm2 info wb-repricer-frontend | grep NODE_ENV
# Должно быть: NODE_ENV: production

# 2. Проверить что Next.js cache работает
ls -la .next/cache/

# 3. Проверить network в DevTools
# Убедиться что chunks загружаются параллельно

# 4. Enable compression в reverse proxy (nginx/caddy)
```

---

## 🔐 Security Checklist

### Production Security

- [ ] `NODE_ENV=production` установлена
- [ ] `NEXT_PUBLIC_API_URL` использует HTTPS
- [ ] JWT secrets не хардкодятся в коде
- [ ] `.env.local` не коммитится в git (.gitignore)
- [ ] Rate limiting настроен на бэкенде (600 req/min)
- [ ] CORS настроен только для разрешенных доменов
- [ ] CSP headers настроены (если требуется)
- [ ] Telegram bot token защищен на бэкенде

### HTTPS Configuration (Reverse Proxy)

Рекомендуется использовать nginx/caddy перед Next.js:

```nginx
# nginx example
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📝 Deployment Checklist Summary

### Pre-Deployment
- [ ] Code quality checks passed (type-check, lint, tests)
- [ ] `.env.local` configured with production values
- [ ] Backend API available and healthy
- [ ] Telegram bot configured (`@Kernel_crypto_bot`)

### Deployment
- [ ] Dependencies installed (`npm install --production`)
- [ ] Application built successfully (`npm run build`)
- [ ] PM2/Docker process started
- [ ] Auto-restart configured (`pm2 save && pm2 startup`)

### Post-Deployment
- [ ] Health check passed (HTTP 200)
- [ ] Login flow works
- [ ] All navigation links accessible
- [ ] Telegram Notifications working (Epic 34-FE)
- [ ] Analytics events sending
- [ ] No errors in logs
- [ ] Performance acceptable (Lighthouse >90)

### Monitoring
- [ ] PM2/Docker monitoring active
- [ ] Log rotation configured
- [ ] Memory/CPU usage normal
- [ ] Alerts configured (optional)

---

## 📞 Support & Escalation

### Common Issues Resolution Time

| Issue | Expected Fix Time |
|-------|------------------|
| Port conflict | 5 minutes |
| Build failure | 15-30 minutes |
| Backend 401 | 10 minutes (backend restart) |
| Memory leak | 1-2 hours (investigation) |
| Slow performance | 30-60 minutes |

### Escalation Path

1. **Level 1**: Check this guide, logs, common issues
2. **Level 2**: Review Epic 34-FE docs (`docs/DEV-HANDOFF-EPIC-34-FE.md`)
3. **Level 3**: Contact backend team (if API issues)
4. **Level 4**: Review full architecture (`docs/front-end-architecture.md`)

---

## 🔗 Related Documentation

- **README.md** - Project overview and quick start
- **DEV-HANDOFF-EPIC-34-FE.md** - Epic 34 implementation guide
- **CHANGELOG-EPIC-34-FE.md** - Change history
- **TROUBLESHOOTING.md** - Detailed troubleshooting (if exists)
- **front-end-architecture.md** - Technical architecture

---

**Last Updated**: 2025-12-30
**Maintained by**: Frontend Team

**Production Deployment History:**
- 2025-12-30: Initial production deployment guide created
- Epic 34-FE (Telegram Notifications) ready for production
