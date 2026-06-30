---
title: 'Интеграция с Avito'
slug: integratsiya-s-avito
source: https://selsup.ru/help/integratsiya-s-avito/
chars: 4758
---

# Интеграция с Avito

В этой статье расскажем вам, как настроить интеграцию с Avito, а также какие особенности и возможности есть при интеграции SelSup с Avito.

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

В этой статье:

- 
- <a href="#osobennosti-integratsii" rel="nofollow">Особенности интеграции</a>
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#udalenie-integratsii" rel="nofollow">Удаление интеграции</a>
- <a href="#udalenie-organizatsii" rel="nofollow">Удаление организации</a>
- <a href="#vse-vozmozhnosti-integratsii-s-avito" rel="nofollow">Все возможности интеграции с Авито</a>

## Особенности интеграции

Интеграция с Avito является дополнительной настройкой, которая оплачивается отдельно от вашего основного тарифа. В течение первых 7 дней вы можете бесплатно протестировать интеграцию с Avito.

В типовой версии Селсап функционал подтверждения заказов для Авито и передача маркировки не реализованы. Это дополнительные возможности, которые могут быть разработаны по запросу.

Что касается печати этикеток для заказов с Авито, на данный момент эта функция также недоступна, поскольку не поддерживается самим API Авито. Мы будем следить за обновлениями в API и, как только появится возможность для реализации печати этикеток, немедленно добавим этот функционал в систему.

**Важно**: остатки на Avito обновляются по API по Avito ID. Feed (YML) для обновления остатков не используется.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции

Чтобы работать с заказами Avito через SelSup, подтвердите свой ИНН через службу технической поддержки Avito. Если ИНН уже подтверждён, переходите к интеграции.

Чтобы использовать API авито - нужен кабинет Авито Pro (платный тариф авито)

**Шаг 1.** Авторизуйтесь в личном кабинете Avito Pro.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/lk-avito-pro.png.webp)

**Шаг 2.** Перейдите в SelSup  – раздел [«Настройки - Интеграции»](https://selsup.ru/application/integration/) **-\> «Avito»** и нажмите кнопку **«Попробовать 7 дней бесплатно»**, затем в этом же поле нажмите **«Настроить»**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_193.png.webp)

**Шаг 3.** На странице с интеграцией включите переключатель **«Работать с Авито»**  и перейдите по ссылке в личный кабинет Avito:\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/rabotat-s-avito-1.png.webp)

Перейдя по ссылке в личном кабинете Avito, вы увидите: **Client ID** — логин и **Client_secret** — пароль для входа.\
**Client ID** — служит идентификатором при настройке и интеграции, **Client_secret** — пароль.

 

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/kopirovat-login-i-parol.png.webp)\
**Шаг 4.** Скопируйте данные и вставьте в SelSup: **Client ID** в поле **«Идентификатор»**, а **Client_secret** в поле **«Пароль»**. Нажмите кнопку **«Подключить»**.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/podkluchit.png.webp)

**Шаг 5.** Заполните контактные данные: контактное лицо, адрес и контактный телефон.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/kontaktnie-dannie.png.webp)

**Настройка интеграции завершена.**

*По завершению интеграции во вкладке **Интеграции с маркетплейсом/сервисом** вместо кнопки **"Настроить"** вы увидите кнопку **"Уже настроено"** — это означает, что по всем вашим организациям интеграция с этим маркетплейсом/сервисом настроена.*\
*Либо кнопку **"Частично настроено"** — это значит, что интеграция настроена, но не со всеми организациями, добавленными в SelSup. Нажмите на кнопку и проверьте, с какими организациями интеграция еще не настроена.*

Следующий шаг — [перенос карточек товаров из Avito в Selsup.](../import-kratochek-s-avito/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление интеграции

Как удалить интеграцию с сервисами и маркетплейсами, рассказано [тут](../udalenie-klyucha-api/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление организации

Как удалить организацию из SelSup рассказали [здесь](../kak-udalit-organizatsiyu/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Все возможности интеграции с Авито

Если вам интересно узнать обо всех возможностях, читайте [здесь.](../vozmozhnosti-integratsii-s-avito/index.html)

Статью с возможными ошибками в интеграции с сервисами читайте [здесь](../vozmozhnye-oshibki-v-integratsii-s-servisami/index.html).
