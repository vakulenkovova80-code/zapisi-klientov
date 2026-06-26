import { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import UpcomingView from './components/UpcomingView.jsx'
import CalendarView from './components/CalendarView.jsx'
import ClientsView from './components/ClientsView.jsx'
import SettingsView from './components/SettingsView.jsx'
import AppointmentForm from './components/AppointmentForm.jsx'
import AppointmentCard from './components/AppointmentCard.jsx'

export default function App() {
  const [tab, setTab] = useState('upcoming')
  // overlay: null | {mode:'new'} | {mode:'edit', id} | {mode:'view', id}
  const [overlay, setOverlay] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const reload = () => setRefresh(n => n + 1)

  const openNew = () => setOverlay({ mode: 'new' })
  const openView = (id) => setOverlay({ mode: 'view', id })
  const openEdit = (id) => setOverlay({ mode: 'edit', id })
  const closeOverlay = () => setOverlay(null)

  return (
    <div className="app">
      {tab === 'upcoming' && <UpcomingView key={refresh} onOpen={openView} onNew={openNew} />}
      {tab === 'calendar' && <CalendarView key={refresh} onOpen={openView} />}
      {tab === 'clients' && <ClientsView key={refresh} onOpen={openView} />}
      {tab === 'settings' && <SettingsView key={refresh} onChanged={reload} />}

      {overlay && (overlay.mode === 'new' || overlay.mode === 'edit') && (
        <AppointmentForm
          id={overlay.mode === 'edit' ? overlay.id : null}
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

      {!overlay && <BottomNav active={tab} onChange={setTab} />}
    </div>
  )
}
