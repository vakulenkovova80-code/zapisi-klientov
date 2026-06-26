import { describe, it, expect, beforeEach } from 'vitest'
import { listClients, getClient, addClient, updateClient, deleteClient } from './clients.js'
import { _resetDB } from './db.js'

beforeEach(async () => { await _resetDB() })

describe('clients CRUD', () => {
  it('добавляет и читает клиента', async () => {
    const id = await addClient({ name: 'Аня', contact: '+79990001122' })
    const c = await getClient(id)
    expect(c.name).toBe('Аня')
    expect(c.contact).toBe('+79990001122')
  })
  it('список отсортирован по имени', async () => {
    await addClient({ name: 'Яна', contact: '' })
    await addClient({ name: 'Аня', contact: '' })
    const list = await listClients()
    expect(list.map(c => c.name)).toEqual(['Аня', 'Яна'])
  })
  it('обновляет и удаляет клиента', async () => {
    const id = await addClient({ name: 'Аня', contact: '' })
    await updateClient(id, { name: 'Анна', contact: '+7' })
    expect((await getClient(id)).name).toBe('Анна')
    await deleteClient(id)
    expect(await getClient(id)).toBeUndefined()
  })
})
