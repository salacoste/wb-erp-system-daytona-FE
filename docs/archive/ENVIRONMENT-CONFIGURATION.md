# Environment Configuration Guide

**Project**: WB Repricer System - Frontend
**Last Updated**: 2025-12-30

Полное руководство по настройке переменных окружения для фронтенда.

---

## 📋 Quick Reference

### Frontend Environment Variables

| Variable                            | Required      | Default                 | Description                     |
| ----------------------------------- | ------------- | ----------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL`               | ✅ Production | `http://localhost:3000` | Backend API URL (БЕЗ `/api`)    |
| `NODE_ENV`                          | ✅ Always     | -                       | `development` или `production`  |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | ❌ Optional   | `Kernel_crypto_bot`     | Telegram bot username (без `@`) |
| `NEXT_PUBLIC_APP_NAME`              | ❌ Optional   | `WB Repricer System`    | Application name                |
| `NEXT_PUBLIC_APP_VERSION`           | ❌ Optional   | `1.0.0`                 | Application version             |

---

## 🔧 Configuration by Environment

### Local Development

**File**: `.env.local` (создайте из `.env.example`)

```bash
# Minimal configuration for local dev
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# Optional (имеют fallback значения)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
NEXT_PUBLIC_APP_NAME=WB Repricer System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Когда использовать:**

- Локальная разработка на вашей машине
- Backend запущен локально на порту 3000
- Telegram bot `@Kernel_crypto_bot` (test bot)

---

### Production Deployment

**File**: `.env.local` или системные переменные окружения

```bash
# ОБЯЗАТЕЛЬНО для production
NEXT_PUBLIC_API_URL=https://api.wb-repricer.com
NODE_ENV=production

# ОПЦИОНАЛЬНО (но рекомендуется)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
NEXT_PUBLIC_APP_NAME=WB Repricer System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Когда использовать:**

- Production сервер
- Backend API доступен по HTTPS
- Telegram bot настроен и готов

---

## 🤖 Telegram Bot Configuration (Epic 34-FE)

### Frontend Variable

**Variable**: `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

**Type**: OPTIONAL (имеет fallback значение)

**Purpose**:

- Отображается в UI на странице `/settings/notifications`
- Используется для генерации deep link: `https://t.me/{username}?start={code}`

**Default Value**: `Kernel_crypto_bot`

**Where Used**:

```typescript
// src/components/notifications/TelegramBindingModal.tsx:39
const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Kernel_crypto_bot';
```

**Format**:

- ✅ Правильно: `Kernel_crypto_bot` (без `@`)
- ❌ Неправильно: `@Kernel_crypto_bot` (с `@`)

**UI Display**:

```
Отправьте боту @Kernel_crypto_bot:
/start ABC123
```

---

### Backend Variable (NOT Frontend)

**Variable**: `TELEGRAM_BOT_TOKEN`

**⚠️ ВАЖНО**: Эта переменная настраивается **НА БЭКЕНДЕ**, не на фронтенде!

**Purpose**:

- Аутентификация с Telegram Bot API
- Отправка уведомлений пользователям

**Security**:

- ❌ НИКОГДА не добавляйте bot token в frontend `.env.local`
- ❌ НИКОГДА не коммитьте bot token в git
- ✅ Храните token только на backend сервере
- ✅ Используйте secrets management (Vault, AWS Secrets Manager, etc.)

**Backend Configuration**:

```bash
# backend/.env.local
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

📖 **Backend setup**: См. backend документацию `../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md`

---

## 🌐 API URL Configuration

### Variable: `NEXT_PUBLIC_API_URL`

**Required**: ✅ YES для production

**Format Rules**:

- ✅ БЕЗ `/api` на конце
- ✅ С протоколом (`http://` или `https://`)
- ✅ Без слэша на конце

**Examples**:

| Environment | Correct URL                           | Incorrect URL                             |
| ----------- | ------------------------------------- | ----------------------------------------- |
| Local Dev   | `http://localhost:3000`               | `http://localhost:3000/api` ❌            |
| Staging     | `https://api-staging.wb-repricer.com` | `https://api-staging.wb-repricer.com/` ❌ |
| Production  | `https://api.wb-repricer.com`         | `https://api.wb-repricer.com/api/v1` ❌   |

**Why**:

- Backend endpoints начинаются с `/v1/` (не `/api/v1/`)
- API client добавляет `/v1/` автоматически
- Правильный запрос: `https://api.wb-repricer.com/v1/auth/login`

**Where Used**:

```typescript
// src/lib/api-client.ts
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const url = `${baseURL}/v1/auth/login`;  // Правильно
```

---

## 🔐 Security Best Practices

### Frontend Variables

**Public Variables** (`NEXT_PUBLIC_*`):

