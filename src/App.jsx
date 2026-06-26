import { useState, useEffect } from 'react'
import { fetchSeed, seedImport } from './lib/seed.js'
import BottomNav from './components/BottomNav.jsx'
import HomeView from './components/HomeView.jsx'
import UpcomingView from './components/UpcomingView.jsx'
import CalendarView from './components/CalendarView.jsx'
import ClientsView from './components/ClientsView.jsx'
import BroadcastView from './components/BroadcastView.jsx'
import SettingsView from './components/SettingsView.jsx'
import AppointmentForm from './components/AppointmentForm.jsx'
import AppointmentCard from './components/AppointmentCard.jsx'
import ClientForm from './components/ClientForm.jsx'

export default function App() {
  const [tab, setTab] = useState('home')
  // overlay: null
  //        | {mode:'new'} | {mode:'edit', id} | {mode:'view', id}
  //        | {mode:'client-new'} | {mode:'client-edit', id}
  const [overlay, setOverlay] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const reload = () => setRefresh(n => n + 1)

  // Загрузка подготовленных записей по ссылке вида .../?seed=1 — в один тап.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('seed') !== '1') return
    fetchSeed()
      .then(data => {
        const n = (data.appointments || []).length
        if (window.confirm(`Загрузить ${n} записей в приложение?`)) {
          return seedImport(data).then(() => {
            window.history.replaceState(null, '', import.meta.env.BASE_URL)
            window.alert('Готово! Записи загружены 💗')
            reload()
          })
        }
        window.history.replaceState(null, '', import.meta.env.BASE_URL)
      })
      .catch(() => window.alert('Не удалось загрузить записи. Проверьте интернет и попробуйте ещё раз.'))
  }, [])

  const openNew = () => setOverlay({ mode: 'new' })
  const openView = (id) => setOverlay({ mode: 'view', id })
  const openEdit = (id) => setOverlay({ mode: 'edit', id })
  const closeOverlay = () => setOverlay(null)

  const openClientNew = () => setOverlay({ mode: 'client-new' })
  const openClientEdit = (id) => setOverlay({ mode: 'client-edit', id })

  // Повторная запись: открываем форму записи с предзаполнением из последнего визита
  const openRebook = (client, lastAppt) => {
    setOverlay({
      mode: 'new',
      prefill: {
        clientName: client.name,
        contact: client.contact || '',
        clientId: client.id,
        serviceName: lastAppt?.serviceName || '',
        price: lastAppt?.price != null ? String(lastAppt.price) : '',
      }
    })
  }

  return (
    <div className="app">
      {tab === 'home'      && <HomeView key={refresh} onOpen={openView} onNew={openNew} />}
      {tab === 'upcoming'  && <UpcomingView key={refresh} onOpen={openView} onNew={openNew} />}
      {tab === 'calendar'  && <CalendarView key={refresh} onOpen={openView} />}
      {tab === 'clients'   && (
        <ClientsView
          key={refresh}
          onOpen={openView}
          onAddClient={openClientNew}
          onEditClient={openClientEdit}
          onRebook={openRebook}
        />
      )}
      {tab === 'broadcast' && <BroadcastView key={refresh} />}
      {tab === 'settings'  && <SettingsView key={refresh} onChanged={reload} />}

      {overlay && (overlay.mode === 'new' || overlay.mode === 'edit') && (
        <AppointmentForm
          id={overlay.mode === 'edit' ? overlay.id : null}
          prefill={overlay.mode === 'new' ? overlay.prefill : undefined}
          onSaved={() => { closeOverlay(); reload() }}
          onCancel={closeOverlay}
        />
      )}
      {overlay && overlay.mode === 'view' && (
        <AppointmentCard
          id={overlay.id}
          onEdit={() => openEdit(overlay.id)}
          onDeleted={() => { closeOverlay(); reload() }}
          onClose={closeOverlay}
        />
      )}
      {overlay && (overlay.mode === 'client-new' || overlay.mode === 'client-edit') && (
        <ClientForm
          id={overlay.mode === 'client-edit' ? overlay.id : null}
          onSaved={() => { closeOverlay(); reload() }}
          onCancel={closeOverlay}
        />
      )}

      {!overlay && <BottomNav active={tab} onChange={setTab} />}
    </div>
  )
}
