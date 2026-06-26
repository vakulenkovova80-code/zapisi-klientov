import { formatDate, formatTime } from './format.js'

/**
 * Генерирует текст напоминания для отправки клиенту.
 * @param {{ clientName: string, serviceName: string, datetime: string }} appt
 * @returns {string}
 */
export function reminderText(appt) {
  const date = formatDate(appt.datetime)
  const time = formatTime(appt.datetime)
  return `Здравствуйте, ${appt.clientName}! Напоминаю о записи ${date} в ${time} на ${appt.serviceName}. Ждём вас! 💗`
}
