import { getDB } from './db.js'

function normalize(data) {
  if (!data.datetime) throw new Error('datetime обязателен')
  return {
    clientId: data.clientId ?? null,
    clientName: data.clientName ?? '',
    contact: data.contact ?? '',
    datetime: data.datetime,
    serviceName: data.serviceName ?? '',
    price: Number(data.price) || 0,
    durationMinutes: Number(data.durationMinutes) || 60,
    note: data.note ?? '',
    photos: data.photos ?? [],
    status: data.status || 'planned',
    location: data.location || 'salon'
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
  const merged = { ...existing, ...patch, id }
  if ('price' in patch) merged.price = Number(patch.price) || 0
  if ('durationMinutes' in patch) merged.durationMinutes = Number(patch.durationMinutes) || 60
  await db.put('appointments', merged)
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
