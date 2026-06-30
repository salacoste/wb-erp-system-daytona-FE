---
title: 'Интеграция с Яндекс.Маркет'
slug: nastrojka-integratsii-s-yandeks-market
source: https://selsup.ru/help/nastrojka-integratsii-s-yandeks-market/
chars: 5456
---

# Интеграция с Яндекс.Маркет

В этой статье расскажем, как настроить интеграцию SelSup с Яндекс Маркетом, а также разберём её особенности и возможности.\

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

В этой статье:

- 
- <a href="#osobennosti-integratsii" rel="nofollow">Особенности интеграции</a>
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#nastrojka-integratsii-po-tokenu" rel="nofollow">Настройка интеграции по токену</a>
- <a href="#udalenie-integratsii" rel="nofollow">Удаление интеграции</a>
- <a href="#udalenie-organizatsii" rel="nofollow">Удаление организации</a>
- <a href="#vse-vozmozhnosti-integratsii-s-yandeks-marketom" rel="nofollow">Все возможности интеграции с Яндекс.Маркетом</a>

## Особенности интеграции

Для каждой схемы работы в Яндекс Маркете, FBS, FBO (также известная как FBY) и DBS, используется отдельный магазин. Для каждого такого магазина в SelSup нужна отдельная интеграция.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции

Перейдите в кабинет [Яндекс.Маркета](https://partner.market.yandex.ru/business/), раздел **Настройки — \> API и Модули → Интеграции.**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/8nn1rpibit-e1774417752342-1024x506.png.webp)

1\. Убедитесь, что в таблице «Интеграции магазинов» выбран нужный магазин с нужной схемой работы.

Если у вас магазин FBS, выбирайте магазин FBS. Если магазин FBO, выбирайте схему FBO. Если магазин Express (DBS/RFBS), выбирайте Express.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/nvidia_overlay_hedtloqagw-1024x374.png.webp)\
Важно выбрать магазин с **campaign ID** именно от нужного магазина и запомнить его схему работы.

2\. В Selsup, перейдите в [Настройки → Интеграции → Яндекс.Маркет.](https://selsup.ru/application/integration/yandex_market) Выберите схему работы на странице интеграции в SelSup, включив нужный переключатель.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_350.png.webp)\
Если магазин работает по схеме FBS, дополнительные переключатели включать не нужно.

3\. Скопируйте **номер кампании** и **ID кабинета** и вставьте в SelSup в настройки интеграции.

- **Номер кампании = *campaign_id***
- **ID кабинета = *businnes_id***

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/nvidia_overlay_mk1jve0ssy-1024x374.png.webp)

**Обратите внимание —** для интеграции между SelSup и Яндекс.Маркет необходимо быть авторизованным под учетной записью владельца аккаунта Яндекс.Маркет.

При авторизации под аккаунтом пользователя с правами администратора Яндекс.Маркет выдаст ошибку *«У вашего аккаунта нет нужного доступа (аккаунт должен быть Владелец или Администратор) для получения ключа API или неправильно указан ID кабинета или номер компании»*.

***![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_351.png.webp)***

Если у вас включена настройка «Базовая цена» в Яндекс.Маркете, то необходимо её включить и в SelSup. При включенной настройке, если цена меняется в одном магазине, то она меняется сразу во всех магазинах на Яндекс.Маркете.

Нажмите **«‎Сохранить»‎**, чтобы добавить интеграцию.

После завершения настройки во вкладке интеграции с маркетплейсом вместо кнопки «Настроить» вы увидите один из статусов:

**«Уже настроено»** — интеграция настроена для всех организаций.

**«Частично настроено»** — интеграция настроена не для всех организаций, добавленных в SelSup.

Нажмите на кнопку, чтобы проверить, для каких организаций интеграция ещё не настроена.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/2c9ivrmkoz.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции по токену

1\. Перейдите на страницу Настройки → API и Модули в личном кабинете Яндекс.Маркета и нажмите "Создать новый токен"

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_190-2.png.webp)

2\. Введите название токена и укажите права доступа Полное управление кабинетом:\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/snimok-ekrana-2024-11-19-v-18.00.48.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление интеграции

Чтобы удалить интеграцию с Яндекс.Маркет, перейдите в раздел [Настройки - Интеграции- Яндекс.Маркет](https://selsup.ru/application/integration/yandex_market) и нажмите кнопку **"Удалить"** под ID кабинета. Она удалит данные об интеграции, и интеграция работать не будет.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_352.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление организации

Как удалить организацию из SelSup рассказали [здесь](../kak-udalit-organizatsiyu/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Все возможности интеграции с Яндекс.Маркетом

Если вам интересно узнать обо всех возможностях - читайте [здесь.](../integratsiya-s-yandeks-market/index.html)

Статью с возможными ошибками в интеграции с сервисами читайте [здесь](../vozmozhnye-oshibki-v-integratsii-s-servisami/index.html).
