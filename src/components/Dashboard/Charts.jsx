import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface3)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '4px 10px',
      fontSize: 11,
      color: 'var(--text)',
    }}>
      {payload[0]?.value?.toFixed(1)}{unit}
    </div>
  )
}

export function Charts({ history }) {
  const data = history.temps.map((t, i) => ({
    idx: i,
    temp: t,
    consumption: history.consumptions[i],
  })).filter((_, i) => i % 3 === 0)

  return (
    <div className="card">
      <div className="card-title">Gráficos em Tempo Real</div>

      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Temperatura (°C)</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={75}>
          <AreaChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff5252" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ff5252" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="idx" hide />
            <YAxis domain={[16, 38]} tick={{ fontSize: 9, fill: '#555f73' }} tickCount={4} />
            <Tooltip content={<CustomTooltip unit="°C" />} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#ff5252"
              strokeWidth={1.5}
              fill="url(#tempGrad)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Linha de referência 24 e 28 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 10 }}>
        {[['24°C', '#ffb74d', 'AC BAIXO'], ['28°C', '#ff5252', 'AC ALTO']].map(([t, c, l]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--text3)' }}>
            <div style={{ width: 20, height: 1.5, background: c, opacity: 0.7 }} />
            {t} → {l}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Consumo (W)</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={75}>
          <AreaChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffb74d" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ffb74d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="idx" hide />
            <YAxis domain={[0, 1700]} tick={{ fontSize: 9, fill: '#555f73' }} tickCount={4} />
            <Tooltip content={<CustomTooltip unit="W" />} />
            <Area
              type="monotone"
              dataKey="consumption"
              stroke="#ffb74d"
              strokeWidth={1.5}
              fill="url(#consGrad)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
