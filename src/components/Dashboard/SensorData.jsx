import { useWeatherAPI } from '../../hooks/useWeatherAPI'

function SensorBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="sensor-bar-wrap">
      <div className="sensor-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function SensorData({ peopleCount, temperature, consumption, acStatus }) {
  const weather   = useWeatherAPI()
  const tempColor = temperature > 28 ? '#ff5252' : temperature > 24 ? '#ffb74d' : '#00e676'
  const peoplePct = Math.min(100, (peopleCount / 10) * 100)

  const topicLight = `smartbuilding/sala01/luz → ${consumption >= 100 ? '1' : '0'}`
  const topicAC    = `smartbuilding/sala01/ac → ${acStatus === 'OFF' ? 'off' : acStatus === 'LOW' ? 'low' : 'high'}`
  const topicPir   = `smartbuilding/sala01/presenca → ${peopleCount > 0 ? '1' : '0'}`
  const topicTemp  = `smartbuilding/sala01/temperatura → ${temperature.toFixed(1)}`

  return (
    <div className="card">
      <div className="card-title">Dados dos Sensores</div>

      <div className="sensor-row">
        <div className="sensor-left">
          <span className="sensor-icon">🌡️</span>
          <span className="sensor-name">Temperatura (DHT11)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SensorBar value={temperature - 16} max={24} color={tempColor} />
          <span className="sensor-value" style={{ color: tempColor }}>{temperature.toFixed(1)}°C</span>
        </div>
      </div>

      <div className="sensor-row">
        <div className="sensor-left">
          <span className="sensor-icon">👁️</span>
          <span className="sensor-name">Presença (PIR)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SensorBar value={peoplePct} max={100} color="#00d4ff" />
          <span className="sensor-value">{peopleCount > 0 ? '1' : '0'}</span>
        </div>
      </div>

      <div className="sensor-row">
        <div className="sensor-left">
          <span className="sensor-icon">⚡</span>
          <span className="sensor-name">Consumo atual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SensorBar value={consumption} max={1600} color="#ffb74d" />
          <span className="sensor-value" style={{ color: '#ffb74d' }}>{consumption}W</span>
        </div>
      </div>

      {/* Temperatura externa real — Open-Meteo (São Paulo) */}
      <div className="sensor-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
        <div className="sensor-left">
          <span className="sensor-icon">🌤️</span>
          <span className="sensor-name">Temp. Externa (São Paulo)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {weather.loading && (
            <span className="sensor-value" style={{ color: 'var(--text3)', fontSize: 11 }}>...</span>
          )}
          {weather.error && (
            <span className="sensor-value" style={{ color: '#ff8a80', fontSize: 11 }}>indisponível</span>
          )}
          {!weather.loading && !weather.error && weather.temperature !== null && (
            <>
              <span className="sensor-value" style={{ color: '#90caf9' }}>
                {weather.temperature.toFixed(1)}°C
              </span>
              <span style={{
                fontSize: 8.5,
                color: 'var(--text3)',
                fontFamily: "'JetBrains Mono', monospace",
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(144,202,249,0.08)',
                border: '1px solid rgba(144,202,249,0.15)',
              }}>open-meteo</span>
            </>
          )}
        </div>
      </div>

      {/* Tópicos MQTT simulados */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <div className="card-title" style={{ marginBottom: 6 }}>Tópicos MQTT Simulados</div>
        {[topicPir, topicTemp, topicLight, topicAC].map((t, i) => (
          <div key={i} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9.5,
            color: 'var(--text3)',
            padding: '2px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{t}</div>
        ))}
      </div>
    </div>
  )
}
