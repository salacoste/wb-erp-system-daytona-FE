---
title: 'Интеграция с Takealot'
slug: integratsiya-s-takealot
source: https://selsup.ru/help/integratsiya-s-takealot/
chars: 3097
---

# Интеграция с Takealot

В этой статье:

- 
- <a href="#vozmozhnosti-integratsii-s-takealot" rel="nofollow">Возможности интеграции с Takealot</a>
- <a href="#chto-poka-ne-podderzhivaetsya" rel="nofollow">Что пока не поддерживается</a>
- <a href="#peredacha-ostatkov-v-takealot" rel="nofollow">Передача остатков в Takealot</a>
- <a href="#kak-podklyuchit-integratsiyu-s-takealot" rel="nofollow">Как подключить интеграцию с Takealot</a>
- <a href="#kak-poluchit-api-klyuch-v-takealot" rel="nofollow">Как получить API-ключ в Takealot</a>
- <a href="#nastrojka-integratsii-v-selsup" rel="nofollow">Настройка интеграции в SelSup</a>

Интеграция SelSup с Takealot позволяет работать с товарами, заказами и остатками по складам.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Возможности интеграции с Takealot

На данный момент в интеграции доступны:

- импорт товаров из Takealot в SelSup;
- импорт заказов из Takealot в SelSup;
- передача остатков из SelSup в Takealot.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Что пока не поддерживается

На данный момент в интеграции не поддерживается:

- редактирование карточек товаров в SelSup с передачей изменений в Takealot;
- передача цен из SelSup в Takealot;
- обмен статусами заказов между SelSup и Takealot.

**Обратите внимание:** статусы заказов подтягиваются в SelSup только при импорте заказов из Takealot. Передача статусов заказов из SelSup в Takealot сейчас не выполняется.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Передача остатков в Takealot

Остатки передаются из SelSup в Takealot.

Для корректной передачи остатков настройте связь складов в SelSup. После настройки SelSup будет передавать остатки по связанным складам.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как подключить интеграцию с Takealot

Для подключения интеграции понадобится API-ключ из кабинета продавца Takealot.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Как получить API-ключ в Takealot

1.  Откройте кабинет продавца Takealot.
2.  Перейдите в раздел **API Integrations** и выберите **Seller API**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2026/04/takealot-api-key-step-3-authentication.jpg.webp)

1.  Откройте вкладку **Authentication**.
2.  Нажмите **Generate API Key**, если ключ ещё не создан.
3.  Скопируйте API-ключ и сохраните его.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2026/04/e7weak4sng-scaled.png.webp)

**Важно:** API-ключ может отображаться только один раз при создании. Скопируйте и сохраните его сразу после генерации.

Если API-ключ уже создан, используйте существующий ключ.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Настройка интеграции в SelSup

После получения API-ключа добавьте его в настройки интеграции Takealot в SelSup.

После подключения SelSup сможет импортировать товары и заказы из Takealot, а также передавать остатки по настроенным связям складов.
