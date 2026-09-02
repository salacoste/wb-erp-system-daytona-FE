# Production Deployment Summary - Frontend

**Дата**: 2025-12-30
**Проект**: WB Repricer System - Frontend
**Версия**: Epic 34-FE (Telegram Notifications) + Navigation Updates
**Статус**: ✅ READY FOR PRODUCTION

---

## 📋 Что готово к деплою

### 1. Epic 34-FE: Telegram Notifications UI (100% Complete)
- ✅ Binding flow (код активации, deep link, polling)
- ✅ Notification preferences (4 типа уведомлений)
- ✅ Quiet hours configuration (13 часовых поясов)
- ✅ Language selection (RU/EN)
- ✅ Unbind flow с подтверждением
- ✅ Analytics events (15 event types)
- ✅ Manual QA complete
- ✅ 8 E2E тестов (Playwright)

### 2. Navigation Updates (2025-12-30)
- ✅ Пункт меню "Уведомления" (иконка Bell)
- ✅ Desktop sidebar + Mobile menu
- ✅ Active state detection
- ✅ TypeScript compilation без ошибок

---

## 🚀 Инструкция по деплою (Step-by-Step)

### Pre-Deployment Checklist

**1. Проверьте requirements:**
```bash
# Node.js 20.x or higher
node -v

# PM2 installed globally
pm2 -v
# Если нет → npm install -g pm2
```

**2. Настройте environment variables:**

Создайте `.env.local` в корне `/frontend`:

```bash
# ОБЯЗАТЕЛЬНО
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NODE_ENV=production

# ОПЦИОНАЛЬНО (есть fallback)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
```

**⚠️ ВАЖНО**:
- `NEXT_PUBLIC_API_URL` **БЕЗ** `/api` на конце
- Пример: `https://api.wb-repricer.com` ← правильно
- Пример: `https://api.wb-repricer.com/api` ← неправильно

---

### Deployment Steps

```bash
# 1. Navigate to frontend directory
cd /path/to/wb-repricer-system-new/frontend

# 2. Pull latest code
git pull origin main

# 3. Install dependencies (production only)
npm install --production

# 4. Build application
npm run build

# Ожидайте вывод:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization

# 5. Start with PM2
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# 6. Save PM2 config for auto-restart on server reboot
pm2 save
pm2 startup
# Выполните команду которую выдаст pm2 startup

# 7. Verify it's running
pm2 status

# Должен показать:
# │ wb-repricer-frontend │ online │ 1 │ ...
```

---

### Post-Deployment Validation

**1. Health Check:**
```bash
# Локальная проверка
curl http://localhost:3100

# Ожидаемый ответ: HTML страница Next.js (200 OK)

# Проверка логов
pm2 logs wb-repricer-frontend --lines 50

# Должен быть вывод:
# ✓ Ready in ...ms
# - Local: http://localhost:3100
# - Network: ...
```

**2. Функциональное тестирование в браузере:**

Откройте `http://localhost:3100` (или ваш домен) и проверьте:

**Login Flow:**
- ✅ Страница `/login` загружается
- ✅ Ввод `test@test.com` / `<E2E_TEST_PASSWORD>`
- ✅ Успешный редирект на `/dashboard`

**Navigation Menu:**
- ✅ Все пункты меню видны (Desktop sidebar)
- ✅ Пункт "Уведомления" (иконка 🔔) присутствует
- ✅ Mobile menu работает (Sheet на <1024px)

**Telegram Notifications (`/settings/notifications`):**
- ✅ Страница загружается
- ✅ Кнопка "Привязать Telegram" открывает модальное окно
- ✅ Генерируется код активации (6 цифр)
- ✅ Deep link корректный: `https://t.me/Kernel_crypto_bot?start={code}`
- ✅ Preferences сохраняются (4 типа уведомлений)
- ✅ Quiet hours работают (время, timezone)
- ✅ Language переключается (RU/EN)
- ✅ Test notification отправляется
- ✅ Unbind работает с подтверждением

**Analytics Events (DevTools → Network):**
- ✅ События отправляются каждые 30 секунд
- ✅ POST запросы на `/v1/analytics/events`
- ✅ Batch size до 50 events
- ✅ Retry logic работает (проверить offline → online)

---

## 📊 Monitoring

### PM2 Commands

```bash
# Real-time logs
pm2 logs wb-repricer-frontend

# Last 100 lines
pm2 logs wb-repricer-frontend --lines 100

# Errors only
pm2 logs wb-repricer-frontend --err

# Process status
pm2 list
pm2 status wb-repricer-frontend

# Resource usage
pm2 monit

# Process info
pm2 info wb-repricer-frontend
```

