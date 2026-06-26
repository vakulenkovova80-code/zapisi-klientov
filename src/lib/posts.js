const INSTAGRAM = '@kateryna.shtander'

/**
 * Генерирует текст поста «Свободные окошки» для сторис.
 * @param {Array<{start: string, end: string}>} freeSlots - массив свободных слотов
 * @param {string} dateLabel - человекочитаемая дата, например «27 июня»
 * @param {string} businessName - имя мастера/бизнеса
 * @returns {string}
 */
export function buildFreeSlotsPost(freeSlots, dateLabel, businessName = 'Kateryna Shtander') {
  if (freeSlots.length === 0) {
    return `${businessName}\n${dateLabel}: всё занято, спасибо! 💕\nСледите за свободными окошками — ${INSTAGRAM}`
  }
  const ranges = freeSlots.map(s => `${s.start}–${s.end}`).join(', ')
  return `${businessName}\n💌 Свободно ${dateLabel}: ${ranges}\nЗапись в директ ${INSTAGRAM}`
}
