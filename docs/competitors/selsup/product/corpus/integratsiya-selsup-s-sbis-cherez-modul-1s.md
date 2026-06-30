---
title: 'Интеграция SelSup с СБИС (SABY)'
slug: integratsiya-selsup-s-sbis-cherez-modul-1s
source: https://selsup.ru/help/integratsiya-selsup-s-sbis-cherez-modul-1s/
chars: 4183
---

# Интеграция SelSup с СБИС (SABY)

Интеграция с СБИС позволяет автоматизировать обмен остатками между вашей учётной системой и маркетплейсами. Благодаря модулю 1С и настройке в SelSup, вы сможете исключить ручную работу и сократить ошибки.

В этой статье:

- 
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#dobavlenie-skladov" rel="nofollow">Добавление складов</a>
- <a href="#import-tovarov-i-sinhronizatsiya-ostatkov-iz-sbis-v-selsup" rel="nofollow">Импорт товаров и синхронизация остатков из СБИС в SelSup</a>
- <a href="#ruchnoe-sopostavlenie-tovarov" rel="nofollow">Ручное сопоставление товаров</a>

## Настройка интеграции

1.**В SelSup:**

- Перейдите в раздел [**Интеграция с 1С**](https://selsup.ru/application/integration/1c).
- Скопируйте **адрес сайта, логин и пароль** из SelSup (они понадобятся для настройки в СБИС).

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_166.png.webp)

2\. **В СБИС:**

- Откройте модуль **1С** → раздел **Интеграция**.
- Введите данные из Селсап (адрес, логин, пароль).
- Сохраните настройки.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Добавление складов

Для корректной работы необходимо указать идентификаторы складов из СБИС в SelSup:

1.Перейдите в SelSup в раздел [Склад → Склады](https://selsup.ru/application/warehouses/)

2.Создайте столько же складов, сколько используется в СБИС.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_167.png.webp)

3\. Укажите для каждого склада соответствующий **идентификатор из СБИС.** Как найти идентификатор склада:

- При выгрузке остатков из СБИС будет [сформирован XML-файл](https://selsup.ru/application/integration/1c/files) (например, `offers0_1.xml`)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_168.png.webp)![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_169.png.webp)

- Найдите в нём строки вида:

> Всё, что в кавычках после `ИдСклада` — это и есть нужный идентификатор.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Импорт товаров и синхронизация остатков из СБИС в SelSup

Чтобы корректно импортировать товары из СБИС в SelSup, необходимо выполнить следующие настройки:

**1.Заполните поле «Артикул» в карточке товара в СБИС**\
Это поле обязательно для успешного создания карточки в SelSup.

- Артикул может совпадать с полем «Код», но важно, чтобы именно поле **«Артикул»** было заполнено.
- Если поле не указано, импорт завершится с ошибкой.

**2.Настройте теги на странице интеграции с 1С в SelSup**

Перейдите в раздел [интеграции](https://selsup.ru/application/integration/1c) с 1С и укажите:

- Тег для артикула модели
- Тег для артикула товара
- 

1.  

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_378.png.webp)

**3. Запустите синхронизацию остатков**

После добавления складов:

- В СБИС запустите массовую выгрузку товаров во внешний сервис
- В выпадающем списке выберите SelSup

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_170.png.webp)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_171.png.webp)![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/06/screenshot_172.png.webp)

В результате будет выполнено массовое сопоставление товаров между СБИС и SelSup. Обмен будет происходить автоматически по расписанию — данные по остаткам начнут поступать в SelSup.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Ручное сопоставление товаров

Если требуется точечная синхронизация:

- В карточке товара в СБИС нажмите **Выгрузить → Внешний сервис → Селсап**.
- Сопоставление происходит по артикулу (значения должны полностью совпадать в СБИС и Селсап).

 

**Хотите быть в курсе новых функций? **Подписывайтесь на наш <a href="https://t.me/SelSup_ru" rel="noopener noreferrer" target="_blank"><strong>Telegram-канал.</strong></a>
