/**
 * Извлекает только цифры из строки контакта.
 * @param {string} contact
 * @returns {string}
 */
function extractDigits(contact) {
  return String(contact || '').replace(/\D/g, '')
}

/**
 * Формирует ссылку WhatsApp для отправки сообщения клиенту.
 * @param {string} contact - телефон (может содержать +, пробелы, скобки, дефисы)
 * @param {string} text    - текст сообщения
 * @returns {string|null}  - URL или null, если контакт невалиден (<10 цифр)
 */
export function waLink(contact, text) {
  const digits = extractDigits(contact)
  if (digits.length < 10) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/**
 * Собирает номера телефонов валидных клиентов в строку через '\n'.
 * @param {Array<{contact: string}>} clients
 * @returns {string}
 */
export function numbersText(clients) {
  return clients
    .map(c => extractDigits(c.contact))
    .filter(d => d.length >= 10)
    .join('\n')
}
