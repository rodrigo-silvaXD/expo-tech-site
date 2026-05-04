import { useState, useEffect, useRef, useCallback } from 'react'

const BASE_TEMP = 22
const TICK_MS = 600

function calcConsumption(light, ac) {
  let w = 0
  if (light === 'ON') w += 100
  if (ac === 'LOW') w += 800
  if (ac === 'HIGH') w += 1500
  return w
}

function getRoomLabel(people) {
  if (people === 0) return 'Sala Vazia'
  if (people <= 2) return 'Poucas Pessoas'
  if (people <= 5) return 'Sala Ocupada'
  return 'Sala Cheia'
}

export function useSmartBuilding() {
  const [peopleCount, setPeopleCountState] = useState(0)
  const [temperature, setTemperatureState] = useState(BASE_TEMP)
  const [lightStatus, setLightStatus] = useState('OFF')
  const [acStatus, setAcStatus] = useState('OFF')
  const [messages, setMessages] = useState([])
  const [isAutoDemo, setIsAutoDemo] = useState(false)
  const [activeScenario, setActiveScenario] = useState('empty')
  const [energyData, setEnergyData] = useState({ withAuto: 0, withoutAuto: 1 })
  const [history, setHistory] = useState({
    temps: Array(60).fill(BASE_TEMP),
    consumptions: Array(60).fill(0),
  })

  const peopleRef = useRef(0)
  const tempRef = useRef(BASE_TEMP)
  const lightRef = useRef('OFF')
  const acRef = useRef('OFF')
  const autoTimers = useRef([])
  const msgIdRef = useRef(0)

  const setPeopleCount = useCallback((n) => {
    const clamped = Math.max(0, Math.min(10, n))
    peopleRef.current = clamped
    setPeopleCountState(clamped)
  }, [])

  const addMessage = useCallback((text, type = 'info') => {
    msgIdRef.current += 1
    const id = msgIdRef.current
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    setMessages(prev => [{ id, text, type, ts }, ...prev].slice(0, 8))
  }, [])

  // Automação: roda a lógica real do projeto
  const runAutomation = useCallback(() => {
    const people = peopleRef.current
    const temp = tempRef.current
    let newLight = lightRef.current
    let newAc = acRef.current

    if (people === 0) {
      if (newLight !== 'OFF') {
        newLight = 'OFF'
        addMessage('Sem presença detectada → Luz desligada', 'info')
      }
      if (newAc !== 'OFF') {
        newAc = 'OFF'
        addMessage('Sem presença → AC desligado • Economia ativada', 'success')
      }
    } else {
      if (newLight !== 'ON') {
        newLight = 'ON'
        addMessage('Presença detectada (PIR) → Luz ligada', 'success')
      }
      if (temp > 28) {
        if (newAc !== 'HIGH') {
          newAc = 'HIGH'
          addMessage(`Temperatura ${temp.toFixed(1)}°C > 28°C → AC modo ALTO`, 'danger')
        }
      } else if (temp > 24) {
        if (newAc !== 'LOW') {
          newAc = 'LOW'
          addMessage(`Temperatura ${temp.toFixed(1)}°C > 24°C → AC modo BAIXO`, 'warning')
        }
      } else {
        if (newAc !== 'OFF') {
          newAc = 'OFF'
          addMessage('Temperatura estável → AC desligado', 'success')
        }
      }
    }

    if (newLight !== lightRef.current) { lightRef.current = newLight; setLightStatus(newLight) }
    if (newAc !== acRef.current) { acRef.current = newAc; setAcStatus(newAc) }
  }, [addMessage])

  // Tick principal de simulação
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperatureState(prev => {
        const people = peopleRef.current
        const ac = acRef.current
        let temp = prev

        temp += people * 0.022
        if (ac === 'LOW') temp -= 0.09
        if (ac === 'HIGH') temp -= 0.18
        if (people === 0 && ac === 'OFF') {
          temp += (BASE_TEMP - temp) * 0.04
        }

        temp = Math.max(16, Math.min(40, temp))
        temp = Math.round(temp * 10) / 10
        tempRef.current = temp
        return temp
      })

      runAutomation()

      setHistory(prev => {
        const newTemp = Math.round(tempRef.current * 10) / 10
        const consumption = calcConsumption(lightRef.current, acRef.current)
        return {
          temps: [...prev.temps.slice(1), newTemp],
          consumptions: [...prev.consumptions.slice(1), consumption],
        }
      })

      setEnergyData(prev => ({
        withAuto: prev.withAuto + calcConsumption(lightRef.current, acRef.current),
        withoutAuto: prev.withoutAuto + 1600,
      }))
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [runAutomation])

  const stopAutoDemo = useCallback(() => {
    autoTimers.current.forEach(t => clearTimeout(t))
    autoTimers.current = []
    setIsAutoDemo(false)
  }, [])

  const startAutoDemo = useCallback(() => {
    stopAutoDemo()
    setIsAutoDemo(true)
    setActiveScenario('demo')
    setPeopleCount(0)
    tempRef.current = BASE_TEMP
    setTemperatureState(BASE_TEMP)

    addMessage('Demonstração automática iniciada!', 'info')

    const steps = [
      [1800, () => { setPeopleCount(1); addMessage('1ª pessoa entrou na sala', 'success') }],
      [5000, () => { setPeopleCount(3); addMessage('Mais 2 pessoas entraram', 'info') }],
      [12000, () => { setPeopleCount(6); addMessage('Sala ficando ocupada...', 'warning') }],
      [24000, () => { setPeopleCount(9); addMessage('Sala cheia! Temperatura subindo...', 'danger') }],
      [42000, () => { setPeopleCount(6); addMessage('Algumas pessoas saíram', 'info') }],
      [56000, () => { setPeopleCount(3); addMessage('Sala quase vazia', 'info') }],
      [68000, () => { setPeopleCount(1); addMessage('Última pessoa restante', 'info') }],
      [78000, () => {
        setPeopleCount(0)
        addMessage('Sala esvaziada → Sistemas desligando', 'success')
        setIsAutoDemo(false)
      }],
    ]

    steps.forEach(([delay, fn]) => {
      const t = setTimeout(fn, delay)
      autoTimers.current.push(t)
    })
  }, [stopAutoDemo, setPeopleCount, addMessage])

  const applyScenario = useCallback((scenario) => {
    stopAutoDemo()
    setActiveScenario(scenario)
    switch (scenario) {
      case 'empty':
        setPeopleCount(0)
        addMessage('Cenário: Sala vazia', 'info')
        break
      case 'few':
        setPeopleCount(2)
        addMessage('Cenário: Poucas pessoas (2)', 'info')
        break
      case 'full':
        setPeopleCount(6)
        addMessage('Cenário: Sala cheia (6 pessoas)', 'warning')
        break
      case 'hot':
        setPeopleCount(9)
        addMessage('Cenário: Sala lotada e quente!', 'danger')
        break
      default: break
    }
  }, [stopAutoDemo, setPeopleCount, addMessage])

  const consumption = calcConsumption(lightStatus, acStatus)
  const savingsPct = energyData.withoutAuto > 0
    ? Math.round((1 - energyData.withAuto / energyData.withoutAuto) * 100)
    : 90

  return {
    peopleCount,
    temperature,
    lightStatus,
    acStatus,
    messages,
    isAutoDemo,
    activeScenario,
    history,
    consumption,
    savings: Math.max(0, Math.min(99, savingsPct)),
    energyData,
    roomLabel: getRoomLabel(peopleCount),
    startAutoDemo,
    stopAutoDemo,
    applyScenario,
  }
}
