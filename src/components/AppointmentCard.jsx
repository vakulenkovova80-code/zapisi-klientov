import { useEffect, useMemo, useState } from 'react'
import { getAppointment, updateAppointment, deleteAppointment } from '../db/appointments.js'
import { formatDayTitle, formatTime, formatPrice } from '../lib/format.js'
import { STATUSES, statusLabel, statusColor } from '../lib/statuses.js'
import { reminderText } from '../lib/reminders.js'
import { waLink } from '../lib/broadcast.js'

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

  if (!a) return null

  const tel = telHref(a.contact)
  const wa = waHref(a.contact)
  const reminderLink = waLink(a.contact, reminderText(a))

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
        <p className="card-when">{formatDayTitle(a.datetime)}, {formatTime(a.datetime)}</p>
        <div className="card-line"><span>Услуга</span><b>{a.serviceName || '—'}</b></div>
        <div className="card-line"><span>Цена</span><b>{formatPrice(a.price)}</b></div>

        <div className="card-line">
          <span>Статус</span>
          <div className="card-status-group">
            <span
              className="status-badge"
              style={{ background: statusColor(a.status) + '22', color: statusColor(a.status) }}
            >
              {statusLabel(a.status)}
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
        </div>

        <button className="btn-danger" onClick={remove}>Удалить запись</button>
      </div>
    </div>
  )
}
