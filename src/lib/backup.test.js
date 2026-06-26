import { describe, it, expect, beforeEach } from 'vitest'
import { Blob as NativeBlob } from 'node:buffer'
// jsdom's Blob is not recognized by Node.js structuredClone (used by fake-indexeddb).
// Replace with native Node.js Blob so IDB can properly round-trip photo data.
globalThis.Blob = NativeBlob
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
