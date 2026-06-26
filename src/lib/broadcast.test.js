import { describe, it, expect } from 'vitest'
import { waLink, numbersText } from './broadcast.js'

describe('waLink', () => {
  it('валидный телефон → ссылка с цифрами и энкодингом текста', () => {
    const link = waLink('+7 (999) 123-45-67', 'Привет!')
    expect(link).toBe('https://wa.me/79991234567?text=' + encodeURIComponent('Привет!'))
  })

  it('телефон без знаков форматирования', () => {
    const link = waLink('79991234567', 'Тест')
    expect(link).toBe('https://wa.me/79991234567?text=' + encodeURIComponent('Тест'))
  })

  it('ник/короткая строка (меньше 10 цифр) → null', () => {
    expect(waLink('@manikur_master', 'Привет')).toBeNull()
    expect(waLink('', 'Привет')).toBeNull()
    expect(waLink('12345', 'Привет')).toBeNull()
  })

  it('ровно 10 цифр — валидно', () => {
    const link = waLink('9991234567', 'ok')
    expect(link).toBe('https://wa.me/9991234567?text=' + encodeURIComponent('ok'))
  })

  it('текст с пробелами и спецсимволами кодируется корректно', () => {
    const text = 'Запись на 10:00 — завтра!'
    const link = waLink('79991234567', text)
    expect(link).toContain(encodeURIComponent(text))
  })
})

describe('numbersText', () => {
  it('собирает валидные номера клиентов через \\n', () => {
    const clients = [
      { name: 'Аня', contact: '+7 999 111-22-33' },
      { name: 'Катя', contact: '+7 999 444-55-66' }
    ]
    const result = numbersText(clients)
    expect(result).toBe('79991112233\n79994445566')
  })

  it('игнорирует клиентов без валидного телефона', () => {
    const clients = [
      { name: 'Аня', contact: '+7 999 111-22-33' },
      { name: 'Ник', contact: '@instagramnik' },
      { name: 'Без контакта', contact: '' }
    ]
    const result = numbersText(clients)
    expect(result).toBe('79991112233')
  })

  it('пустой список → пустая строка', () => {
    expect(numbersText([])).toBe('')
  })

  it('все клиенты невалидны → пустая строка', () => {
    const clients = [
      { name: 'А', contact: '@vk' },
      { name: 'Б', contact: null }
    ]
    expect(numbersText(clients)).toBe('')
  })
})
