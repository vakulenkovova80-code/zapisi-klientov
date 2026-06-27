/**
 * G8 — Скидочная карта клиента
 * Рисует PNG-карту на offscreen canvas и возвращает Blob.
 */

/**
 * Нарисовать скруглённый прямоугольник (helper).
 * @param {CanvasRenderingContext2D} ctx
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Генерирует красивую розовую скидочную карту и возвращает Promise<Blob>.
 * @param {{ clientName: string, businessName: string, percent?: number }} opts
 * @returns {Promise<Blob>}
 */
export function drawDiscountCard({ clientName, businessName, percent = 10 }) {
  const W = 800
  const H = 500

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Background gradient (vertical: #fdeef4 → #f7c5d9) ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
  bgGrad.addColorStop(0, '#fdeef4')
  bgGrad.addColorStop(1, '#f7c5d9')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── Card border / frame ──
  ctx.save()
  roundRect(ctx, 10, 10, W - 20, H - 20, 28)
  ctx.strokeStyle = 'rgba(214,104,143,0.35)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.restore()

  // ── Inner decorative stripe (top) ──
  const stripeGrad = ctx.createLinearGradient(0, 0, W, 0)
  stripeGrad.addColorStop(0, '#f4b8cd')
  stripeGrad.addColorStop(1, '#e89bb4')
  ctx.fillStyle = stripeGrad
  roundRect(ctx, 10, 10, W - 20, 10, 4)
  ctx.fill()

  // ── Soft decorative circles ──
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#d6688f'
  ctx.beginPath()
  ctx.arc(W - 80, 80, 100, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(60, H - 60, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()

  // ── businessName ──
  ctx.fillStyle = '#d6688f'
  ctx.font = 'bold 46px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(businessName, W / 2, 100)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(214,104,143,0.3)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 122)
  ctx.lineTo(W - 60, 122)
  ctx.stroke()

  // ── «СКИДКА» label ──
  ctx.fillStyle = '#b84f7a'
  ctx.font = '600 26px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('СКИДКА', W / 2, 185)

  // ── Big percent ──
  ctx.fillStyle = '#d6688f'
  ctx.font = 'bold 130px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${percent}%`, W / 2, 310)

  // ── «на следующую услугу» ──
  ctx.fillStyle = '#9c4d6a'
  ctx.font = '600 28px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('на следующую услугу', W / 2, 355)

  // ── Divider ──
  ctx.strokeStyle = 'rgba(214,104,143,0.25)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(60, 378)
  ctx.lineTo(W - 60, 378)
  ctx.stroke()

  // ── «Для: clientName» ──
  const clientLine = `Для: ${clientName}`
  ctx.fillStyle = '#7a3d58'
  ctx.font = '500 26px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(clientLine, W / 2, 415)

  // ── Footer: @handle + tip ──
  ctx.fillStyle = '#d6688f'
  ctx.font = '600 20px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('@kateryna.shtander 💗', W / 2, 452)

  ctx.fillStyle = '#c5a0b2'
  ctx.font = '400 16px -apple-system, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Покажите это сообщение мастеру', W / 2, 478)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('canvas.toBlob вернул null'))
    }, 'image/png')
  })
}

/**
 * Поделиться картинкой через Web Share API или скачать как файл.
 * @param {Blob} blob
 * @param {string} filename
 */
export async function shareOrDownloadCard(blob, filename) {
  const file = new File([blob], filename, { type: 'image/png' })

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: 'Скидочная карта' })
      return
    } catch {
      // Пользователь отменил или share не удался — упадём на скачивание
    }
  }

  // Fallback: скачать файл
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
