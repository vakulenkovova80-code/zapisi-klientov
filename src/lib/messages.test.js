import { describe, it, expect } from 'vitest'
import { reviewRequestText, birthdayText, promoTemplates } from './messages.js'

describe('reviewRequestText', () => {
  it('подставляет имя и ссылку', () => {
    const appt = { clientName: 'Оля' }
    const text = reviewRequestText(appt, 'https://g.co/review/123')
    expect(text).toContain('Оля')
    expect(text).toContain('https://g.co/review/123')
    expect(text).toContain('спасибо за визит')
  })

  it('пустой reviewLink — нет хвоста-ссылки, но текст корректен', () => {
    const appt = { clientName: 'Аня' }
    const text = reviewRequestText(appt, '')
    expect(text).toContain('Аня')
    expect(text).toContain('спасибо за визит')
    // нет undefined или лишнего двоеточия
    expect(text).not.toContain('undefined')
    expect(text).not.toMatch(/:\s*$/)
  })

  it('без reviewLink (не передан) — работает без ошибок', () => {
    const appt = { clientName: 'Катя' }
    const text = reviewRequestText(appt)
    expect(text).toContain('Катя')
    expect(text).not.toContain('undefined')
  })

  it('текст содержит эмодзи 💕', () => {
    const text = reviewRequestText({ clientName: 'Ира' }, '')
    expect(text).toContain('💕')
  })
})

describe('birthdayText', () => {
  it('подставляет имя клиента', () => {
    const text = birthdayText({ name: 'Наташа' })
    expect(text).toContain('Наташа')
  })

  it('содержит поздравление с ДР и эмодзи 🎂', () => {
    const text = birthdayText({ name: 'Лена' })
    expect(text).toContain('днём рождения')
    expect(text).toContain('🎂')
  })

  it('упоминает сюрприз на следующий визит', () => {
    const text = birthdayText({ name: 'Вика' })
    expect(text).toContain('следующий визит')
  })
})

describe('promoTemplates', () => {
  it('является непустым массивом', () => {
    expect(Array.isArray(promoTemplates)).toBe(true)
    expect(promoTemplates.length).toBeGreaterThan(0)
  })

  it('каждый элемент — непустая строка', () => {
    for (const t of promoTemplates) {
      expect(typeof t).toBe('string')
      expect(t.length).toBeGreaterThan(0)
    }
  })

  it('содержит шаблон с упоминанием @kateryna.shtander', () => {
    const hasInstagram = promoTemplates.some(t => t.includes('@kateryna.shtander'))
    expect(hasInstagram).toBe(true)
  })

  it('минимум 3 шаблона', () => {
    expect(promoTemplates.length).toBeGreaterThanOrEqual(3)
  })
})
