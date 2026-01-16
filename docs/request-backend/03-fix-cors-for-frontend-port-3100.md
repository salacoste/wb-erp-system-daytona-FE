# 03. Исправление CORS для Frontend порта 3100

## 📋 Проблема

Frontend приложение запущено на порту **3100** (production через PM2), но backend CORS настроен только на разрешение запросов с `http://localhost:5173`.

**Ошибка в браузере:**
```
Access to fetch at 'http://localhost:3000/v1/auth/login' from origin 'http://localhost:3100' 
has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5173' 
that is not equal to the supplied origin 'http://localhost:3100'.
```

## 🔧 Требуемое исправление

### Обновить CORS настройки на backend

**Текущая конфигурация (предположительно):**
- Разрешено: `http://localhost:5173` (старый dev порт)

**Требуемая конфигурация:**
- Разрешено: `http://localhost:3100` (production frontend порт)
- Опционально: также оставить `http://localhost:5173` для совместимости
- Опционально: добавить `http://localhost:3000` для dev режима Next.js

## 📍 Где находится CORS конфигурация

CORS настройки обычно находятся в:
- `src/main.ts` (NestJS) - метод `app.enableCors()`
- `src/app.module.ts` - глобальная конфигурация
- Или в отдельном файле конфигурации CORS

### Пример для NestJS:

```typescript
// src/main.ts или src/app.module.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3100',  // ⚠️ ДОБАВИТЬ: Production frontend (PM2)
      'http://localhost:5173',  // Опционально: оставить для совместимости
      'http://localhost:3000',  // Опционально: Next.js dev mode
    ],
    credentials: true, // Важно для JWT cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Cabinet-Id',
      'Accept',
    ],
  });
  
  await app.listen(3000);
}
bootstrap();
```

### Или через переменные окружения:

```typescript
// src/main.ts

const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3100',  // ⚠️ ДОБАВИТЬ
  'http://localhost:5173',
  'http://localhost:3000',
];

app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cabinet-Id', 'Accept'],
});
```

И в `.env`:
```bash
CORS_ORIGINS=http://localhost:3100,http://localhost:5173,http://localhost:3000
```

## ✅ Проверка после исправления

После обновления CORS настроек:

1. **Перезапустить backend:**
   ```bash
   pm2 restart wb-repricer-api
   ```

2. **Проверить в браузере:**
   - Открыть `http://localhost:3100/login`
   - Попытаться войти
   - Проверить Network tab в DevTools
   - Должен быть успешный запрос к `/v1/auth/login`
   - В Response Headers должно быть: `Access-Control-Allow-Origin: http://localhost:3100`

3. **Проверить Preflight запрос (OPTIONS):**
   - В Network tab найти OPTIONS запрос к `/v1/auth/login`
   - Должен вернуть 200 OK
   - Headers должны включать:
     - `Access-Control-Allow-Origin: http://localhost:3100`
     - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
     - `Access-Control-Allow-Headers: Content-Type, Authorization, X-Cabinet-Id, Accept`
     - `Access-Control-Allow-Credentials: true`

## 🔍 Диагностика

Если проблема сохраняется после исправления:

1. **Проверить логи backend:**
   ```bash
   pm2 logs wb-repricer-api
   ```

2. **Проверить что backend перезапущен:**
   ```bash
   pm2 status
   ```

3. **Проверить CORS настройки в коде:**
   - Убедиться что `http://localhost:3100` добавлен в список origins
   - Убедиться что `credentials: true` установлен (для JWT cookies)
   - Убедиться что все необходимые headers разрешены

4. **Проверить в браузере:**
   - Очистить кеш браузера (Ctrl+Shift+R или Cmd+Shift+R)
   - Проверить что нет других CORS ошибок в консоли

## 📝 Дополнительные замечания

### Для production окружения:

Если планируется развертывание на production, нужно также добавить production URL:

```typescript
const allowedOrigins = [
  'http://localhost:3100',           // Local development (PM2)
  'http://localhost:5173',           // Legacy dev port
  'http://localhost:3000',            // Next.js dev mode
  'https://your-production-domain.com', // Production frontend
];
```

### Для разных окружений:

Рекомендуется использовать переменные окружения:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const allowedOrigins = isDevelopment
  ? [
      'http://localhost:3100',
      'http://localhost:5173',
      'http://localhost:3000',
    ]
  : [
      'https://your-production-domain.com',
    ];
```

## ✅ Checklist для Backend разработчика

- [ ] Найти файл с CORS конфигурацией (обычно `src/main.ts`)
- [ ] Добавить `http://localhost:3100` в список разрешенных origins
- [ ] Убедиться что `credentials: true` установлен
- [ ] Убедиться что все необходимые headers разрешены (`Authorization`, `X-Cabinet-Id`)
- [ ] Перезапустить backend (`pm2 restart wb-repricer-api`)
- [ ] Проверить что CORS работает (попробовать login с frontend)

---

**Дата создания:** 2025-01-20  
**Приоритет:** 🔴 **КРИТИЧЕСКИЙ** - Блокирует работу frontend  
**Статус:** Ожидает исправления на backend

