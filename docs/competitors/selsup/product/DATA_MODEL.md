# Модель данных SelSup

## Обзор

SelSup — мультисервисная SaaS-платформа для селлеров маркетплейсов (Wildberries, Ozon, Яндекс Маркет, СберМегаМаркет, AliExpress и др.). Ядро продукта — единый внутренний справочник товаров (PIM), не зависящий от конкретной площадки: карточка создаётся один раз и через «тумблеры-курки» публикуется на маркетплейсы; обратный импорт карточек сопровождается автоматическим матчингом по штрихкоду/артикулу.

Модель данных построена вокруг нескольких концепций:

1. **Мультиарендность (multi-tenant).** Верхнеуровневая сущность — `Account` (аккаунт селлера). Внутри аккаунта несколько `Organization` (юрлица/ИП), у каждой — подключения к маркетплейсам (`Integration`) и склады (`Warehouse`). Пользователи (`User`) привязаны к аккаунту с ролевым доступом и ограничениями по организациям/брендам.
2. **Трёхуровневая модель товара:** Модель (`Product`) → Цвет (`ProductColor`) → Размер (`ProductSize`). Уровень размера — самый нижний и приоритетный при заполнении параметров. Учет остатков и себестоимости ведётся по `SKU`/партии.
3. **Единый ключ матчинга** — комбинация `Артикул объединения + Цвет + Размер` и/или штрихкод (`Barcode`). Правило тарификации: один товар на нескольких маркетплейсах = 1 SKU; разные размеры/цвета = разные SKU.
4. **Партионный учёт FIFO** через `Stock Item` (ID остатка) и `Batch` (партия). Себестоимость считается по партиям; доступны 3 режима (классический FIFO, упрощённый FIFO, последняя себестоимость).
5. **Связь карточек между организациями/маркетплейсами** через `Stock Link` (оригинал/дубликаты, общий остаток) и `Marketplace Link` (артикулы/ID на конкретном МП).
6. **Двусторонний обмен с маркетплейсами** через очередь фоновых задач (`Background Task`); все операции аудируются (`Audit Log`, `Event History`).
7. **AI-слой** (стратегии, формализатор, фото/видео/SEO, планировщик поставок) работает поверх аналитики и даёт рекомендации в виде `AI Task`.
8. **Финансовое ядро** — сырые `Marketplace Operation` (профит-репорт) агрегируются в P&L, юнит-экономику, ABC-анализ; налоговый движок (УСН/ОСНО/НДС) и ДДС (`Cash Flow Payment`) дают чистую прибыль.

Сущности ниже сгруппированы по доменам: аккаунт/доступ, каталог (PIM), остатки/склад, заказы и сборка, FBO-отгрузки, маркировка/этикетки, цены/стратегии/акции, закупки/производство/комплекты, CRM/покупатели/конкуренты, аналитика/финансы, интеграции/импорт-экспорт, AI-модули, автоматизация/задания.


---

## Основные сущности

### 1. Домен «Аккаунт, доступ, тариф»

#### Account (Аккаунт / учётная запись селлера)
- `id` (uuid) — первичный ключ
- `email` (string, unique) — логин, идентификатор основного аккаунта/администратора
- `phone` (string) — телефон
- `password_hash` (string)
- `two_factor_enabled` (bool) — двухфакторная авторизация
- `max_sessions` (int, default 2) — лимит одновременных устройств
- `timezone` (string)
- `referral_link` (string) — партнёрская ссылка
- `created_at`, `updated_at` (datetime)

#### UserSession (Сессия устройства)
- `id`, `account_id` (ref Account), `device_info` (string), `ip` (string)
- `created_at`, `expires_at` (datetime)
- `active` (bool)

#### ClientAccountLink (Связанный аккаунт клиента — B2B)
- `id`, `parent_account_id` (ref Account), `client_account_id` (ref Account)
- `access_level` (enum: manage_stock_and_data) — делегирование доступа фулфилменту/агентству

#### Subscription (Тариф / подписка)
- `id`, `account_id` (ref Account)
- `plan_name` (string) — название плана
- `period_months` (int: 1/3/6/12/24)
- `start_date`, `end_date` (date)
- `limits` (jsonb): `max_organizations`, `max_products`, `max_employees`, `max_warehouses`, `storage_bytes`
- `connected_modules` (array enum: PIM, AI_Findir, Marking, Smart_Warehouse, Planner, Telegram, Photo_Gen, etc.)
- `connected_marketplaces` (array enum)
- `payer_organization_id` (ref Organization)
- `payment_method` (enum: card / invoice)
- `closing_documents` (array ref Document)
- `status` (enum: active / expired / pending)

#### Organization (Организация — юрлицо/ИП)
- `id`, `account_id` (ref Account)
- `inn` (string) — автозаполнение полей
- `name`, `legal_address`, `bank_requisites` (jsonb)
- `tax_system` (enum: USN_Income / USN_Income_Expenses / OSNO)
- `usn_rate` (decimal, default 6)
- `vat_out_rate`, `vat_in_rate` (decimal) — для ОСНО
- `flag_write_off_cost` (bool), `flag_vat_in_cost` (bool) — налоговые тумблеры
- `stamp_image_id`, `signature_image_id` (ref Media) — печать/подпись для УПД/ТТН
- `edo_id` (string) — ID в ЭДО (для УПД ДОП)
- `stock_strategy` (enum: same_if_not_one / same / split_by_sales)
- `article_formation_rule` (string) — формирование артикула
- `reserve_from_one_warehouse` (bool)
- `default_brand_id` (ref Brand), `default_manufacturer_id` (ref Manufacturer)
- `min_fbs_stock`, `max_fbs_stock` (int)
- `flags` (jsonb): `sync_stocks`, `auto_import_orders`, `quick_fbo_import`, `fbo_min_threshold`
- `tariff_type` (enum: FBO / FBS / DBS / realFBS / PVZ) — схема работы для комиссии
- `paid_service_fee_wb`, `paid_service_fee_ozon` (decimal)
- `ozon_supply_cluster`, `ozon_delivery_cluster` (string) — для Ozon FBO
- `ozon_handling_cost`, `ozon_last_mile_cost` (decimal, default 25)
- `status` (enum: active / archived / deleted)
- `deleted_at` (datetime, nullable) — мягкое удаление

#### Store (Магазин)
- `id`, `organization_id` (ref Organization), `name`, `requisites` (jsonb inherited)

#### Position (Должность)
- `id`, `account_id`, `name`, `default_job_id` (ref Job) — «работа по умолчанию»

#### User (Сотрудник / пользователь)
- `id`, `account_id` (ref Account)
- `full_name`, `login`, `password_hash`, `phone`, `email`
- `position_id` (ref Position)
- `role_id` (ref Role)
- `organization_ids` (array ref Organization, или «все»)
- `brand_ids` (array ref Brand) — ограничение видимости
- `flag_can_publish_cards` (bool) — «Разрешить обновлять и сохранять карточки на МП»
- `flag_can_assemble_without_scan` (bool)
- `active` (bool)

#### Role (Роль / права доступа)
- `id`, `name` (enum: Администратор / Менеджер товаров / Оператор / Рекламщик-аналитик / Закупщик / Сотрудник склада / Контент-менеджер / Просмотр карточек / Консультант / Управление ценами)
- `permissions` (jsonb) — матрица видимости разделов/меню/аналитики/финансов/закупочных цен

#### Certificate (Сертификат / декларация)
- `id`, `account_id`, `name` (полное с ЕАЭС), `number`, `type` (enum: Certificate / Declaration / Refusal_Letter)
- `valid_from`, `valid_to` (date), `image_id` (ref Media)
- `brand_ids`, `category_ids` (array) — правило сопоставления с карточками

#### ExtensionSession (Сессия браузерного расширения)
- `id`, `account_id`, `authorized` (bool), `processes` (jsonb): copy_cards / positions / reviews / spp / funnel
- `auto_run_schedule` (jsonb): time, timezone, selected_data


### 2. Домен «Каталог товаров (PIM)»

