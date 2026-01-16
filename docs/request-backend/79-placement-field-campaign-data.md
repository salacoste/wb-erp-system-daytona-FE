# Request #79: Поле Placement для кампаний (размещение: поиск/витрина)

**Дата запроса**: 2025-12-26
**Статус**: ⚠️ Требуется исследование + миграция
**Приоритет**: Medium
**Запрошено**: Frontend Team

---

## 📋 Запрос от Frontend

> Проанализировал текущую структуру данных. Поля `placement` (размещение: поиск/витрина) в текущей структуре Campaign НЕТ.
>
> **Запрос**: Нужно ли это поле для отображения размещения кампании? Можем ли мы его получить из WB API?

---

## ✅ INVESTIGATION RESULTS (2025-12-26)

**Script**: `scripts/inspect-campaign-response.ts`
**Status**: ✅ **PLACEMENT DATA AVAILABLE** in WB API!

### WB API Response Structure

**Type 9 Campaigns** (modern unified):
```json
{
  "settings": {
    "name": "Campaign name",
    "payment_type": "cpm",
    "placements": {           // ✅ PLACEMENT DATA HERE!
      "recommendations": false,
      "search": true
    }
  }
}
```

**Legacy Campaigns** (types 4-8):
- ❌ NO placement data available

**Conclusion**: Field `settings.placements` доступно для type 9 кампаний как **объект с boolean флагами**, не массив!

---

## 🔍 Текущее состояние

### Backend Database Schema

**Таблица**: `adv_campaigns`
**Поле placement**: ❌ **ОТСУТСТВУЕТ**

```prisma
model AdvCampaign {
  id          String   @id @default(uuid()) @db.Uuid
  cabinetId   String   @map("cabinet_id") @db.Uuid
  advertId    Int      @unique @map("advert_id")
  name        String   @db.VarChar(500)
  type        Int      // Campaign type: 8=deprecated, 9=unified
  status      Int      // Status: 4=ready, 7=completed, 9=active, 11=paused
  nmIds       Int[]    @map("nm_ids")
  budget      Decimal? @db.Decimal(15, 2)
  dailyBudget Decimal? @map("daily_budget") @db.Decimal(15, 2)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  // ❌ NO placement field
}
```

### Backend Service Layer

**Файл**: `src/imports/services/adv-sync.service.ts`
**Интерфейс**: `WbCampaignDetails` - ❌ **placement НЕ извлекается** из WB API

```typescript
interface WbCampaignDetails {
  advertId: number;
  name: string;
  type: number;
  status: number;
  dailyBudget?: number;
  createTime?: string;
  changeTime?: string;
  startTime?: string;
  endTime?: string;
  nms?: number[];  // Products (nmIds)
  params?: Array<{ nms?: Array<{ nm: number }> }>;
  // ❌ NO placement_types field
}
```

**Методы синхронизации**:
- `getAuctionAdverts({ ids })` для type 9 кампаний - извлекаем: `id, name, status, daily_budget, timestamps, nm_settings`
- `createPromotionAdvert([ids])` для legacy кампаний (types 4-8) - извлекаем те же поля

⚠️ **Критично**: Мы НЕ извлекаем `placement_types` из ответа API, даже если WB его возвращает.

---

## 📚 WB API Documentation (WildberriesSDK v2.2.2)

### Campaign Creation API

**Метод**: `createSeacatSaveAd()`
**Поле placement_types**: ✅ **ДОСТУПНО** при создании кампании

```typescript
// SDK Documentation (Context7)
await sdk.promotion.createSeacatSaveAd({
  name: 'Winter Sale 2024',
  nms: [12345678, 87654321],
  bid_type: 'manual',
  placement_types: ['search', 'recommendations', 'carousel'], // ✅ Поле placement_types
  daily_budget: 10000
});
```

**Возможные значения `placement_types`**:
| Значение | UI Label (RU) | Описание |
|----------|---------------|----------|
| `search` | Поиск | Размещение в результатах поиска |
| `recommendations` | Витрина/Карточка товара | Рекомендации на главной/в карточках |
| `carousel` | Карусель | Карусель на главной странице |

### Campaign Details API ❓ НЕИЗВЕСТНО

**Методы**:
- `getAuctionAdverts({ ids })` - получение детали type 9 кампаний
- `createPromotionAdvert([ids])` - получение детали legacy кампаний