### Log Files Location

- Stdout: `~/.pm2/logs/wb-repricer-frontend-out.log`
- Stderr: `~/.pm2/logs/wb-repricer-frontend-error.log`

### 📈 Grafana Analytics Dashboard (Story 34.7)

**Dashboard URL**: http://localhost:3002/d/telegram-notifications-analytics

**Backend**: ✅ Story 34.7 complete (analytics endpoint, Prometheus metrics, Grafana dashboard)
**Frontend**: ✅ Fully integrated (16 event types, 100% test coverage)

**Key Metrics to Monitor**:
1. **Binding Funnel Success Rate** - Should be ≥90% (warning if <90%)
2. **Error Rate (Last 1h)** - Should be <5% (critical if >5%)
3. **Avg Binding Duration** - Should be <60s (warning if >60s)
4. **Total Events** - Should increase steadily (warning if no data >15 min)

**How to Access**:
```bash
# 1. Verify backend analytics endpoint is running
curl -X POST http://localhost:3000/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"events": [{"timestamp": "2025-12-30T10:00:00Z", "event_type": "test", "category": "behavior", "properties": {}}]}'

# Expected: HTTP 200 OK (or 204 No Content)

# 2. Open Grafana dashboard in browser
open http://localhost:3002/d/telegram-notifications-analytics

# 3. Verify data is flowing (wait 30s for first batch)
```

**Alert Rules** (configured on backend):
| Alert | Severity | Threshold | Action |
|-------|----------|-----------|--------|
| High Error Rate | Critical | >5% for 5 min | Page on-call engineer |
| Low Binding Completion | Warning | <90% for 10 min | Investigate binding flow |
| Slow Binding Duration | Warning | >60s avg for 5 min | Check API latency |
| No Data Received | Warning | >15 min | Verify analytics service |

**Prometheus Metrics** (backend):
```
analytics_events_inserted_total{category}       # Total events by category
analytics_events_batch_size                     # Batch size distribution (1-50)
analytics_events_insert_duration_seconds        # Insert latency histogram
analytics_events_errors_total{error_type}       # API errors counter
analytics_events_rate_limited_total             # Rate limit hits
```

**Backend Documentation**:
- Story Doc: `backend/docs/stories/epic-34/story-34.7-analytics-endpoint.md`
- Dashboard JSON: `backend/docs/grafana/telegram-notifications-analytics.json`
- Alert Rules: `backend/docs/grafana/alerts/story-34-7-analytics-alerts.md`

---

## 🔄 Update Deployment (Zero-Downtime)

Для обновления на новую версию:

```bash
cd /path/to/frontend
git pull origin main
npm install --production
npm run build
pm2 reload wb-repricer-frontend  # Zero-downtime reload
pm2 logs wb-repricer-frontend --lines 20
```

---

## 🐛 Troubleshooting

### Issue 1: Port 3100 already in use
```bash
lsof -i :3100
kill -9 <PID>
pm2 restart wb-repricer-frontend
```

### Issue 2: Build fails
```bash
npm run type-check  # Проверить TypeScript errors
npm run lint        # Проверить ESLint errors
rm -rf .next node_modules
npm install
npm run build
```

### Issue 3: Backend 401 Unauthorized
```bash
# 1. Проверить что backend запущен
curl https://your-backend-api.com/v1/health

# 2. Перезапустить backend (если JWT secret изменился)
# (инструкция в backend документации)

# 3. Очистить localStorage в браузере
# DevTools → Application → Local Storage → Clear
```

### Issue 4: Telegram bot не работает
```bash
# Проверить environment variable
echo $NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
# Должно быть: Kernel_crypto_bot

# Если изменили переменную → rebuild
npm run build
pm2 reload wb-repricer-frontend
```

### Issue 5: Analytics events не отправляются
```bash
# 1. Проверить browser console (F12)
# Должны быть логи: "📊 Analytics: Sending batch of X events"

# 2. Проверить backend endpoint
curl -X POST https://your-backend-api.com/v1/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"events": []}'

# Ожидаемый ответ: 204 No Content или 200 OK
```

---

## 🔐 Security Checklist

**Pre-Production:**
- [ ] `NODE_ENV=production` в `.env.local`
- [ ] `NEXT_PUBLIC_API_URL` использует HTTPS
- [ ] `.env.local` не коммитится в git (.gitignore проверен)
- [ ] Backend rate limiting настроен (600 req/min)
- [ ] Telegram bot token защищен на бэкенде

