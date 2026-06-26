# План реализации: приложение «Записи клиентов»

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA на React, в которой мастер по макияжу/причёскам ведёт записи клиентов; всё хранится локально в телефоне, работает офлайн, ставится на экран «Домой», не зависит от компьютера владельца после публикации.

**Architecture:** Чистый клиент без сервера. Слой данных — IndexedDB (через `idb`) с тремя хранилищами: `appointments`, `clients`, `services`. Логика (CRUD, бэкап, генерация .ics, форматирование) покрыта unit-тестами на Vitest + `fake-indexeddb`. UI — React-компоненты с навигацией снизу; проверяются запуском в браузере. PWA-обвязка через `vite-plugin-pwa`. Деплой — статический хостинг (Netlify).

**Tech Stack:** Vite, React 18, `idb`, `vite-plugin-pwa`, Vitest, `fake-indexeddb`, `@testing-library/react` (точечно).

---

## Соглашения по данным (используются во всех задачах)

ID везде — `crypto.randomUUID()` (строка).

**service** (хранилище `services`, keyPath `id`):
```js
{ id: string, name: string, price: number }
```

**client** (хранилище `clients`, keyPath `id`):
```js
{ id: string, name: string, contact: string }   // contact — телефон или ссылка
```

**appointment** (хранилище `appointments`, keyPath `id`, индексы: `datetime`, `clientId`):
```js
{
  id: string,
  clientId: string | null,   // связь с клиентом, если есть
  clientName: string,
  contact: string,
  datetime: string,          // ISO-строка, напр. "2026-06-26T14:30:00.000Z"
  serviceName: string,
  price: number,
  note: string,
  photos: Blob[]             // фото результата
}
```

**Структура файлов:**
```
package.json, vite.config.js, vitest.config.js, index.html
public/manifest подключается через vite-plugin-pwa
public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
src/
  main.jsx                — точка входа, регистрация PWA
  App.jsx                 — оболочка + переключение экранов + нижняя навигация
  db/db.js                — открытие IndexedDB, схема, миграции
  db/services.js          — CRUD услуг
  db/clients.js           — CRUD клиентов
  db/appointments.js      — CRUD записей
  lib/format.js           — форматирование дат/времени/цены (ru)
  lib/backup.js           — экспорт/импорт резервной копии
  lib/ics.js              — генерация события календаря (.ics)
  components/BottomNav.jsx
  components/UpcomingView.jsx
  components/CalendarView.jsx
  components/AppointmentForm.jsx
  components/AppointmentCard.jsx
  components/ClientsView.jsx
  components/SettingsView.jsx
  styles.css
tests/  (рядом с кодом: *.test.js)
```

---

### Task 1: Каркас проекта (Vite + React + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`, `.gitignore` (обновить)

- [ ] **Step 1: Инициализировать проект и зависимости**

Run:
```bash
npm init -y
npm install react react-dom idb
npm install -D vite @vitejs/plugin-react vitest jsdom fake-indexeddb @testing-library/react @testing-library/jest-dom vite-plugin-pwa
```

- [ ] **Step 2: Создать `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Записи клиентов',
        short_name: 'Записи',
        description: 'Учёт записей клиентов на макияж и причёски',
        lang: 'ru',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#c98ba0',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
```

- [ ] **Step 3: Создать `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
})
```

- [ ] **Step 4: Создать `tests/setup.js`**

