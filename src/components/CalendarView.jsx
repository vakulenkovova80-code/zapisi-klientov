import { useEffect, useMemo, useState } from 'react'
import { listAppointments } from '../db/appointments.js'
import { getMeta } from '../db/meta.js'
import { formatTime, formatPrice, toDayKey } from '../lib/format.js'
import { computeFreeSlots } from '../lib/slots.js'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const WD = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export default function CalendarView({ onOpen }) {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(() => toDayKey(new Date()))
  const [workHours, setWorkHours] = useState({ start: '08:00', end: '22:00' })

  useEffect(() => { listAppointments().then(setItems) }, [])
  useEffect(() => { getMeta('workHours', { start: '08:00', end: '22:00' }).then(setWorkHours) }, [])

  const byDay = useMemo(() => {
    const m = {}
    for (const a of items) { const k = toDayKey(a.datetime); (m[k] = m[k] || []).push(a) }
    return m
  }, [items])

  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Пн=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const shift = (delta) => setCursor(new Date(year, month + delta, 1))
  const selectedList = useMemo(
    () => [...(byDay[selected] || [])].sort((a, b) => a.datetime.localeCompare(b.datetime)),
    [byDay, selected]
  )

  const freeSlots = useMemo(
    () => computeFreeSlots(selectedList, workHours.start, workHours.end).free,
    [selectedList, workHours]
  )

  function fmtSlot(t) { return t.replace(/^0/, '') }

  return (
    <div>
      <header className="cal-head">
        <button className="link" onClick={() => shift(-1)}>‹</button>
        <h1>{MONTHS[month]} {year}</h1>
        <button className="link" onClick={() => shift(1)}>›</button>
      </header>

      <div className="cal-grid">
        {WD.map(w => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />
          const key = toDayKey(d)
          const has = !!byDay[key]
          return (
            <button key={i}
              className={`cal-cell ${key === selected ? 'sel' : ''}`}
              onClick={() => setSelected(key)}>
              {d.getDate()}
              {has && <span className="cal-dot" />}
            </button>
          )
        })}
      </div>

      <div className="cal-list">
        {selectedList.length === 0 && <p className="empty">В этот день записей нет</p>}
        {selectedList.map(a => (
          <button key={a.id} className="appt-row" onClick={() => onOpen(a.id)}>
            <span className="appt-time">{formatTime(a.datetime)}</span>
            <span className="appt-main">
              <span className="appt-name">{a.clientName}</span>
              <span className="appt-service">{a.serviceName}</span>
            </span>
            <span className="appt-price">{formatPrice(a.price)}</span>
          </button>
        ))}
      </div>

      <div className="cal-free-block">
        <span className="cal-free-title">🟢 Свободно</span>
        <span className="cal-free-slots">
          {freeSlots.length === 0
            ? 'Весь день занят'
            : freeSlots.map(s => `${fmtSlot(s.start)}–${fmtSlot(s.end)}`).join(', ')
          }
        </span>
      </div>
    </div>
  )
}
