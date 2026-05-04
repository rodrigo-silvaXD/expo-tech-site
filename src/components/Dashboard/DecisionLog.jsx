export function DecisionLog({ messages, lightStatus, acStatus, peopleCount, temperature }) {
  const lightOn = lightStatus === 'ON'
  const acOn = acStatus !== 'OFF'
  const acHigh = acStatus === 'HIGH'

  let decisionText = ''
  let decisionColor = 'var(--text2)'

  if (peopleCount === 0) {
    decisionText = 'Nenhuma presença detectada pelo sensor PIR. Sistema em modo economia: luz e AC desligados.'
    decisionColor = '#8892a4'
  } else if (temperature > 28 && acHigh) {
    decisionText = `Temperatura crítica (${temperature.toFixed(1)}°C). Presença confirmada. AC no modo ALTO ativado para resfriamento máximo.`
    decisionColor = '#ff8a80'
  } else if (temperature > 24 && acOn) {
    decisionText = `Temperatura elevada (${temperature.toFixed(1)}°C). Presença confirmada. AC no modo BAIXO ativado para conforto.`
    decisionColor = '#ffd180'
  } else if (lightOn) {
    decisionText = `Ambiente estável (${temperature.toFixed(1)}°C). Presença confirmada. Apenas iluminação ativa.`
    decisionColor = '#6fffc0'
  }

  return (
    <div className="card">
      <div className="card-title">Decisão do Sistema</div>

      {/* Lógica atual */}
      <div style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--surface3)',
        border: '1px solid var(--border)',
        marginBottom: 12,
        fontSize: 12,
        lineHeight: 1.6,
        color: decisionColor,
      }}>
        {decisionText || 'Aguardando dados dos sensores...'}
      </div>

      {/* Regras ativas */}
      <div className="card-title" style={{ marginBottom: 6 }}>Regras de Automação</div>
      {[
        { rule: 'presença = 0  →  luz OFF + AC OFF', active: peopleCount === 0, type: 'info' },
        { rule: 'presença = 1  →  luz ON', active: lightOn, type: 'success' },
        { rule: 'temperatura > 24°C  →  AC BAIXO', active: acStatus === 'LOW', type: 'warning' },
        { rule: 'temperatura > 28°C  →  AC ALTO', active: acHigh, type: 'danger' },
      ].map(({ rule, active, type }, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            background: active
              ? (type === 'success' ? 'var(--green)' : type === 'warning' ? 'var(--orange)' : type === 'danger' ? 'var(--red)' : 'var(--cyan)')
              : 'var(--surface3)',
            boxShadow: active ? `0 0 6px currentColor` : 'none',
          }} />
          <span style={{ color: active ? 'var(--text)' : 'var(--text3)' }}>{rule}</span>
          {active && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontFamily: 'Inter' }}>ATIVA</span>}
        </div>
      ))}

      {/* Log de eventos */}
      {messages.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 12, marginBottom: 6 }}>Log de Eventos</div>
          <div className="decision-list">
            {messages.slice(0, 4).map(m => (
              <div key={m.id} className={`decision-item ${m.type}`}>
                <div className="decision-dot" />
                <span className="decision-text">{m.text}</span>
                <span className="decision-time">{m.ts}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
