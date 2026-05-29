import { useSmartBuilding } from './hooks/useSmartBuilding'
import { Scene3D } from './components/Scene3D/index'
import { Dashboard } from './components/Dashboard/index'
import { Controls } from './components/Controls'
import { ExplanationBubble } from './components/ExplanationBubble'

export default function App() {
  const sb = useSmartBuilding()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Building</h1>
        <span className="header-badge">Sistema de Automação</span>
        <div className="mqtt-indicator" style={{ marginLeft: 16 }}>
          <div className="mqtt-dot" />
          <span>MQTT Simulado</span>
        </div>
        <span className="header-subtitle">
          PIR · DHT11 · Iluminação · Ar-condicionado · Automação Inteligente
        </span>
      </header>

      <main className="app-main">
        <div className="scene-wrapper">
          <Scene3D
            peopleCount={sb.peopleCount}
            lightStatus={sb.lightStatus}
            acStatus={sb.acStatus}
            temperature={sb.temperature}
          />
          <ExplanationBubble messages={sb.messages} />

          {/* Info flutuante sobre a cena */}
          <div style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            display: 'flex',
            gap: 8,
            flexDirection: 'column',
            pointerEvents: 'none',
          }}>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(10,14,22,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              🖱 Arraste para girar a câmera · Scroll para zoom
            </div>
          </div>

          {/* Temperatura flutuante */}
          <div style={{
            position: 'absolute',
            top: 14,
            right: 14,
            padding: '8px 14px',
            background: 'rgba(10,14,22,0.85)',
            border: `1px solid ${sb.temperature > 28 ? 'rgba(255,82,82,0.5)' : sb.temperature > 24 ? 'rgba(255,183,77,0.5)' : 'rgba(0,230,118,0.5)'}`,
            borderRadius: 10,
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Temperatura</div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: sb.temperature > 28 ? '#ff5252' : sb.temperature > 24 ? '#ffb74d' : '#00e676',
            }}>
              {sb.temperature.toFixed(1)}°C
            </div>
          </div>
        </div>

        <Dashboard
          roomLabel={sb.roomLabel}
          lightStatus={sb.lightStatus}
          acStatus={sb.acStatus}
          savings={sb.savings}
          peopleCount={sb.peopleCount}
          temperature={sb.temperature}
          consumption={sb.consumption}
          energyData={sb.energyData}
          messages={sb.messages}
          history={sb.history}
          aiData={sb.aiData}
        />
      </main>

      <Controls
        onScenario={sb.applyScenario}
        onAutoDemo={sb.startAutoDemo}
        isAutoDemo={sb.isAutoDemo}
        activeScenario={sb.activeScenario}
      />
    </div>
  )
}
