---
title: 'Импорт товаров в Selsup'
slug: import
source: https://selsup.ru/help/import/
chars: 9656
---

# Импорт товаров в Selsup

В этой статье:

- 
- <a href="#obshhaya-instruktsiya-po-importu-tovarov" rel="nofollow">Общая инструкция по импорту товаров</a>
- <a href="#obnovlenie-parametrov-selsup-pri-importe-s-marketplejsov" rel="nofollow">Обновление параметров SelSup при импорте с маркетплейсов</a>
- <a href="#import-tovarov-po-brendu" rel="nofollow">Импорт товаров по бренду</a>
- <a href="#bystryj-import" rel="nofollow">Быстрый импорт</a>
- <a href="#osobennosti-importa-iz-wildberries" rel="nofollow">Особенности импорта из Wildberries</a>
- <a href="#osobennosti-importa-iz-ozon" rel="nofollow">Особенности импорта из Ozon</a>
- <a href="#osobennosti-importa-iz-yandeks-market" rel="nofollow">Особенности импорта из Яндекс Маркет</a>
- <a href="#osobennosti-importa-iz-megamarketa" rel="nofollow">Особенности импорта из Мегамаркета</a>
- <a href="#osobennosti-importa-iz-aliexpress" rel="nofollow">Особенности импорта из Aliexpress</a>
- <a href="#osobennosti-importa-iz-avito" rel="nofollow">Особенности импорта из Avito</a>
- <a href="#osobennosti-importa-iz-lemana-pro-lerua" rel="nofollow">Особенности импорта из Лемана ПРО (Леруа)</a>
- <a href="#osobennosti-importa-iz-chestnogo-znaka" rel="nofollow">Особенности импорта из Честного знака</a>
- <a href="#osobennosti-importa-iz-mojsklad" rel="nofollow">Особенности импорта из МойСклад</a>
- <a href="#osobennosti-importa-iz-webasyst" rel="nofollow">Особенности импорта из Webasyst</a>
- <a href="#osobennosti-importa-iz-yml-fajlov" rel="nofollow">Особенности импорта из YML файлов</a>

## Общая инструкция по импорту товаров

Чтобы импортировать товары в Selsup из других маркетплейсов откройте раздел [Товары - Импорт товаров](https://selsup.ru/application/productsImport/).

Откроется окно импорта товаров, в котором нужно выбрать интересующий Вас сервис для импорта.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_82.png.webp)

Если вы вели нормальный учет товаров и использовали на всех маркетплейсах одинаковые артикулы или баркоды, то переход на Selsup у вас будет максимально быстрый. Импортируйте карточки изо всех маркетплейсов и они объединяться в одну карточку в Selsup.\
Если вы использовали разные артикулы и баркоды, то нужно будет объединить товары между маркетплейсами на [странице](https://selsup.ru/application/productsImport/merge/). Подробнее про объединение читайте [здесь](../merge/index.html).

Также если вы планируете создавать новые товары и обновлять уже существующие карточки из маркетплейса, в SelSup есть полезная функция, благодарю которой не нужно запускать Импорт товаров снова, чтобы обновить параметры карточек и добавить в SelSup только что созданные.\
Вы можете включить кнопку **«Автоматически импортировать товары ночью»** на странице импорта товаров, которая каждую ночь будет автоматически запускать Импорт товаров обновляя данные в ранее созданных товарах, и создавая новые товары, как обычный ручной импорт.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/screenshot_83.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Обновление параметров SelSup при импорте с маркетплейсов

При импорте данных с маркетплейсов **автоматически не обновляются** внутренние параметры SelSup, например **Название** или **Описание**.

Это значит, что ваше внутреннее название останется прежним, даже если на маркетплейсе оно было изменено.

**Как обновить название вручную:**

1.  **В карточке товара:** Просто скопируйте название из пришедшего параметра (например, «Название_WB») в основное поле «Название».

2.  **Через Excel:** Выгрузите товары, массово скопируйте данные из колонки с названием с площадки в колонку с вашим названием и загрузите файл обратно.

Ознакомьтесь с инструкциями по особенностям импорта с каждой площадкой.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Импорт товаров по бренду

По умолчанию при импорте товаров с маркетплейсов в SelSup загружаются все товары из вашей библиотеки, включая товары всех брендов. Если вам нужно импортировать в SelSup только товары определённых брендов, используйте поле **«Бренд для импорта»**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/image-15.png.webp)

