import { describe, it, expect } from 'vitest'
import { buildFreeSlotsPost } from './posts.js'

describe('buildFreeSlotsPost', () => {
  it('с окнами: содержит businessName, dateLabel, диапазоны и @kateryna.shtander', () => {
    const slots = [
      { start: '08:00', end: '11:00' },
      { start: '14:30', end: '22:00' },
    ]
    const text = buildFreeSlotsPost(slots, '27 июня')
    expect(text).toContain('27 июня')
    expect(text).toContain('08:00–11:00')
    expect(text).toContain('14:30–22:00')
    expect(text).toContain('@kateryna.shtander')
    expect(text).toContain('Kateryna Shtander')
  })

  it('с окнами: диапазоны перечислены через запятую', () => {
    const slots = [
      { start: '09:00', end: '10:00' },
      { start: '13:00', end: '15:00' },
    ]
    const text = buildFreeSlotsPost(slots, 'Понедельник')
    expect(text).toContain('09:00–10:00, 13:00–15:00')
  })

  it('с окнами: кастомный businessName используется в тексте', () => {
    const slots = [{ start: '10:00', end: '12:00' }]
    const text = buildFreeSlotsPost(slots, 'Среда', 'Мастер Оля')
    expect(text).toContain('Мастер Оля')
    expect(text).not.toContain('Kateryna Shtander')
  })

  it('пустой массив → вариант «всё занято» с @kateryna.shtander', () => {
    const text = buildFreeSlotsPost([], '28 июня')
    expect(text).toContain('всё занято')
    expect(text).toContain('28 июня')
    expect(text).toContain('@kateryna.shtander')
  })

  it('пустой массив → НЕ содержит «Свободно»', () => {
    const text = buildFreeSlotsPost([], '28 июня')
    expect(text).not.toContain('Свободно')
  })

  it('один слот: правильный формат без лишних запятых', () => {
    const slots = [{ start: '12:00', end: '18:00' }]
    const text = buildFreeSlotsPost(slots, 'Пятница')
    expect(text).toContain('12:00–18:00')
    // нет запятой в конце
    expect(text).not.toMatch(/12:00–18:00,/)
  })
})
