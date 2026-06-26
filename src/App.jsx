import { useState } from 'react'
import BottomNav from './components/BottomNav.jsx'
import UpcomingView from './components/UpcomingView.jsx'
import CalendarView from './components/CalendarView.jsx'
import ClientsView from './components/ClientsView.jsx'
import SettingsView from './components/SettingsView.jsx'
import AppointmentForm from './components/AppointmentForm.jsx'
import AppointmentCard from './components/AppointmentCard.jsx'
import ClientForm from './components/ClientForm.jsx'
import BroadcastView from './components/BroadcastView.jsx'

export default function App() {
  const [tab, setTab] = useState('upcoming')
  // overlay: null
  //        | {mode:'new'} | {mode:'edit', id} | {mode:'view', id}
  //        | {mode:'client-new'} | {mode:'client-edit', id}
  //        | {mode:'broadcast'}
  const [overlay, setOverlay] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const reload = () => setRefresh(n => n + 1)

  const openNew = () => setOverlay({ mode: 'new' })
  const openView = (id) => setOverlay({ mode: 'view', id })
  const openEdit = (id) => setOverlay({ mode: 'edit', id })
  const closeOverlay = () => setOverlay(null)

  const openClientNew = () => setOverlay({ mode: 'client-new' })
  const openClientEdit = (id) => setOverlay({ mode: 'client-edit', id })
  const openBroadcast = () => setOverlay({ mode: 'broadcast' })

  return (
    <div className="app">
      {tab === 'upcoming' && <UpcomingView key={refresh} onOpen={openView} onNew={openNew} />}
      {tab === 'calendar' && <CalendarView key={refresh} onOpen={openView} />}
      {tab === 'clients' && (
        <ClientsView
          key={refresh}
          onOpen={openView}
          onAddClient={openClientNew}
          onEditClient={openClientEdit}
          onBroadcast={openBroadcast}
        />
      )}
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
      {overlay && (overlay.mode === 'client-new' || overlay.mode === 'client-edit') && (
        <ClientForm
          id={overlay.mode === 'client-edit' ? overlay.id : null}
          onSaved={() => { closeOverlay(); reload() }}
          onCancel={closeOverlay}
        />
      )}
      {overlay && overlay.mode === 'broadcast' && (
        <BroadcastView onClose={closeOverlay} />
      )}

      {!overlay && <BottomNav active={tab} onChange={setTab} />}
    </div>
  )
}