Как использовать:

- Перейдите в раздел [Товары → Импорт товаров](https://selsup.ru/application/productsImport/) и выберите нужный маркетплейс.
- В поле **«Бренд для импорта»** скопируйте название бренда.
- Нажмите **«Импортировать товары»**.

На данный момент эта возможность доступна для **Ozon**, **Wildberries** и **Яндекс.Маркета**.

Название бренда нужно указывать **точно так же, как на маркетплейсе** — с учётом регистра, пробелов и специальных символов. Рекомендуем скопировать его напрямую из личного кабинета маркетплейса.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/ab4g5rfphb-1024x373.png.webp)

После запуска импорта в SelSup будут загружены **только товары указанного бренда**. В карточках товаров бренд также проставится автоматически — так же, как на маркетплейсе.

Это удобно, например, если по отдельным брендам у вас действуют особые условия работы, подписан NDA или вы не хотите, чтобы SelSup получал к ним доступ и вносил по ним изменения.

**Обратите внимание:** если вы хотите сами контролировать, какие товары загружаются в SelSup, отключите опцию **«Автоматически импортировать товары ночью»** в настройках импорта для нужной организации и маркетплейса.

Тогда SelSup не будет автоматически импортировать все товары ночью, и вы сможете запускать импорт вручную только для тех брендов, которые вам нужны.

Подробнее о работе с брендами и создании новых вы можете прочитать [в нашей статье](../dobavlenie-brendov/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Быстрый импорт

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/03/znjn5pdhqe.png.webp)

Включите тумблер **Быстрый импорт**, если вам нужно быстро загрузить новые товары. После включения SelSup будет импортировать только новые позиции, игнорируя уже существующие товары и не обновляя их.

Карточки создаются без заполненных параметров маркетплейса — это позволяет сократить время на первичную загрузку ассортимента. После быстрого импорта автоматически запускается фоновый процесс, который начинает подтягивать остальные параметры карточек. Этот этап требует больше времени, так как данные обрабатываются и загружаются поэтапно.

**Обратите внимание:** пока фоновый импорт не завершён, карточки, загруженные через быстрый импорт, нельзя редактировать или отправлять на маркетплейс.

Необходимо дождаться окончания полной загрузки данных.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Wildberries

Про особенности и порядок импорта карточек с Вайлдберриз читайте в отдельной [статье](../import-wildberries/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Ozon

Нажмите [ссылку](../kak-importirovat-kartochki-tovarov-s-ozon/index.html), чтобы узнать, как переносить карточки товаров с Озон.

Следите за обновлениями программы в нашем [Телеграмм канале](https://t.me/SelSup_ru) и на сайте в разделе [«Новости SelSup»](https://selsup.ru/news/). Читайте [блог](https://selsup.ru/news-mp/) – там много полезных статей. 

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Яндекс Маркет

Узнайте об особенностях и порядке импорта карточек с **Яндекс Маркета** в отдельной [статье](../import-kartochek-s-yandeks-marketa/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Мегамаркета

Как импортировать карточки с МегаМаркета в SelSup рассказали [здесь](../import-kartochek-s-megamarketa/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Aliexpress

Как перенести карточки товаров с **AliExpress** — читайте в [инструкции](../import-kartochek-s-aliexpress/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Avito

Нажмите [ссылку](../import-kratochek-s-avito/index.html), чтобы узнать, как импортировать товары с Avito.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Лемана ПРО (Леруа)

Все о переносе карточек с **Лемана ПРО** – в нашей [статье](../import-tovarov-iz-lerua-merlen/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Честного знака

Подробности о работе с **Честным Знаком** и импорте товаров — по [ссылке](../import-kartochek-iz-chestnogo-znaka/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из МойСклад

Как интегрировать данные с **МойСклад** – инструкция [внутри](../import-kartochek-s-moj-sklad/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из Webasyst

Импорт товаров из **Webasyst**: [порядок действий и особенности](../import-tovarov-iz-webasyst/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Особенности импорта из YML файлов

Читайте [статью](../import-tovarov-iz-yml-fajlov/index.html), чтобы узнать, как импортировать товары из **YML-файлов**.

 

**[На главную страницу по настройке SelSup.](../s-chego-nachat/index.html)**
