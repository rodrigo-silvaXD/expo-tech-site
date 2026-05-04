export function EconomyPanel({ consumption, savings, energyData }) {
  const withoutAuto = 1600
  const withAuto = consumption

  const kwhWithout = ((energyData.withoutAuto / 1000) * (600 / 3600)).toFixed(3)
  const kwhWith = ((energyData.withAuto / 1000) * (600 / 3600)).toFixed(3)
  const kwhSaved = Math.max(0, kwhWithout - kwhWith).toFixed(3)

  const co2Saved = (kwhSaved * 0.233).toFixed(3)

  return (
    <div className="card">
      <div className="card-title">Economia de Energia</div>

      <div className="economy-compare">
        <div className="economy-col">
          <div className="economy-col-label">Sem automação</div>
          <div className="economy-col-value red">{withoutAuto}W</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>luz + AC sempre ON</div>
        </div>
        <div className="economy-col">
          <div className="economy-col-label">Com automação</div>
          <div className="economy-col-value green">{withAuto}W</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>inteligente</div>
        </div>
      </div>

      <div className="economy-saved">
        <div className="economy-saved-label">Economia acumulada</div>
        <div className="economy-saved-value">{savings}%</div>
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          { label: 'kWh economizado', value: kwhSaved, color: '#00e676' },
          { label: 'CO₂ evitado', value: `${co2Saved}kg`, color: '#00d4ff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--surface3)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 10,
        padding: '8px 12px',
        borderRadius: 8,
        background: 'var(--surface3)',
        fontSize: 11,
        color: 'var(--text3)',
        lineHeight: 1.5,
      }}>
        💡 Projeção mensal: <strong style={{ color: 'var(--green)' }}>{Math.round(savings * 0.48 * 100) / 100}% menos</strong> na conta de energia elétrica com automação inteligente.
      </div>
    </div>
  )
}
