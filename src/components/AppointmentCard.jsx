import { useEffect, useMemo, useState } from 'react'
import { getAppointment, deleteAppointment } from '../db/appointments.js'
import { formatDayTitle, formatTime, formatPrice } from '../lib/format.js'

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
        {a.note && <p className="card-note">{a.note}</p>}

        {photoUrls.length > 0 && (
          <div className="photo-row">
            {photoUrls.map((u, i) => <img key={i} src={u} alt="" />)}
          </div>
        )}

        <div className="card-actions">
          {tel && <a className="btn-secondary" href={tel}>📞 Позвонить</a>}
          {wa && <a className="btn-secondary" href={wa} target="_blank" rel="noreferrer">💬 WhatsApp</a>}
        </div>

        <button className="btn-danger" onClick={remove}>Удалить запись</button>
      </div>
    </div>
  )
}
