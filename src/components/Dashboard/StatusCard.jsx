export function StatusCard({ roomLabel, lightStatus, acStatus, savings, peopleCount }) {
  const lightOn = lightStatus === 'ON'
  const acOn = acStatus !== 'OFF'
  const acHigh = acStatus === 'HIGH'

  return (
    <div className="card status-main">
      <div className="card-title">Status da Sala</div>

      <div className="status-room-label">{roomLabel}</div>

      <div className="status-grid">
        <div className={`status-item ${lightOn ? 'on' : 'off'}`}>
          <span className="status-icon">{lightOn ? '💡' : '🌑'}</span>
          <div className="status-info">
            <span className="status-label">Iluminação</span>
            <span className={`status-value ${lightOn ? 'green' : 'dim'}`}>
              {lightStatus}
            </span>
          </div>
        </div>

        <div className={`status-item ${acHigh ? 'ac-high' : acOn ? 'ac-low' : 'off'}`}>
          <span className="status-icon">{acOn ? '❄️' : '🔌'}</span>
          <div className="status-info">
            <span className="status-label">Ar-condicionado</span>
            <span className={`status-value ${acOn ? 'blue' : 'dim'}`}>
              {acStatus === 'OFF' ? 'OFF' : acStatus === 'LOW' ? 'BAIXO' : 'ALTO'}
            </span>
          </div>
        </div>

        <div className="status-item off">
          <span className="status-icon">👥</span>
          <div className="status-info">
            <span className="status-label">Pessoas</span>
            <span className="status-value" style={{ color: peopleCount > 0 ? '#ffb74d' : '#555f73' }}>
              {peopleCount}
            </span>
          </div>
        </div>

        <div className="status-item off">
          <span className="status-icon">📡</span>
          <div className="status-info">
            <span className="status-label">MQTT / PIR</span>
            <span className="status-value green">ONLINE</span>
          </div>
        </div>
      </div>

      <div className="economy-badge">
        <span className="economy-badge-label">Economia atual</span>
        <span className="economy-badge-value">{savings}%</span>
      </div>
    </div>
  )
}
