---
title: 'Импорт товаров из Ozon'
slug: kak-importirovat-kartochki-tovarov-s-ozon
source: https://selsup.ru/help/kak-importirovat-kartochki-tovarov-s-ozon/
chars: 15002
---

# Импорт товаров из Ozon

В этой статье подробно расскажем, как импортировать карточки товаров из Ozon в SelSup.

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

В этой статье:

- 
- <a href="#kak-importiruyutsya-tovary-s-ozon" rel="nofollow">Как импортируются товары с Ozon</a>
- <a href="#nastrojki-importa" rel="nofollow">Настройки импорта</a>
- <a href="#avtomaticheski-importirovat-tovary-nochyu" rel="nofollow">Автоматически импортировать товары ночью</a>
- <a href="#import-tolko-vidimyh-kartochek" rel="nofollow">Импорт только видимых карточек</a>
- <a href="#ne-obedinyat-kartochki-po-tsvetam-i-razmeram" rel="nofollow">Не объединять карточки по цветам и размерам</a>
- <a href="#obnovlyat-gabarity-i-ves-pri-importe" rel="nofollow">Обновлять габариты и вес при импорте</a>
- <a href="#import-tovarov-s-opredelennogo-sklada-v-ozon" rel="nofollow">Импорт товаров с определенного склада в Ozon</a>
- <a href="#brend-dlya-importa" rel="nofollow">Бренд для импорта</a>
- <a href="#bystryj-import" rel="nofollow">Быстрый импорт</a>
- <a href="#osobennosti-importa-iz-ozon" rel="nofollow">Особенности импорта из Ozon</a>
- <a href="#import-tovarov" rel="nofollow">Импорт товаров</a>
- <a href="#kak-massovo-obnovit-fotografii-tovarov-iz-ozon" rel="nofollow">Как массово обновить фотографии товаров из Ozon</a>
- <a href="#vozmozhnye-oshibki-importa" rel="nofollow">Возможные ошибки импорта</a>

## Как импортируются товары с Ozon

[В этой статье](../kak-selsup-importiruet-kartochki-s-ozon/index.html) подробно описали, как происходит импорт товаров из Ozon в SelSup.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройки импорта

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_nvjguk5ehq.png.webp)

Перед импортом товаров с Ozon важно ознакомиться с настройками, определить, какие из них вам нужны, выбрать эти параметры и только затем начинать импорт.

1.  Чтобы перейти к настройкам импорта, зайдите в раздел [Товары - Импорт товаров](https://selsup.ru/application/productsImport/) и нажмите вкладку **Ozon**.
2.  Выберите организацию, для которой импортируются товары (если у вас в SelSup только одна организация, выбирать ничего не нужно).
3.  Выберите производителя, который будет указан у всех импортированных товаров. Если это не нужно, можно не выбирать.

**Выбор производителя обязателен, если для товара требуется маркировка.** Без указания производителя корректная передача данных для маркировки невозможна.

4.  Ознакомьтесь с настройками импорта и укажите необходимые. О каждой настройке подробнее расскажем ниже:

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Автоматически импортировать товары ночью

Если вы планируете создавать новые товары и обновлять уже существующие карточки из маркетплейса, включите функцию автоматического импорта товаров ночью на странице импорта товаров. Эта функция автоматически запускает импорт каждую ночь, обновляя данные в уже созданных товарах и добавляя новые товары, как при ручном импорте.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_nsyyzu1qqf.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Импорт только видимых карточек

Кнопка позволяет импортировать только те товары, которые доступны на маркетплейсе Ozon в данный момент — без архивных и завершенных позиций. Если эта функция вам необходима, включите соответствующий переключатель.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_dl7itu2ofe.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Не объединять карточки по цветам и размерам

Тумблер *«Не объединять карточки по цветам и размерам»* позволяет гибко настроить объединение карточек в SelSup, учитывая структуру артикула на Ozon.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_u0zqqau2xa.png.webp)

**Что произойдет при выключенном тумблере:** В поле артикула появится значение из параметра *«Объединять на одной карточке»*, и карточки в SelSup будут объединены аналогично их объединению на Ozon.

