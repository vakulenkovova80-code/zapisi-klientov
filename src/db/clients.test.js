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

  it('addClient сохраняет source и note', async () => {
    const id = await addClient({ name: 'Марина', contact: '+7', source: 'Instagram', note: 'VIP' })
    const c = await getClient(id)
    expect(c.source).toBe('Instagram')
    expect(c.note).toBe('VIP')
  })

  it('addClient без source/note — дефолт пустая строка', async () => {
    const id = await addClient({ name: 'Лена', contact: '' })
    const c = await getClient(id)
    expect(c.source).toBe('')
    expect(c.note).toBe('')
  })

  it('updateClient сохраняет source и note', async () => {
    const id = await addClient({ name: 'Оля', contact: '' })
    await updateClient(id, { name: 'Оля', contact: '', source: 'TikTok', note: 'постоянная' })
    const c = await getClient(id)
    expect(c.source).toBe('TikTok')
    expect(c.note).toBe('постоянная')
  })

  it('updateClient без source/note — дефолт пустая строка', async () => {
    const id = await addClient({ name: 'Катя', contact: '', source: 'ВКонтакте', note: 'была' })
    await updateClient(id, { name: 'Катя', contact: '' })
    const c = await getClient(id)
    expect(c.source).toBe('')
    expect(c.note).toBe('')
  })
})
