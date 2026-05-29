import { StatusCard }   from './StatusCard'
import { SensorData }   from './SensorData'
import { DecisionLog }  from './DecisionLog'
import { EconomyPanel } from './EconomyPanel'
import { Charts }       from './Charts'
import { AIPanel }      from './AIPanel'

export function Dashboard(props) {
  const {
    roomLabel, lightStatus, acStatus, savings, peopleCount,
    temperature, consumption, energyData, messages, history,
    aiData,
  } = props

  return (
    <aside className="dashboard">
      <div className="dashboard-scroll">
        <StatusCard
          roomLabel={roomLabel}
          lightStatus={lightStatus}
          acStatus={acStatus}
          savings={savings}
          peopleCount={peopleCount}
        />

        <SensorData
          peopleCount={peopleCount}
          temperature={temperature}
          consumption={consumption}
          acStatus={acStatus}
        />

        <AIPanel
          aiData={aiData}
          consumption={consumption}
          temperature={temperature}
          peopleCount={peopleCount}
        />

        <DecisionLog
          messages={messages}
          lightStatus={lightStatus}
          acStatus={acStatus}
          peopleCount={peopleCount}
          temperature={temperature}
        />

        <EconomyPanel
          consumption={consumption}
          savings={savings}
          energyData={energyData}
        />

        <Charts history={history} />
      </div>
    </aside>
  )
}
