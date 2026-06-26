import { useEffect, useState } from 'react'
import { addAppointment, getAppointment, updateAppointment } from '../db/appointments.js'
import { listServices } from '../db/services.js'
import { listClients, addClient } from '../db/clients.js'
import { buildICS, downloadICS } from '../lib/ics.js'

function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

export default function AppointmentForm({ id, onSaved, onCancel }) {
  const [clientName, setClientName] = useState('')
  const [contact, setContact] = useState('')
  const [datetimeLocal, setDatetimeLocal] = useState(toLocalInput(null))
  const [serviceName, setServiceName] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState([])
  const [services, setServices] = useState([])

  useEffect(() => { listServices().then(setServices) }, [])
  useEffect(() => {
    if (!id) return
    getAppointment(id).then(a => {
      if (!a) return
      setClientName(a.clientName); setContact(a.contact)
      setDatetimeLocal(toLocalInput(a.datetime)); setServiceName(a.serviceName)
      setPrice(String(a.price)); setNote(a.note); setPhotos(a.photos || [])
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
    serviceName, price: Number(price) || 0, note, photos
  })

  const save = async () => {
    if (!clientName.trim()) { alert('Введите имя клиента'); return }
    let clientId = null
    if (id) {
      await updateAppointment(id, buildData())
    } else {
      const clients = await listClients()
      const existing = clients.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase())
      clientId = existing ? existing.id : await addClient({ name: clientName.trim(), contact })
      await addAppointment({ ...buildData(), clientId })
    }
    onSaved()
  }

  const addToCalendar = () => {
    const ics = buildICS({
      title: `${clientName} — ${serviceName}`,
      startISO: new Date(datetimeLocal).toISOString(),
      durationMinutes: 60, note, reminderMinutes: 60
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
        <label>Цена, ₽
          <input type="number" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label>Заметка
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Пожелания, аллергии…" />
        </label>
        <label>Фото результата
          <input type="file" accept="image/*" multiple onChange={onAddPhotos} />
        </label>
        {photos.length > 0 && (
          <div className="photo-row">
            {photos.map((p, i) => <img key={i} src={URL.createObjectURL(p)} alt="" />)}
          </div>
        )}

        <button className="btn-secondary" type="button" onClick={addToCalendar}>
          ➕ В Календарь iPhone (напоминание)
        </button>
      </div>
    </div>
  )
}
