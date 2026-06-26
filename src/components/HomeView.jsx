import { useEffect, useState } from 'react'
import { listAppointments } from '../db/appointments.js'
import { listClients } from '../db/clients.js'
import { getMeta } from '../db/meta.js'
import {
  sumIncome, countInRange,
  todayRange, weekRange, monthRange,
  topService
} from '../lib/stats.js'
import { computeFreeSlots } from '../lib/slots.js'
import { formatPrice, formatTime, formatDayTitle, toDayKey } from '../lib/format.js'
import { statusLabel, statusColor } from '../lib/statuses.js'

export default function HomeView({ onOpen, onNew }) {
  const [appts, setAppts]       = useState(null)
  const [clients, setClients]   = useState([])
  const [workHours, setWorkHours] = useState({ start: '08:00', end: '22:00' })

  useEffect(() => {
    Promise.all([
      listAppointments(),
      listClients(),
      getMeta('workHours', { start: '08:00', end: '22:00' })
    ]).then(([a, c, wh]) => {
      setAppts(a)
      setClients(c)
      setWorkHours(wh)
    })
  }, [])

  if (!appts) {
    return (
      <div>
        <header className="screen-head">
          <h1>Главная</h1>
        </header>
        <p className="empty">Загрузка…</p>
      </div>
    )
  }

  const todayKey   = toDayKey(new Date())
  const todayAppts = appts
    .filter(a => toDayKey(a.datetime) === todayKey)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))

  const tRange = todayRange()
  const wRange = weekRange()
  const mRange = monthRange()

  const incomeToday    = sumIncome(appts, tRange, ['came'])
  const expectedToday  = sumIncome(appts, tRange, ['planned', 'confirmed'])
  const countToday     = countInRange(appts, tRange)
  const incomeWeek     = sumIncome(appts, wRange, ['came'])
  const incomeMonth    = sumIncome(appts, mRange, ['came'])

  const top = topService(appts.filter(a => a.status !== 'cancelled'))

  const { free: freeSlots } = computeFreeSlots(todayAppts, workHours.start, workHours.end)

  return (
    <div>
      <header className="screen-head home-head">
        <div>
          <h1>Главная</h1>
          <p className="home-greeting">Привет! 💗</p>
          <p className="home-date">{formatDayTitle(new Date().toISOString())}</p>
        </div>
        <button className="home-new-btn" onClick={onNew}>＋ Запись</button>
      </header>

      {/* Карточки-счётчики 2×2 */}
      <div className="stat-grid">
        <div className="stat-card stat-card--income">
          <span className="stat-value">{formatPrice(incomeToday)}</span>
          <span className="stat-label">Доход сегодня</span>
        </div>
        <div className="stat-card stat-card--expected">
          <span className="stat-value">{formatPrice(expectedToday)}</span>
          <span className="stat-label">Ожидается</span>
        </div>
        <div className="stat-card stat-card--count">
          <span className="stat-value">{countToday}</span>
          <span className="stat-label">Записей сегодня</span>
        </div>
        <div className="stat-card stat-card--clients">
          <span className="stat-value">{clients.length}</span>
          <span className="stat-label">Клиентов всего</span>
        </div>
      </div>

      {/* Доход за период */}
      <div className="home-income-row">
        <div className="home-income-item">
          <span className="home-income-label">За неделю</span>
          <span className="home-income-value">{formatPrice(incomeWeek)}</span>
        </div>
        <div className="home-income-divider" />
        <div className="home-income-item">
          <span className="home-income-label">За месяц</span>
          <span className="home-income-value">{formatPrice(incomeMonth)}</span>
        </div>
      </div>

      {/* Топ-услуга */}
      {top && (
        <div className="home-top-service">
          <span className="home-top-icon">⭐</span>
          <span className="home-top-text">
            Чаще всего: <strong>{top.name}</strong> ({top.count})
          </span>
        </div>
      )}

      {/* Записи сегодня */}
      <h2 className="day-title home-section-title">Сегодня</h2>
      {todayAppts.length === 0 ? (
        <p className="empty home-empty">На сегодня записей нет</p>
      ) : (
        todayAppts.map(a => (
          <button key={a.id} className="appt-row" onClick={() => onOpen(a.id)}>
            <span className="appt-time">{formatTime(a.datetime)}</span>
            <span className="appt-main">
              <span className="appt-name">{a.clientName}</span>
              <span className="appt-service">{a.serviceName}</span>
            </span>
            <span className="appt-row-right">
              <span className="appt-price">{formatPrice(a.price)}</span>
              <span
                className="status-badge"
                style={{ background: statusColor(a.status || 'planned') + '22', color: statusColor(a.status || 'planned') }}
              >
                {statusLabel(a.status || 'planned')}
              </span>
            </span>
          </button>
        ))
      )}

      {/* Свободное время сегодня */}
      <h2 className="day-title home-section-title">Свободно сегодня</h2>
      <div className="cal-free-block">
        <span className="cal-free-title">🕐</span>
        <span className="cal-free-slots">
          {freeSlots.length === 0
            ? 'Весь день занят'
            : freeSlots.map(s => `${s.start}–${s.end}`).join(', ')
          }
        </span>
      </div>

      <button className="fab" onClick={onNew} aria-label="Новая запись">＋</button>
    </div>
  )
}