#### Product (Карточка товара / Модель)
- `id` (uuid)
- `organization_id` (ref Organization)
- `unification_article` (string) — «Артикул для объединения в одну карточку» (авто при импорте)
- `name`, `label_name` (string) — название и «название для этикетки»
- `brand_id` (ref Brand, обязательно)
- `type` (enum: Product / Digital / Kit / Service) — тип товара SelSup
- `manufacturer_id` (ref Manufacturer), `production_country` (string, обязательно)
- `category_id` (ref Category, обязательно)
- `price_with_discount`, `price_without_discount` (decimal, обязательно)
- `vat_rate` (decimal), `purchase_price`, `extra_costs`, `cost_price` (decimal, авто = purchase+extra), `wholesale_price`
- `description` (text), `gender`, `season`, `composition`, `laundry_care` (text)
- `internal_info`, `site_url` (string)
- `dimensions` (jsonb: length/width/height), `weight` (decimal, обязательно)
- `order_deadline_time` (string) — «до какого времени должен быть сделан заказ»
- `photo_updated_at` (datetime) — дата изменения фото
- `status` (enum: Actual / Not_Actual / Archived / Deleted)
- `fbs_status` (enum: Created / In_Stock / Lost / Reserved / Shipped / Removed)
- `is_favorite` (bool) — избранный (для AI-отчётов)
- `primary_manager_id` (ref User) — «Менеджер товара основной»
- `created_at`, `updated_at`

#### ProductColor (Цвет — вариация уровня цвета)
- `id`, `product_id` (ref Product)
- `color_article` (string) — артикул цвета
- `color_id` (ref ColorDict)
- `photo_ids` (array ref Media) — фото цвета
- `description` (text) — параметры уровня цвета (для Ozon)
- `status` (enum: active/archived/deleted)

#### ProductSize (Размер — вариация уровня размера)
- `id`, `color_id` (ref ProductColor)
- `size`, `russian_size`, `manufacturer_size`, `wb_size`, `name` (string)
- `barcode_ids` (array ref Barcode)
- `sku_id` (ref Sku) — внутренний ID учёта остатков
- `status` (enum: active/archived/deleted)
- `gtin` (string, nullable) — для Честного Знака

#### Sku (SKU — единица учёта остатков)
- `id`, `value` (string, unique) — один SKU у нескольких товаров, объединённых по остатку; меняется при объединении/разъединении
- `created_at`

#### StockLink (Связь карточек по остатку — оригинал/дубли)
- `id`, `original_product_id` (ref Product), `stock_strategy` (enum)
- `duplicate_product_ids` (array ref Product)

#### GroupProduct (Групповая карточка)
- `id`, `account_id`, `name`, `photo_ids` (array), `barcodes` (array), `marketplace_articles` (jsonb)
- `member_product_ids` (array ref Product, в т.ч. разных организаций)
- `supplier_articles` (array ref SupplierArticle) — артикулы поставщиков

#### Category (Категория SelSup)
- `id`, `account_id`, `name`, `parent_id` (ref Category, nullable) — иерархия
- `tnved` (string), `category_type` (string), `laundry_care`
- `ozon_commission` (decimal)
- `dimensions` (jsonb), `weight` (decimal) — для всех товаров категории
- `flag_marked` (bool) — «Товары категории маркируются» (авто по ТНВЭД)
- `flag_split_color_size` (bool)
- `flag_show_my_params`, `flag_show_shelf_life` (bool)
- `name_template` (string) — `{цвет}`, `{размер}`
- `flag_remove_from_fbs` (bool)
- `default_params` (jsonb)
- `okpd2` (string)
- `status` (enum: active / archived)

#### CategoryMarketplaceMapping (Связь категории SelSup ↔ категория МП)
- `id`, `category_id` (ref Category), `marketplace` (enum), `external_category_id`/`external_category_name` (string)
- `matched_by` (enum: ai / manual / product_card)

#### Brand (Бренд)
- `id`, `account_id`, `name`, `ozon_name`, `ozon_id` (string, numeric external_id)
- `logo_media_id` (ref Media)

#### Manufacturer (Производитель)
- `id`, `account_id`, `requisites` (jsonb incl. INN), `production_country` (string default)
- `inn` (string) — обязателен для Честного Знака

#### ColorDict (Справочник цветов), MaterialDict и т.п.
- `id`, `name`, `hex` (nullable)

#### Parameter (Конструктор параметров SelSup)
- `id`, `account_id`, `name`, `published` (bool), `use_all_categories` (bool), `category_ids` (array)
- `required` (bool), `allow_multiple` (bool), `group_name`
- `value_type` (enum: text / number / enum / etc.), `edit_view` (enum: dropdown / input)
- `level` (enum: model / category / display / product)
- `show_in_analytics` (bool)
- `bind_level` (enum: model / color / size)
- `linked_service_param_id` (ref Parameter) — связь со служебным параметром

#### ParameterValue (Значение параметра)
- `id`, `parameter_id` (ref Parameter), `entity_type` (enum: product / color / size / category), `entity_id` (uuid)
- `value` (jsonb)

#### ParameterMappingRule (Правило маппинга значений МП)
- `id`, `account_id`, `name`, `level` (enum) — ограничение одного уровня
- `mappings` (jsonb): [{from_param_id, from_value, to_param_id, to_value}]

#### Tag (Тег)
- `id`, `account_id`, `name`
- `product_size_ids` (array) — связь многие-ко-многим

#### MarketplaceLink (Связь карточки с маркетплейсом)
- `id`, `product_id` (ref Product), `size_id` (ref ProductSize, nullable)
- `marketplace` (enum: WB / Ozon / Yandex / Megamarket / AliExpress / Avito / Lamoda / Magnit / Leroy / SimaLand / Webasyst / InSales / WooCommerce / Tilda / OpenCart / Moysklad / 1C / CSBIS / Takealot / MVideo / Uzum / DetskiyMir / Amazon)
- `external_article`, `external_id`, `external_imt`, `external_sku`, `guid` (string) — ID/артикул на МП
- `linked_at` (datetime)

#### Barcode (Штрихкод)
- `id`, `account_id`, `value` (string), `gtin` (string, nullable)
- `generation_source` (enum: HonestSign / GS1RUS / Marketplace / Range / Manual)
- `product_size_id` (ref ProductSize)
- `marketplace_usage` (array enum) — пометка использования по МП
- `allow_duplicate_across_orgs` (bool) — глобальная настройка дублирования

#### Media (Фото / Видео / файл)
- `id`, `account_id`, `type` (enum: photo / video / file)
- `source` (enum: uploaded / marketplace_url / external_url)
- `url` / `storage_key` (string), `format` (mp4/mov/jpeg), `angle` (string, nullable)
- `marketplace_marks` (array enum) — «значки» МП для выборочной отправки
- `is_main` (bool), `position` (int)
- `rich_content_json` (jsonb) — rich-контент Ozon

#### PhotoSession (Фотосъёмка)
- `id`, `account_id`, `storage_type` (enum: YandexDisk / GoogleDrive), `folder_path`
- `structure` (enum: folders_for_products / files_with_angles / files_with_article)
- `settings` (jsonb: replace/add_first/replace_angles/ignore_date/resize_3_4/marketplace_angle)
- `status` (enum: new / updated / imported)

#### Competitor (Конкурент)
- `id`, `product_id` (ref Product), `marketplace` (enum), `url`, `external_article`

#### ProductChangeHistory (История изменений карточки)
- `id`, `product_id`, `version_id` (int), `changed_at` (datetime), `user_id`
- `snapshot` (jsonb), `restorable` (bool)

#### SkuChangeHistory (История изменений SKU)
- `id`, `sku_id`, `changed_at`, `user_id`, `operation` (string)


### 3. Домен «Остатки, склад, адресное хранение»

#### Warehouse (Склад)
- `id`, `organization_id` (ref Organization), `name`
- `type` (enum: physical_fbs / virtual_fbo / fulfillment)
- `flags` (jsonb): `no_stock_transfer`, `no_order_load`, `use_for_orders`, `fbo_accounting` (Склад для учёта остатков FBO)
- `priority` (int) — приоритет списания
- `unplaced_cell_id` (ref StorageCell) — ячейка для неразмещённых (по умолч. А.1.1.1)
- `marketplace` (enum, nullable) — для виртуального FBO

#### WarehouseMarketplaceLink (Связь склада SelSup ↔ склад МП)
- `id`, `warehouse_id` (ref Warehouse), `marketplace` (enum), `organization_id`, `external_warehouse_id` (string)

#### StorageStructure (Адресное хранение: Проход/Стеллаж/Полка/Ячейка)
- `id`, `warehouse_id` (ref Warehouse)
- `level` (enum: aisle / rack / shelf / cell)
- `parent_id` (ref StorageStructure, nullable)
- `name` (буква/номер), `barcode` (string)
- `hidden` (bool)

