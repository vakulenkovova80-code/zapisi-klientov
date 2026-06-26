// E4 заменит этот файл полноценной реализацией
export default function BroadcastView({ onClose }) {
  return (
    <div className="overlay">
      <header className="overlay-head">
        <button className="link" onClick={onClose}>Закрыть</button>
        <h2>Рассылка</h2>
        <span />
      </header>
    </div>
  )
}
