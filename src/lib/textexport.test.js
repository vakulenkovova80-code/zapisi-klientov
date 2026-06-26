import { describe, it, expect } from 'vitest'
import { buildTextExport } from './textexport.js'

describe('buildTextExport', () => {
  const appts = [
    { datetime: '2026-07-02T16:00:00', clientName: 'Марина', serviceName: 'Причёска', price: 4000, status: 'confirmed' },
    { datetime: '2026-07-01T10:30:00', clientName: 'Аня', serviceName: 'Макияж', price: 1500, status: 'came' }
  ]

  it('содержит имя, услугу и дату каждой записи', () => {
    const txt = buildTextExport(appts)
    expect(txt).toContain('Аня')
    expect(txt).toContain('Макияж')
    expect(txt).toContain('01.07.2026 10:30')
    expect(txt).toContain('Марина')
    expect(txt).toContain('Причёска')
  })

  it('сортирует по времени по возрастанию', () => {
    const txt = buildTextExport(appts)
    expect(txt.indexOf('Аня')).toBeLessThan(txt.indexOf('Марина'))
  })

  it('включает заголовок и количество', () => {
    const txt = buildTextExport(appts)
    expect(txt).toContain('Всего записей: 2')
  })

  it('пустой список не падает', () => {
    const txt = buildTextExport([])
    expect(txt).toContain('Всего записей: 0')
  })
})
