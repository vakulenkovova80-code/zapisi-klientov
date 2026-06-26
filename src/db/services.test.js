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
