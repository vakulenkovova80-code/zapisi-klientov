import { getDB } from '../db/db.js'

// Аддитивная загрузка записей из подготовленного файла (без очистки существующих).
// Идемпотентно: повторная загрузка перезаписывает те же записи по id, не плодит дубли
// и не стирает данные, добавленные пользователем вручную.
export async function seedImport(data) {
  const db = await getDB()
  const tx = db.transaction(['services', 'clients', 'appointments', 'meta'], 'readwrite')
  for (const s of data.services || []) tx.objectStore('services').put(s)
  for (const c of data.clients || []) tx.objectStore('clients').put(c)
  for (const a of data.appointments || []) {
    tx.objectStore('appointments').put({ ...a, photos: a.photos || [] })
  }
  for (const m of data.meta || []) tx.objectStore('meta').put(m)
  await tx.done
}

// Загружает файл стартовых записей, лежащий рядом с приложением.
export async function fetchSeed() {
  const res = await fetch(`${import.meta.env.BASE_URL}seed-zapisi.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Не удалось загрузить файл записей')
  return res.json()
}