- ✅ Встраиваются в client-side bundle
- ✅ Видны в браузере (DevTools → Sources)
- ⚠️ НЕ храните sensitive data
- ⚠️ НЕ храните API tokens/secrets

**Safe to expose**:

- API URLs
- Bot usernames
- Feature flags
- Application metadata

**NEVER expose**:

- JWT secrets
- Bot tokens
- Database credentials
- API keys

---

## 📝 Configuration Files Reference

### Frontend Files

```
frontend/
├── .env.local                    # Local overrides (gitignored)
├── .env.example                  # Template with all variables
├── next.config.ts                # Next.js config (reads env vars)
└── ecosystem.config.js           # PM2 config (can set env vars)
```

### Backend Files (Reference)

```
backend/
├── .env.local                    # Backend config (contains TELEGRAM_BOT_TOKEN)
└── .env.example                  # Backend template
```

**⚠️ ВАЖНО**: Frontend и Backend имеют РАЗНЫЕ `.env.local` файлы!

---

## 🔄 Changing Environment Variables

### Development (Immediate Effect)

```bash
# 1. Edit .env.local
nano .env.local

# 2. Restart dev server
# If using npm run dev:
Ctrl+C  # Stop
npm run dev  # Restart

# If using PM2:
pm2 restart wb-repricer-frontend-dev
```

---

### Production (Requires Rebuild)

```bash
# 1. Edit .env.local
nano .env.local

# 2. Rebuild application (обязательно!)
npm run build

# 3. Reload PM2
pm2 reload wb-repricer-frontend

# 4. Verify new value
pm2 logs wb-repricer-frontend --lines 20
```

**⚠️ КРИТИЧНО**: `NEXT_PUBLIC_*` переменные встраиваются в bundle при build. Изменение `.env.local` БЕЗ rebuild не применится!

---

## ✅ Validation Checklist

### Pre-Deployment

**Check .env.local:**

- [ ] `NEXT_PUBLIC_API_URL` установлен (production URL)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` установлен или оставлен пустым (fallback работает)
- [ ] Нет `TELEGRAM_BOT_TOKEN` (это backend переменная!)
- [ ] Файл НЕ коммитится в git

**Check backend .env.local:**

- [ ] `TELEGRAM_BOT_TOKEN` настроен на бэкенде
- [ ] Bot token получен от `@BotFather`
- [ ] Backend может отправлять сообщения

---

### Post-Deployment

**Verify variables loaded:**

```bash
# 1. Check browser console (DevTools)
console.log(process.env.NEXT_PUBLIC_API_URL)
# Ожидаемый результат: "https://api.wb-repricer.com"

console.log(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)
# Ожидаемый результат: "Kernel_crypto_bot"

# 2. Check deep link generation
# Open /settings/notifications → Click "Привязать Telegram"
# Deep link должен быть: https://t.me/Kernel_crypto_bot?start={code}
```

**Common Issues:**

| Issue                       | Cause                       | Solution                                |
| --------------------------- | --------------------------- | --------------------------------------- |
| Deep link shows `undefined` | Variable not set            | Set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` |
| Deep link shows old value   | Build cache                 | `rm -rf .next && npm run build`         |
| API calls to wrong URL      | Wrong `NEXT_PUBLIC_API_URL` | Fix `.env.local` → rebuild              |
| 401 Unauthorized            | Backend URL wrong           | Verify `NEXT_PUBLIC_API_URL`            |

---

## 📚 Related Documentation

**Configuration:**

- `.env.example` - Template with all variables and comments
- `README.md` - Configuration section
- `DEPLOYMENT-GUIDE.md` - Deployment-specific env vars

**Epic 34-FE (Telegram):**

- `DEV-HANDOFF-EPIC-34-FE.md` - Complete integration guide
- `API-INTEGRATION-GUIDE-EPIC-34-FE.md` - API usage patterns
- `../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md` - User guide (backend repo)

**Backend Configuration:**

- `../docs/request-backend/73-telegram-notifications-epic-34.md` - Backend spec
- Backend `.env.example` - Backend variables (including `TELEGRAM_BOT_TOKEN`)

---

## 🔗 Quick Links

**Frontend Deployment:**

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Full deployment guide
- [DEPLOYMENT-CHEATSHEET.md](DEPLOYMENT-CHEATSHEET.md) - Quick commands
- [QUICK-DEPLOY.md](QUICK-DEPLOY.md) - 5-step deploy

**Epic 34-FE:**

- [DEV-HANDOFF-EPIC-34-FE.md](DEV-HANDOFF-EPIC-34-FE.md) - Developer handoff
- [CHANGELOG-EPIC-34-FE.md](CHANGELOG-EPIC-34-FE.md) - Change history

---

**Last Updated**: 2025-12-30
**Owner**: Frontend Team
