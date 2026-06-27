/**
 * Текст запроса отзыва после визита.
 * @param {{ clientName: string }} appt
 * @param {string} reviewLink
 * @returns {string}
 */
export function reviewRequestText(appt, reviewLink = '') {
  const base = `${appt.clientName}, спасибо за визит! 💕 Будем рады вашему отзыву`
  if (reviewLink) {
    return `${base}: ${reviewLink}`
  }
  return base
}

/**
 * Поздравительный текст с днём рождения.
 * @param {{ name: string }} client
 * @returns {string}
 */
export function birthdayText(client) {
  return `${client.name}, с днём рождения! 🎂 Дарим вам приятный сюрприз на следующий визит 💕`
}

/**
 * Готовые шаблоны промо-акций для рассылки/сторис.
 * @type {string[]}
 */
export const promoTemplates = [
  '🌸 Скидка 20% на макияж до конца недели! Запись @kateryna.shtander',
  '💇‍♀️ Приведи подругу — обеим скидка 15%!',
  '✨ Свободные окошки на этой неделе — успей записаться!',
  '🎁 Подарочный сертификат на любую услугу — отличный подарок! @kateryna.shtander',
  '💄 Специальное предложение на причёску + макияж. Подробности в директ @kateryna.shtander',
]

/**
 * Готові шаблони промо-акцій для польськомовних клієнтів.
 * @type {string[]}
 */
export const promoTemplatesPL = [
  '🌸 Zniżka 20% na makijaż do końca tygodnia! Zapisy @kateryna.shtander',
  '💇‍♀️ Przyprowadź koleżankę — obie dostajecie 15% zniżki!',
  '✨ Wolne terminy w tym tygodniu — zapisz się!',
  '🎁 Bon podarunkowy na dowolną usługę — świetny prezent! @kateryna.shtander',
  '💄 Specjalna oferta na fryzurę + makijaż. Szczegóły w DM @kateryna.shtander',
]
