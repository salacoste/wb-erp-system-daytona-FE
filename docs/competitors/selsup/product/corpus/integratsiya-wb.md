---
title: 'Интеграция с Wildberries'
slug: integratsiya-wb
source: https://selsup.ru/help/integratsiya-wb/
chars: 6143
---

# Интеграция с Wildberries

В этой статье мы расскажем вам, как настроить интеграцию с Wildberries, а также рассмотрим особенности и возможности интеграции SelSup с Wildberries.\

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

\

В этой статье:

- 
- <a href="#osobennosti-integratsii" rel="nofollow">Особенности интеграции</a>
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#srok-dejstviya-klyucha-api" rel="nofollow">Срок действия ключа API</a>
- <a href="#import-kartochek-wildberries" rel="nofollow">Импорт карточек Wildberries</a>
- <a href="#udalenie-integratsii" rel="nofollow">Удаление интеграции</a>
- <a href="#udalenie-organizatsii" rel="nofollow">Удаление организации</a>
- <a href="#vse-vozmozhnosti-integratsii-s-wildberries" rel="nofollow">Все возможности интеграции с Wildberries</a>

## Особенности интеграции

\- SelSup позволяет синхронизировать каталоги товаров с маркетплейсом Wildberries, обновлять информацию о товарах, управлять описаниями, ценами, наличием и выполнять множество других операций, делая процесс добавления и редактирования товаров более удобным и эффективным.\
- Ключ API Wildberries имеет срок действия. Чтобы избежать ошибок, не забывайте своевременно его обновлять.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции

Настройка SelSup займет не более 5 минут.

**Шаг 1.** После регистрации перейдите в меню [**Настройки - Интеграции**](https://selsup.ru/application/integration/), затем  выберите Wildberries.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_182.png.webp)

**Шаг 2.** Включите переключатель **«Работать с маркетплейсом»**, выберите **организацию** и следуйте инструкции, указанной справа на странице, чтобы получить токен. Или переходите ниже к Шагу 3.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_195.png.webp)

**Шаг 3.** Перейдите в раздел <a href="https://seller.wildberries.ru/api-integrations" class="MuiTypography-root MuiTypography-inherit MuiLink-root MuiLink-underlineAlways css-1qmtpo7" rel="noopener" target="_blank">“Интеграции по API”</a> и нажмите кнопку **“Создать токен”**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/snimok-ekrana-2025-10-27-v-06.28.17.png.webp)

**Шаг 4.** Нажмите на вкладку **"Для интеграции вручную"**, укажите название нового токена, выберите тип токена:  **Персональный токен** и нажмите кнопку **"Создать токен"**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/image-2-1.png.webp)

**Шаг 5.** Нажмите кнопку «**Скопировать**». Cкопируйте ключ, вернитесь в [SelSup](https://selsup.ru/application/integration/) и вставьте его в соответствующее поле.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_343.png.webp)

Если при попытке сгенерировать токен возникла ошибка, это может означать, что ваш логин не является основным для аккаунта Wildberries. Выполните эти действия, используя основной логин. Если основной логин вам не принадлежит, обратитесь в официальную поддержку Wildberries, чтобы сменить основной логин.

Подключая API-ключ, Вы закрепляете его за текущим аккаунтом. При подключении того же магазина на другом аккаунте — он будет автоматически заблокирован. Перенос магазина с аккаунта на аккаунт возможен только при оплате подписки. Удаление API-ключа из кабинета не сделает его доступным для подключения на других аккаунтах.

*После завершения интеграции во вкладке [**«Интеграции»**](https://selsup.ru/application/integration/) вместо кнопки **"Настроить"** появится кнопка **"Уже настроено"**. Это означает, что интеграция успешно выполнена для всех ваших организаций.* *Если появляется кнопка **"Частично настроено"**, это значит, что интеграция выполнена не для всех организаций, добавленных в SelSup. Нажмите на эту кнопку, чтобы проверить, с какими организациями интеграция еще не настроена.*

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Срок действия ключа API

Обратите внимание, что ключ API имеет ограниченный срок действия. Регулярно обновляйте его, чтобы избежать ошибок. Если ключ просрочен, SelSup выдаст соответствующее уведомление.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/snimok-ekrana-2024-05-29-v-16.50.33.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Импорт карточек Wildberries

После подключения интеграции вы можете импортировать товары из Wildberries в SelSup. Для этого используйте раздел [Товары → Импорт товаров → Wildberries](https://selsup.ru/application/productsImport/wildberries).

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/chrome_hvayyulcwz-1024x643.png.webp)

Если вам нужно быстро загрузить только новые позиции, используйте **быстрый импорт**. В этом режиме SelSup импортирует только новые товары и не обновляет уже существующие.

Если вам нужно сразу получить полные полные данные по карточкам, используйте **обычный импорт**.

Подробнее о различиях между быстрым и обычным импортом **[читайте в нашей статье](../import-wildberries/index.html)** про импорт товаров из Wildberries.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление интеграции

Подробнее о том, как удалить интеграцию, читайте в этой [статье.](../udalenie-klyucha-api/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление организации

О том, как удалить организацию из SelSup, мы рассказали [здесь](../kak-udalit-organizatsiyu/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Все возможности интеграции с Wildberries

Если вы хотите узнать обо всех возможностях интеграции, прочитайте [здесь.](../integration-s-wildberries/index.html)

Подробнее об ошибках при интеграции с сервисами читайте [здесь](../vozmozhnye-oshibki-v-integratsii-s-servisami/index.html).