#### StockItem (Остаток — партия, партионный учёт)
- `id` (uuid) — ID остатка
- `sku_id` (ref Sku), `product_size_id` (ref ProductSize)
- `warehouse_id` (ref Warehouse), `storage_cell_id` (ref StorageStructure, nullable)
- `quantity` (int, текущий), `reserved` (int), `shipped` (int)
- `purchase_price`, `extra_costs` (decimal), `gtd_number` / `rnpt` (string)
- `expiry_date` (date, nullable), `production_date` (date, nullable)
- `type` (enum: FBS / FBO_API / FBO_virtual)
- `batch_id` (ref Batch), `income_order_id` (ref IncomeOrder)
- `created_at`

#### Batch (Партия — для FIFO)
- `id`, `sku_id`, `quantity`, `cost_price`, `currency`, `purchase_price`
- `received_at` (datetime), `expiry_date`, `production_date`, `source_income_id` (ref IncomeOrder)

#### IncomeOrder (Приёмка на склад / поступление)
- `id`, `organization_id`, `supplier_id` (ref Supplier, nullable)
- `warehouse_id` (ref Warehouse), `input_method` (enum: Production / Import / etc.)
- `status` (enum: draft / posted / closed)
- `purchase_order_id` (ref PurchaseOrder, nullable) — связанные документы
- `overhead_costs` (jsonb: distribution, pct_of_sum)

#### IncomeOrderItem (Строка приёмки)
- `id`, `income_order_id`, `product_size_id`, `quantity`
- `purchase_price`, `extra_costs`, `storage_cell_id`, `expiry_date`, `production_date`, `gtd_number`, `marking_code_id` (ref MarkingCode)

#### WriteOffOrder (Списание остатков)
- `id`, `organization_id`, `warehouse_id`, `status`, `items` (jsonb: [{product_size_id, quantity, price}]), `change_history` (jsonb)

#### MovementOrder (Перемещение между складами/ячейками)
- `id`, `organization_id`, `from_warehouse_id`, `to_warehouse_id`
- `from_cell_id`, `to_cell_id` (ref StorageStructure)
- `items` (jsonb), `status`, `assembly_list_url`

#### Inventory (Инвентаризация)
- `id`, `warehouse_id`, `date`, `file_with_cells` (bool)
- `extra_columns` (jsonb: expiry/production_date/gtd), `status` (open/closed)

#### Supply (Поставка FBS — группа заказов на дату)
- `id`, `organization_id`, `marketplace`, `warehouse_id`, `delivery_date`, `name`
- `external_number` (string), `qr_code` (string, WB), `is_b2b` (bool)
- `status` (enum: created / shipped / closed), `order_ids` (array ref Order)
- `problem_orders` (jsonb) — сверка с WB

#### StockOperationHistory (История операций с остатком)
- `id`, `stock_item_id` (ref StockItem), `storage_cell_id`, `date`, `order_id`, `user_id`
- `delta` (int), `total_after` (int), `operation_type` (enum: change/reserve/take/lost/remove/inventory/found/unique_replace/release_reserve/...)

#### StockSendHistory (История отправки остатков — 3 мес.)
- `id`, `sku_id`, `product_size_id`, `sent_quantity`, `received_quantity`
- `warehouse_id`, `status` (success/error), `error_reason`, `date`

#### ProductStockSettings (Настройки остатков товара)
- `product_size_id`, `min_stock`, `max_stock`, `decrease_by` (int)
- `exclude_from_fbs` (bool), `exclude_marketplaces` (array enum), `ignored_warehouses` (array)


### 4. Домен «Заказы и сборка (FBS/FBO/DBS)»

#### Order (Заказ)
- `id` (uuid), `external_number` (string, на МП), `organization_id`, `marketplace` (enum)
- `scheme` (enum: FBS / FBO / Express / DBS / realFBS / hybrid_DBS / DBW / DBM / B2B / Wholesale / Retail)
- `status` (enum: New / On_Assembly / Assembled / Sent / In_Transit / Sold / Completed / Canceled / Returned / Ready_for_Pickup / Lost / In_Purchase)
- `internal_status` (enum) — до отгрузки, не передаётся на МП
- `order_date`, `purchase_date`, `shipment_date`, `days_in_transit` (date/int)
- `warehouse_id`, `delivery_service` (string, для DBS), `track_number` (string)
- `customer_id` (ref Customer, nullable), `is_b2b` (bool)
- `amount`, `cost_price`, `commission_amount`, `commission_pct`, `logistics_cost`, `gross_profit` (decimal)
- `reserved_stock_id` (ref StockItem), `supply_id` (ref Supply, nullable)
- `label_url`, `error_message` (string)
- `assembled_by_id` (ref User), `assembly_started_at` (datetime)
- `storage_cell_id`, `aisle` (ref StorageStructure / string) — адресное хранение
- `created_at`

#### OrderItem (Строка заказа)
- `id`, `order_id`, `product_size_id`, `quantity`, `unit_price`
- `marking_code_id` (ref MarkingCode, nullable), `gtd_number` (string, nullable)

#### OrderBox (Короб/отправление — разделение заказа)
- `id`, `order_id`, `barcode` (string, WB-TRBX для ПВЗ), `type` (enum: mix/mono/qr/preliminary/pvz)
- `dimensions` (jsonb, optional), `items` (array: [{product_size_id, quantity}])
- `packed_by_id` (ref User), `packed_at` (datetime)

#### FboOrder (Заказ на отгрузку FBO — на склад МП)
- `id`, `name`, `organization_id`, `marketplace` (enum: WB / Ozon / Yandex)
- `marketplace_warehouse_id` (string), `source_warehouse_id` (ref Warehouse)
- `flag_write_off` (bool) — «Списать остатки»
- `wb_supply_type` (enum: mix / mono / mono_pallet / supersafe / qr_box)
- `status` (enum: New / Assembled / Packed / Ready_for_Supply / Shipped / Closed / Returned)
- `external_shipment_number` (string), `supply_id` (ref Shipment)
- `store_id_wb` (string) — для QR-коробов
- `pass_data` (jsonb: boxes_count, driver, car, package_type, supply_barcode_a4)

#### Shipment (Поставка FBO — внутренний номер)
- `id`, `internal_number`, `supply_date`, `name`, `supply_type`
- `order_ids` (array ref FboOrder)

#### Box (Короб FBO — справочник)
- `id`, `barcode` (уникальный: WB / QR SelSup / Ozon / WB-TRBX), `type`, `content` (jsonb)
- `packed_by_id`, `packed_at`, `fbo_order_id` (ref FboOrder)

#### WbAcceptanceAct (Акт приёмки WB)
- `id`, `fbo_order_id`, `file_url` (zip/xlsx), `received_items` (jsonb), `imported_at`

#### AssemblyJob (Сборочное задание — адресное хранение, ≤10 заказов)
- `id`, `active` (bool), `assigned_account_id`, `marketplace`, `order_ids` (array)
- `date_scope` (enum: today / tomorrow / older_than_day)

#### Label (Этикетка заказа — формируется МП)
- `id`, `order_id`, `type` (enum: order / product / assembly / info / videofix / marking)
- `url`, `available_status` (enum)


### 5. Домен «Маркировка, Честный Знак, этикетки»

#### MarkingCode (Код маркировки / КИЗ / DataMatrix)
- `id`, `code_value` (string — короткий), `full_code_value` (string — с криптохвостом)
- `gtin` (string, извлекается между (01) и (21)), `serial_number` (string), `crypto_tail` (string, после 91/92)
- `status` (enum: Created / Received / Applied / In_Turnover / Withdrawn / Transferred / Written_off / Left / Erroneous)
- `type` (enum: Unit / Kit / Group_Package / Set)
- `owner_inn` (string) — организация-владелец
- `product_size_id`, `order_id`, `supply_id` (refs, nullable)
- `expiry_date`, `production_date` (date, nullable)
- `emission_method` / `release_method` (enum: Production / Import / Marking_Residues / Remarketing / Commission_From_Individual)

#### MarkingDocument (Документ маркировки)
- `id`, `type` (enum: Input_In_Turnover / Withdraw_From_Turnover / Cancel_Code / Return_To_Turnover / UPD / UPD_DOP / Application_Report)
- `status` (enum: Created / Accepted / Success / Error), `number`, `sale_date`, `check_number`
- `organization_id`, `marking_code_ids` (array), `xml_url`

#### SuzOrder (Заказ СУЗ)
- `id`, `suz_identifier`, `status` (enum: Processed / etc.)
- `items` (jsonb, ≤10 позиций), `error_reason` (string)