```js
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Создать `index.html`**

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <title>Записи клиентов</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Создать `src/main.jsx`**

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

- [ ] **Step 7: Создать минимальный `src/App.jsx`**

```jsx
export default function App() {
  return <div className="app">Записи клиентов</div>
}
```

- [ ] **Step 8: Создать `src/styles.css` (заготовка)**

```css
:root { --accent: #c98ba0; --bg: #faf7f8; --text: #2b2ب2b; }
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: #2b2b2b; }
.app { max-width: 600px; margin: 0 auto; padding: 16px 16px 88px; }
```
(Примечание: убедиться, что `--text` валиден — заменить на `#2b2b2b`.)

- [ ] **Step 9: Добавить npm-скрипты в `package.json`**

В секцию `"scripts"`:
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 10: Обновить `.gitignore`**

Добавить строки:
```
node_modules
dist
dist-ssr
.DS_Store
```

- [ ] **Step 11: Проверить, что dev-сервер и тест-раннер запускаются**

Run: `npm run build`
Expected: сборка проходит без ошибок (создаётся `dist/`). Иконок ещё нет — если сборка падает из-за отсутствующих иконок, временно убрать `includeAssets`/иконки и вернуть в Task 14.

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat: каркас проекта Vite + React + Vitest + PWA"
```

---

### Task 2: Форматирование (lib/format.js)

**Files:**
- Create: `src/lib/format.js`, `src/lib/format.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/lib/format.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { formatPrice, formatTime, formatDate, formatDayTitle } from './format.js'

describe('format', () => {
  it('форматирует цену в рублях', () => {
    expect(formatPrice(1500)).toBe('1 500 ₽')
    expect(formatPrice(0)).toBe('0 ₽')
  })
  it('форматирует время ЧЧ:ММ', () => {
    expect(formatTime('2026-06-26T14:30:00')).toBe('14:30')
  })
  it('форматирует дату как «26 июня»', () => {
    expect(formatDate('2026-06-26T14:30:00')).toBe('26 июня')
  })
  it('заголовок дня содержит число и месяц', () => {
    expect(formatDayTitle('2026-06-26T14:30:00')).toContain('26')
    expect(formatDayTitle('2026-06-26T14:30:00')).toContain('июня')
  })
})
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npm test -- format`
Expected: FAIL (модуль/функции не найдены).

- [ ] **Step 3: Реализовать `src/lib/format.js`**

```js
const MONTHS = ['января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря']
const WEEKDAYS = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']

export function formatPrice(n) {
  const num = Number(n) || 0
  return num.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'
}

export function formatTime(iso) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatDayTitle(iso) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`
}
```

- [ ] **Step 4: Запустить тест — убедиться, что проходит**

Run: `npm test -- format`
Expected: PASS. (Если `toLocaleString` в среде даёт обычные пробелы — тест всё равно пройдёт благодаря `replace`.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js && git commit -m "feat: форматирование дат/времени/цены"
```

---

### Task 3: База данных + CRUD услуг (db/db.js, db/services.js)

**Files:**
- Create: `src/db/db.js`, `src/db/services.js`, `src/db/services.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/db/services.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { listServices, addService, updateService, deleteService } from './services.js'
import { _resetDB } from './db.js'

beforeEach(async () => { await _resetDB() })

describe('services CRUD', () => {
  it('добавляет и возвращает услуги, отсортированные по имени', async () => {
    await addService({ name: 'Причёска', price: 2000 })
    await addService({ name: 'Макияж', price: 1500 })
    const list = await listServices()
    expect(list.map(s => s.name)).toEqual(['Макияж', 'Причёска'])
  })
  it('обновляет услугу', async () => {
    const id = await addService({ name: 'Макияж', price: 1500 })
    await updateService(id, { name: 'Макияж', price: 1800 })
    const list = await listServices()
    expect(list[0].price).toBe(1800)
  })
  it('удаляет услугу', async () => {
    const id = await addService({ name: 'Макияж', price: 1500 })
    await deleteService(id)
    expect(await listServices()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- services`
Expected: FAIL (модулей нет).

- [ ] **Step 3: Реализовать `src/db/db.js`**

```js
import { openDB, deleteDB } from 'idb'

const DB_NAME = 'zapisi-klientov'
const DB_VERSION = 1
let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('services')) {
          db.createObjectStore('services', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('appointments')) {
          const store = db.createObjectStore('appointments', { keyPath: 'id' })
          store.createIndex('datetime', 'datetime')
          store.createIndex('clientId', 'clientId')
        }
      }
    })
  }
  return dbPromise
}

// Только для тестов: пересоздать пустую базу.
export async function _resetDB() {
  if (dbPromise) { (await dbPromise).close(); dbPromise = null }
  await deleteDB(DB_NAME)
}
```

- [ ] **Step 4: Реализовать `src/db/services.js`**

```js
import { getDB } from './db.js'

export async function listServices() {
  const db = await getDB()
  const all = await db.getAll('services')
  return all.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export async function addService({ name, price }) {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.put('services', { id, name, price: Number(price) || 0 })
  return id
}

export async function updateService(id, { name, price }) {
  const db = await getDB()
  await db.put('services', { id, name, price: Number(price) || 0 })
}

export async function deleteService(id) {
  const db = await getDB()
  await db.delete('services', id)
}
```

- [ ] **Step 5: Запустить — убедиться, что проходит**

Run: `npm test -- services`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/db/db.js src/db/services.js src/db/services.test.js && git commit -m "feat: база IndexedDB и CRUD услуг"
```

---

### Task 4: CRUD клиентов (db/clients.js)

**Files:**
- Create: `src/db/clients.js`, `src/db/clients.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/db/clients.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { listClients, getClient, addClient, updateClient, deleteClient } from './clients.js'
import { _resetDB } from './db.js'

beforeEach(async () => { await _resetDB() })

describe('clients CRUD', () => {
  it('добавляет и читает клиента', async () => {
    const id = await addClient({ name: 'Аня', contact: '+79990001122' })
    const c = await getClient(id)
    expect(c.name).toBe('Аня')
    expect(c.contact).toBe('+79990001122')
  })
  it('список отсортирован по имени', async () => {
    await addClient({ name: 'Яна', contact: '' })
    await addClient({ name: 'Аня', contact: '' })
    const list = await listClients()
    expect(list.map(c => c.name)).toEqual(['Аня', 'Яна'])
  })
  it('обновляет и удаляет клиента', async () => {
    const id = await addClient({ name: 'Аня', contact: '' })
    await updateClient(id, { name: 'Анна', contact: '+7' })
    expect((await getClient(id)).name).toBe('Анна')
    await deleteClient(id)
    expect(await getClient(id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- clients`
Expected: FAIL.

- [ ] **Step 3: Реализовать `src/db/clients.js`**

```js
import { getDB } from './db.js'

export async function listClients() {
  const db = await getDB()
  const all = await db.getAll('clients')
  return all.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export async function getClient(id) {
  const db = await getDB()
  return db.get('clients', id)
}

export async function addClient({ name, contact = '' }) {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.put('clients', { id, name, contact })
  return id
}

export async function updateClient(id, { name, contact = '' }) {
  const db = await getDB()
  await db.put('clients', { id, name, contact })
}

export async function deleteClient(id) {
  const db = await getDB()
  await db.delete('clients', id)
}
```

- [ ] **Step 4: Запустить — убедиться, что проходит**

Run: `npm test -- clients`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/clients.js src/db/clients.test.js && git commit -m "feat: CRUD клиентов"
```

---

### Task 5: CRUD записей (db/appointments.js)

**Files:**
- Create: `src/db/appointments.js`, `src/db/appointments.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/db/appointments.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  addAppointment, getAppointment, updateAppointment,
  deleteAppointment, listAppointments, listUpcoming, listByClient
} from './appointments.js'
import { _resetDB } from './db.js'

beforeEach(async () => { await _resetDB() })

function base(overrides = {}) {
  return {
    clientId: null, clientName: 'Аня', contact: '+7',
    datetime: '2026-07-01T10:00:00.000Z', serviceName: 'Макияж',
    price: 1500, note: '', photos: [], ...overrides
  }
}

describe('appointments CRUD', () => {
  it('добавляет и читает запись', async () => {
    const id = await addAppointment(base())
    const a = await getAppointment(id)
    expect(a.clientName).toBe('Аня')
    expect(a.price).toBe(1500)
  })
  it('listAppointments сортирует по времени по возрастанию', async () => {
    await addAppointment(base({ datetime: '2026-07-02T10:00:00.000Z', clientName: 'B' }))
    await addAppointment(base({ datetime: '2026-07-01T10:00:00.000Z', clientName: 'A' }))
    const list = await listAppointments()
    expect(list.map(a => a.clientName)).toEqual(['A', 'B'])
  })
  it('listUpcoming возвращает только записи от указанной даты', async () => {
    await addAppointment(base({ datetime: '2026-07-01T10:00:00.000Z', clientName: 'past' }))
    await addAppointment(base({ datetime: '2026-07-10T10:00:00.000Z', clientName: 'future' }))
    const list = await listUpcoming('2026-07-05T00:00:00.000Z')
    expect(list.map(a => a.clientName)).toEqual(['future'])
  })
  it('listByClient фильтрует по clientId', async () => {
    await addAppointment(base({ clientId: 'c1', clientName: 'mine' }))
    await addAppointment(base({ clientId: 'c2', clientName: 'other' }))
    const list = await listByClient('c1')
    expect(list.map(a => a.clientName)).toEqual(['mine'])
  })
  it('обновляет и удаляет', async () => {
    const id = await addAppointment(base())
    await updateAppointment(id, { price: 2000 })
    expect((await getAppointment(id)).price).toBe(2000)
    await deleteAppointment(id)
    expect(await getAppointment(id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- appointments`
Expected: FAIL.

- [ ] **Step 3: Реализовать `src/db/appointments.js`**

```js
import { getDB } from './db.js'

function normalize(data) {
  return {
    clientId: data.clientId ?? null,
    clientName: data.clientName ?? '',
    contact: data.contact ?? '',
    datetime: data.datetime,
    serviceName: data.serviceName ?? '',
    price: Number(data.price) || 0,
    note: data.note ?? '',
    photos: data.photos ?? []
  }
}

export async function addAppointment(data) {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.put('appointments', { id, ...normalize(data) })
  return id
}

export async function getAppointment(id) {
  const db = await getDB()
  return db.get('appointments', id)
}

export async function updateAppointment(id, patch) {
  const db = await getDB()
  const existing = await db.get('appointments', id)
  if (!existing) return
  await db.put('appointments', { ...existing, ...patch, id })
}

export async function deleteAppointment(id) {
  const db = await getDB()
  await db.delete('appointments', id)
}

export async function listAppointments() {
  const db = await getDB()
  const all = await db.getAllFromIndex('appointments', 'datetime')
  return all // индекс уже даёт сортировку по datetime
}

export async function listUpcoming(fromISO) {
  const all = await listAppointments()
  return all.filter(a => a.datetime >= fromISO)
}

export async function listByClient(clientId) {
  const db = await getDB()
  return db.getAllFromIndex('appointments', 'clientId', clientId)
}
```

- [ ] **Step 4: Запустить — убедиться, что проходит**

Run: `npm test -- appointments`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/appointments.js src/db/appointments.test.js && git commit -m "feat: CRUD записей с индексами"
```

---

### Task 6: Резервная копия (lib/backup.js)

**Files:**
- Create: `src/lib/backup.js`, `src/lib/backup.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/lib/backup.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, restoreBackup } from './backup.js'
import { _resetDB } from '../db/db.js'
import { addService, listServices } from '../db/services.js'
import { addClient, listClients } from '../db/clients.js'
import { addAppointment, listAppointments } from '../db/appointments.js'

beforeEach(async () => { await _resetDB() })

describe('backup', () => {
  it('buildBackup собирает все данные с версией', async () => {
    await addService({ name: 'Макияж', price: 1500 })
    await addClient({ name: 'Аня', contact: '+7' })
    await addAppointment({ clientName: 'Аня', datetime: '2026-07-01T10:00:00.000Z', serviceName: 'Макияж', price: 1500, photos: [] })
    const data = await buildBackup()
    expect(data.version).toBe(1)
    expect(data.services).toHaveLength(1)
    expect(data.clients).toHaveLength(1)
    expect(data.appointments).toHaveLength(1)
  })

  it('фото сериализуются в base64 и восстанавливаются в Blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    await addAppointment({ clientName: 'Аня', datetime: '2026-07-01T10:00:00.000Z', serviceName: 'Макияж', price: 1500, photos: [blob] })
    const data = await buildBackup()
    expect(typeof data.appointments[0].photos[0].data).toBe('string')

    await _resetDB()
    await restoreBackup(data)
    const list = await listAppointments()
    expect(list[0].photos[0]).toBeInstanceOf(Blob)
    expect(await list[0].photos[0].text()).toBe('hello')
  })

  it('restoreBackup заменяет существующие данные', async () => {
    await addService({ name: 'Старое', price: 1 })
    const data = { version: 1, services: [{ id: 'x', name: 'Новое', price: 2 }], clients: [], appointments: [] }
    await restoreBackup(data)
    const list = await listServices()
    expect(list.map(s => s.name)).toEqual(['Новое'])
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- backup`
Expected: FAIL.

- [ ] **Step 3: Реализовать `src/lib/backup.js`**

```js
import { getDB } from '../db/db.js'

const VERSION = 1

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64, type) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new Blob([bytes], { type })
}

export async function buildBackup() {
  const db = await getDB()
  const services = await db.getAll('services')
  const clients = await db.getAll('clients')
  const rawAppointments = await db.getAll('appointments')

  const appointments = await Promise.all(rawAppointments.map(async (a) => ({
    ...a,
    photos: await Promise.all((a.photos || []).map(async (b) => ({
      type: b.type || 'image/jpeg',
      data: await blobToBase64(b)
    })))
  })))

  return { version: VERSION, exportedAt: new Date().toISOString(), services, clients, appointments }
}

export async function restoreBackup(data) {
  const db = await getDB()
  const tx = db.transaction(['services', 'clients', 'appointments'], 'readwrite')
  await Promise.all([
    tx.objectStore('services').clear(),
    tx.objectStore('clients').clear(),
    tx.objectStore('appointments').clear()
  ])
  for (const s of data.services || []) tx.objectStore('services').put(s)
  for (const c of data.clients || []) tx.objectStore('clients').put(c)
  for (const a of data.appointments || []) {
    const photos = (a.photos || []).map(p => base64ToBlob(p.data, p.type))
    tx.objectStore('appointments').put({ ...a, photos })
  }
  await tx.done
}
```

- [ ] **Step 4: Запустить — убедиться, что проходит**

Run: `npm test -- backup`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backup.js src/lib/backup.test.js && git commit -m "feat: экспорт/импорт резервной копии с фото"
```

---

### Task 7: Событие календаря (lib/ics.js)

**Files:**
- Create: `src/lib/ics.js`, `src/lib/ics.test.js`

- [ ] **Step 1: Написать падающий тест**

`src/lib/ics.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { buildICS } from './ics.js'

describe('ics', () => {
  it('создаёт валидный VEVENT с заголовком и напоминанием', () => {
    const ics = buildICS({
      title: 'Аня — Макияж',
      startISO: '2026-07-01T10:00:00.000Z',
      durationMinutes: 60,
      note: 'без аллергий',
      reminderMinutes: 60
    })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:Аня — Макияж')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT60M')
    expect(ics).toContain('END:VCALENDAR')
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npm test -- ics`
Expected: FAIL.

- [ ] **Step 3: Реализовать `src/lib/ics.js`**

```js
function toICSDate(iso) {
  // -> 20260701T100000Z (UTC)
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICS({ title, startISO, durationMinutes = 60, note = '', reminderMinutes = 60 }) {
  const start = toICSDate(startISO)
  const end = toICSDate(new Date(new Date(startISO).getTime() + durationMinutes * 60000).toISOString())
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@zapisi`
  const stamp = toICSDate(new Date().toISOString())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//zapisi-klientov//RU',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(note)}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${reminderMinutes}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}

export function downloadICS(filename, icsString) {
  const blob = new Blob([icsString], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
```

- [ ] **Step 4: Запустить — убедиться, что проходит**

Run: `npm test -- ics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ics.js src/lib/ics.test.js && git commit -m "feat: генерация события .ics для Календаря iPhone"
```

---

### Task 8: Оболочка приложения и нижняя навигация (App.jsx, BottomNav.jsx)

**Files:**
- Modify: `src/App.jsx`
- Create: `src/components/BottomNav.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Создать `src/components/BottomNav.jsx`**

```jsx
const TABS = [
  { key: 'upcoming', label: 'Записи', icon: '📋' },
  { key: 'calendar', label: 'Календарь', icon: '🗓️' },
  { key: 'clients', label: 'Клиенты', icon: '👥' },
  { key: 'settings', label: 'Настройки', icon: '⚙️' }
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`nav-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Переписать `src/App.jsx` с переключением экранов**

```jsx
import { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import UpcomingView from './components/UpcomingView.jsx'
import CalendarView from './components/CalendarView.jsx'
import ClientsView from './components/ClientsView.jsx'
import SettingsView from './components/SettingsView.jsx'
import AppointmentForm from './components/AppointmentForm.jsx'
import AppointmentCard from './components/AppointmentCard.jsx'

export default function App() {
  const [tab, setTab] = useState('upcoming')
  // overlay: null | {mode:'new'} | {mode:'edit', id} | {mode:'view', id}
  const [overlay, setOverlay] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const reload = () => setRefresh(n => n + 1)

  const openNew = () => setOverlay({ mode: 'new' })
  const openView = (id) => setOverlay({ mode: 'view', id })
  const openEdit = (id) => setOverlay({ mode: 'edit', id })
  const closeOverlay = () => setOverlay(null)

  return (
    <div className="app">
      {tab === 'upcoming' && <UpcomingView key={refresh} onOpen={openView} onNew={openNew} />}
      {tab === 'calendar' && <CalendarView key={refresh} onOpen={openView} />}
      {tab === 'clients' && <ClientsView key={refresh} onOpen={openView} />}
      {tab === 'settings' && <SettingsView key={refresh} onChanged={reload} />}

      {overlay && (overlay.mode === 'new' || overlay.mode === 'edit') && (
        <AppointmentForm
          id={overlay.mode === 'edit' ? overlay.id : null}
          onSaved={() => { closeOverlay(); reload() }}
          onCancel={closeOverlay}
        />
      )}
      {overlay && overlay.mode === 'view' && (
        <AppointmentCard
          id={overlay.id}
          onEdit={() => openEdit(overlay.id)}
          onDeleted={() => { closeOverlay(); reload() }}
          onClose={closeOverlay}
        />
      )}

      {!overlay && <BottomNav active={tab} onChange={setTab} />}
    </div>
  )
}
```

- [ ] **Step 3: Добавить стили навигации в `src/styles.css`**

```css
.bottom-nav {
  position: fixed; left: 0; right: 0; bottom: 0;
  display: flex; justify-content: space-around;
  background: #fff; border-top: 1px solid #eee;
  padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
  max-width: 600px; margin: 0 auto;
}
.nav-item { background: none; border: none; display: flex; flex-direction: column;
  align-items: center; gap: 2px; font-size: 11px; color: #888; padding: 4px 10px; }
.nav-item.active { color: var(--accent); }
.nav-icon { font-size: 22px; }
button { cursor: pointer; }
```

- [ ] **Step 4: Создать пустые заглушки экранов, чтобы приложение собиралось**

Создать файлы с минимальным содержимым (будут заполнены в следующих задачах):
`src/components/UpcomingView.jsx`:
```jsx
export default function UpcomingView({ onNew }) {
  return <div><h1>Записи</h1><button onClick={onNew}>➕ Новая</button></div>
}
```
`src/components/CalendarView.jsx`:
```jsx
export default function CalendarView() { return <div><h1>Календарь</h1></div> }
```
`src/components/ClientsView.jsx`:
```jsx
export default function ClientsView() { return <div><h1>Клиенты</h1></div> }
```
`src/components/SettingsView.jsx`:
```jsx
export default function SettingsView() { return <div><h1>Настройки</h1></div> }
```
`src/components/AppointmentForm.jsx`:
```jsx
export default function AppointmentForm({ onCancel }) {
  return <div><h1>Запись</h1><button onClick={onCancel}>Отмена</button></div>
}
```
`src/components/AppointmentCard.jsx`:
```jsx
export default function AppointmentCard({ onClose }) {
  return <div><h1>Карточка</h1><button onClick={onClose}>Закрыть</button></div>
}
```

- [ ] **Step 5: Проверить в браузере**

Run: `npm run dev`
Expected: открывается приложение, внизу 4 вкладки, переключаются; кнопка «➕ Новая» открывает заглушку формы, «Отмена» закрывает.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: оболочка приложения и нижняя навигация"
```

---

### Task 9: Главный экран «Ближайшие записи» (UpcomingView.jsx)

**Files:**
- Modify: `src/components/UpcomingView.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/UpcomingView.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { listUpcoming } from '../db/appointments.js'
import { formatTime, formatDayTitle, formatPrice } from '../lib/format.js'

function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}

function groupByDay(items) {
  const groups = {}
  for (const a of items) {
    const key = a.datetime.slice(0, 10)
    ;(groups[key] = groups[key] || []).push(a)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export default function UpcomingView({ onOpen, onNew }) {
  const [items, setItems] = useState(null)
  useEffect(() => { listUpcoming(startOfToday()).then(setItems) }, [])

  const groups = items ? groupByDay(items) : []

  return (
    <div>
      <header className="screen-head">
        <h1>Ближайшие записи</h1>
      </header>

      {items && items.length === 0 && (
        <p className="empty">Записей пока нет. Нажмите «＋», чтобы добавить.</p>
      )}

      {groups.map(([day, list]) => (
        <section key={day} className="day-group">
          <h2 className="day-title">{formatDayTitle(list[0].datetime)}</h2>
          {list.map(a => (
            <button key={a.id} className="appt-row" onClick={() => onOpen(a.id)}>
              <span className="appt-time">{formatTime(a.datetime)}</span>
              <span className="appt-main">
                <span className="appt-name">{a.clientName}</span>
                <span className="appt-service">{a.serviceName}</span>
              </span>
              <span className="appt-price">{formatPrice(a.price)}</span>
            </button>
          ))}
        </section>
      ))}

      <button className="fab" onClick={onNew} aria-label="Новая запись">＋</button>
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили списка и кнопки «＋» в `src/styles.css`**

```css
.screen-head h1 { font-size: 22px; margin: 8px 0 16px; }
.empty { color: #999; text-align: center; margin-top: 40px; }
.day-title { font-size: 14px; color: var(--accent); margin: 18px 0 8px; }
.appt-row { width: 100%; display: flex; align-items: center; gap: 12px;
  background: #fff; border: none; border-radius: 14px; padding: 12px 14px;
  margin-bottom: 8px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.appt-time { font-weight: 600; font-size: 16px; min-width: 48px; }
.appt-main { display: flex; flex-direction: column; flex: 1; }
.appt-name { font-size: 16px; }
.appt-service { font-size: 13px; color: #888; }
.appt-price { font-weight: 600; color: #4a4a4a; }
.fab { position: fixed; right: 20px; bottom: 84px; width: 56px; height: 56px;
  border-radius: 50%; border: none; background: var(--accent); color: #fff;
  font-size: 28px; box-shadow: 0 4px 12px rgba(0,0,0,.2); max-width: none;
  display: flex; align-items: center; justify-content: center; }
```

- [ ] **Step 3: Проверить в браузере**

Run: `npm run dev`
Expected: на вкладке «Записи» — заголовок, пустое состояние, плавающая кнопка «＋». (Данные появятся после реализации формы — Task 10.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: главный экран ближайших записей"
```

---

### Task 10: Форма записи (AppointmentForm.jsx)

**Files:**
- Modify: `src/components/AppointmentForm.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/AppointmentForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { addAppointment, getAppointment, updateAppointment } from '../db/appointments.js'
import { listServices } from '../db/services.js'
import { listClients, addClient } from '../db/clients.js'
import { buildICS, downloadICS } from '../lib/ics.js'

function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function AppointmentForm({ id, onSaved, onCancel }) {
  const [clientName, setClientName] = useState('')
  const [contact, setContact] = useState('')
  const [datetimeLocal, setDatetimeLocal] = useState(toLocalInput(null))
  const [serviceName, setServiceName] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => { listServices().then(setServices) }, [])
  useEffect(() => {
    if (!id) return
    getAppointment(id).then(a => {
      if (!a) return
      setClientName(a.clientName); setContact(a.contact)
      setDatetimeLocal(toLocalInput(a.datetime)); setServiceName(a.serviceName)
      setPrice(String(a.price)); setNote(a.note); setPhotos(a.photos || [])
    })
  }, [id])

  const onPickService = (name) => {
    setServiceName(name)
    const s = services.find(x => x.name === name)
    if (s && !price) setPrice(String(s.price))
  }

  const onAddPhotos = (e) => {
    setPhotos(prev => [...prev, ...Array.from(e.target.files)])
  }

  const buildData = () => ({
    clientName, contact,
    datetime: new Date(datetimeLocal).toISOString(),
    serviceName, price: Number(price) || 0, note, photos
  })

  const save = async () => {
    if (!clientName.trim()) { alert('Введите имя клиента'); return }
    let clientId = null
    if (id) {
      await updateAppointment(id, buildData())
    } else {
      const clients = await listClients()
      const existing = clients.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase())
      clientId = existing ? existing.id : await addClient({ name: clientName.trim(), contact })
      await addAppointment({ ...buildData(), clientId })
    }
    onSaved()
  }

  const addToCalendar = () => {
    const ics = buildICS({
      title: `${clientName} — ${serviceName}`,
      startISO: new Date(datetimeLocal).toISOString(),
      durationMinutes: 60, note, reminderMinutes: 60
    })
    downloadICS('zapis.ics', ics)
  }

  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onCancel}>Отмена</button>
        <h2>{id ? 'Изменить запись' : 'Новая запись'}</h2>
        <button className="link primary" onClick={save}>Сохранить</button>
      </header>

      <div className="form">
        <label>Имя клиента
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Например, Аня" />
        </label>
        <label>Телефон / соцсеть
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="+7… или @ник" />
        </label>
        <label>Дата и время
          <input type="datetime-local" value={datetimeLocal} onChange={e => setDatetimeLocal(e.target.value)} />
        </label>
        <label>Услуга
          <input list="services-list" value={serviceName} onChange={e => onPickService(e.target.value)} placeholder="Макияж / Причёска" />
          <datalist id="services-list">
            {services.map(s => <option key={s.id} value={s.name} />)}
          </datalist>
        </label>
        <label>Цена, ₽
          <input type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label>Заметка
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Пожелания, аллергии…" />
        </label>
        <label>Фото результата
          <input type="file" accept="image/*" multiple onChange={onAddPhotos} />
        </label>
        {photos.length > 0 && (
          <div className="photo-row">
            {photos.map((p, i) => <img key={i} src={URL.createObjectURL(p)} alt="" />)}
          </div>
        )}

        <button className="btn-secondary" type="button" onClick={addToCalendar}>
          ➕ В Календарь iPhone (напоминание)
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили формы и оверлея в `src/styles.css`**

```css
.overlay { position: fixed; inset: 0; background: var(--bg); z-index: 10;
  max-width: 600px; margin: 0 auto; overflow-y: auto; padding-bottom: 40px; }
.overlay-head { display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; position: sticky; top: 0; background: var(--bg); }
.overlay-head h2 { font-size: 16px; margin: 0; }
.link { background: none; border: none; color: #888; font-size: 16px; }
.link.primary { color: var(--accent); font-weight: 600; }
.form { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #777; }
.form input, .form textarea { font-size: 16px; padding: 12px; border: 1px solid #e3dadd;
  border-radius: 10px; background: #fff; color: #2b2b2b; }
.photo-row { display: flex; gap: 8px; flex-wrap: wrap; }
.photo-row img { width: 72px; height: 72px; object-fit: cover; border-radius: 10px; }
.btn-secondary { padding: 14px; border: none; border-radius: 12px;
  background: #f0e4e8; color: var(--accent); font-size: 15px; font-weight: 600; }
```

- [ ] **Step 3: Проверить в браузере**

Run: `npm run dev`
Expected: «＋» → форма; заполнение и «Сохранить» → запись появляется на главном экране; повторное открытие как «view»→«Изменить» подтягивает данные; «В Календарь iPhone» скачивает .ics-файл (на iPhone он откроется в Календаре).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: форма создания/редактирования записи + добавление в календарь"
```

---

### Task 11: Карточка записи (AppointmentCard.jsx)

**Files:**
- Modify: `src/components/AppointmentCard.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/AppointmentCard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { getAppointment, deleteAppointment } from '../db/appointments.js'
import { formatDayTitle, formatTime, formatPrice } from '../lib/format.js'

function telHref(contact) {
  return /^[+\d][\d\s\-()]*$/.test(contact) ? `tel:${contact.replace(/[\s\-()]/g, '')}` : null
}
function waHref(contact) {
  const digits = contact.replace(/\D/g, '')
  return digits.length >= 10 ? `https://wa.me/${digits}` : null
}

export default function AppointmentCard({ id, onEdit, onDeleted, onClose }) {
  const [a, setA] = useState(null)
  useEffect(() => { getAppointment(id).then(setA) }, [id])
  if (!a) return null

  const tel = telHref(a.contact)
  const wa = waHref(a.contact)

  const remove = async () => {
    if (confirm('Удалить запись?')) { await deleteAppointment(id); onDeleted() }
  }

  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onClose}>Назад</button>
        <h2>Запись</h2>
        <button className="link primary" onClick={onEdit}>Изменить</button>
      </header>

      <div className="card-body">
        <h1 className="card-name">{a.clientName}</h1>
        <p className="card-when">{formatDayTitle(a.datetime)}, {formatTime(a.datetime)}</p>
        <div className="card-line"><span>Услуга</span><b>{a.serviceName || '—'}</b></div>
        <div className="card-line"><span>Цена</span><b>{formatPrice(a.price)}</b></div>
        {a.note && <p className="card-note">{a.note}</p>}

        {a.photos && a.photos.length > 0 && (
          <div className="photo-row">
            {a.photos.map((p, i) => <img key={i} src={URL.createObjectURL(p)} alt="" />)}
          </div>
        )}

        <div className="card-actions">
          {tel && <a className="btn-secondary" href={tel}>📞 Позвонить</a>}
          {wa && <a className="btn-secondary" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
        </div>

        <button className="btn-danger" onClick={remove}>Удалить запись</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили карточки в `src/styles.css`**

```css
.card-body { padding: 0 16px; }
.card-name { font-size: 24px; margin: 6px 0; }
.card-when { color: var(--accent); margin: 0 0 18px; }
.card-line { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
.card-line span { color: #888; }
.card-note { background: #fff; border-radius: 10px; padding: 12px; margin: 14px 0; }
.card-actions { display: flex; gap: 10px; margin: 18px 0; }
.card-actions .btn-secondary { flex: 1; text-align: center; text-decoration: none; }
.btn-danger { width: 100%; padding: 14px; border: none; border-radius: 12px;
  background: #fbeaea; color: #c0392b; font-size: 15px; font-weight: 600; margin-top: 10px; }
```

- [ ] **Step 3: Проверить в браузере**

Run: `npm run dev`
Expected: тап по записи → карточка с данными, фото, кнопками «Позвонить»/«WhatsApp» (если контакт похож на телефон); «Изменить» открывает форму; «Удалить» убирает запись из списка.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: карточка записи с действиями и удалением"
```

---

### Task 12: Календарь (CalendarView.jsx)

**Files:**
- Modify: `src/components/CalendarView.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/CalendarView.jsx`**

```jsx
import { useEffect, useMemo, useState } from 'react'
import { listAppointments } from '../db/appointments.js'
import { formatTime, formatPrice } from '../lib/format.js'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function ymd(d) { return d.toISOString().slice(0, 10) }

export default function CalendarView({ onOpen }) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(() => ymd(new Date()))

  useEffect(() => { listAppointments().then(setItems) }, [])

  const byDay = useMemo(() => {
    const m = {}
    for (const a of items) { const k = a.datetime.slice(0, 10); (m[k] = m[k] || []).push(a) }
    return m
  }, [items])

  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Пн=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const shift = (delta) => setCursor(new Date(year, month + delta, 1))
  const selectedList = (byDay[selected] || []).sort((a, b) => a.datetime.localeCompare(b.datetime))

  return (
    <div>
      <header className="cal-head">
        <button className="link" onClick={() => shift(-1)}>‹</button>
        <h1>{MONTHS[month]} {year}</h1>
        <button className="link" onClick={() => shift(1)}>›</button>
      </header>

      <div className="cal-grid">
        {WD.map(w => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />
          const key = ymd(d)
          const has = !!byDay[key]
          return (
            <button key={i}
              className={`cal-cell ${key === selected ? 'sel' : ''}`}
              onClick={() => setSelected(key)}>
              {d.getDate()}
              {has && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>

      <div className="cal-list">
        {selectedList.length === 0 && <p className="empty">В этот день записей нет</p>}
        {selectedList.map(a => (
          <button key={a.id} className="appt-row" onClick={() => onOpen(a.id)}>
            <span className="appt-time">{formatTime(a.datetime)}</span>
            <span className="appt-main">
              <span className="appt-name">{a.clientName}</span>
              <span className="appt-service">{a.serviceName}</span>
            </span>
            <span className="appt-price">{formatPrice(a.price)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили календаря в `src/styles.css`**

```css
.cal-head { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 12px; }
.cal-head h1 { font-size: 18px; margin: 0; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-wd { text-align: center; font-size: 11px; color: #aaa; padding-bottom: 4px; }
.cal-cell { aspect-ratio: 1; border: none; background: #fff; border-radius: 10px;
  font-size: 15px; position: relative; color: #2b2b2b; }
.cal-cell.empty { background: transparent; }
.cal-cell.sel { background: var(--accent); color: #fff; }
.cal-dot { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
.cal-cell.sel .cal-dot { background: #fff; }
.cal-list { margin-top: 18px; }
```

- [ ] **Step 3: Проверить в браузере**

Run: `npm run dev`
Expected: вкладка «Календарь» — сетка месяца, точки в днях с записями, переключение месяцев стрелками, тап по дню показывает его записи, тап по записи открывает карточку.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: экран календаря с записями по дням"
```

---

### Task 13: Клиенты и история визитов (ClientsView.jsx)

**Files:**
- Modify: `src/components/ClientsView.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/ClientsView.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { listClients } from '../db/clients.js'
import { listByClient } from '../db/appointments.js'
import { formatDate, formatPrice } from '../lib/format.js'

export default function ClientsView({ onOpen }) {
  const [clients, setClients] = useState([])
  const [openId, setOpenId] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => { listClients().then(setClients) }, [])

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    const list = await listByClient(id)
    setHistory(list.sort((a, b) => b.datetime.localeCompare(a.datetime)))
  }

  return (
    <div>
      <header className="screen-head"><h1>Клиенты</h1></header>
      {clients.length === 0 && <p className="empty">Клиенты появятся после первых записей.</p>}
      {clients.map(c => (
        <div key={c.id} className="client-block">
          <button className="client-row" onClick={() => toggle(c.id)}>
            <span className="appt-name">{c.name}</span>
            <span className="appt-service">{c.contact}</span>
          </button>
          {openId === c.id && (
            <div className="client-history">
              {history.length === 0 && <p className="empty">Нет визитов</p>}
              {history.map(a => (
                <button key={a.id} className="hist-row" onClick={() => onOpen(a.id)}>
                  <span>{formatDate(a.datetime)} · {a.serviceName}</span>
                  <b>{formatPrice(a.price)}</b>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили клиентов в `src/styles.css`**

```css
.client-block { margin-bottom: 8px; }
.client-row { width: 100%; display: flex; flex-direction: column; align-items: flex-start;
  background: #fff; border: none; border-radius: 14px; padding: 12px 14px; text-align: left; }
.client-history { padding: 6px 6px 0; }
.hist-row { width: 100%; display: flex; justify-content: space-between;
  background: #fbf5f7; border: none; border-radius: 10px; padding: 10px 12px; margin: 6px 0;
  font-size: 14px; text-align: left; }
```

- [ ] **Step 3: Проверить в браузере**

Run: `npm run dev`
Expected: вкладка «Клиенты» — список клиентов (создаются вместе с записями в Task 10); тап раскрывает историю визитов, тап по визиту открывает карточку.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: экран клиентов с историей визитов"
```

---

### Task 14: Настройки — услуги и резервная копия (SettingsView.jsx)

**Files:**
- Modify: `src/components/SettingsView.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Реализовать `src/components/SettingsView.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { listServices, addService, updateService, deleteService } from '../db/services.js'
import { buildBackup, restoreBackup } from '../lib/backup.js'

export default function SettingsView({ onChanged }) {
  const [services, setServices] = useState([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  const reload = () => listServices().then(setServices)
  useEffect(() => { reload() }, [])

  const add = async () => {
    if (!name.trim()) return
    await addService({ name: name.trim(), price: Number(price) || 0 })
    setName(''); setPrice(''); reload(); onChanged && onChanged()
  }
  const remove = async (id) => { await deleteService(id); reload() }
  const changePrice = async (s, value) => { await updateService(s.id, { name: s.name, price: Number(value) || 0 }); reload() }

  const exportBackup = async () => {
    const data = await buildBackup()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kopiya-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importBackup = async (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!confirm('Заменить все текущие данные данными из копии?')) return
    const text = await file.text()
    await restoreBackup(JSON.parse(text))
    alert('Копия восстановлена'); reload(); onChanged && onChanged()
  }

  return (
    <div>
      <header className="screen-head"><h1>Настройки</h1></header>

      <section className="settings-block">
        <h2 className="day-title">Услуги и цены</h2>
        {services.map(s => (
          <div key={s.id} className="svc-row">
            <span>{s.name}</span>
            <input type="number" inputMode="numeric" defaultValue={s.price}
              onBlur={e => changePrice(s, e.target.value)} />
            <button className="link" onClick={() => remove(s.id)}>✕</button>
          </div>
        ))}
        <div className="svc-add">
          <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Цена" type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
          <button className="link primary" onClick={add}>＋</button>
        </div>
      </section>

      <section className="settings-block">
        <h2 className="day-title">Резервная копия</h2>
        <p className="hint">Сохраняйте копию раз в неделю — на случай потери телефона.</p>
        <button className="btn-secondary" onClick={exportBackup}>💾 Сохранить копию</button>
        <label className="btn-secondary file-label">
          📂 Загрузить копию
          <input type="file" accept="application/json" onChange={importBackup} hidden />
        </label>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Добавить стили настроек в `src/styles.css`**

```css
.settings-block { margin-bottom: 26px; }
.svc-row, .svc-add { display: flex; align-items: center; gap: 10px; background: #fff;
  border-radius: 10px; padding: 8px 12px; margin-bottom: 8px; }
.svc-row span { flex: 1; }
.svc-row input, .svc-add input { width: 90px; padding: 8px; border: 1px solid #e3dadd; border-radius: 8px; font-size: 15px; }
.svc-add input:first-child { flex: 1; width: auto; }
.hint { color: #999; font-size: 13px; margin: 4px 0 12px; }
.settings-block .btn-secondary { display: block; width: 100%; text-align: center; margin-bottom: 10px; }
.file-label input { display: none; }
```

- [ ] **Step 3: Создать иконки PWA**

Создать три файла иконок в `public/icons/`: `icon-192.png` (192×192), `icon-512.png` (512×512), `apple-touch-icon.png` (180×180). Простой вариант — однотонный фон цвета `#c98ba0` с буквой/символом. Можно сгенерировать командой ImageMagick, если установлен:
```bash
mkdir -p public/icons
command -v magick >/dev/null && {
  magick -size 512x512 xc:'#c98ba0' -gravity center -pointsize 280 -fill white -annotate 0 '💄' public/icons/icon-512.png
  magick public/icons/icon-512.png -resize 192x192 public/icons/icon-192.png
  magick public/icons/icon-512.png -resize 180x180 public/icons/apple-touch-icon.png
} || echo 'ImageMagick нет — добавить иконки вручную (любые PNG нужных размеров)'
```
Если ImageMagick недоступен — положить любые подходящие PNG нужных размеров (192, 512, 180). Без них PWA-установка работает, но иконка будет дефолтной.

- [ ] **Step 4: Проверить в браузере**

Run: `npm run dev`
Expected: вкладка «Настройки» — добавление услуги (после этого она доступна в форме записи), правка цены по `onBlur`, удаление; «Сохранить копию» скачивает JSON; «Загрузить копию» восстанавливает данные.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: настройки услуг и резервное копирование + иконки PWA"
```

---

### Task 15: Финальная проверка PWA и сборки

**Files:**
- Verify only (правки при необходимости).

- [ ] **Step 1: Прогнать все тесты**

Run: `npm test`
Expected: все тесты (format, services, clients, appointments, backup, ics) — PASS.

- [ ] **Step 2: Собрать продакшн-сборку**

Run: `npm run build`
Expected: сборка успешна, в `dist/` есть `index.html`, `manifest.webmanifest`, `sw.js` (service worker от vite-plugin-pwa), иконки.

- [ ] **Step 3: Проверить установку как PWA локально**

Run: `npm run preview`
Открыть выданный URL в Chrome → DevTools → Application → Manifest: имя «Записи клиентов», иконки подхватываются, «Installable». Проверить офлайн: в DevTools → Network → Offline, перезагрузить — приложение открывается, данные на месте.

- [ ] **Step 4: Commit (если были правки)**

```bash
git add -A && git commit -m "chore: финальная проверка PWA и сборки"
```

---

### Task 16: Публикация на Netlify (без зависимости от компьютера)

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Создать `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Запушить репозиторий на GitHub**

```bash
git add netlify.toml && git commit -m "chore: конфигурация деплоя Netlify"
# создать удалённый репозиторий и запушить (выполняет владелец):
# gh repo create zapisi-klientov --private --source=. --push
```

- [ ] **Step 3: Подключить Netlify (выполняет владелец, разово)**

В Netlify: «Add new site» → «Import from Git» → выбрать репозиторий. Build command и publish уже заданы в `netlify.toml`. После деплоя Netlify выдаст постоянный URL (напр. `https://zapisi-klientov.netlify.app`). Этот URL и есть приложение — оно живёт в облаке, не на компьютере владельца.

- [ ] **Step 4: Установить на iPhone (выполняет девушка, разово)**

Открыть URL в Safari → кнопка «Поделиться» → «На экран Домой». Появится иконка «Записи». Дальше открывается как обычное приложение, работает офлайн, данные хранятся в телефоне.

- [ ] **Step 5: Проверить полный сценарий на айфоне**

Создать запись, добавить фото, нажать «➕ В Календарь iPhone» (должен открыться Календарь с напоминанием), сделать резервную копию в «Файлы», проверить работу без интернета.

---

## Самопроверка плана (выполнено при написании)

- **Покрытие спецификации:** тип/хостинг/локальное хранение — Task 1, 3, 16; данные (запись/клиент/услуга) — Task 3–5; экраны 1–6 — Task 9, 12, 10, 11, 13, 14; напоминания через .ics — Task 7, 10; резервная копия — Task 6, 14; технологии — Task 1; проверка — Task 15, 16. Вне объёма (онлайн-запись клиентов, push, мультиюзер) — не реализуется. ✔
- **Заглушки:** временные заглушки экранов в Task 8 намеренные и заменяются в Task 9–14; реальных placeholder-ов в логике нет. ✔
- **Согласованность сигнатур:** `addAppointment/updateAppointment/getAppointment/deleteAppointment/listAppointments/listUpcoming/listByClient`, `buildBackup/restoreBackup`, `buildICS/downloadICS`, `formatPrice/formatTime/formatDate/formatDayTitle` — имена и параметры совпадают между задачами. ✔
