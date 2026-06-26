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
