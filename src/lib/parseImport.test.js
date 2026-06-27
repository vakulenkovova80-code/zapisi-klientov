import { describe, it, expect } from 'vitest'
import { parseImportText } from './parseImport.js'

describe('parseImportText', () => {
  it('одна валидная строка → одна запись, 0 ошибок', () => {
    const result = parseImportText('27.06.2026 14:00 | Ольга | Окрашивание | 1500')
    expect(result.appointments).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    const a = result.appointments[0]
    expect(a.clientName).toBe('Ольга')
    expect(a.serviceName).toBe('Окрашивание')
    expect(a.price).toBe(1500)
    expect(a.contact).toBe('')
    expect(a.note).toBe('')
    expect(a.photos).toEqual([])
    expect(a.status).toBe('planned')
    expect(a.durationMinutes).toBe(60)
  })

  it('datetime формируется как локальное время', () => {
    const result = parseImportText('27.06.2026 14:30 | Ольга')
    const a = result.appointments[0]
    // Проверяем что это валидный ISO-строка
    expect(() => new Date(a.datetime)).not.toThrow()
    // Локальная дата соответствует переданной
    const d = new Date(a.datetime)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5) // июнь = 5
    expect(d.getDate()).toBe(27)
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(30)
  })

  it('несколько строк → несколько записей', () => {
    const text = [
      '27.06.2026 10:00 | Марина | Маникюр | 400',
      '28.06.2026 12:00 | Тетяна | Педикюр | 500',
    ].join('\n')
    const result = parseImportText(text)
    expect(result.appointments).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
    expect(result.appointments[0].clientName).toBe('Марина')
    expect(result.appointments[1].clientName).toBe('Тетяна')
  })

  it('строка без услуги и цены → serviceName пустой, price=0', () => {
    const result = parseImportText('27.06.2026 09:00 | Катя')
    const a = result.appointments[0]
    expect(a.clientName).toBe('Катя')
    expect(a.serviceName).toBe('')
    expect(a.price).toBe(0)
  })

  it('строка с услугой, но без цены → price=0', () => {
    const result = parseImportText('27.06.2026 11:00 | Ніна | Завивка')
    const a = result.appointments[0]
    expect(a.serviceName).toBe('Завивка')
    expect(a.price).toBe(0)
  })

  it('пустые строки и строки из пробелов — пропускаются', () => {
    const text = '\n  \n27.06.2026 14:00 | Ольга | Окрашивание | 1500\n\n   \n'
    const result = parseImportText(text)
    expect(result.appointments).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
  })

  it('битая строка → в errors, валидные всё равно парсятся', () => {
    const text = [
      '27.06.2026 10:00 | Марина | Маникюр | 400',
      'это не запись вообще',
      '28.06.2026 12:00 | Тетяна',
    ].join('\n')
    const result = parseImportText(text)
    expect(result.appointments).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('это не запись вообще')
  })

  it('цена с пробелами «1 500» → 1500', () => {
    const result = parseImportText('27.06.2026 14:00 | Ольга | Окрашивание | 1 500')
    expect(result.appointments[0].price).toBe(1500)
  })

  it('цена «2 000» с пробелом-nbsp или обычным → 2000', () => {
    const result = parseImportText('27.06.2026 14:00 | Ольга | Окрашивание | 2 000')
    expect(result.appointments[0].price).toBe(2000)
  })

  it('строка с неверным форматом даты → в errors', () => {
    const result = parseImportText('2026/06/27 14:00 | Ольга')
    expect(result.appointments).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('строка без имени (второе поле пустое) → в errors', () => {
    const result = parseImportText('27.06.2026 14:00 |  | Маникюр')
    expect(result.appointments).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('пустой текст → пустой результат без ошибок', () => {
    const result = parseImportText('')
    expect(result.appointments).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('поля обрезаются от пробелов', () => {
    const result = parseImportText('27.06.2026 14:00 |  Оксана  |  Укладка  |  700  ')
    const a = result.appointments[0]
    expect(a.clientName).toBe('Оксана')
    expect(a.serviceName).toBe('Укладка')
    expect(a.price).toBe(700)
  })

  it('clientId не задаётся (null)', () => {
    const result = parseImportText('27.06.2026 14:00 | Катя')
    expect(result.appointments[0].clientId).toBeNull()
  })
})