#### NationalCatalogCard (Карточка Национального каталога / ЧЗ)
- `id`, `product_id`, `gtin`, `tnved`, `okpd2`, `type` (incl. Technical), `manufacturer_inn`
- `certificate_id` (ref Certificate), `moderation_status` (enum: Awaiting_Signing / Ready_for_Order)

#### LabelTemplate (Шаблон этикетки)
- `id`, `account_id`, `type` (enum: product / marking / box_barcode / storage_cell / order_wb / order_ozon / order_yandex / order_megamarket / order_funnel_58x40 / order_funnel_75x120 / supply / supply_barcode / videofix / dbs_order / a4)
- `width_mm`, `height_mm`, `image_width_px`, `image_height_px`
- `objects` (jsonb: [{type: text/barcode/image, content/substitution, font, size, max_lines, margins, condition, barcode_format}])
- `copies_count` (int — «сколько печатаем»), `printer_id` (ref Printer)

#### Printer (Принтер / QZ Tray)
- `id`, `name`, `qz_connected` (bool), `template_ids` (array)

#### UniqueUnitCode (Уникальный код единицы товара)
- `id`, `code`, `barcode_id`, `marking_code_id` (ref MarkingCode, nullable)
- `status`, `warehouse_id`, `income_order_id`, `order_id`
- `placed_by_id`, `placed_at`, `serial_number`, `shelf_life`, `purchase_price`, `retail_price`

#### AggregatedCode (Агрегированный код)
- `id`, `code` (упаковка/комплект), `gln_first7` (string), `nested_marking_code_ids` (array, ≥2)
- `scenario` (enum: sets_and_kits / order_aggregation / aggregation_job)

#### VsdDoc (ВСД Меркурий — ручной ввод)
- `id`, `number` (string), `product_size_id` (ref ProductSize)

#### SupplierArticle (Артикул поставщика)
- `id`, `supplier_id` (ref Supplier), `article` (string), `group_product_id` (ref GroupProduct, nullable), `product_id` (ref Product, nullable)

### 6. Домен «Цены, стратегии, акции»

#### Price (Ценовая строка по МП)
- `id`, `product_size_id`, `marketplace` (enum, nullable — общий столбец)
- `price_without_discount_current`, `price_without_discount_new` (decimal)
- `price_with_discount_current`, `price_with_discount_new_desired`, `price_with_discount_new_calc_wb` (decimal)
- `discount_pct_current`, `discount_pct_promo` (decimal)
- `commission_amount`, `logistics_cost` (decimal, авто)
- `gross_profit_current`, `gross_profit_new`, `margin_pct_current`, `margin_pct_new` (decimal)
- `unit_econ_by_margin`, `unit_econ_by_profit` (decimal) — рекомендованные цены
- `actual_marketplace_costs` (jsonb) — фактические расходы с МП
- `potential_revenue_diff` (decimal)
- `orders_2weeks`, `turnover_days_2weeks` (decimal, 999 если нет заказов)

#### PurchasePriceParams (Параметры закупки и затрат)
- `id`, `product_size_id`, `purchase_price`, `currency`, `extra_costs`
- `permanent_costs` (decimal), `min_price` (decimal, только снижение), `promo_participation_pct` (decimal)
- `tax_rate` (decimal), `desired_margin_pct`, `desired_profit_rub`, `redemption_pct` (decimal)
- `cost_price` (decimal, авто = purchase+extra), `manual_sales_cost` (decimal, приоритет над %)

#### PricingStrategy (Стратегия ценообразования)
- `id`, `account_id`, `name` (string), `is_standard` (bool — РЦ/Целевая цена/Цена слива)
- `type` (enum: Manual / MRPC_Control / Night_Repricer)
- `repricer_params` (jsonb: work_time, discount_pct, marketplace, min_retail_price) — для репрайсера
- `product_size_ids` (array)

#### Promotion (Акция маркетплейса)
- `id`, `name`, `marketplace` (enum), `organization_id`, `period_start`, `period_end`, `conditions` (string)
- `is_auto_promo` (bool), `is_deleted_or_finished` (bool)
- `product_status` (jsonb: per product — participate / candidate / not_found_in_selsup / erroneous)
- `benefit_columns` (jsonb: margin_promo, margin_current, gross_profit_current, gross_profit_promo, price_with_discount_promo, redemption_pct)

#### PriceHistoryEntry (Запись истории цен)
- `id`, `product_size_id`, `barcode`, `new_prices` (jsonb), `old_prices` (jsonb)
- `source` (enum: User_Data / Service_Data), `user_id`, `sent_at` (datetime)
- `status` (enum: Success / Error), `error_description` (string), `detailed_status` (string)


### 7. Домен «Закупки, производство, комплекты»

#### Supplier (Поставщик / контрагент)
- `id`, `account_id`, `name_or_inn`, `custom_name`, `contact_person`, `email`, `phone`, `url`
- `product_ids` (array ref Product) — один ко многим

#### PurchaseOrder (Заказ поставщику / закупка)
- `id`, `number` (auto), `name`, `organization_id`, `currency`, `supplier_id` (ref Supplier)
- `status` (enum), `total_quantity`, `total_sum` (decimal)
- `income_order_id` (ref IncomeOrder, nullable)
- `tabs` (jsonb: order/prices/discrepancies/purchase_planning/related_docs)

#### PurchaseOrderItem (Строка закупки)
- `id`, `purchase_order_id`, `product_size_id`, `quantity`, `purchase_price`, `delivery_per_unit`
- `retail_price` (decimal, авто = purchase×K + delivery), `has_arrived`, `defect_qty`, `comment`

#### SupplierPayment (Платёж поставщику)
- `id`, `supplier_id`, `date`, `amount`, `purchase_order_id` (nullable)

#### SupplierSettlements (Взаиморасчёты — расчётная)
- `period`, `supplier_id`, `purchases_sum`, `payments_sum`

#### ProductionProcess (Производственный процесс)
- `id`, `account_id`, `name`, `stages` (array: [{id, name, description}])

#### TechCard (Технологическая карта)
- `id`, `name`, `description`, `process_id` (ref ProductionProcess)
- `materials` (array: [{material_size_id, quantity}]), `result` (array: [{result_size_id, quantity_per_norm}])
- `salary` (jsonb), `documents` (array)

#### ProductionOrder (Производственный заказ)
- `id`, `name`, `start_date`, `end_date`, `tech_card_id` (ref TechCard)
- `normative` (int), `from_warehouse_id`, `to_warehouse_id` (refs Warehouse)
- `status` (enum: draft / confirmed / completed), `fbs_order_ids` (array)
- `cost_analysis` (jsonb: materials / extra_costs / salary / total)

#### Kit (Комплект — тип товара)
- `id`, `product_id` (ref Product, type=Kit), `cost_price_manual` (decimal), `calculated_stock` (int), `manual_stock` (int)
- `gtin` (string, из ЧЗ)

#### KitComponent (Состав комплекта)
- `id`, `kit_id`, `component_product_size_id`, `quantity`

#### SalesBySupplierReport (Отчёт «Продажи по поставщикам» — расчётная)
- `supplier_id`, `period`, `sales_qty`, `sales_rub`, `returns_qty`, `returns_rub`, `revenue`
- `stock_qty`, `stock_purchase_value`, `sold_at_purchase`, `avg_actual_sale_price`

### 8. Домен «CRM, покупатели, конкуренты, реклама»

#### Chat (Чат покупателя)
- `id`, `marketplace` (enum: Ozon / WB), `organization_id`, `customer_name`
- `messages` (array: [{from, text, date}]), `last_message_date`, `is_unanswered`

#### Question (Вопрос)
- `id`, `marketplace`, `organization_id`, `product_id`, `question_text`, `answer_text`, `status`, `date`

#### Review (Отзыв)
- `id`, `marketplace`, `organization_id`, `product_id`, `rating`, `review_text`, `answer_text`, `status`, `date`

#### ResponseTemplate (Шаблон ответа)
- `id`, `name`, `type`, `text`

#### Customer (Покупатель)
- `id`, `account_id`, `name`, `phone`, `address`, `orders_history` (array ref Order)
- `source` (enum: DBS / realFBS_Ozon / online_store), `acquisition_source` (string, planned)

#### SalesFunnelRecord (Воронка продаж — на товар за период, WB)
- `id`, `organization_id`, `product_size_id`, `period`
- `fbo_stocks_wb`, `views`, `cart_adds`, `orders_created`, `purchases`, `cancellations` (int)
- `conversion_views_to_cart`, `conversion_cart_to_order`, `redemption_rate` (decimal)
- `card_rating`, `users_rating` (decimal, nullable), `ctr`, `impressions` (через расширение)

