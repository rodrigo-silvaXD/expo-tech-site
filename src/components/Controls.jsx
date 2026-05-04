export function Controls({ onScenario, onAutoDemo, isAutoDemo, activeScenario }) {
  const scenarios = [
    { key: 'empty', label: '🏢 Sala Vazia', desc: 'presença=0' },
    { key: 'few', label: '👤 Poucas Pessoas', desc: '2 pessoas' },
    { key: 'full', label: '👥 Sala Cheia', desc: '6 pessoas' },
    { key: 'hot', label: '🔥 Sala Quente', desc: '9 pessoas' },
  ]

  return (
    <footer className="controls">
      <span className="controls-label">Cenários</span>

      {scenarios.map(({ key, label, desc }) => (
        <button
          key={key}
          className={`btn ${activeScenario === key && !isAutoDemo ? 'active' : ''}`}
          onClick={() => onScenario(key)}
          title={desc}
        >
          {label}
        </button>
      ))}

      <button
        className={`btn btn-demo ${isAutoDemo ? 'running' : ''}`}
        onClick={onAutoDemo}
      >
        {isAutoDemo ? '⏸ Demo rodando...' : '▶ Demonstração Automática'}
      </button>
    </footer>
  )
}
