const TABS = [
  { key: 'upcoming', label: 'Записи', icon: '📋' },
  { key: 'calendar', label: 'Календарь', icon: '🗓️' },
  { key: 'clients', label: 'Клиенты', icon: '👥' },
  { key: 'settings', label: 'Настройки', icon: '⚙️' }
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.key}
          className={`nav-item ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