#### ProductPosition (Позиция товара в выдаче — расширение)
- `id`, `product_id`, `marketplace` (enum: WB/Ozon/Yandex), `search_query`, `depth` (int), `position` (int/«не в топе»), `date`

#### ProductRating (Рейтинг/отзывы товара — расширение)
- `id`, `product_id`, `rating`, `reviews_count`, `marketplace` (enum: WB/Ozon)

#### ProductSpp (СПП товара — расширение)
- `id`, `product_id`, `spp` (decimal), `date`

#### AdCampaign (Рекламная кампания)
- `id`, `external_id`, `name`, `organization_id`, `marketplace` (enum)
- `status` (enum: deleting / ready_to_launch / completed / canceled / showing / paused), `date`
- `statistics` (jsonb: clicks, views, spend, avg_cost), `sku_spend` (array: [{sku_id, spend, drr}])

#### EmailTemplate (Шаблон письма — один на аккаунт)
- `id`, `account_id`, `subject`, `content`

#### TelegramNotificationConfig (Telegram-подписка)
- `id`, `account_id`, `linked` (bool)
- `notify_fbs`, `notify_express`, `notify_dropshipping_errors` (bool), `fbo_threshold` (int)


### 9. Домен «Аналитика и финансы»

#### MarketplaceOperation (Сырая операция маркетплейса — Profit Report)
- `id`, `organization_id`, `marketplace` (enum), `date` (datetime)
- `operation_type` (enum: sale / return / logistics / commission / spp / fine / surcharge / service / other_accrual / storage / advertising / paid_reception / withholding / advance_payment)
- `amount_rub` (decimal), `amount_currency` (decimal), `currency`
- `product_size_id` (ref, nullable), `purchase_price_at_moment` (decimal), `extra_costs_at_moment` (decimal)
- `is_self_buyout` (bool, размечается вручную)

#### LoadedReport (Загруженный отчёт — журнал ручного импорта)
- `id`, `marketplace`, `organization_id`, `period_start`, `period_end`, `file_url`, `loaded_at`

#### CashFlowPayment (Платёж ДДС)
- `id`, `account_id`, `type` (enum: income / expense), `organization_id`, `amount`, `date`
- `category` (string), `counterparty` (string), `is_recurring` (bool)

#### RecurringPayment (Регулярный платёж ДДС)
- `id`, `frequency` (string), `organization_id`, `amount`, `category`, `counterparty`, `date`

#### Hypothesis (Гипотеза)
- `id`, `name`, `product_id`, `marketplace` (enum), `start_date`, `end_date`

#### SalesPlan (План продаж)
- `id`, `product_size_id`, `period` (date/week), `plan_qty`, `plan_rub`

#### ProductManagerBinding (Привязка менеджера к товару)
- `id`, `product_id`, `primary_manager_id` (ref User)
- `manager_wb_id`, `manager_ozon_id`, `manager_yandex_id` (refs User, nullable)

> **Расчётные метрики** (не отдельные таблицы, агрегаты поверх MarketplaceOperation + Batch): Выручка, Продажи, Возвраты, Отмены, Логистика, Платная приёмка, Комиссия (с эквайрингом), СПП WB, Штрафы, Доплаты, Услуги, Прочие начисления, Платное хранение, Реклама, Сумма расходов на МП, Итого к оплате, Себестоимость, Закупочная цена проданного, Товарный остаток (FBS/FBO/общий), Процент выкупа, Валовая/Маржинальная/Чистая прибыль, Маржинальность, Рентабельность, ROI, ДРР, Доли логистики/комиссии/рекламы, Средний чек, Эффективности, Самовыкупы.

### 10. Домен «Интеграции, импорт/экспорт, обмен»

#### Integration (Подключение интеграции)
- `id`, `account_id`, `service` (enum: список ~25 МП/CMS/учётных систем)
- `organization_id` (ref Organization), `status` (enum: not_configured / configured / partially_configured)
- `credentials` (jsonb) — зависит от сервиса (api_token / client_id+secret / login+pass / connector_url+creds / domain+consumer_key+secret)
- `scheme` (enum: FBS / FBO / FBY / DBS / realFBS / Express, nullable)
- `payment_type` (enum: free / paid_monthly / custom_dev), `trial_days` (int)

#### InvalidTokenNotification (Уведомление о невалидном токене)
- `id`, `organization_id`, `service`, `is_invalid` (bool)

#### StatusMapping (Сопоставление статусов заказов)
- `id`, `integration_id`, `external_status` (string), `selsup_status` (enum Order.status)

#### YmlFeed (YML-фид)
- `id`, `account_id`, `url`, `login`, `password`, `target_marketplace` (enum: Yandex / Megamarket / Avito)
- `content_scope` (jsonb: catalog / prices / stocks), `upload_history` (array: [{date, status, errors}])

#### RegularExchange (Регулярный обмен — дропшиппинг)
- `id`, `account_id`, `type` (enum: Email_IMAP / Email_XLS / Excel_URL / YML / JSON_API_Core)
- `source_config` (jsonb: imap/credentials/url/auth/json_config)
- `organization_id`, `warehouse_id` (до 2), `cron_schedule` (≥30 мин, кроме тарифа Бизнес)
- `supplier_id` (ref Supplier, nullable)
- `flags` (jsonb: update_stocks / update_stocks_on_mp / send_prices_to_mp / write_off_stocks / filter_by_name / import_for_group_cards)
- `match_field` (enum: any_article / external_article / article_wb / article_ozon / article_megamarket / sku_yandex / sku_aliexpress)
- `xpath_tags` (jsonb — для YML: offer/@id, vendorCode, barcode, count, outlets/count)

#### PriceList (Прайс-лист поставщика — разовая загрузка)
- `id`, `organization_id`, `warehouse_id`, `columns` (jsonb), `match_field`, `write_off_stocks` (bool)

#### ImportExportJob (Задача импорта/переноса)
- `id`, `account_id`, `type` (enum: api_import / quick_import / overnight_import / excel_mass_edit / excel_update_mp / yml_import / xml_cml / file_act / transfer_between_orgs / moysklad_sync / 1c_sync)
- `params` (jsonb), `status` (enum), `error_log` (jsonb), `stats` (jsonb: added/updated/errors)

#### ImportErrorLog (Журнал «Ошибки импорта»)
- `id`, `import_job_id`, `product_identifier`, `reason` (string)

#### CommerceMlExchange (Обмен по CommerceML 1/2)
- `id`, `account_id`, `direction` (enum: import_xml_catalog / offers_xml / prices / rests)
- `file_url`, `tag_id_sklada` (string), `price_type_id` (string), `group_id_with_hash` (string, содержит `#`)

#### OneCMapping (Сопоставление товаров 1С)
- `id`, `account_id`, `scheme` (enum: Code_Article1C / Article_Article1C / Code_ArticleOzon / Article_ArticleOzon / ...WB/Yandex/Megamarket/AliExpress)
- `product_size_id`, `external_1c_id` (string)


### 11. Домен «AI-модули»

#### AiTask (Задача AI-Стратегий)
- `id`, `account_id`, `product_id` (ref Product), `marketplace` (enum, только WB на данный момент)
- `problem_text` (text), `recommended_action` (text), `potential_effect` (text), `priority` (int)
- `profit_delta_14d` (decimal) — дельта чистой прибыли за 14 дней vs предыдущие 14
- `status` (enum: Open / In_Progress / Done), `owner_id` (ref User, один), `assignee_ids` (array ref User)
- `result_text` (string) — фиксация «до/после» одной строкой
- `created_at`

#### AiFormalizerResult (Результат Формализатора — предлагаемое значение параметра)
- `id`, `product_id`, `parameter_id` (ref Parameter), `proposed_value` (jsonb), `confirmed` (bool)

#### AiImageLayer (Слой изображения в AI-редакторе)
- `id`, `media_id` (ref Media), `type` (enum: text / shape / background), `content` (jsonb), `order` (int), `locked` (bool)
- `deep_params` (jsonb: gamma/saturation/hue/noise)

#### AiPhotoTemplate (Мои шаблоны — личная библиотека)
- `id`, `account_id`, `name`, `media_id`

#### AiPhotoSeries (Серия фото — Фотоворонка)
- `id`, `product_id`, `plan_count` (int: 7/8/9/10), `status` (jsonb per photo: regen/confirmed), `final_grid` (array ref Media)