**Production:**
- [ ] Reverse proxy (nginx/caddy) настроен для HTTPS
- [ ] CORS настроен только для разрешенных доменов
- [ ] PM2 auto-restart включен (`pm2 save && pm2 startup`)

---

## 📁 Важные файлы

### Environment Configuration
- `.env.local` - Production environment variables (НЕ коммитить!)
- `.env.example` - Пример конфигурации

### PM2 Configuration
- `ecosystem.config.js` - PM2 process configuration

### Deployment Documentation
- `docs/DEPLOYMENT-GUIDE.md` - Полная инструкция
- `docs/DEPLOYMENT-CHEATSHEET.md` - Краткая шпаргалка
- `docs/DEV-HANDOFF-EPIC-34-FE.md` - Epic 34 implementation details
- `README.md` - Project overview

---

## ✅ Final Checklist

**Pre-Deployment:**
- [ ] Node.js 20.x or higher installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] `.env.local` configured with production values
- [ ] Backend API available and healthy
- [ ] Telegram bot `@Kernel_crypto_bot` configured

**Deployment:**
- [ ] Dependencies installed (`npm install --production`)
- [ ] Build successful (`npm run build`)
- [ ] PM2 process started and "online"
- [ ] Auto-restart configured (`pm2 save && pm2 startup`)

**Post-Deployment:**
- [ ] Health check passed (`curl http://localhost:3100`)
- [ ] Login flow works
- [ ] All navigation links accessible (Desktop + Mobile)
- [ ] "Уведомления" menu item visible
- [ ] `/settings/notifications` page loads
- [ ] Telegram binding flow works end-to-end
- [ ] Analytics events sending (check Network tab)
- [ ] No errors in PM2 logs
- [ ] Performance acceptable (page load <3s)

---

## 📞 Support & Escalation

### Issue Resolution Priority

| Issue | Severity | Expected Fix Time |
|-------|----------|------------------|
| Port conflict | Low | 5 minutes |
| Build failure | Medium | 15-30 minutes |
| Backend 401 | Medium | 10 minutes (backend restart) |
| Telegram bot not working | Medium | 15 minutes |
| Analytics not sending | Low | 20 minutes |
| Memory leak | High | 1-2 hours |

### Escalation Path

1. **Level 1**: Check this document + `DEPLOYMENT-GUIDE.md`
2. **Level 2**: Review PM2 logs + browser DevTools
3. **Level 3**: Check Epic 34-FE docs (`DEV-HANDOFF-EPIC-34-FE.md`)
4. **Level 4**: Contact backend team (if API/Telegram issues)
5. **Level 5**: Full architecture review (`front-end-architecture.md`)

---

## 🔗 Quick Links

**Deployment:**
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Полная инструкция (30+ страниц)
- [DEPLOYMENT-CHEATSHEET.md](DEPLOYMENT-CHEATSHEET.md) - Краткая шпаргалка

**Epic 34-FE:**
- [DEV-HANDOFF-EPIC-34-FE.md](DEV-HANDOFF-EPIC-34-FE.md) - Developer handoff
- [CHANGELOG-EPIC-34-FE.md](CHANGELOG-EPIC-34-FE.md) - Change history
- [API-INTEGRATION-GUIDE-EPIC-34-FE.md](API-INTEGRATION-GUIDE-EPIC-34-FE.md) - API guide

**Project:**
- [README.md](../README.md) - Project overview
- [front-end-architecture.md](front-end-architecture.md) - Architecture
- [front-end-spec.md](front-end-spec.md) - UI/UX specs

---

## 📝 Notes for Production Team

1. **Port**: Приложение работает на порту **3100** (не 3000!)
2. **PM2**: Обязательно используйте PM2 для production (не `npm run start`)
3. **HTTPS**: Рекомендуется настроить reverse proxy (nginx/caddy) для SSL
4. **Monitoring**: PM2 предоставляет мониторинг из коробки (`pm2 monit`)
5. **Log Rotation**: PM2 автоматически ротирует логи (можно настроить `pm2 install pm2-logrotate`)
6. **Memory Limit**: Можно добавить `--max-memory-restart 400M` если нужно
7. **Cluster Mode**: Пока не используется (instances=1), можно включить позже для высокой нагрузки

---

**Deployment Date**: 2025-12-30
**Deployed By**: [Your Name]
**Production Status**: ✅ READY

**Questions?** Смотрите полную документацию в `docs/DEPLOYMENT-GUIDE.md`
