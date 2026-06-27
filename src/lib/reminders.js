import { formatDate, formatTime } from './format.js'

/**
 * Генерирует текст напоминания для отправки клиенту.
 * @param {{ clientName: string, serviceName: string, datetime: string }} appt
 * @param {'ru'|'pl'} lang
 * @returns {string}
 */
export function reminderText(appt, lang = 'ru') {
  if (lang === 'pl') {
    const d = new Date(appt.datetime)
    const dd = String(d.getDate()).padStart(2, '0')
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `Dzień dobry, ${appt.clientName}! Przypominam o wizycie ${dd}.${mo} o ${hh}:${min} — ${appt.serviceName}. Do zobaczenia! 💗`
  }
  const date = formatDate(appt.datetime)
  const time = formatTime(appt.datetime)
  return `Здравствуйте, ${appt.clientName}! Напоминаю о записи ${date} в ${time} на ${appt.serviceName}. Ждём вас! 💗`
}
