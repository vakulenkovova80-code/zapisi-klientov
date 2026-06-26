# План: расширение «мини-CRM» (база клиентов, рассылка, свободное время)

> Расширение существующего PWA «Записи клиентов». Стиль — тот же нежно-розовый.
> Процесс: TDD для логики, проверка/ревью каждого шага.

**Goal:** Превратить приложение в рабочий инструмент: полноценная база клиентов
(добавление напрямую, телефон, источник «откуда», заметка, поиск,
редактирование), рассылка по клиентам (WhatsApp по очереди + копирование
номеров/текста), и календарь со свободным временем в рамках рабочих часов.

**Решения пользователя:** рассылка — оба варианта (WhatsApp-кнопки + копирование);
рабочие часы по умолчанию 8:00–22:00 (редактируются в настройках).

---

## Изменения модели данных

**client** (доп. поля, обратносовместимо):
```js
{ id, name, contact, source: string, note: string }   // source — «откуда», note — заметка
```

**appointment** (доп. поле):
```js
{ ..., durationMinutes: number }   // по умолчанию 60
```

**meta** — НОВОЕ хранилище (keyPath `key`) для настроек приложения:
```js
{ key: 'workHours', value: { start: '08:00', end: '22:00' } }
```
DB_VERSION: 1 → 2 (upgrade добавляет стор `meta`, существующие данные сохраняются).

**Источники клиента (datalist):** Instagram, TikTok, Telegram, Рекомендация,
Реклама, Вывеска/прохожий, Постоянный (+ свободный ввод).

---

## Задачи

### E1: Слой данных (поля, meta-стор, бэкап)
**Files:** `src/db/db.js`, `src/db/clients.js`, `src/db/appointments.js`, `src/db/meta.js` (new), `src/lib/backup.js`, тесты рядом.

- `db.js`: DB_VERSION=2; в `upgrade` добавить `meta` (keyPath 'key'), не ломая существующие сторы (guard через `contains`).
- `meta.js`: `getMeta(key, fallback)`, `setMeta(key, value)`. Тесты.
- `clients.js`: `addClient`/`updateClient` принимают и сохраняют `source` (default '') и `note` (default ''). Обновить тесты.
- `appointments.js`: `normalize` добавляет `durationMinutes: Number(data.durationMinutes) || 60`; `updateAppointment` приводит `durationMinutes` к числу, если есть в patch. Тесты.
- `backup.js`: `buildBackup` включает `meta` (getAll из стора); VERSION=2; `restoreBackup` принимает версии 1 и 2 (meta опционально, по умолчанию []), очищает/пишет и стор `meta`. Тесты (включая совместимость со старой v1-структурой без meta).

### E2: Чистая логика (свободные слоты, рассылка)
**Files:** `src/lib/slots.js` (new), `src/lib/broadcast.js` (new), тесты.

- `slots.js`: `computeFreeSlots(appointments, workStart, workEnd)` где workStart/end — 'HH:MM'. Из каждой записи берём локальные минуты начала (`new Date(datetime)` → getHours*60+getMinutes) и конец = старт+durationMinutes; обрезаем по рабочему окну; мёржим пересечения занятого; возвращаем `{ busy: [{start,end}], free: [{start,end}] }`, где start/end — строки 'HH:MM'. (Предполагается, что переданные записи уже относятся к одному дню.) Тесты: пустой день → весь интервал свободен; одна запись делит на две части; пересекающиеся записи мёржатся; запись за пределами окна игнорируется/обрезается.
- `broadcast.js`: `waLink(contact, text)` → `https://wa.me/<digits>?text=<encodeURIComponent>` или null если телефон невалиден (<10 цифр); `numbersText(clients)` → номера через `\n` (только валидные). Тесты.

### E3: База клиентов (форма + экран)
**Files:** `src/App.jsx` (расширить overlay), `src/components/ClientForm.jsx` (new), `src/components/ClientsView.jsx`, `src/styles.css`.

- `App.jsx`: добавить режимы overlay: `client-new`, `client-edit` (id), `broadcast`. Рендерить `ClientForm` (props: id|null, onSaved, onCancel) и `BroadcastView` (props: onClose). Передать в `ClientsView` новые props: `onAddClient`, `onEditClient(id)`, `onBroadcast`, плюс существующий `onOpen`.
- `ClientForm.jsx`: поля имя/телефон/источник(datalist)/заметка; загрузка по id (getClient) при edit; сохранение addClient/updateClient; стиль как у AppointmentForm (overlay-head + form).
- `ClientsView.jsx`: header с кнопками «＋ Клиент» и «✉️ Рассылка»; поле поиска (фильтр по имени, регистронезависимо); строка клиента показывает источник; кнопка «Изменить» (→ onEditClient); раскрытие истории визитов (как сейчас). Пустое состояние.

### E4: Рассылка
**Files:** `src/components/BroadcastView.jsx` (new), `src/styles.css`.

- Загрузка клиентов; выпадающий фильтр по источнику («Все» + найденные источники); чекбоксы выбора (по умолчанию выбраны все видимые); textarea сообщения; список выбранных с кнопкой «WhatsApp» (waLink, только у кого валидный телефон); кнопки «Скопировать номера» (numbersText) и «Скопировать текст» (navigator.clipboard). Props: onClose. Overlay-стиль.

### E5: Длительность записи + рабочие часы
**Files:** `src/components/AppointmentForm.jsx`, `src/components/SettingsView.jsx`, `src/lib/ics.js` (использовать durationMinutes), `src/styles.css`.

- `AppointmentForm`: поле «Длительность, мин» (number, по умолчанию 60); сохранять в durationMinutes; в `buildICS` передавать durationMinutes вместо 60.
- `SettingsView`: секция «Рабочие часы» — два `<input type="time">` (начало/конец), загрузка через getMeta('workHours', {start:'08:00',end:'22:00'}), сохранение setMeta при изменении; onChanged.

### E6: Свободное время в календаре
**Files:** `src/components/CalendarView.jsx`, `src/styles.css`.

- Загрузить рабочие часы (getMeta('workHours', default 08:00–22:00)).
- Для выбранного дня: взять его записи, вызвать `computeFreeSlots`, показать под списком блок «🟢 Свободно: 8:00–11:00, 12:30–22:00» (и при желании занятость). Если день вне записей — весь рабочий интервал свободен.

### E7: Проверка
- `npm test` (все зелёное, включая новые), `npm run build`.
- Визуальная проверка ключевых экранов (клиенты+форма, рассылка, календарь со свободным временем, настройки рабочих часов).
- Коммит.

---

## Самопроверка плана
- Покрытие запросов пользователя: база клиентов с прямым добавлением/телефоном/источником/поиском/редактированием — E1,E3; рассылка (оба варианта) — E2,E4; календарь со свободным временем + рабочие часы — E1(meta),E2(slots),E5,E6. ✔
- Совместимость: DB upgrade аддитивный; backup принимает v1 и v2. ✔
- Офлайн сохраняется (без внешних ресурсов). ✔
