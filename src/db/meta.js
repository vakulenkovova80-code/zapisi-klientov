import { getDB } from './db.js'

export async function getMeta(key, fallback) {
  const db = await getDB()
  const row = await db.get('meta', key)
  return row !== undefined ? row.value : fallback
}

export async function setMeta(key, value) {
  const db = await getDB()
  await db.put('meta', { key, value })
}
