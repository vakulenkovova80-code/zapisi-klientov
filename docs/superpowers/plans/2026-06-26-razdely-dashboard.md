# План: разделы + Главная + статистика/статусы/напоминания

> Расширение PWA «Записи клиентов». Цель — сделать приложение полноценным
> рабочим инструментом с чёткими разделами и богатым дизайном. Нежно-розовый стиль.

**Решения пользователя:** 6 разделов + Главная; добавить доход/статистику,
статусы записей, напоминания клиенту.

## Навигация (нижнее меню, 6 разделов)
1. 🏠 Главная — сводка дня (записи сегодня, свободное время сегодня, доход, счётчики)
2. 📋 Записи — список ближайших (как есть, + статусы)
3. 🗓 Календарь — с загруженностью дней + свободное время
4. 👥 Клиенты — база (＋Клиент, поиск, источник, история)
5. ✉️ Рассылка — отдельный раздел (вынести из Клиентов)
6. ⚙️ Настройки

## Модель данных
- appointment: `status` (default 'planned'). Значения: planned, confirmed, came, cancelled, no_show. Подписи/цвета — в общем модуле констант.

## Задачи

### F1: Данные и логика (TDD)
**Files:** `src/db/appointments.js`(normalize+status, update приведение), `src/lib/statuses.js`(new: STATUSES [{key,label,color}], helper), `src/lib/stats.js`(new), `src/lib/reminders.js`(new), тесты.
- `appointments.normalize`: `status: data.status || 'planned'`. updateAppointment: status проходит через обычный merge (строка, не число) — отдельной коэрции не нужно.
- `statuses.js`: массив статусов с key/label(ru)/color; `statusLabel(key)`, `statusColor(key)`.
- `stats.js`: чистые функции по массиву записей: `sumIncome(appts, {from,to}, {countStatuses})` — сумма price записей со статусом из набора (по умолчанию ['came']) в диапазоне дат; `countInRange`; `topService(appts)` → {name,count}; вспомогательные диапазоны `todayRange()/weekRange()/monthRange()` (локальные). TDD.
- `reminders.js`: `reminderText(appt)` → «Здравствуйте, {имя}! Напоминаю о записи {дата} в {время} на {услуга}. Ждём вас! 💗» (используй format.js). TDD на подстановку.

### F2: Навигация 6 разделов + Рассылка как раздел + заглушка Главной
**Files:** `src/components/BottomNav.jsx`, `src/App.jsx`, `src/components/BroadcastView.jsx`, `src/components/ClientsView.jsx`, `src/components/HomeView.jsx`(new), `src/styles.css`.
- BottomNav: 6 вкладок (home/upcoming/calendar/clients/broadcast/settings) с иконками и короткими подписями; компактно под 6 (меньше горизонтальный паддинг, размер иконки ~20px). Активная — роза.
- App: tab по умолчанию 'home'; рендер HomeView (home), UpcomingView (upcoming), CalendarView, ClientsView, BroadcastView (как обычный раздел — НЕ overlay), SettingsView. Overlay-режимы (записи/клиент) остаются.
- BroadcastView: адаптировать под раздел — заменить overlay-head на screen-head «Рассылка» (без onClose); работает как вкладка. (Логику выбора/копирования/WhatsApp сохранить.)
- ClientsView: убрать кнопку «✉️ Рассылка» из шапки (оставить «＋ Клиент»), т.к. рассылка теперь раздел.
- HomeView: пока заглушка (наполнит F3), чтобы build прошёл.

### F3: Главная (HomeView) — сводка дня + статистика
**Files:** `src/components/HomeView.jsx`, `src/styles.css`.
- Приветствие + сегодняшняя дата (formatDayTitle).
- Карточки-счётчики: доход сегодня (sumIncome came за сегодня), ожидается сегодня (planned+confirmed), записей сегодня (кол-во), всего клиентов.
- Доход за неделю и месяц (sumIncome за weekRange/monthRange).
- «Сегодня»: список записей сегодня (время/имя/услуга/цена/статус-бейдж), тап → onOpen.
- «Свободно сегодня»: computeFreeSlots(записи сегодня, рабочие часы из getMeta).
- Топ-услуга (topService) — небольшой блок.
- Props: onOpen (открыть запись), onNew (быстрая кнопка «＋ запись»).

### F4: Статусы записей + напоминание клиенту
**Files:** `src/components/AppointmentForm.jsx`, `src/components/AppointmentCard.jsx`, `src/components/UpcomingView.jsx`, `src/lib`(использовать statuses/reminders), `src/styles.css`.
- AppointmentForm: селект статуса (по умолчанию planned).
- AppointmentCard: показать статус (бейдж с цветом) + быстрая смена статуса (кнопки/селект → updateAppointment {status}); кнопка «🔔 Напомнить» → ссылка WhatsApp с reminderText (waLink из broadcast.js); если нет телефона — скрыть/пометить.
- UpcomingView и HomeView: маленький цветной бейдж статуса в строке записи.

### F5: Календарь — загруженность
**Files:** `src/components/CalendarView.jsx`, `src/styles.css`.
- В ячейке дня показать загруженность: число записей (маленький бейдж) ИЛИ интенсивность фона по количеству. Сохранить точку/выбор/свободное время.

### F6: Дизайн-полировка
**Files:** `src/styles.css` (+мелкие правки разметки при необходимости).
- Единый богатый вид: карточки-счётчики с мягкими градиентами/тенями, аккуратные заголовки разделов, бейджи статусов, компактная читаемая 6-вкладочная навигация. Тач-зоны ≥44px, контраст. Без внешних шрифтов (офлайн).

### F7: Проверка и передеплой
- `npx vitest run` + `npm run build`.
- Визуальная проверка всех разделов (Главная, Записи, Календарь загруженность, Клиенты, Рассылка-раздел, Настройки, статусы, напоминание).
- Merge в main; пересборка `GH_PAGES=1` и публикация в ветку gh-pages; проверить живой URL.

## Самопроверка плана
- 6 разделов + Главная ✔; рассылка как раздел ✔; календарь загруженности ✔; доход/статистика (F1 stats + F3) ✔; статусы (F1+F4) ✔; напоминания (F1 reminders + F4) ✔; дизайн (F6) ✔; передеплой (F7) ✔.
- Офлайн/без внешних шрифтов сохраняется. Данные модель аддитивна (status), бэкап не ломается.
