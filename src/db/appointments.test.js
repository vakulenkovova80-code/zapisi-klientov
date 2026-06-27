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
  it('частичное обновление сохраняет остальные поля', async () => {
    const id = await addAppointment(base({ note: 'важно' }))
    await updateAppointment(id, { price: 2000 })
    const a = await getAppointment(id)
    expect(a.price).toBe(2000)
    expect(a.clientName).toBe('Аня')
    expect(a.note).toBe('важно')
    expect(a.serviceName).toBe('Макияж')
  })
  it('updateAppointment приводит строковую цену к числу', async () => {
    const id = await addAppointment(base())
    await updateAppointment(id, { price: '2500' })
    expect((await getAppointment(id)).price).toBe(2500)
  })

  it('durationMinutes по умолчанию 60', async () => {
    const id = await addAppointment(base())
    expect((await getAppointment(id)).durationMinutes).toBe(60)
  })

  it('durationMinutes сохраняется из переданного значения', async () => {
    const id = await addAppointment(base({ durationMinutes: 90 }))
    expect((await getAppointment(id)).durationMinutes).toBe(90)
  })

  it('updateAppointment приводит строковый durationMinutes к числу', async () => {
    const id = await addAppointment(base())
    await updateAppointment(id, { durationMinutes: '120' })
    expect((await getAppointment(id)).durationMinutes).toBe(120)
  })

  it('дефолтный статус planned', async () => {
    const id = await addAppointment(base())
    const a = await getAppointment(id)
    expect(a.status).toBe('planned')
  })

  it('сохраняет переданный статус', async () => {
    const id = await addAppointment(base({ status: 'confirmed' }))
    const a = await getAppointment(id)
    expect(a.status).toBe('confirmed')
  })

  it('updateAppointment обновляет статус, сохраняя остальные поля', async () => {
    const id = await addAppointment(base({ note: 'важно' }))
    await updateAppointment(id, { status: 'came' })
    const a = await getAppointment(id)
    expect(a.status).toBe('came')
    expect(a.clientName).toBe('Аня')
    expect(a.note).toBe('важно')
  })

  it('дефолтный location salon', async () => {
    const id = await addAppointment(base())
    const a = await getAppointment(id)
    expect(a.location).toBe('salon')
  })

  it('сохраняет переданный location', async () => {
    const id = await addAppointment(base({ location: 'home' }))
    const a = await getAppointment(id)
    expect(a.location).toBe('home')
  })

  it('updateAppointment обновляет location, сохраняя остальные поля', async () => {
    const id = await addAppointment(base({ note: 'важно' }))
    await updateAppointment(id, { location: 'home' })
    const a = await getAppointment(id)
    expect(a.location).toBe('home')
    expect(a.clientName).toBe('Аня')
    expect(a.note).toBe('важно')
  })
})