⚠️ **Статус**: Документация SDK НЕ показывает, возвращают ли эти методы поле `placement_types` в ответе.

**Требуется проверка**:
1. Логировать **полный JSON ответ** от `getAuctionAdverts()` для type 9 кампаний
2. Проверить, есть ли `placement_types` в объекте `settings` или корневом уровне ответа
3. Проверить для legacy кампаний аналогично

---

## 🎯 Рекомендации

### ✅ RECOMMENDED: Implement placement field based on actual API structure

**Status**: ✅ **WB API returns `settings.placements` object for type 9 campaigns**

**Data Structure** (actual from WB API):
```typescript
placements: {
  search: boolean;          // Размещение в поиске
  recommendations: boolean; // Рекомендации (витрина/карточка товара)
  // carousel: boolean;     // ❓ Unknown if this exists (not in current campaign)
}
```

#### 1.1 Database Migration
```sql
-- Add placements column to adv_campaigns (JSONB for flexibility)
ALTER TABLE adv_campaigns
ADD COLUMN placements JSONB;

-- Create index for filtering by placement type
CREATE INDEX idx_adv_campaigns_placements_search
ON adv_campaigns ((placements->>'search'));

CREATE INDEX idx_adv_campaigns_placements_recommendations
ON adv_campaigns ((placements->>'recommendations'));

-- Example data: {"search": true, "recommendations": false}
```

#### 1.2 Prisma Schema Update
```prisma
model AdvCampaign {
  // ... existing fields ...
  placements Json? // { "search": true, "recommendations": false }
}
```

**TypeScript Type**:
```typescript
type Placements = {
  search: boolean;
  recommendations: boolean;
  carousel?: boolean; // Future-proofing
};
```

#### 1.3 Backend Service Update
```typescript
// adv-sync.service.ts
interface WbCampaignDetails {
  // ... existing fields ...
  placements?: {
    search: boolean;
    recommendations: boolean;
    carousel?: boolean;
  }; // NEW: placement settings from API
}

// In fetchType9Campaigns() (line ~378):
const campaign: WbCampaignDetails = {
  // ... existing mappings ...
  placements: (advertsData.settings as Record<string, unknown>)?.placements as {
    search: boolean;
    recommendations: boolean;
    carousel?: boolean;
  } | undefined,
};

// In upsertCampaign():
await this.prisma.advCampaign.upsert({
  where: { advertId: campaign.advertId },
  update: {
    // ... existing fields ...
    placements: campaign.placements ? (campaign.placements as unknown as Prisma.JsonValue) : null,
  },
  create: {
    // ... existing fields ...
    placements: campaign.placements ? (campaign.placements as unknown as Prisma.JsonValue) : null,
  },
});
```

**Note**: Legacy campaigns (type 4-8) will have `placements: null` since WB API doesn't provide this field for them.

#### 1.4 API Response (Analytics)
```typescript
// GET /v1/analytics/advertising
{
  "campaigns": [
    {
      "advertId": 17804855,
      "name": "2024-06-07-Поиск-Дым долгий 5 л-148190095",
      "type": 9,
      "status": 11,
      "placements": {                    // ✅ NEW field (only for type 9)
        "search": true,
        "recommendations": false
      },
      "budget": null,
      "dailyBudget": 5000.00
    },
    {
      "advertId": 8645189,
      "name": "краска для руля",
      "type": 4,
      "status": 7,
      "placements": null,                // ❌ NULL for legacy campaigns
      "budget": null,
      "dailyBudget": 0.00
    }
  ]
}
```

**Время реализации**: ~4 часа (миграция + backend service + tests + re-sync)

---

## 🔬 План действий (Следующие шаги)

### ✅ Шаг 1: Исследование API ответа (ЗАВЕРШЕНО)

**Script**: `scripts/inspect-campaign-response.ts`
**Status**: ✅ **COMPLETED** (2025-12-26)

**Результат**:
- ✅ Type 9 campaigns: `settings.placements` объект с boolean флагами найден!
- ❌ Legacy campaigns (4-8): placement data отсутствует
- 📝 Структура: `{ search: boolean, recommendations: boolean }`

### 🚀 Шаг 2: Реализация Backend (4 часа)

**Подзадачи**:
1. **Prisma Migration** (~1h):
   - Добавить `placements JSONB` колонку в `adv_campaigns`
   - Создать индексы для `search` и `recommendations` полей
   - Запустить миграцию на dev

