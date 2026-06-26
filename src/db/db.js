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
