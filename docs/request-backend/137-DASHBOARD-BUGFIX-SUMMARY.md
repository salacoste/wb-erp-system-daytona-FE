# Dashboard Bugfix Summary - 2026-02-01

**Статус**: ✅ ВСЕ ИСПРАВЛЕНО
**Дата**: 2026-02-01

---

## Исправленные баги

### BUG-002: FBS Prices Stored in Kopecks (CRITICAL)

**Проблема**: WB API возвращает цены FBS заказов в копейках (×100), но бэкенд сохранял их как рубли.

**Влияние**:
- FBS Revenue отображалась в 100 раз больше (964,400 ₽ вместо 9,644 ₽)
- Искажались все финансовые метрики на дашборде

**Исправление**:
1. `src/orders/services/orders-sync.service.ts` - деление на 100 при сохранении
2. Миграция `20260201193002_bug002_fix_fbs_prices_kopecks` - исправление существующих данных

**Тесты**: 48 тестов пройдено, включая новый тест на конвертацию

---

### BUG-001: Theoretical Profit for Incomplete Data (HIGH)

**Проблема**: TheoreticalProfitCard показывал -2,102.66 ₽ вместо "—" для незавершённой недели.

**Влияние**: Пользователи видели "убыток" когда реальная прибыль неизвестна.

**Исправление**:
- `frontend/src/components/custom/dashboard/TheoreticalProfitCard.tsx` - проверка `isComplete` перед отображением
- Скрытие ComparisonBadge при неполных данных

**Тесты**: 13 тестов пройдено

---

### Data Availability Indicators (MEDIUM)

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-01
**Summary**: Three bugs fixed: BUG-002 (FBS prices in kopecks - critical), BUG-001 (theoretical profit for incomplete data - high), and data availability indicators added (medium). All fixes deployed with tests passing.
**Remaining frontend action**: None - all bugs fixed and validated.

**Проблема**: Пользователи не понимали, какие данные доступны в реальном времени, а какие ожидают недельный отчёт.

**Решение**:
1. `DataAvailabilityBadge.tsx` - компонент статуса данных (realtime/delayed/pending)
2. `IncompleteWeekBanner.tsx` - баннер для незавершённых периодов
3. `week-report-utils.ts` - утилиты для определения доступности данных

**Тесты**: 49 тестов пройдено (16 + 8 + 25)

---

## Созданные файлы

### Backend
| Файл | Описание |
|------|----------|
| `src/orders/services/orders-sync.service.ts` | Исправлено: деление цен на 100 |
| `prisma/migrations/20260201193002_bug002_fix_fbs_prices_kopecks/migration.sql` | Миграция для существующих данных |

### Frontend
| Файл | Описание |
|------|----------|
| `src/components/custom/dashboard/TheoreticalProfitCard.tsx` | Исправлено: проверка isComplete |
| `src/components/custom/dashboard/DataAvailabilityBadge.tsx` | Новый: индикатор статуса данных |
| `src/components/custom/dashboard/IncompleteWeekBanner.tsx` | Новый: баннер для текущей недели |
| `src/lib/week-report-utils.ts` | Новый: утилиты доступности данных |
| `src/components/custom/dashboard/index.ts` | Обновлено: экспорты компонентов |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | Обновлено: интеграция баннера |

### Тесты
| Файл | Кол-во тестов |
|------|---------------|
| `orders-sync.service.spec.ts` | 48 |
| `TheoreticalProfitCard.test.tsx` | 13 |
| `DataAvailabilityBadge.test.tsx` | 16 |
| `IncompleteWeekBanner.test.tsx` | 8 |
| `week-report-utils.test.ts` | 25 |
| **Всего** | **110** |

### Документация
| Файл | Описание |
|------|----------|
| `134-DASHBOARD-W05-VALIDATION-BUGS.md` | Описание BUG-001 |
| `135-BUG-FBS-PRICES-KOPECKS.md` | Описание BUG-002 |
| `136-DAILY-DATA-AVAILABILITY-GUIDE.md` | Руководство по ежедневным данным |
| `137-DASHBOARD-BUGFIX-SUMMARY.md` | Этот файл |

---

## Валидация результатов

### До исправления (Week 2026-W05)
| Метрика | Значение | Статус |
|---------|----------|--------|
| FBS Orders Revenue | 964,400 ₽ | ❌ Некорректно (×100) |
| FBS Avg Order Value | 107,155 ₽ | ❌ Некорректно |
| Total Orders Revenue | 1,265,467 ₽ | ❌ Некорректно |
| Theoretical Profit | -2,102.66 ₽ | ❌ Вводит в заблуждение |

### После исправления (Week 2026-W05)
| Метрика | Значение | Статус |
|---------|----------|--------|
| FBS Orders Revenue | 9,644 ₽ | ✅ Корректно |
| FBS Avg Order Value | 1,071.55 ₽ | ✅ Корректно |
| Total Orders Revenue | 310,711 ₽ | ✅ Корректно |
| Theoretical Profit | — (нет данных) | ✅ Корректно |

---

## Действия для деплоя

1. ✅ Миграция уже применена к локальной БД
2. 🔄 Для продакшена:
   ```bash
   npx prisma migrate deploy
   ```
3. 🔄 Пересинхронизация FBS заказов (опционально):
   ```bash
   POST /v1/orders/sync
   ```

---

**Подготовлено**: Claude Code
**Дата**: 2026-02-01
