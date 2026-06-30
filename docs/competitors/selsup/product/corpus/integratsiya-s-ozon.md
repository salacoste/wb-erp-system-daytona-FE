---
title: 'Интеграция с Ozon'
slug: integratsiya-s-ozon
source: https://selsup.ru/help/integratsiya-s-ozon/
chars: 6215
---

# Интеграция с Ozon

В этой статье мы расскажем вам, как настроить интеграцию с Ozon, а также рассмотрим особенности и возможности интеграции SelSup с Ozon.

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

\

В этой статье:

- 
- <a href="#osobennosti-integratsii" rel="nofollow">Особенности интеграции</a>
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#integratsiya-ozon-performance" rel="nofollow">Интеграция Ozon Performance</a>
- <a href="#udalenie-integratsii" rel="nofollow">Удаление интеграции</a>
- <a href="#udalenie-organizatsii" rel="nofollow">Удаление организации</a>
- <a href="#vse-vozmozhnosti-integratsii-s-ozon" rel="nofollow">Все возможности интеграции с Ozon</a>

## Особенности интеграции

\- SelSup позволяет легко загружать товары на площадку Ozon, обновлять их описания, цены, наличие и другие параметры через удобный интерфейс.\
- SelSup автоматически синхронизирует заказы с маркетплейсом, что облегчает обработку заказов, управление доставкой и отслеживание статусов заказов.\
- Интеграция SelSup и Ozon позволяет автоматизировать многие рутинные задачи, такие как обновление информации о товарах, управление заказами и оптимизация процессов продаж.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции

Настройка SelSup займет не более 5 минут.

**Шаг 1.** Перейдите в [личный кабинет SelSup](https://selsup.ru/application/).

**Шаг 2.** Перейдите в раздел [Настройки - Интеграции.](https://selsup.ru/application/integration/) Выберите вкладку [Ozon](https://selsup.ru/application/integration/ozon) и нажмите кнопку **«Настроить».**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_184.png.webp)

**Шаг 3.** Включите переключатель **«Работать с маркетплейсом»**, выберите **организацию** и следуйте инструкции, указанной справа на странице, чтобы получить токен.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_345.png.webp)

**Шаг 4.** Скопируйте значение поля **«Client Id»** в личном кабинете Ozon, нажав кнопку **«Скопировать».\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/api0ozon.png.webp)Шаг 5.** Вставьте скопированный **Client Id** в поле **«Идентификатор клиента (Client Id)»** в личном кабинете SelSup.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_346.png.webp)\
**Шаг 6.** Вернитесь в личный кабинет Ozon, нажмите кнопку **"Сгенерировать ключ".**\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/kluch.png.webp)**Шаг 7.** На открывшейся вкладке генерации ключа введите его название, для удобства рекомендуем вводить название ключа - "SelSup".

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/generaciya-klucha.png.webp)\
**Шаг 8.**  Далее необходимо указать **Тип токена**, для интеграции выберите тип токена **"Admin"** и нажмите **"Сгенерировать"**.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/admin-kluch.png.webp)\
***Ключ доступа создан,*** скопируйте его, нажав на соответствующую кнопку копирования.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/kluch-sozdan-1.png.webp)\
**Шаг 9.** Вернитесь на страницу интеграции в личным кабинете SelSup. Вставьте скопированный ключ доступа в  поле «**Ключ API**» и нажмите **«Сохранить».**\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_347.png.webp)\
**Поздравляем! Интеграция с Ozon успешно завершена!**

*По завершению интеграции во вкладке интеграции с маркетплейсом/сервисом вместо кнопки "Настроить" Вы увидите кнопку **"Уже настроено"** - она значит, что по всем вашим организациям интеграция с этим маркетплейсом/сервисом настроена. Либо кнопку **"Частично настроено"** - она значит, что интеграция настроена, но не со всеми организациями, добавленными в SelSup. Нажмите на кнопку и проверьте с какими организациями интеграция еще не настроена.*

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Интеграция Ozon Performance

Чтобы отслеживать расходы на рекламу Ozon потоварно, нужно настроить интеграцию с Оzon Performance.

Вот пошаговая инструкция:

1.  **Получение API-ключей в личном кабинете Ozon**:

- Перейдите в раздел ["Настройки" → "API-ключи"](https://seller.ozon.ru/app/settings/api-keys)

- Выберите "Performance API". Если нет аккаунта, нажмите Создать аккаунт.

- Нажмите "Добавить ключ" для нужного аккаунта

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_12.png.webp)

- Скопируйте два параметра: client_id и client_secret

2.  **Настройка интеграции в SelSup**:

- Откройте раздел ["Настройки" → "Интеграции"](https://selsup.ru/application/integration/ozon)

- Найдите блок "Ozon Performance"

- Вставьте скопированные ключи в соответствующие поля и нажмите "Подключить"

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_13.png.webp)

Подробнее о работе с отчетом "Товарная аналитика" рассказали в [статье.](../tovarnaya-analitika/index.html)

О разделе "Реклама" в SelSup, для чего он нужен и какими функциями обладает, рассказали [тут](../reklama/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление интеграции

Как удалить интеграцию с сервисами и маркетплейсами рассказали [тут](../udalenie-klyucha-api/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление организации

Как удалить организацию из SelSup рассказали [здесь](../kak-udalit-organizatsiyu/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Все возможности интеграции с Ozon

Если вам интересно узнать обо всех возможностях - читайте [здесь.](../vozmozhnosti-integratsii-s-ozon/index.html)

Возможные ошибки в интеграции с Ozon читайте [здесь.](../vozmozhnye-oshibki-v-integratsii-s-servisami/index.html)
