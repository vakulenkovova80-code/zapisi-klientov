function toICSDate(iso) {
  // -> 20260701T100000Z (UTC)
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICS({ title, startISO, durationMinutes = 60, note = '', reminderMinutes = 60 }) {
  const start = toICSDate(startISO)
  const end = toICSDate(new Date(new Date(startISO).getTime() + durationMinutes * 60000).toISOString())
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@zapisi`
  const stamp = toICSDate(new Date().toISOString())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//zapisi-klientov//RU',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(note)}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${reminderMinutes}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
}

export function downloadICS(filename, icsString) {
  const blob = new Blob([icsString], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