#### AiVideo (Видео товара)
- `id`, `product_id`, `source_photo_ids` (array, 2 фото), `motion_prompt` (text)
- `target_marketplaces` (array enum: Ozon / WB), `status` (enum: generated / saved / sent), `media_id` (ref Media)

#### KeywordGroup (Группа ключевых слов — PIM/SEO)
- `id`, `product_id`, `name`, `keywords` (array), `frequencies` (jsonb — частота по словам)

#### SeoDescription (SEO-описание)
- `id`, `product_id`, `keyword_group_ids` (array ref KeywordGroup), `generated_text` (text), `mp_rules_compliance` (jsonb)

#### DeliveryCalculation (Расчёт поставки — Точные поставки)
- `id`, `account_id`, `marketplace` (enum: WB / Ozon), `organization_id`
- `mode` (enum: Manual_Distribution / Smart_Distribution[in_dev])
- `cluster_ids`, `warehouse_ids` (array), `analysis_period_start`, `analysis_period_end` (date)
- `planned_supply_date` (date), `plan_days` (int, default 30), `recommend_from` (int)
- `flags` (jsonb: count_by_orders[on] / include_fbs / limit_by_fbo_stock[in_dev] / distribute_unmatched / ai_forecast[in_dev])
- `recommendations` (array: [{product_size_id, name, fbo_stock, in_supply, deficit, warehouse_qty, package_type, wb_coeffs, cost}])
- `detailing` (array per warehouse: [{warehouse_id, fbo_stock, in_supply, enough_days, demand, deficit}])
- `created_supply_ids` (array ref Shipment)

#### AiFindirData (Данные расширения AI Финдир)
- `id`, `product_id`, `marketplace`, `data_type` (enum: position / rating_reviews / spp_wb / funnel_ctr_impressions), `payload` (jsonb), `date`

#### HandOnPulseItem (Показатели «Рука на пульсе по-товарно»)
- `id`, `product_size_id`, `organization_id`, `marketplace`, `period`
- `price_with_spp`, `price_with_discount`, `spp_rub`, `spp_pct` (decimal)
- `rating`, `reviews_count` (decimal)
- `profit_fact`, `profit_per_sku`, `cost_per_sku`, `margin_pct`, `revenue_fact_rub`, `revenue_fact_qty` (decimal)
- `orders_qty`, `redemption_qty`, `cancellations` (int)
- `cart_count`, `cr_cart`, `cr_order`, `redemption_pct` (decimal) — воронка WB
- `ad_budget_fact`, `auction_budget`, `ark_budget`, `drr_pct`, `clicks`, `impressions`, `ctr_pct` (decimal)
- `abc_revenue`, `abc_profit` (enum: A/B/C)
- `stock_fbs`, `stock_fbo`, `turnover_days` (int)
- `profit_plan`, `position_rank` (int, через расширение)
- `manual_fields` (jsonb: comment / ad_budget_plan / days_to_season_end / sizes / resort_plan / revenue_plan_qty / strategy)
- `auto_updated_at` (datetime) — обновление каждую ночь

### 12. Домен «Автоматизация, задания, события»

#### Job (Задание оператора)
- `id`, `account_id`, `name`, `product_class_id` (ref Category, или «все»), `position_id` (ref Position)
- `work_cost` (money), `tariffs` (array: [{brand_id / class / category / product_size_id, rate}])
- `type` (enum: комплектация / сборка_заказов / сборка_fbo / упаковка_fbo / упаковка_с_добавлением_fbo / возврат_товара / проверка_заказов / custom)
- `availability` (string, напр. «только после регистрации Генерального директора»)

#### UserTask (Задача сотрудника — «Мои задачи»)
- `id`, `account_id`, `name`, `description` (text), `priority` (enum: very_urgent / not_urgent / medium)
- `status` (enum: To_Work / In_Work / For_Review / Resolved), `start_date`, `end_date` (date, nullable)
- `assignee_id` (ref User), `author_id` (ref User)

#### BackgroundTask / EventHistory (Событие / фоновая задача)
- `id`, `status` (enum: Queued / Running / Completed / Error / Interrupting / Interrupted_Stopped)
- `name` / `type` (enum, напр. «Импорт заказов со своего склада»)
- `file_url`, `message` (text), `created_at` (datetime)
- `initiated_by` (enum: Robot_SelSup / User; +user_id)

#### GlobalSetting (Глобальная настройка)
- `id`, `account_id`, `section` (enum: general / products / analytics / prices / purchases / orders / supplies / stocks / employees / jobs)
- `key` (string), `value` (jsonb: bool / string / enum / ref)

#### SupportTicket (Обращение в техподдержку)
- `id`, `type` (enum: Incident / Consultation / Setup_Request / Feature_Request)
- `priority` (enum: Critical / Significant / Medium / Minor), `user_login`, `description`, `object_url`
- `error_text`, `expected_result`, `attachments` (array), `status` (registered / in_work / suspended / closed)
- `created_at`, `sla_target` (datetime)

#### AuditLog (Аудит действий сотрудников)
- `id`, `account_id`, `user_id`, `entity_type`, `entity_id`, `action` (string), `timestamp` (datetime)

#### GeneratedDocument (Закрывающий/УПД/ТТН документ)
- `id`, `account_id`, `type` (enum: UPD / UPD_DOP / TTN / closing / act)
- `organization_id`, `file_url`, `xml_url` (for WB УПД НДС), `created_at`


---

## Связи между сущностями (ER-описание)

### Иерархия аренды и доступа
- `Account` **1—N** `Organization` **1—N** `Store`; `Organization` **1—N** `Integration` (одно подключение на МП); `Organization` **1—N** `Warehouse`.
- `Account` **1—N** `User`; `User` **N—1** `Role`; `User` **N—1** `Position`; `User` **N—N** `Organization` (через `organization_ids`); `User` **N—N** `Brand` (ограничение видимости).
- `Account` **1—1** `Subscription`; `Account` **1—N** `ClientAccountLink` (делегирование доступа фулфилменту).
- `Organization` **N—N** `Organization` через `StockLink` (оригинал↔дубликаты, общий остаток).

### Иерархия товара (ядро PIM)
- `Organization` **1—N** `Product` **1—N** `ProductColor` **1—N** `ProductSize`.
- `ProductSize` **N—1** `Sku`; `Sku` **1—N** `ProductSize` (один SKU у нескольких товаров, объединённых по остатку).
- `Product` **N—1** `Brand`, `Manufacturer`, `Category`, `GroupProduct` (многие карточки под одним «зонтом»).
- `Product`/`ProductColor`/`ProductSize` **1—N** `ParameterValue` → `Parameter` (значения параметров на трёх уровнях).
- `Category` **N—N** `MarketplaceCategory` через `CategoryMarketplaceMapping` (по каждому МП).
- `Product`/`ProductSize` **1—N** `MarketplaceLink` (связи с каждым МП по `external_article`/`external_id`).
- `ProductSize` **1—N** `Barcode` (несколько штрихкодов с пометкой МП; на этикетке — один).
- `Product`/`ProductColor` **1—N** `Media` (фото/видео/rich-контент); `Product` **1—N** `PhotoSession`.
- `Product` **N—N** `Tag` (через `ProductSize`); `Product` **1—N** `Competitor`.
- `Product` **1—N** `ProductChangeHistory`; `Sku` **1—N** `SkuChangeHistory`.
- `Product` **1—N** `ProductManagerBinding` → `User` (primary + по МП).
- `Certificate` **N—N** `Brand`/`Category` (правило сопоставления с карточками).

### Остатки и склад
- `Warehouse` **1—N** `WarehouseMarketplaceLink` (связи со складами МП: МП→организация→ID склада МП).
- `Warehouse` **1—N** `StorageStructure` (адресное хранение: проход→стеллаж→полка→ячейка, self-ref `parent_id`).
- `StockItem` **N—1** `Sku`, `Warehouse`, `StorageStructure`, `Batch`, `IncomeOrder`.
- `IncomeOrder` **N—1** `Supplier`, `PurchaseOrder`; **1—N** `IncomeOrderItem` → `ProductSize`, `MarkingCode`, `StorageStructure`.
- `Inventory`, `WriteOffOrder`, `MovementOrder` **N—1** `Warehouse`; содержат строки `ProductSize`+quantity.
- `Order` **N—1** `Supply` (поставка FBS); `Order` **N—N** `StockItem` (резерв/списание); `Order` **1—N** `OrderItem` → `ProductSize`, `MarkingCode`.
- `StockItem` **1—N** `StockOperationHistory` (история операций по ID остатка); `Sku` **1—N** `StockSendHistory` (история отправки, 3 мес.).

