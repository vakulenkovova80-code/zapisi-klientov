import { useEffect, useMemo, useRef, useState } from 'react'
import { getAppointment, updateAppointment, deleteAppointment, listByClient } from '../db/appointments.js'
import { getMeta } from '../db/meta.js'
import { loyaltyInfo } from '../lib/loyalty.js'
import { reviewRequestText } from '../lib/messages.js'
import { formatDayTitle, formatTime, formatPrice } from '../lib/format.js'
import { STATUSES, statusLabel, statusColor } from '../lib/statuses.js'
import { locationLabel, locationIcon } from '../lib/locations.js'
import { reminderText } from '../lib/reminders.js'
import { waLink } from '../lib/broadcast.js'
import { drawDiscountCard } from '../lib/discountCard.js'

function telHref(contact) {
  return /^[+\d][\d\s\-()]*$/.test(contact) ? `tel:${contact.replace(/[\s\-()]/g, '')}` : null
}
function waHref(contact) {
  const digits = contact.replace(/\D/g, '')
  return digits.length >= 10 ? `https://wa.me/${digits}` : null
}

export default function AppointmentCard({ id, onEdit, onDeleted, onClose }) {
  const [a, setA] = useState(null)
  useEffect(() => { getAppointment(id).then(setA) }, [id])

  // Safe blob URLs — hooks must be called unconditionally, before early return
  const photoUrls = useMemo(() => (a?.photos || []).map(p => URL.createObjectURL(p)), [a])
  useEffect(() => () => { photoUrls.forEach(u => URL.revokeObjectURL(u)) }, [photoUrls])

  // Loyalty — load visits count + settings; must be above early return
  const [loyalty, setLoyalty] = useState(null)
  useEffect(() => {
    if (!a?.clientId) { setLoyalty(null); return }
    let cancelled = false
    Promise.all([listByClient(a.clientId), getMeta('loyaltyEvery', 5), getMeta('discountPercent', 40)])
      .then(([visits, every, percent]) => {
        if (!cancelled) setLoyalty({ ...loyaltyInfo(visits.length, every), percent })
      })
    return () => { cancelled = true }
  }, [a?.clientId])

  // Review link setting — must be above early return
  const [reviewLink, setReviewLink] = useState('')
  useEffect(() => { getMeta('reviewLink', '').then(setReviewLink) }, [])

  // Card preview — must be above early return
  const [cardUrl, setCardUrl] = useState(null)
  const cardBlobRef = useRef(null)
  useEffect(() => {
    const url = cardUrl
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [cardUrl])

  if (!a) return null

  const canShareFiles = (() => {
    if (typeof navigator === 'undefined' || !navigator.canShare) return false
    try { return navigator.canShare({ files: [new File([], 'x.png', { type: 'image/png' })] }) }
    catch { return false }
  })()

  const handleCardOpen = async () => {
    try {
      const [businessName, every, percent] = await Promise.all([
        getMeta('businessName', 'Kateryna Shtander'),
        getMeta('loyaltyEvery', 5),
        getMeta('discountPercent', 40),
      ])
      const visitCount = loyalty?.count ?? 0
      const blob = await drawDiscountCard({ clientName: a.clientName, businessName, visitCount, every, percent })
      cardBlobRef.current = blob
      setCardUrl(URL.createObjectURL(blob))
    } catch (err) {
      alert('Не удалось создать карту лояльности: ' + err.message)
    }
  }

  const handleCardShare = async () => {
    if (!cardBlobRef.current) return
    const file = new File([cardBlobRef.current], 'karta-loyalnosti.png', { type: 'image/png' })
    try { await navigator.share({ files: [file], title: 'Карта лояльности' }) }
    catch { /* пользователь отменил */ }
  }

  const handleCardSave = () => {
    if (!cardUrl) return
    const link = document.createElement('a')
    link.href = cardUrl
    link.download = 'karta-loyalnosti.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCardClose = () => {
    cardBlobRef.current = null
    setCardUrl(null)
  }

  const tel = telHref(a.contact)
  const wa = waHref(a.contact)
  const reminderLink = waLink(a.contact, reminderText(a))
  const reviewHref = waLink(a.contact, reviewRequestText(a, reviewLink))

  const changeStatus = async (newKey) => {
    await updateAppointment(id, { status: newKey })
    setA({ ...a, status: newKey })
  }

  const remove = async () => {
    if (confirm('Удалить запись?')) { await deleteAppointment(id); onDeleted() }
  }

  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onClose}>Назад</button>
        <h2>Запись</h2>
        <button className="link primary" onClick={onEdit}>Изменить</button>
      </header>

      <div className="card-body">
        <h1 className="card-name">{a.clientName}</h1>
        {loyalty && (
          <div className="card-loyalty">
            {loyalty.discountNow
              ? <span className="loyalty-badge loyalty-badge--discount">🎁 Скидка {loyalty.percent}%!</span>
              : loyalty.isRegular
                ? <span className="loyalty-badge loyalty-badge--regular">Постоянный 💖</span>
                : <span className="loyalty-badge loyalty-badge--progress">До скидки: {loyalty.visitsToDiscount}</span>
            }
          </div>
        )}
        <p className="card-when">{formatDayTitle(a.datetime)}, {formatTime(a.datetime)}</p>
        <div className="card-line"><span>Услуга</span><b>{a.serviceName || '—'}</b></div>
        <div className="card-line"><span>Цена</span><b>{formatPrice(a.price)}</b></div>
        <div className="card-line">
          <span>Место</span>
          <b>{locationIcon(a.location || 'salon')} {locationLabel(a.location || 'salon')}</b>
        </div>

        <div className="card-line">
          <span>Статус</span>
          <div className="card-status-group">
            <span
              className="status-badge"
              style={{ background: statusColor(a.status || 'planned') + '22', color: statusColor(a.status || 'planned') }}
            >
              {statusLabel(a.status || 'planned')}
            </span>
            <select
              className="card-status-select"
              value={a.status || 'planned'}
              onChange={e => changeStatus(e.target.value)}
              aria-label="Сменить статус"
            >
              {STATUSES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {a.note && <p className="card-note">{a.note}</p>}

        {photoUrls.length > 0 && (
          <div className="photo-row">
            {photoUrls.map((u, i) => <img key={i} src={u} alt="" />)}
          </div>
        )}

        <div className="card-actions">
          {tel && <a className="btn-secondary" href={tel}>📞 Позвонить</a>}
          {wa && <a className="btn-secondary" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
          {reminderLink && (
            <a className="btn-secondary" href={reminderLink} target="_blank" rel="noreferrer">🔔 Напомнить</a>
          )}
          {reviewHref && (
            <a className="btn-secondary" href={reviewHref} target="_blank" rel="noreferrer">🌟 Запросить отзыв</a>
          )}
          <button type="button" className="btn-secondary" onClick={handleCardOpen}>
            🎟 Карта лояльности
          </button>
        </div>

        <button className="btn-danger" onClick={remove}>Удалить запись</button>
      </div>

      {cardUrl && (
        <div className="overlay card-preview">
          <header className="overlay-head">
            <button className="link" onClick={handleCardClose}>Закрыть</button>
            <h2>Карта лояльности</h2>
            <span />
          </header>
          <div className="card-preview-body">
            <img className="card-preview-img" src={cardUrl} alt="Карта лояльности" />
            <div className="card-preview-actions">
              {canShareFiles && (
                <button type="button" className="btn-secondary" onClick={handleCardShare}>
                  📤 Поделиться
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={handleCardSave}>
                💾 Сохранить
              </button>
              <button type="button" className="btn-secondary" onClick={handleCardClose}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
