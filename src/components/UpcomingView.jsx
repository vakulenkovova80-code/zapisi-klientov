import { useEffect, useState } from 'react'
import { listUpcoming } from '../db/appointments.js'
import { formatTime, formatDayTitle, formatPrice, toDayKey } from '../lib/format.js'

function startOfToday() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}

function groupByDay(items) {
  const groups = {}
  for (const a of items) {
    const key = toDayKey(a.datetime)
    ;(groups[key] = groups[key] || []).push(a)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export default function UpcomingView({ onOpen, onNew }) {
  const [items, setItems] = useState(null)
  useEffect(() => { listUpcoming(startOfToday()).then(setItems) }, [])

  const groups = items ? groupByDay(items) : []

  return (
    <div>
      <header className="screen-head">
        <h1>Ближайшие записи</h1>
      </header>

      {items && items.length === 0 && (
        <p className="empty">Записей пока нет. Нажмите «＋», чтобы добавить.</p>
      )}

      {groups.map(([day, list]) => (
        <section key={day} className="day-group">
          <h2 className="day-title">{formatDayTitle(list[0].datetime)}</h2>
          {list.map(a => (
            <button key={a.id} className="appt-row" onClick={() => onOpen(a.id)}>
              <span className="appt-time">{formatTime(a.datetime)}</span>
              <span className="appt-main">
                <span className="appt-name">{a.clientName}</span>
                <span className="appt-service">{a.serviceName}</span>
              </span>
              <span className="appt-price">{formatPrice(a.price)}</span>
            </button>
          ))}
        </section>
      ))}

      <button className="fab" onClick={onNew} aria-label="Новая запись">＋</button>
    </div>
  )
}