Если тумблер ***не включен***, при нажатии кнопки **Импортировать товары Ozon** откроется окно с выбором настроек, где можно выбрать:

- *Сохранить объединение товаров по размерам и цветам, как на Ozon при импорте в SelSup* (тумблер выключен).
- *Объединение товаров по цветам при сохранении артикулов Ozon в качестве артикула модели, а по размерам товары останутся объединенными* (тумблер включен).

Выберите нужный вариант. Тумблер либо включится, либо останется выключенным в зависимости от вашего выбора. Затем нажмите **Сохранить**.

**Что произойдет при включенном тумблере:** В поле *«Артикул для объединения в одну карточку»* у модели будет указан артикул Ozon, однако карточки не будут объединяться в SelSup, как это сделано на Ozon. На самом маркетплейсе никаких изменений не произойдет.

Если тумблер ***включен***, при нажатии на кнопку «Импортировать товары Ozon» также откроется окно с настройками. Нужная настройка будет выбрана автоматически, но рекомендуется проверить правильность выбора и нажать «Сохранить» для завершения.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nastroika-ozon.png.webp)

Обратите внимание, что данное окно отображается только один раз, чтобы Вы убедились в правильности выбора подходящих Вам настроек импорта товаров.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Обновлять габариты и вес при импорте

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_x1ztpx7atk.png.webp)

При включении данного тумблера **Selsup** будет автоматически обновлять габариты и вес товаров при импорте, если они отличаются от данных, указанных на маркетплейсе.

Рекомендуется включить эту настройку в следующих случаях:

- если вы изменяли габариты и вес товаров в личном кабинете маркетплейса;

- если данные в SelSup отличаются от актуальных параметров на площадке.

Включение опции поможет синхронизировать информацию и избежать расхождений в характеристиках товаров.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Импорт товаров с определенного склада в Ozon

Функция *«Импорт товаров с определенного склада»* позволяет импортировать только те товары, которые находятся на выбранном складе, зарегистрированном на Ozon.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_k0qek17a68.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Бренд для импорта

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/4flyvldudd.png.webp)

По умолчанию при импорте товаров в SelSup загружаются все товары из вашей библиотеки Ozon, включая товары всех брендов. Если вам нужно импортировать только товары определённых брендов, используйте поле **«Бренд для импорта»**.

Как использовать:

- Перейдите в раздел [Товары → Импорт товаров](https://selsup.ru/application/productsImport/) и выберите маркетплейс Ozon.
- В поле **«Бренд для импорта»** укажите название бренда так, как оно указано на Ozon.
- Нажмите **«Импортировать товары»**.

После запуска импорта в SelSup будут загружены только товары указанного бренда.

Подробнее вы можете прочитать [в нашей статье](../import/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Быстрый импорт

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/nvidia_overlay_02qezy2bdi.png.webp)

Включите тумблер **Быстрый импорт**, если вам нужно быстро загрузить новые товары. После включения SelSup будет импортировать только новые позиции, игнорируя уже существующие товары и не обновляя их.

Карточки создаются без заполненных параметров маркетплейса — это позволяет сократить время на первичную загрузку ассортимента. После быстрого импорта автоматически запускается фоновый процесс, который начинает подтягивать остальные параметры карточек. Этот этап требует больше времени, так как данные обрабатываются и загружаются поэтапно.

**Обратите внимание:** пока фоновый импорт не завершён, карточки, загруженные через быстрый импорт, нельзя редактировать или отправлять на маркетплейс. Необходимо дождаться окончания полной загрузки данных.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Ozon

**Объединение карточек:\**
Если в личном кабинете на Ozon в карточке товара заполнено поле **«Объединять на одной карточке»**, то в SelSup эта карточка импортируется тоже как объединённая. Основанием для объединения выступает артикула модели из Ozon.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_142.png.webp)

Карточка товара в интерфейсе SelSup, во вкладке [Товары](https://selsup.ru/application/products):

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_145.png.webp)

Excel-файл с карточками товаров:

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/artikul-v-tablitse.png.webp)

При объединении в SelSup в одной карточке товар будет представлен в разных цветах и размерах.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_146.png.webp)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_147.png.webp)