### Заказы, сборка, FBO
- `Order` (FBS) **1—N** `OrderBox` (разделение на отправления); `Order` **1—N** `Label`.
- `FboOrder` **N—1** `Organization`, `Warehouse` (источник), `Shipment`; **1—N** `Box`, `WbAcceptanceAct`.
- `Shipment` **1—N** `FboOrder` (внутренняя группировка); `AssemblyJob` **N—N** `Order` (≤10 заказов).
- `Order`/`FboOrder` **1—N** `MarkingCode` (привязка КИЗ к заказу).

### Маркировка и этикетки
- `MarkingCode` **N—1** `ProductSize`, `Order`, `FboOrder`; **N—1** `Organization` (по `owner_inn`).
- `MarkingDocument` **N—N** `MarkingCode`; **N—1** `Organization`.
- `SuzOrder` **1—N** `MarkingCode`; `NationalCatalogCard` **N—1** `Product`, `Certificate`.
- `LabelTemplate` **N—N** `Printer`; `AggregatedCode` **N—N** `MarkingCode` (вложенные, ≥2).
- `Category.flag_marked` + `tnved` → триггер появления блока ЧЗ в `FboOrder`/`Order`.

### Цены, стратегии, акции
- `ProductSize` **1—N** `Price` (по каждому МП + общий); **1—1** `PurchasePriceParams`.
- `PricingStrategy` **N—N** `ProductSize` (через `Price`).
- `Promotion` **N—N** `ProductSize` (через `product_status` в jsonb).
- `ProductSize` **1—N** `PriceHistoryEntry`.

### Закупки, производство, комплекты
- `Supplier` **1—N** `PurchaseOrder` **1—N** `PurchaseOrderItem` → `ProductSize`; **N—1** `IncomeOrder`.
- `Supplier` **N—N** `Product` (привязка); `Supplier` **1—N** `SupplierPayment`, `SupplierArticle`.
- `ProductionProcess` **1—N** `TechCard` (через материалы/результат → `ProductSize`); `TechCard` **1—N** `ProductionOrder` → `Warehouse` (списания/приёмки), `Order` (FBS).

### CRM, покупатели, реклама
- `Chat`/`Question`/`Review` **N—1** `Marketplace`, `Organization`, `Product` (для вопроса/отзыва).
- `Customer` **1—N** `Order` (история); `SalesFunnelRecord`/`ProductPosition`/`ProductRating`/`ProductSpp` **N—1** `Product`/`ProductSize`.
- `AdCampaign` **N—1** `Organization`, `Marketplace`; **1—N** sku_spend → `Sku`.

### Аналитика и финансы
- `MarketplaceOperation` **N—1** `Organization`, `Marketplace`, `ProductSize` (при наличии связи).
- `CashFlowPayment`/`RecurringPayment` **N—1** `Organization`; `Hypothesis`/`SalesPlan` **N—1** `Product`/`ProductSize`.
- `Batch` (FIFO) **N—1** `Sku`; агрегируется в `MarketplaceOperation.purchase_price_at_moment`.

### Интеграции, импорт/экспорт
- `Integration` **N—1** `Account`, `Organization`; **1—N** `InvalidTokenNotification`, `StatusMapping`.
- `RegularExchange`/`PriceList`/`YmlFeed` **N—1** `Organization`, `Warehouse` (до 2), `Supplier`.
- `ImportExportJob` **1—N** `ImportErrorLog`; `CommerceMlExchange`/`OneCMapping` **N—1** `Account`, `ProductSize`.

### AI и автоматизация
- `AiTask` **N—1** `Product`, `User` (owner), `Marketplace` (только WB).
- `AiPhotoSeries`/`AiVideo`/`KeywordGroup`/`SeoDescription` **N—1** `Product`.
- `DeliveryCalculation` **N—1** `Organization`, `Marketplace`; **1—N** `Shipment` (созданные поставки).
- `HandOnPulseItem` **N—1** `ProductSize`, `Organization`, `Marketplace`; агрегирует данные из `Price`, `ProductRating`, `MarketplaceOperation`, `SalesFunnelRecord`, `AdCampaign`, `StockItem`.
- `Job` **N—1** `Position`, `Category`; `UserTask` **N—1** `User` (assignee), `User` (author).
- `BackgroundTask`/`AuditLog` **N—1** `User` (initiator); `SupportTicket` **N—1** `User`.


---

## Справочники и перечисления (статусы, типы)

### Маркетплейсы (enum `marketplace`)
WB (Wildberries), Ozon, Yandex (Яндекс Маркет), Megamarket (СберМегаМаркет), AliExpress, Avito, Lamoda, Magnit (Магнит Маркет), Leroy (Леман ПРО/Леруа Мерлен), SimaLand, Webasyst, InSales, WooCommerce, Tilda, OpenCart, Moysklad, 1C, CSBIS (SABY), Takealot, MVideo (М.Видео), Uzum, DetskiyMir (Детский мир), Amazon.

### Схемы работы (enum `scheme`)
FBO, FBS, Express (EDBS/realFBS Express), DBS, realFBS, hybrid_DBS, DBW (Delivery by Marketplace/со своего склада), DBM, B2B (юридические лица), Wholesale (опт), Retail (розница).

### Статусы заказа (enum)
Внутренние (до отгрузки, не передаются на МП): `New`, `On_Assembly`, `Assembled`, `Sent` (+ служебный `In_Purchase`).
После отгрузки (синхронизируются с МП): `In_Transit`, `Sold`, `Completed`, `Canceled`, `Canceled_by_Client`, `Returned`, `Ready_for_Pickup`, `Lost`.
Отображение `Label` меняет статус МП на «Ожидает доставки».

### Статусы FBO-заказа/поставки (enum)
`New` → `Assembled` → `Packed` → `Ready_for_Supply` → `Shipped` → `Closed` (+ `Returned`).

### Статусы товара на складе FBS (enum)
`Created`, `In_Stock`, `Lost`, `Reserved`, `Shipped`, `Removed`.

### Жизненный цикл карточки (enum)
`Actual`, `Not_Actual`, `Archived`, `Deleted`. (Удаление — только при отсутствии связей; иначе архив.)

### Тип товара SelSup (enum)
`Product`, `Digital` (Цифровой), `Kit` (Комплект), `Service`.

### Стратегия остатков (enum)
`same_if_not_one` (одинаковые если не 1 шт.), `same` (одинаковые), `split_by_sales` (разделение по продажам — платно).

### Системы налогообложения (enum)
`USN_Income` (УСН Доходы), `USN_Income_Expenses` (УСН Доходы−Расходы), `OSNO`. НДС: `vat_out`, `vat_in` (для ОСНО).

### Типы операций маркетплейса (enum, Profit Report)
`sale`, `return`, `logistics`, `commission`, `spp`, `fine`, `surcharge`, `service`, `other_accrual`, `storage`, `advertising`, `paid_reception`, `withholding`, `advance_payment`.

### Статусы кода маркировки (enum)
`Created`, `Received`, `Applied` (Нанесён), `In_Turnover` (Введён в оборот), `Withdrawn` (Выведен из оборота), `Transferred`, `Written_off`, `Left`, `Erroneous`.
Правила перехода: ввод → «Нанесён»; вывод — только из «В обороте»; возврат — из «Выведен из оборота». Срок вывода: 3 рабочих дня (FBS) или 30 календарных дней.

### Типы маркировочных документов (enum)
`Input_In_Turnover`, `Withdraw_From_Turnover`, `Cancel_Code`, `Return_To_Turnover`, `UPD`, `UPD_DOP`, `Application_Report`.

### Способы эмиссии/выпуска кода (enum)
`Production`, `Import`, `Marking_Residues`, `Remarketing` (Перемаркировка), `Commission_From_Individual`.

### Типы коробов WB (enum)
`mix` (Микс), `mono` (Моно), `mono_pallet` (Моно-паллет), `supersafe` (Суперсейф), `qr_box`, `preliminary` (предварительный Ozon), `pvz` (WB-TRBX).

### Типы этикеток (enum)
`product` (товарная), `marking` (КИЗ), `box_barcode` (ШК короба), `storage_cell` (ячейка), `order_wb/ozon/yandex/megamarket`, `order_funnel_58x40`, `order_funnel_75x120`, `supply`, `supply_barcode`, `videofix`, `dbs_order`, `a4`, `storage_label` (хранения).

