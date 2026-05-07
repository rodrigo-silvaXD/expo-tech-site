import { useState, useEffect } from 'react'

export function useWeatherAPI() {
  const [outdoorTemp, setOutdoorTemp] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current=temperature_2m')
      .then(res => {
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setOutdoorTemp(data.current.temperature_2m)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setOutdoorTemp(null)
        setIsLoading(false)
      })
  }, [])

  return { outdoorTemp, isLoading, error }
}