Пример карточки на Ozon с разделением по размерам и цветам:

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/tsveta-i-razmery-v-kartochke.png.webp)

**Цвет товара:\**
SelSup импортирует цвет, указанный в карточке товара на Ozon. Если в личном кабинете Ozon поле цвета пустое, то и в SelSup оно останется пустым.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_143.png.webp)

Поле «Цвет» в Excel-файле с карточками товара:

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/tsvet-v-tablitse.png.webp)\
**Размер товара:\**
Для товаров с размерами, например одежды или обуви, SelSup использует размеры и переносит их в поле «Размер».

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_141.png.webp)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/razmer-v-tablitse.png.webp)

**Если у товара нет размеров**, SelSup использует другие параметры, например, количество штук в упаковке для шоколада или аромат для шампуня. Если же дополнительных параметров нет, SelSup отображает в поле «Размер» артикул товара.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/batonchiki-v-ozon.png.webp)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/aromaty-v-ozon.png.webp)

В случае отсутствия размера в колонке «Размер» будет указан артикул товара. Это не ошибка, а принцип работы SelSup: поля «Артикул», «Размер» и «Цвет» в SelSup не дублируются, и в каждом столбце должно быть уникальное значение. На отображение товара на маркетплейсе это не влияет.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_144.png.webp)

Вы можете изменить этот принцип в настройках импорта, но тогда карточки товаров будут разделены в SelSup.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/artikul-razmer-i-tsvet-v-selsap.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Импорт товаров

После выбора необходимых настроек переходите к импорту товаров в SelSup:

1.  Перейдите в раздел [**Товары — Импорт товаров**](https://selsup.ru/application/productsImport/ozon), вкладка **Ozon**.
2.  Нажмите на кнопку **«Импортировать товары Ozon»**, чтобы запустить импорт.
3.  Результаты импорта отобразятся ниже. При возникновении ошибок они будут указаны в таблице «Ошибки импорта», где вы сможете просмотреть причины ошибок и внести необходимые исправления.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_45-1.png.webp)\
Импортированные товары отобразятся в разделе [**Товары**](https://selsup.ru/application/products) в таблице с товарами.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_36-1.png.webp)

Убедитесь, что импортированные товары объединились с карточками аналогичных товаров с других маркетплейсов.\
В таблице с товарами найдите импортированный товар и проверьте, что в столбце «Ссылки» отображаются значки всех маркетплейсов, включая Ozon. Нажав на значок, вы откроете карточку товара на соответствующем маркетплейсе.![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/tovari-obedenini.png.webp)\
Если карточки не объединены или объединение некорректное, выполните корректировку вручную. Подробнее про объединение карточек читайте [тут.](../merge/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как массово обновить фотографии товаров из Ozon

Способ обновления зависит от того, как сейчас загружены изображения в SelSup.

**Способ 1: Если в карточках товаров фото загружены ссылками из Ozon**

- Если вы обновили изображения в личном кабинете Ozon, просто **запустите стандартный "Импорт товаров с Ozon"**.

- Система автоматически обновит все данные, включая актуальные ссылки на фотографии.

**Способ 2: Если в карточках товаров фото загружены файлами в SelSup**

- Чтобы заменить их на актуальные изображения из Ozon, перейдите в раздел **"Настройки" -** [**"Мои организации"**](https://selsup.ru/application/organizations/).

- Нажмите на кнопку **"Заменить изображения на ссылки из Ozon"**.

- После этого все фотографии в карточках товаров будут массово обновлены на текущие из вашего кабинета Ozon.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/05/screenshot_41-1.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Возможные ошибки импорта

Если вы столкнулись с проблемами при импорте товаров, ознакомьтесь с этой [статьей](../vozmozhnye-oshibki-pri-importe-kartochek-iz-marketplejsov/index.html).

Полная инструкция по интеграции с Ozon представлена [тут](../vozmozhnosti-integratsii-s-ozon/index.html).

Следите за обновлениями программы в нашем [Телеграмм канале](https://t.me/SelSup_ru) и на сайте в разделе [«Новости SelSup»](https://selsup.ru/news/). Читайте [блог](https://selsup.ru/news-mp/) — там много полезных статей.