### Виды штрихкодов (enum)
EAN-13, EAN-8, Code 128, QR Code, Data Matrix, GS1 Data Matrix.

### Статусы фоновой задачи / события (enum)
`Queued`, `Running`, `Completed`, `Error`, `Interrupting`, `Interrupted_Stopped`.

### Статусы задачи сотрудника (enum)
`To_Work` (В работу), `In_Work`, `For_Review` (На проверку), `Resolved`. Приоритеты: `very_urgent`, `not_urgent`, `medium`.

### Статусы AI-задачи (enum)
`Open`, `In_Progress`, `Done`.

### Статусы рекламной кампании (enum)
`deleting`, `ready_to_launch`, `completed`, `canceled`, `showing`, `paused`.

### Приоритеты обращения в поддержку (enum) + SLA
`Critical` (ответ ≤30 мин, обработка ≤4 раб. ч), `Significant` (≤1 раб. ч / ≤8 раб. ч), `Medium` (≤4 раб. ч / ≤1 раб. день), `Minor` (≤4 раб. ч / ≤2 раб. дня). Рабочее время МСК: будни 05:00–00:00, сб 09:00–21:00, вс/праздники 09:00–18:00.

### Роли пользователей (enum)
Администратор, Менеджер товаров, Оператор, Рекламщик/аналитик, Закупщик, Сотрудник склада, Контент-менеджер, Просмотр карточек, Консультант, Управление ценами.

### Способы генерации штрихкода (enum)
`HonestSign`, `GS1RUS`, `Marketplace`, `Range`, `Manual`.

### Типы регулярного обмена (enum)
`Email_IMAP`, `Email_XLS`, `Excel_URL`, `YML`, `JSON_API_Core`.

### Справочники
- `ColorDict` (цвета), `CurrencyDict` (RUB/BYN/...), `CountryDict` (страны производства), `PackagingTypeDict` (типы упаковки WB: Короб/Монопаллета/Суперсейф/Поштучная паллета + коэффициенты складов WB).

---

## Примечания для реализации БД

### Общая архитектура
1. **Multi-tenant через `account_id`** на каждой таблице; индекс по `(account_id, ...)` обязателен. Все сущности изолированы по аккаунту, кроме глобальных справочников (`ColorDict`, `CurrencyDict`).
2. **Реляционная БД** (PostgreSQL) для основной модели; jsonb-колонки — для вариативных параметров (`ParameterValue.value`, `Subscription.limits`, `Integration.credentials`, `Job.tariffs`, `Price.actual_marketplace_costs`), т.к. состав полей зависит от маркетплейса/тарифа.
3. **Сырые операции** (`MarketplaceOperation`) — append-only, индекс по `(organization_id, marketplace, date)`; агрегаты P&L/юнит-экономики пересчитываются по триггерам/ночным джобам и кэшируются в материализованных представлениях.
4. **Очередь фоновых задач** — отдельная подсистема (`BackgroundTask`): SelSup ежеминутно обновляет данные и обменивается с МП; статусы в очереди поддерживают прерывание.

### Уникальность и матчинг
5. **Уникальный ключ товара** в рамках организации: комбинация `(organization_id, unification_article, color_article, size)` или `barcode`. Глобальная настройка `allow_duplicate_barcodes_across_orgs` разрешает дубли ШК между организациями (внутри одной — уникальны).
6. **Матчинг при импорте**: сначала по штрихкоду, затем по артикулу маркетплейса; правило «не создавать дубль, а обновить связь». Конфликты идентификаторов (разный ID 1С, разные непустые ID одного МП) блокируют объединение.
7. **SKU** — нельзя вставлять произвольные значения (только копировать существующие); пустой SKU при загрузке → возврат исходного.

### Учёт остатков и себестоимости
8. **Партионный учёт**: каждая приёмка создаёт `Batch` + `StockItem` с уникальным ID; история операций (`StockOperationHistory`) ведётся по `stock_item_id`. FIFO/FEFO — списание по ранним партиям/ранним срокам годности.
9. **Три режима себестоимости** (переключатель в настройках аналитики): классический FIFO (через приёмки), упрощённый FIFO (без склада — цена из карточки на момент обработки), FIFO выключен (последняя себестоимость с пересчётом всей истории).
10. **Резерв/списание**: резерв создаётся автоматически при сохранении заказа в статусе «Новый»; списывается только при смене статуса или ночным списанием. Удаление/восстановление отгруженного заказа не возвращает резерв — нужно создавать новый.
11. **Отрицательные остатки не используются** — при уменьшении ниже нуля ставится 0. Для передачи нуля нужна история остатка (приёмка/инвентаризация ≥1).

### Трансформация отправляемого остатка/цены
12. **Порядок применения трансформаций остатка** при отправке на МП: мин/макс пороги → «уменьшать остаток на» → порог FBO (Умный склад). Отрицательная рекомендация → 0.
13. **Минимальная цена** — только снижение (повысить нельзя). WB: отправляется скидка (целое число, округление вниз), не цена; «Со скидкой новая расчётная» может отличаться от желаемой.

### Интеграции и идемпотентность
14. **API-ключи шифруются AES-256**; хранить в `Integration.credentials` (зашифрованный jsonb). Токены имеют срок действия (особенно WB) — нужен механизм ротации + уведомления `InvalidTokenNotification`.
15. **Идемпотентность импорта заказов** по `external_number` + `marketplace`; перезагрузка за неделю для разрешения коллизий. FBO-поставки Ozon/Яндекс/МегаМаркет — внутренние (через API не создаются); статусы SelSup ↔ МП не связаны автоматически (кроме Ozon до таймслота).
16. **Раздельные очереди WB** для карточек (с лимитом 1000/день) и фото; rich-контент WB через API недоступен; видео WB передаётся вместе с фото.

### История и аудит
17. **История изменений карточек** включается тумблером (`GlobalSetting`); хранит snapshot + `restorable`. История отправки остатков — 3 месяца. Аудит действий сотрудников (`AuditLog`) — для контроля KPI.
18. **Мягкое удаление** (`deleted_at`) для Organization/Product; каскадное удаление только администратором с подтверждением кодом из email; восстановление через тумблер «Удалённые». Удаление элемента адресного хранения с остатками запрещено.

### Производительность и лимиты
19. **Тарифные лимиты**: `max_organizations`, `max_products`, `max_employees`, `max_warehouses`, `storage_bytes`. Хранилище: фото по ссылкам не расходуют объём — только загруженные в SelSup.
20. **Суточный лимит WB** на создание новых карточек (1000/день); редактирование существующих без лимита. Регулярный обмен — ≥30 мин (кроме тарифа Бизнес); защита от массового обнуления (>50% артикулов).
21. **Глубина аналитики по API** — 3 месяца (базовый тариф); WB «Джем» — вся история; Ozon Премиум — 6 мес, Премиум Плюс — вся история. Финансовые данные обновляются: WB — раз в неделю/день, Ozon — раз в месяц, Яндекс — раз в неделю.

### Валидация и бизнес-правила
22. **Обязательные поля для отправки на МП**: бренд, страна производства, цены (со/без скидки), габариты и вес, категория (со связью с категорией МП — иначе комиссия = 0). Запрещённые символы в параметрах: `!@#$%^&*"№;%:?*+`.
23. **GTIN** должен начинаться с 2 или 4; GTIN без первой цифры = EAN-13. Для Честного Знака обязателен ИНН производителя (совпадает с ЭЦП).
24. **Формулы прибыли**: Валовая прибыль = Итого к оплате − Себестоимость − Самовыкупы; Чистая прибыль = Валовая − (Налог + НДС) − Прочие расходы. Налог считается от «Выручки после СПП»; для УСН Д-Р — большее из основного и минимального (1%).
25. **Процент выкупа** — разные формулы по МП: WB = Выкупы/(Выкупы+Отмены); Ozon = Невозвращённые/Все заказы (по отправлениям); остальные = Завершённые/(Завершённые+Возвраты+Отмены).

### Версионирование и миграции
26. **Габариты фиксируются при первом импорте** и не обновляются автоматически (только вручную); категория товара также фиксируется при создании. Нужен механизм отката при массовом редактировании через Excel (undo отсутствует — тестировать на одной карточке).
27. **API SelSup** — отдельный контракт для модуля 1С (расширение `.cfe`); реализует функционал SelSup, не работает напрямую с МП. Поддержка версий API и обратной совместимости с конфигурациями 1С (УНФ/КА/УТ/БП/ERP/Розница).

