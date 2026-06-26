import { useEffect, useMemo, useState } from 'react'
import { addAppointment, getAppointment, updateAppointment } from '../db/appointments.js'
import { listServices } from '../db/services.js'
import { listClients, addClient } from '../db/clients.js'
import { buildICS, downloadICS } from '../lib/ics.js'
import { STATUSES } from '../lib/statuses.js'

function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function AppointmentForm({ id, onSaved, onCancel, prefill }) {
  const [clientName, setClientName] = useState((!id && prefill?.clientName) || '')
  const [contact, setContact] = useState((!id && prefill?.contact) || '')
  const [datetimeLocal, setDatetimeLocal] = useState(toLocalInput(null))
  const [serviceName, setServiceName] = useState((!id && prefill?.serviceName) || '')
  const [price, setPrice] = useState(
    (!id && prefill?.price != null && prefill.price !== '') ? String(prefill.price) : ''
  )
  const [note, setNote] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('planned')
  const [services, setServices] = useState([])

  useEffect(() => { listServices().then(setServices) }, [])
  useEffect(() => {
    if (!id) return
    getAppointment(id).then(a => {
      if (!a) return
      setClientName(a.clientName); setContact(a.contact)
      setDatetimeLocal(toLocalInput(a.datetime)); setServiceName(a.serviceName)
      setPrice(String(a.price)); setNote(a.note); setPhotos(a.photos || [])
      setDurationMinutes(a.durationMinutes ?? 60)
      setStatus(a.status || 'planned')
    })
  }, [id])

  const onPickService = (name) => {
    setServiceName(name)
    const s = services.find(x => x.name === name)
    if (s && !price) setPrice(String(s.price))
  }

  const onAddPhotos = (e) => {
    setPhotos(prev => [...prev, ...Array.from(e.target.files)])
  }

  const buildData = () => ({
    clientName, contact,
    datetime: new Date(datetimeLocal).toISOString(),
    serviceName, price: Number(price) || 0,
    durationMinutes: Number(durationMinutes) || 60,
    note, photos, status
  })

  const save = async () => {
    if (!clientName.trim()) { alert('Введите имя клиента'); return }
    if (id) {
      await updateAppointment(id, buildData())
    } else {
      const clients = await listClients()
      const existing = clients.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase())
      const clientId = existing ? existing.id : await addClient({ name: clientName.trim(), contact })
      await addAppointment({ ...buildData(), clientId })
    }
    onSaved()
  }

  const photoUrls = useMemo(() => photos.map(p => URL.createObjectURL(p)), [photos])
  useEffect(() => () => { photoUrls.forEach(u => URL.revokeObjectURL(u)) }, [photoUrls])

  const addToCalendar = () => {
    const ics = buildICS({
      title: `${clientName} — ${serviceName}`,
      startISO: new Date(datetimeLocal).toISOString(),
      durationMinutes: Number(durationMinutes) || 60, note, reminderMinutes: 60
    })
    downloadICS('zapis.ics', ics)
  }

  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onCancel}>Отмена</button>
        <h2>{id ? 'Изменить запись' : 'Новая запись'}</h2>
        <button className="link primary" onClick={save}>Сохранить</button>
      </header>

      <div className="form">
        <label>Имя клиента
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Например, Аня" />
        </label>
        <label>Телефон / соцсеть
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="+7… или @ник" />
        </label>
        <label>Дата и время
          <input type="datetime-local" value={datetimeLocal} onChange={e => setDatetimeLocal(e.target.value)} />
        </label>
        <label>Услуга
          <input list="services-list" value={serviceName} onChange={e => onPickService(e.target.value)} placeholder="Макияж / Причёска" />
          <datalist id="services-list">
            {services.map(s => <option key={s.id} value={s.name} />)}
          </datalist>
        </label>
        <label>Цена, zł
          <input type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label>Длительность, мин
          <input type="number" inputMode="numeric" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} min="1" />
        </label>
        <label>Статус
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>Заметка
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Пожелания, аллергии…" />
        </label>
        <label>Фото результата
          <input type="file" accept="image/*" multiple onChange={onAddPhotos} />
        </label>
        {photos.length > 0 && (
          <div className="photo-row">
            {photoUrls.map((u, i) => <img key={i} src={u} alt="" />)}
          </div>
        )}

        <button className="btn-secondary" type="button" onClick={addToCalendar}>
          ➕ В Календарь iPhone (напоминание)
        </button>
      </div>
    </div>
  )
}
