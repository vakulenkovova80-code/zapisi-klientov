const INSTAGRAM = '@kateryna.shtander'

/**
 * Генерирует текст поста «Свободные окошки» для сторис.
 * @param {Array<{start: string, end: string}>} freeSlots - массив свободных слотов
 * @param {string} dateLabel - человекочитаемая дата, например «27 июня» / «dziś»
 * @param {string} businessName - имя мастера/бизнеса
 * @param {'ru'|'pl'} lang - язык поста (по умолчанию 'ru')
 * @returns {string}
 */
export function buildFreeSlotsPost(freeSlots, dateLabel, businessName = 'Kateryna Shtander', lang = 'ru') {
  if (lang === 'pl') {
    if (freeSlots.length === 0) {
      return `${businessName}\n${dateLabel}: wszystko zajęte, dziękuję! 💕\nŚledź wolne terminy — ${INSTAGRAM}`
    }
    const ranges = freeSlots.map(s => `${s.start}–${s.end}`).join(', ')
    return `${businessName}\n💌 Wolne ${dateLabel}: ${ranges}\nZapisy w DM ${INSTAGRAM}`
  }
  // Default: RU
  if (freeSlots.length === 0) {
    return `${businessName}\n${dateLabel}: всё занято, спасибо! 💕\nСледите за свободными окошками — ${INSTAGRAM}`
  }
  const ranges = freeSlots.map(s => `${s.start}–${s.end}`).join(', ')
  return `${businessName}\n💌 Свободно ${dateLabel}: ${ranges}\nЗапись в директ ${INSTAGRAM}`
}
