export function AIPanel({ aiData, consumption }) {
  const {
    status, predicted_w, saving_pct, anomaly_score,
    anomaly_flag, total_readings, training_samples,
  } = aiData

  const isOffline = status === 'offline'
  const isIdle    = status === 'idle'
  const hasData   = status === 'ok' && predicted_w !== null

  const anomalyColor = anomaly_flag
    ? '#ff5252'
    : anomaly_score > 20 ? '#ffb74d' : '#00e676'

  const deviation = hasData ? Math.abs(consumption - predicted_w) : null

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Módulo IA — Predição de Consumo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isOffline ? '#ff5252' : isIdle ? '#555f73' : '#00e676',
            boxShadow: (!isIdle && !isOffline) ? '0 0 6px #00e676' : 'none',
          }} />
          <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {isOffline ? 'OFFLINE' : isIdle ? 'AGUARDANDO' : 'ONLINE'}
          </span>
        </div>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px', borderRadius: 4,
        background: 'rgba(0,212,255,0.08)',
        border: '1px solid rgba(0,212,255,0.2)',
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 9, color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
          LinearRegression · sklearn
        </span>
        {training_samples > 0 && (
          <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
            {training_samples} amostras
          </span>
        )}
      </div>

      {isOffline && (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(255,82,82,0.08)',
          border: '1px solid rgba(255,82,82,0.2)',
          fontSize: 11, color: '#ff8a80',
        }}>
          Backend indisponível. A simulação continua funcionando normalmente.
        </div>
      )}

      {isIdle && !isOffline && (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--surface3)',
          border: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text3)',
        }}>
          Aguardando primeiras leituras...
        </div>
      )}

      {hasData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--surface3)',
              border: '1px solid var(--border)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Consumo real</div>
              <div style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace", color: '#ffb74d',
              }}>{consumption}W</div>
            </div>
            <div style={{
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--surface3)',
              border: '1px solid rgba(0,212,255,0.2)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Predição IA</div>
              <div style={{
                fontSize: 16, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)',
              }}>{predicted_w}W</div>
            </div>
          </div>

          {deviation !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 10px', borderRadius: 6,
              background: 'var(--surface3)', border: '1px solid var(--border)',
              marginBottom: 10, fontSize: 11,
            }}>
              <span style={{ color: 'var(--text3)' }}>Desvio</span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: deviation < 80 ? '#00e676' : deviation < 200 ? '#ffb74d' : '#ff5252',
              }}>
                {deviation}W ({anomaly_score?.toFixed(1)}%)
              </span>
            </div>
          )}

          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 10, color: 'var(--text3)', marginBottom: 4,
            }}>
              <span>Score de Anomalia</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: anomalyColor }}>
                {anomaly_score?.toFixed(1)}%
                {anomaly_flag && <span style={{ marginLeft: 4, color: '#ff5252' }}>⚠ ANÔMALO</span>}
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, anomaly_score || 0)}%`,
                background: anomalyColor,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 9, color: 'var(--text3)', marginTop: 2,
            }}>
              <span>Normal</span>
              <span style={{ color: '#ffb74d' }}>Atenção &gt;20%</span>
              <span style={{ color: '#ff5252' }}>Anomalia &gt;40%</span>
            </div>
          </div>

          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: 'rgba(0,230,118,0.06)',
            border: '1px solid rgba(0,230,118,0.15)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>Economia prevista (IA)</span>
            <span style={{
              fontSize: 15, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace", color: '#00e676',
            }}>{saving_pct?.toFixed(1)}%</span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'var(--text3)',
            borderTop: '1px solid var(--border)', paddingTop: 8,
          }}>
            <span>Leituras armazenadas</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text2)' }}>
              {total_readings}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