2. **Backend Service Update** (~1.5h):
   - Обновить `WbCampaignDetails` interface
   - Извлекать `settings.placements` в `fetchType9Campaigns()`
   - Сохранять в `upsertCampaign()` как JSON
   - Legacy campaigns: `placements: null`

3. **API Response Update** (~30min):
   - Добавить `placements` поле в `GET /v1/analytics/advertising` response
   - Обновить TypeScript types
   - Обновить Swagger документацию

4. **Re-sync Campaigns** (~1h):
   - Очистить старые данные: `DELETE FROM adv_campaigns`
   - Запустить свежую синхронизацию для заполнения placements
   - Проверить результат в БД

### 📝 Шаг 3: Документация (~30min)

Обновить:
- ✅ `frontend/docs/request-backend/79-placement-field-campaign-data.md` (текущий файл)
- `docs/epics/epic-33-advertising-analytics.md` - добавить placements field
- API Swagger - обновить Campaign schema
- Frontend TypeScript types - синхронизировать с backend

---

## 📊 Влияние на Frontend

### TypeScript Types Update

```typescript
// frontend/src/types/advertising-analytics.ts
export interface Campaign {
  advertId: number;
  name: string;
  type: number;
  status: number;
  placements: {           // ✅ NEW field
    search: boolean;
    recommendations: boolean;
    carousel?: boolean;
  } | null;               // null for legacy campaigns (type 4-8)
  budget: number | null;
  dailyBudget: number;
  createdAt: string;
  updatedAt: string;
}
```

### UI Component Examples

**Option 1: Chips для каждого размещения**
```tsx
{campaign.placements && (
  <Box sx={{ display: 'flex', gap: 1 }}>
    {campaign.placements.search && (
      <Chip label="Поиск" color="primary" size="small" />
    )}
    {campaign.placements.recommendations && (
      <Chip label="Рекомендации" color="secondary" size="small" />
    )}
    {campaign.placements.carousel && (
      <Chip label="Карусель" color="info" size="small" />
    )}
  </Box>
)}
{!campaign.placements && (
  <Typography variant="caption" color="text.secondary">
    N/A (legacy кампания)
  </Typography>
)}
```

**Option 2: Текстовое отображение**
```tsx
const getPlacementLabel = (placements: Campaign['placements']): string => {
  if (!placements) return 'N/A';

  const active: string[] = [];
  if (placements.search) active.push('Поиск');
  if (placements.recommendations) active.push('Рекомендации');
  if (placements.carousel) active.push('Карусель');

  return active.join(' + ') || 'Нет активных';
};

<Typography>{getPlacementLabel(campaign.placements)}</Typography>
```

**Option 3: Icon-based UI**
```tsx
import SearchIcon from '@mui/icons-material/Search';
import RecommendIcon from '@mui/icons-material/ThumbUp';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';

{campaign.placements && (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    <Tooltip title="Поиск">
      <SearchIcon color={campaign.placements.search ? 'primary' : 'disabled'} />
    </Tooltip>
    <Tooltip title="Рекомендации">
      <RecommendIcon color={campaign.placements.recommendations ? 'secondary' : 'disabled'} />
    </Tooltip>
  </Box>
)}
```

### Filtering Support

Если нужна фильтрация по размещению:

```typescript
// Filter campaigns by placement type
const searchCampaigns = campaigns.filter(c => c.placements?.search === true);
const recommendCampaigns = campaigns.filter(c => c.placements?.recommendations === true);

// Combined filter
const activePlacements = campaigns.filter(c =>
  c.placements && (c.placements.search || c.placements.recommendations)
);
```

---

## ⏱️ Оценка времени

| Этап | Подзадача | Время |
|------|-----------|-------|
| **✅ Исследование** | WB API response analysis | ✅ **DONE** |
| **🚀 Backend Implementation** | Prisma migration (JSONB column + indexes) | 1.0 час |
|  | Service update (extract + upsert placements) | 1.5 часа |
|  | API response update + Swagger docs | 0.5 часа |
|  | Re-sync campaigns (clear + reload) | 1.0 час |
| **📝 Документация** | Epic 33, API docs, frontend types | 0.5 часа |
| **👨‍💻 Frontend Implementation** | TypeScript types update | 0.5 часа |
|  | UI components (chips/icons) | 1.0 час |
|  | **ИТОГО** | **~6 часов** |

