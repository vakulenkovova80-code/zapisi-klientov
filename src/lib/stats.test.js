import { describe, it, expect } from 'vitest'
import { todayRange, weekRange, monthRange, sumIncome, countInRange, topService } from './stats.js'

// --- Вспомогалки для тестов ---
function appt(datetime, price, status, serviceName = 'Макияж') {
  return { datetime, price, status, serviceName }
}

describe('todayRange / weekRange / monthRange', () => {
  it('todayRange: from < to, оба ISO-строки', () => {
    const { from, to } = todayRange()
    expect(typeof from).toBe('string')
    expect(typeof to).toBe('string')
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('weekRange: from < to, оба ISO-строки', () => {
    const { from, to } = weekRange()
    expect(typeof from).toBe('string')
    expect(typeof to).toBe('string')
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('monthRange: from < to, оба ISO-строки', () => {
    const { from, to } = monthRange()
    expect(typeof from).toBe('string')
    expect(typeof to).toBe('string')
    expect(new Date(from) < new Date(to)).toBe(true)
  })

  it('todayRange охватывает ровно один день', () => {
    const { from, to } = todayRange()
    const diff = new Date(to) - new Date(from)
    // 24 часа = 86400000 мс
    expect(diff).toBe(86400000)
  })

  it('weekRange охватывает 7 дней', () => {
    const { from, to } = weekRange()
    const diff = new Date(to) - new Date(from)
    expect(diff).toBe(7 * 86400000)
  })

  it('weekRange.from — понедельник (день=1)', () => {
    const { from } = weekRange()
    const d = new Date(from)
    expect(d.getDay()).toBe(1)
  })
})

describe('sumIncome', () => {
  const range = { from: '2026-06-01T00:00:00', to: '2026-07-01T00:00:00' }

  it('суммирует только записи со статусом came в диапазоне', () => {
    const appts = [
      appt('2026-06-10T10:00:00', 1000, 'came'),
      appt('2026-06-15T10:00:00', 500,  'came'),
      appt('2026-06-20T10:00:00', 800,  'planned'),  // статус не тот — не считаем
    ]
    expect(sumIncome(appts, range)).toBe(1500)
  })

  it('не считает запись вне диапазона', () => {
    const appts = [
      appt('2026-05-31T23:59:59', 1000, 'came'),  // до from
      appt('2026-07-01T00:00:00', 500,  'came'),  // равно to — эксклюзивно, не считаем
      appt('2026-06-10T10:00:00', 200,  'came'),  // в диапазоне
    ]
    expect(sumIncome(appts, range)).toBe(200)
  })

  it('поддерживает кастомный список статусов', () => {
    const appts = [
      appt('2026-06-10T10:00:00', 300, 'came'),
      appt('2026-06-10T11:00:00', 700, 'confirmed'),
      appt('2026-06-10T12:00:00', 100, 'planned'),
    ]
    expect(sumIncome(appts, range, ['came', 'confirmed'])).toBe(1000)
  })

  it('пустой массив → 0', () => {
    expect(sumIncome([], range)).toBe(0)
  })

  it('нет записей подходящего статуса → 0', () => {
    const appts = [
      appt('2026-06-10T10:00:00', 1000, 'planned'),
      appt('2026-06-10T11:00:00', 500,  'cancelled'),
    ]
    expect(sumIncome(appts, range)).toBe(0)
  })
})

describe('countInRange', () => {
  const range = { from: '2026-06-01T00:00:00', to: '2026-07-01T00:00:00' }

  it('считает записи в диапазоне любого статуса', () => {
    const appts = [
      appt('2026-06-05T10:00:00', 100, 'came'),
      appt('2026-06-10T10:00:00', 200, 'planned'),
      appt('2026-07-10T10:00:00', 300, 'came'),  // вне диапазона
    ]
    expect(countInRange(appts, range)).toBe(2)
  })

  it('граница to эксклюзивна', () => {
    const appts = [
      appt('2026-06-30T23:59:59', 100, 'planned'),  // включается
      appt('2026-07-01T00:00:00', 200, 'planned'),  // = to, не включается
    ]
    expect(countInRange(appts, range)).toBe(1)
  })

  it('пустой массив → 0', () => {
    expect(countInRange([], range)).toBe(0)
  })
})

describe('topService', () => {
  it('возвращает самую частую услугу', () => {
    const appts = [
      appt('2026-06-01T10:00:00', 0, 'came', 'Макияж'),
      appt('2026-06-02T10:00:00', 0, 'came', 'Макияж'),
      appt('2026-06-03T10:00:00', 0, 'came', 'Чистка'),
    ]
    expect(topService(appts)).toEqual({ name: 'Макияж', count: 2 })
  })

  it('при равном количестве возвращает один из лидеров', () => {
    const appts = [
      appt('2026-06-01T10:00:00', 0, 'came', 'A'),
      appt('2026-06-02T10:00:00', 0, 'came', 'B'),
    ]
    const result = topService(appts)
    expect(['A', 'B']).toContain(result.name)
    expect(result.count).toBe(1)
  })

  it('пустой массив → null', () => {
    expect(topService([])).toBeNull()
  })
})
