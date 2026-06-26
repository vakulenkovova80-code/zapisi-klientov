import { getDB } from '../db/db.js'

const VERSION = 2

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 8192, bytes.byteLength)))
  }
  return btoa(binary)
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
  const meta = await db.getAll('meta')

  const appointments = await Promise.all(rawAppointments.map(async (a) => ({
    ...a,
    photos: await Promise.all((a.photos || []).map(async (b) => ({
      type: b.type || 'image/jpeg',
      data: await blobToBase64(b)
    })))
  })))

  return { version: VERSION, exportedAt: new Date().toISOString(), services, clients, appointments, meta }
}

export async function restoreBackup(data) {
  if (![1, 2].includes(data.version)) {
    throw new Error('Несовместимая версия резервной копии')
  }
  const db = await getDB()
  const tx = db.transaction(['services', 'clients', 'appointments', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('services').clear(),
    tx.objectStore('clients').clear(),
    tx.objectStore('appointments').clear(),
    tx.objectStore('meta').clear()
  ])
  for (const s of data.services || []) tx.objectStore('services').put(s)
  for (const c of data.clients || []) tx.objectStore('clients').put(c)
  for (const a of data.appointments || []) {
    const photos = (a.photos || []).map(p => base64ToBlob(p.data, p.type))
    tx.objectStore('appointments').put({ ...a, photos })
  }
  for (const m of data.meta || []) tx.objectStore('meta').put(m)
  await tx.done
}