**Блокеры**: Нет
**Зависимости**: Backend должен быть завершён перед Frontend

---

## 📎 Связанные документы

- **Epic 33**: `docs/epics/epic-33-advertising-analytics.md` - Advertising Analytics API
- **SDK v2.2.2**: `daytona-wildberries-typescript-sdk` Promotion module
- **WB API Docs**: Официальная документация WildberriesSDK (Context7)
- **Database Schema**: `prisma/schema.prisma` - AdvCampaign model
- **Sync Service**: `src/imports/services/adv-sync.service.ts` - Campaign sync logic

---

## ✅ Checklist для реализации

### ✅ Phase 1: Исследование (COMPLETED)
- [x] Создать скрипт `inspect-campaign-response.ts`
- [x] Запустить для type 9 кампании
- [x] Проверить для legacy кампаний (types 4-8)
- [x] Документировать результат → `settings.placements` найдено!

### 🚀 Phase 2: Backend Implementation
- [ ] **Prisma Migration**
  - [ ] Создать миграцию: `ADD COLUMN placements JSONB`
  - [ ] Добавить индексы: `placements->>'search'`, `placements->>'recommendations'`
  - [ ] Запустить миграцию: `npx prisma migrate dev`
  - [ ] Обновить schema.prisma: `placements Json?`

- [ ] **Service Layer Update** (`src/imports/services/adv-sync.service.ts`)
  - [ ] Обновить `WbCampaignDetails` interface - добавить `placements`
  - [ ] Обновить `fetchType9Campaigns()` - извлекать `settings.placements`
  - [ ] Обновить `upsertCampaign()` - сохранять как `Prisma.JsonValue`
  - [ ] Legacy campaigns: автоматически `placements: null`

- [ ] **API Response Update**
  - [ ] Добавить `placements` в DTO `GET /v1/analytics/advertising`
  - [ ] Обновить Swagger аннотации (@ApiProperty)
  - [ ] Обновить TypeScript types

- [ ] **Re-sync & Validation**
  - [ ] Очистить старые кампании: `DELETE FROM adv_campaigns`
  - [ ] Запустить синхронизацию: `npx tsx scripts/trigger-adv-sync.ts`
  - [ ] Проверить в БД: `SELECT placements FROM adv_campaigns WHERE type = 9 LIMIT 5`
  - [ ] Убедиться legacy: `SELECT placements FROM adv_campaigns WHERE type IN (4,6,7,8) LIMIT 5` → NULL

### 📝 Phase 3: Документация
- [x] Обновить `frontend/docs/request-backend/79-placement-field-campaign-data.md`
- [ ] Обновить `docs/epics/epic-33-advertising-analytics.md`
- [ ] Обновить API Swagger документацию
- [ ] Синхронизировать Frontend TypeScript types

### 👨‍💻 Phase 4: Frontend Implementation (Optional - зависит от команды)
- [ ] Обновить `frontend/src/types/advertising-analytics.ts`
- [ ] Добавить UI components для отображения placements (chips/icons)
- [ ] Добавить фильтры по placement type (если нужно)

---

## 📝 Заметки

1. **✅ Placement доступно только для Type 9**: Legacy кампании (types 4-8) не имеют этого поля в WB API. Frontend должен корректно обрабатывать `null` значения.

2. **✅ Структура данных**: WB API возвращает **объект** `{ search: boolean, recommendations: boolean }`, не массив строк. Это удобнее для фильтрации и отображения.

3. **⚠️ Carousel placement**: В текущей кампании (ID 17804855) поле `carousel` отсутствует. Неизвестно, добавляет ли WB это поле для некоторых кампаний. Используем optional `carousel?: boolean` для future-proofing.

4. **🔄 Миграция данных**: После добавления поля `placements` необходимо **полностью пересинхронизировать** все кампании для заполнения новых данных.

5. **📊 Backend/Frontend синхронизация**: Поле `placements` будет `null` для legacy кампаний. Frontend должен показывать "N/A" или скрывать placement UI для таких кампаний.

6. **🎯 Real-World Example** (из WB API):
   ```json
   {
     "advertId": 17804855,
     "name": "2024-06-07-Поиск-Дым долгий 5 л-148190095",
     "placements": { "search": true, "recommendations": false }
   }
   ```

---

**✅ Следующий шаг**: Приступить к Phase 2 (Backend Implementation) - миграция БД + обновление sync service.
