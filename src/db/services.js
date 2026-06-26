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
